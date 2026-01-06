import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, ShoppingBag, Check, ChevronLeft, ChevronRight, Star, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { useModal } from '../ui/Modal';
import { apiFetch } from '../../config/api';
import './QuickViewModal.css';

const QuickViewModal = ({ product, onClose, onAddToWishlist }) => {
  const { addToCart, isInCart, removeByProductId, openCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (product?.sizes?.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    // Check wishlist status
    if (isAuthenticated && token && product) {
      checkWishlistStatus();
    }
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  const checkWishlistStatus = async () => {
    try {
      const res = await apiFetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setIsWishlisted(items.some(item => 
          item.product_id === product.id || item.id === product.id
        ));
      }
    } catch (error) {
      console.error('Check wishlist error:', error);
    }
  };

  if (!product) return null;

  // Parse images properly
  const PLACEHOLDER = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_400,h_400/jewllery_shop/logos/alankara-emblem.png';
  let images = [PLACEHOLDER];
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        images = parsed.length > 0 ? parsed : [PLACEHOLDER];
      } catch {
        images = [product.images];
      }
    } else if (Array.isArray(product.images)) {
      images = product.images.length > 0 ? product.images : [PLACEHOLDER];
    }
  }
  
  const inCart = isInCart(product.id);

  // Calculate price properly with parseFloat
  const calculatePrice = () => {
    const metalPrice = parseFloat(product.metal_price) || 0;
    const makingCharges = parseFloat(product.making_charges) || 0;
    const subtotal = metalPrice + makingCharges;
    const gstPercent = parseFloat(product.gst_percent) || 3;
    const gst = subtotal * (gstPercent / 100);
    return subtotal + gst;
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCartToggle = () => {
    // Check if out of stock - show simple alert modal
    if (product.stock === 0 || product.stock === '0') {
      modal.alert({
        title: 'Out of Stock',
        message: `Oops! "${product.name}" is currently out of stock. We will refill soon. Please check back later!`
      });
      return;
    }

    if (inCart) {
      removeByProductId(product.id);
      // No toast - just remove silently and open cart
      openCart();
    } else {
      addToCart({
        ...product,
        selectedSize,
        quantity,
        price: calculatePrice()
      });
      // No toast - just open cart sidebar
      openCart();
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.warning('Please login to add to wishlist');
      return;
    }

    setIsProcessing(true);
    try {
      if (isWishlisted) {
        await apiFetch(`/api/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(false);
        toast.info('Removed from wishlist');
      } else {
        await apiFetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.id })
        });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
    setIsProcessing(false);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const isOutOfStock = product.stock === 0 || product.stock === '0';

  return (
    <div className="quick-view-overlay" onClick={onClose}>
      <div className="quick-view-modal" onClick={e => e.stopPropagation()}>
        <button className="quick-view-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="quick-view-content">
          {/* Image Gallery */}
          <div className="quick-view-gallery">
            <div className="gallery-main">
              <img 
                src={images[selectedImage]} 
                alt={product.name} 
              />
              {images.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={prevImage}>
                    <ChevronLeft size={20} />
                  </button>
                  <button className="gallery-nav next" onClick={nextImage}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {isOutOfStock && (
                <span className="badge badge-error">Out of Stock</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="quick-view-info">
            <span className="product-category">{product.category}</span>
            <h2 className="product-name">{product.name}</h2>
            
            {/* Rating */}
            {product.rating && (
              <div className="product-rating">
                <Star size={16} fill="currentColor" />
                <span>{product.rating}</span>
                {product.review_count && (
                  <span className="review-count">({product.review_count} reviews)</span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="product-price">
              <span className="current-price">{formatPrice(calculatePrice())}</span>
              {product.original_price && (
                <span className="original-price">{formatPrice(product.original_price)}</span>
              )}
            </div>

            {/* Description */}
            <p className="product-description">
              {product.description?.substring(0, 150)}
              {product.description?.length > 150 ? '...' : ''}
            </p>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && product.sizes[0] !== 'Standard' && (
              <div className="size-selection">
                <label>Size:</label>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="quantity-selection">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="quick-view-actions">
              <button 
                className={`btn-add-cart ${inCart ? 'in-cart' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                onClick={handleCartToggle}
              >
                {inCart ? <Check size={18} /> : <ShoppingBag size={18} />}
                {isOutOfStock ? 'Out of Stock' : (inCart ? 'In Cart' : 'Add to Cart')}
              </button>
              <button 
                className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
                onClick={toggleWishlist}
                disabled={isProcessing}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* View Full Details Link */}
            <Link 
              to={`/products/${product.id}`} 
              className="view-full-details"
              onClick={onClose}
            >
              <Eye size={16} />
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
