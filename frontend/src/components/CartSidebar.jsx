import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartSidebar.css';

const CartSidebar = () => {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    gst, 
    total,
    sidebarOpen,
    closeCartSidebar 
  } = useCart();

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getItemPrice = (item) => {
    // Use backend-calculated item_price if available (includes flash sale)
    if (item.item_price) {
      return item.item_price * item.quantity;
    }
    // Fallback for guest cart
    return (parseFloat(item.metal_price || 0) + parseFloat(item.making_charges || 0)) * item.quantity;
  };
  
  const getOriginalPrice = (item) => {
    if (item.original_price) {
      return item.original_price * item.quantity;
    }
    return (parseFloat(item.metal_price || 0) + parseFloat(item.making_charges || 0)) * item.quantity;
  };

  const PLACEHOLDER = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_400,h_400/jewllery_shop/logos/alankara-emblem.png';

  const getProductImage = (item) => {
    try {
      if (item.images) {
        let images = item.images;
        if (typeof images === 'string') {
          images = JSON.parse(images);
        }
        if (Array.isArray(images) && images.length > 0) {
          return images[0];
        }
      }
    } catch (e) {
      console.error('Error parsing image:', e);
    }
    return PLACEHOLDER;
  };

  const handleCheckout = () => {
    closeCartSidebar();
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    closeCartSidebar();
  };

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="cart-sidebar-overlay" onClick={closeCartSidebar} />
      
      {/* Sidebar */}
      <div className={`cart-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-sidebar-header">
          <h2>
            <ShoppingCart size={20} />
            Your Cart ({items.length})
          </h2>
          <button className="close-btn" onClick={closeCartSidebar}>
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="cart-sidebar-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={48} />
              <p>Your cart is empty</p>
              <button className="continue-btn" onClick={handleContinueShopping}>
                Start Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id || item.product_id} className="cart-sidebar-item">
                <button 
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.id || item.product_id)}
                >
                  <X size={14} />
                </button>
                
                <img 
                  src={getProductImage(item)} 
                  alt={item.name}
                  className="item-image"
                />
                
                <div className="item-details">
                  <h4 className="item-name">{item.name}</h4>
                  {item.size && (
                    <span className="item-size">Size: {item.size}</span>
                  )}
                  <div className="item-price-container">
                    {item.flash_sale_applied && (
                      <>
                        <span className="flash-indicator"><Zap size={12} /> {item.flash_sale_discount}% OFF</span>
                        <span className="original-price-struck">{formatPrice(getOriginalPrice(item))}</span>
                      </>
                    )}
                    <span className={`item-price ${item.flash_sale_applied ? 'flash-price' : ''}`}>
                      {formatPrice(getItemPrice(item))}
                    </span>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id || item.product_id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id || item.product_id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="cart-sidebar-footer">
            <div className="totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="total-row">
                <span>GST (3%)</span>
                <span>{formatPrice(gst)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            
            <button className="checkout-btn" onClick={handleCheckout}>
              <ShoppingCart size={18} />
              Proceed to Checkout
            </button>
            
            <button className="continue-btn" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
