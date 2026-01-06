import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Check, X, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { useModal } from '../ui/Modal';
import { apiFetch } from '../../config/api';
import './ProductCard.css';

const ProductCard = ({ product, onQuickView }) => {
  const { addToCart, isInCart, removeByProductId } = useCart();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inCart = isInCart(product.id);

  const price = parseFloat(product.metal_price) + parseFloat(product.making_charges);
  const gst = price * 0.03;
  const totalPrice = price + gst;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Check wishlist status on load
  useEffect(() => {
    if (isAuthenticated && token) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, token, product.id]);

  const checkWishlistStatus = async () => {
    try {
      const res = await apiFetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Handle both array and object with items
        const items = Array.isArray(data) ? data : data.items || [];
        // Check both product_id and id (from products table join)
        const inWishlist = items.some(item => 
          item.product_id === product.id || item.id === product.id
        );
        setIsWishlisted(inWishlist);
      }
    } catch (error) {
      console.error('Check wishlist error:', error);
    }
  };

  const handleCartToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    
    // Check if product is out of stock
    if (product.stock === 0 || product.stock === '0') {
      modal.warning(
        'Out of Stock', 
        `Oops! "${product.name}" is currently out of stock. We will refill soon. Please check back later!`
      );
      return;
    }
    
    setIsProcessing(true);
    
    if (inCart) {
      await removeByProductId(product.id);
      toast.info('Removed from cart');
    } else {
      const result = await addToCart(product, 1);
      if (result?.success === false) {
        toast.error(result?.message || 'Failed to add to cart');
      }
      // No toast for success - cart sidebar opens instead
    }
    
    setIsProcessing(false);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to save items to your wishlist.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (isWishlisted) {
        // Remove from wishlist
        const res = await apiFetch(`/api/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setIsWishlisted(false);
          toast.info('Removed from wishlist');
        } else {
          const data = await res.json();
          toast.error(data.message || 'Failed to remove from wishlist');
        }
      } else {
        // Add to wishlist
        const res = await apiFetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.id })
        });
        if (res.ok) {
          setIsWishlisted(true);
          toast.success('Added to wishlist!');
        } else {
          const data = await res.json();
          toast.error(data.message || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      toast.error('Something went wrong');
    }
    
    setIsProcessing(false);
  };

  // Cloudinary placeholder
  const PLACEHOLDER = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_400,h_400/jewllery_shop/logos/alankara-emblem.png';

  const getImage = () => {
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          return parsed[0] || PLACEHOLDER;
        } catch {
          return product.images;
        }
      }
      return product.images[0] || PLACEHOLDER;
    }
    return PLACEHOLDER;
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image">
        <img src={getImage()} alt={product.name} loading="lazy" />
        
        {/* Badges */}
        <div className="product-badges">
          {Boolean(product.is_new) && (
            <span className="badge badge-new">New</span>
          )}
          {Boolean(product.is_bestseller) && (
            <span className="badge badge-bestseller">Bestseller</span>
          )}
          {Boolean(product.is_limited) && (
            <span className="badge badge-limited">Limited</span>
          )}
          {Boolean(product.is_featured) && !product.is_new && !product.is_bestseller && (
            <span className="badge badge-gold">Featured</span>
          )}
          {(product.stock === 0 || product.stock === '0') && (
            <span className="badge badge-error">Out of Stock</span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="badge badge-warning">Low Stock</span>
          )}
        </div>

        {/* Actions */}
        <div className="product-actions">
          <button 
            className={`action-icon wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={toggleWishlist}
            disabled={isProcessing}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button 
            className={`action-icon cart-btn ${inCart ? 'in-cart' : ''} ${(product.stock === 0 || product.stock === '0') ? 'out-of-stock' : ''}`}
            onClick={handleCartToggle}
            disabled={isProcessing}
            aria-label={inCart ? 'Remove from cart' : 'Add to cart'}
          >
            {inCart ? <Check size={18} /> : <ShoppingBag size={18} />}
          </button>
          {onQuickView && (
            <button 
              className="action-icon quick-view-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label="Quick view"
            >
              <Eye size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-meta">
          <span className="product-metal">{product.purity} {product.metal_type}</span>
          <span className="product-weight">{product.weight_grams}g</span>
        </div>

        {product.rating > 0 && (
          <div className="product-rating">
            <Star size={14} fill="currentColor" />
            <span>{product.rating}</span>
            <span className="rating-count">({product.review_count})</span>
          </div>
        )}

        <div className="product-price">
          <span className="price">{formatPrice(totalPrice)}</span>
          <span className="price-note">incl. GST</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
