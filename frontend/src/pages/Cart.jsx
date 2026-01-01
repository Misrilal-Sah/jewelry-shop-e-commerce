import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, Loader2, Bookmark, RotateCcw, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/SEO';
import './Cart.css';

const Cart = () => {
  const { 
    items, subtotal, gst, total, finalTotal, itemCount, 
    updateQuantity, removeFromCart, clearCart, addToCart,
    appliedCoupon, discount, applyCoupon, removeCoupon 
  } = useCart();
  const { isAuthenticated, token } = useAuth();
  const modal = useModal();
  const toast = useToast();

  // Coupon input state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Save for Later state
  const [savedItems, setSavedItems] = useState([]);
  const [savingItem, setSavingItem] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Fetch saved items on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSavedItems();
    }
  }, [isAuthenticated, token]);

  const fetchSavedItems = async () => {
    if (!isAuthenticated) return;
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
    }
    setLoadingSaved(false);
  };

  const handleSaveForLater = async (item) => {
    if (!isAuthenticated) {
      toast.warning('Please login to save items');
      return;
    }

    setSavingItem(item.id);
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          selected_size: item.size || item.selectedSize
        })
      });

      if (res.ok) {
        removeFromCart(item.id);
        fetchSavedItems();
        toast.success('Saved for later');
      } else {
        toast.error('Failed to save item');
      }
    } catch (error) {
      toast.error('Failed to save item');
    }
    setSavingItem(null);
  };

  const handleMoveToCart = async (savedItem) => {
    setSavingItem(savedItem.id);
    try {
      // Add to cart
      const productData = {
        id: savedItem.product_id,
        product_id: savedItem.product_id,
        name: savedItem.name,
        images: savedItem.images,
        metal_price: savedItem.metal_price,
        making_charges: savedItem.making_charges,
        category: savedItem.category,
        metal_type: savedItem.metal_type,
        purity: savedItem.purity,
        stock: savedItem.stock,
        gst_percent: savedItem.gst_percent,
        quantity: savedItem.quantity || 1,
        selectedSize: savedItem.selected_size
      };
      
      addToCart(productData, 1, savedItem.selected_size, true); // Skip opening cart sidebar

      // Remove from saved
      await fetch(`/api/saved/${savedItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchSavedItems();
      toast.success('Moved to cart');
    } catch (error) {
      toast.error('Failed to move item');
    }
    setSavingItem(null);
  };

  const handleRemoveSaved = async (savedItemId) => {
    try {
      const res = await fetch(`/api/saved/${savedItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchSavedItems();
        toast.info('Item removed');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const PLACEHOLDER = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_400,h_400/jewllery_shop/logos/alankara-emblem.png';

  const getImage = (item) => {
    if (item.images) {
      if (typeof item.images === 'string') {
        try {
          const parsed = JSON.parse(item.images);
          return parsed[0] || PLACEHOLDER;
        } catch {
          return item.images;
        }
      }
      return item.images[0] || PLACEHOLDER;
    }
    return PLACEHOLDER;
  };

  const calculateItemPrice = (item) => {
    // Use backend item_price if available (includes flash sale discount)
    if (item.item_price) {
      return item.item_price;
    }
    // Fallback for guest cart
    const metalPrice = parseFloat(item.metal_price) || 0;
    const makingCharges = parseFloat(item.making_charges) || 0;
    return metalPrice + makingCharges;
  };
  
  const calculateOriginalPrice = (item) => {
    if (item.original_price) {
      return item.original_price;
    }
    const metalPrice = parseFloat(item.metal_price) || 0;
    const makingCharges = parseFloat(item.making_charges) || 0;
    return metalPrice + makingCharges;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to apply a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    modal.loading('Verifying Coupon', 'Please wait while we verify your coupon code...');

    try {
      const res = await fetch('/api/cart/coupon/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          cart_total: total
        })
      });

      modal.hide();
      const data = await res.json();

      if (res.ok) {
        applyCoupon(data.coupon, data.discount);
        setCouponCode('');
        modal.success('Coupon Applied!', data.message);
      } else {
        setCouponError(data.message);
        modal.error('Invalid Coupon', data.message);
      }
    } catch (error) {
      modal.hide();
      console.error('Apply coupon error:', error);
      setCouponError('Failed to verify coupon');
      modal.error('Error', 'Failed to verify coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="container">
          <EmptyState 
            type="cart" 
            title="Your cart is empty"
            description="Looks like you haven't added any jewelry to your cart yet."
            actionText="Start Shopping"
            actionLink="/products"
          />
        </div>
      </div>
    );
  }

  return (
    <>
    <SEO 
      title="Shopping Cart"
      description="Review your jewelry selections in your shopping cart."
      noindex={true}
    />
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-wrapper">
            {items.length > 0 && (
              <div className="cart-items">
                {items.map((item) => {
                  const itemPrice = calculateItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div key={item.id} className="cart-item">
                      <div className="item-image">
                        <img src={getImage(item)} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <Link to={`/products/${item.product_id || item.id}`} className="item-name">
                          {item.name}
                        </Link>
                        {item.size && (
                          <span className="item-size">Size: {item.size}</span>
                        )}
                        <div className="item-price-mobile">{formatPrice(itemTotal)}</div>
                        
                        {/* Save for Later button - mobile */}
                        {isAuthenticated && (
                          <button 
                            className="save-for-later-mobile"
                            onClick={() => handleSaveForLater(item)}
                            disabled={savingItem === item.id}
                          >
                            <Bookmark size={14} />
                            {savingItem === item.id ? 'Saving...' : 'Save for later'}
                          </button>
                        )}
                      </div>
                      <div className="item-quantity">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className={`item-price ${item.flash_sale_applied ? 'flash-sale-price' : ''}`}>
                        {item.flash_sale_applied && (
                          <>
                            <span className="flash-badge-cart"><Zap size={12} /> {item.flash_sale_discount}% OFF</span>
                            <span className="original-price-struck">{formatPrice(calculateOriginalPrice(item) * item.quantity)}</span>
                          </>
                        )}
                        <span className={item.flash_sale_applied ? 'discounted' : ''}>{formatPrice(itemTotal)}</span>
                      </div>
                      <div className="item-actions-btns">
                        {isAuthenticated && (
                          <button 
                            className="save-btn cart-action-bordered"
                            onClick={() => handleSaveForLater(item)}
                            disabled={savingItem === item.id}
                            title="Save for later"
                          >
                            {savingItem === item.id ? <Loader2 size={16} className="spin" /> : <Bookmark size={16} />}
                          </button>
                        )}
                        <button 
                          className="remove-btn cart-action-bordered"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="cart-actions">
                  <Link to="/products" className="btn btn-secondary">
                    Continue Shopping
                  </Link>
                  <button className="btn btn-ghost" onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </div>
            )}

            {/* Saved for Later Section */}
            {isAuthenticated && savedItems.length > 0 && (
              <div className="saved-items-section">
                <h2>
                  <Bookmark size={20} />
                  Saved for Later ({savedItems.length})
                </h2>
                <div className="saved-items-grid">
                  {savedItems.map((item) => {
                    const itemPrice = calculateItemPrice(item);
                    return (
                      <div key={item.id} className="saved-item">
                        <div className="saved-item-image">
                          <img src={getImage(item)} alt={item.name} />
                        </div>
                        <div className="saved-item-info">
                          <Link to={`/products/${item.product_id}`} className="saved-item-name">
                            {item.name}
                          </Link>
                          <span className="saved-item-price">{formatPrice(itemPrice)}</span>
                          {item.stock === 0 && (
                            <span className="out-of-stock-badge">Out of Stock</span>
                          )}
                        </div>
                        <div className="saved-item-actions">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMoveToCart(item)}
                            disabled={savingItem === item.id || item.stock === 0}
                          >
                            {savingItem === item.id ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <>
                                <RotateCcw size={14} />
                                Move to Cart
                              </>
                            )}
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRemoveSaved(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty cart but has saved items */}
            {items.length === 0 && savedItems.length > 0 && (
              <div className="cart-empty-with-saved">
                <ShoppingBag size={48} strokeWidth={1} />
                <h3>Your cart is empty</h3>
                <p>You have {savedItems.length} item{savedItems.length > 1 ? 's' : ''} saved for later.</p>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {items.length > 0 && (
            <div className="cart-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>GST (3%)</span>
                  <span>{formatPrice(gst)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Coupon Discount</span>
                    <span className="discount-value">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free">FREE</span>
                </div>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary btn-lg checkout-btn">
                Proceed to Checkout <ArrowRight size={18} />
              </Link>

              {/* Coupon Section */}
              <div className="cart-coupon-section">
                {appliedCoupon ? (
                  <div className="applied-coupon">
                    <div className="coupon-info">
                      <Tag size={16} />
                      <span>{appliedCoupon.code}</span>
                      <span className="discount-amount">-{formatPrice(discount)}</span>
                    </div>
                    <button className="remove-coupon-btn" onClick={handleRemoveCoupon}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="coupon-input-row">
                      <input 
                        type="text" 
                        placeholder="Enter coupon code" 
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button 
                        className="btn btn-secondary"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? <Loader2 size={16} className="spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="coupon-error">{couponError}</p>}
                  </>
                )}
              </div>

              <div className="summary-info">
                <p>✓ Free shipping on orders above ₹10,000</p>
                <p>✓ 15-day easy returns</p>
                <p>✓ 100% secure checkout</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Cart;
