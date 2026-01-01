import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingBag, Star, ChevronRight, 
  Shield, Truck, RotateCcw, Ruler, ZoomIn, X, User, Check, Calendar,
  ThumbsUp, Image, Upload, Trash2, Zap
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import RecentlyViewed from '../components/product/RecentlyViewed';
import RecommendedProducts from '../components/product/RecommendedProducts';
import ShareButtons from '../components/product/ShareButtons';
import AlertButton from '../components/ui/AlertButton';
import FlashSaleTimer from '../components/product/FlashSaleTimer';
import ProductQA from '../components/product/ProductQA';
import SEO from '../components/SEO';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, removeByProductId } = useCart();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reviews state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  
  // Flash sale state
  const [flashSale, setFlashSale] = useState(null);

  // Mock product data
  const mockProducts = {
    1: {
      id: 1,
      name: 'Royal Diamond Solitaire Ring',
      description: 'An exquisite diamond solitaire ring featuring a brilliant-cut diamond set in 18K gold. This stunning piece showcases exceptional craftsmanship with a prong setting that maximizes light reflection. Perfect for engagements, anniversaries, or as a treasured gift for someone special.',
      category: 'rings',
      collection: 'wedding',
      metal_type: 'diamond',
      purity: '18K',
      weight_grams: 4.5,
      metal_price: 125000,
      making_charges: 15000,
      gst_percent: 3,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/jxyw8vx454t3mnr2q8is.jpg'],
      sizes: ['5', '6', '7', '8', '9', '10'],
      rating: 4.8,
      review_count: 124,
      stock: 10,
      certification: 'BIS Hallmarked, IGI Certified Diamond'
    },
    2: {
      id: 2,
      name: 'Traditional Gold Necklace Set',
      description: 'A stunning traditional gold necklace set with intricate temple jewelry design. This masterpiece features detailed filigree work and traditional motifs that celebrate Indian heritage. Includes matching earrings for a complete bridal look.',
      category: 'necklaces',
      collection: 'wedding',
      metal_type: 'gold',
      purity: '22K',
      weight_grams: 45,
      metal_price: 285000,
      making_charges: 35000,
      gst_percent: 3,
      images: ['https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/ygijqk8osfqg10qmlzuu.jpg'],
      sizes: ['Standard'],
      rating: 4.9,
      review_count: 89,
      stock: 5,
      certification: 'BIS Hallmarked'
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  // Check wishlist status when authenticated
  useEffect(() => {
    if (isAuthenticated && token && product) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, token, product]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        if (data.sizes?.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } else {
        setProduct(mockProducts[id] || mockProducts[1]);
        if (mockProducts[id]?.sizes?.length > 0) {
          setSelectedSize(mockProducts[id].sizes[0]);
        }
      }
    } catch (error) {
      setProduct(mockProducts[id] || mockProducts[1]);
    } finally {
      setLoading(false);
    }
  };

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product && !loading) {
      addToRecentlyViewed(product);
      fetchFlashSale(product.id);
    }
  }, [product, loading]);

  // Fetch flash sale for this product
  const fetchFlashSale = async (productId) => {
    try {
      const res = await fetch(`/api/flash-sales/product/${productId}`);
      if (res.ok) {
        const data = await res.json();
        // API returns { hasFlashSale: true, flashSale: {...} } or { hasFlashSale: false }
        if (data && data.hasFlashSale && data.flashSale) {
          setFlashSale({
            ...data.flashSale,
            is_active: true // Mark as active since API only returns active sales
          });
        } else {
          setFlashSale(null);
        }
      }
    } catch (error) {
      console.error('Fetch flash sale error:', error);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        const inWishlist = items.some(item => 
          item.product_id === product.id || item.id === product.id
        );
        setIsWishlisted(inWishlist);
      }
    } catch (error) {
      console.error('Check wishlist error:', error);
    }
  };

  const inCart = product ? isInCart(product.id) : false;

  const handleCartToggle = async () => {
    if (isProcessing) return;
    
    // Check if product is out of stock
    if (product?.stock === 0 || product?.stock === '0') {
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
      // If flash sale is active, modify product to use flash pricing
      let productToAdd = product;
      const activeFlashSale = flashSale && flashSale.is_active;
      if (activeFlashSale) {
        const currentBasePrice = parseFloat(product.metal_price) + parseFloat(product.making_charges);
        const currentFlashPrice = flashSale.flash_price 
          ? parseFloat(flashSale.flash_price) 
          : currentBasePrice * (1 - flashSale.discount_percentage / 100);
        productToAdd = {
          ...product,
          // Override prices with flash sale pricing
          metal_price: currentFlashPrice,
          making_charges: 0, // Already included in flash price
          flash_sale_applied: true,
          flash_sale_discount: flashSale.discount_percentage,
          original_price: currentBasePrice
        };
      }
      const result = await addToCart(productToAdd, quantity, selectedSize);
      if (result?.success === false) {
        toast.error(result?.message || 'Failed to add to cart');
      }
      // No toast for success - cart sidebar opens instead
    }
    
    setIsProcessing(false);
  };

  const handleBuyNow = async () => {
    if (isProcessing) return;
    
    // Check if product is out of stock
    if (product?.stock === 0 || product?.stock === '0') {
      modal.warning(
        'Out of Stock', 
        `Oops! "${product.name}" is currently out of stock. We will refill soon. Please check back later!`
      );
      return;
    }
    
    setIsProcessing(true);
    
    if (!inCart) {
      // If flash sale is active, modify product to use flash pricing
      let productToAdd = product;
      const activeFlashSale = flashSale && flashSale.is_active;
      if (activeFlashSale) {
        const currentBasePrice = parseFloat(product.metal_price) + parseFloat(product.making_charges);
        const currentFlashPrice = flashSale.flash_price 
          ? parseFloat(flashSale.flash_price) 
          : currentBasePrice * (1 - flashSale.discount_percentage / 100);
        productToAdd = {
          ...product,
          metal_price: currentFlashPrice,
          making_charges: 0,
          flash_sale_applied: true,
          flash_sale_discount: flashSale.discount_percentage,
          original_price: currentBasePrice
        };
      }
      await addToCart(productToAdd, quantity, selectedSize);
    }
    navigate('/checkout');
    
    setIsProcessing(false);
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to save items to your wishlist.');
      return;
    }
    
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist/${product.id}`, {
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
        const res = await fetch('/api/wishlist', {
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

  const handleShare = async () => {
    const productUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
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

  const getImages = () => {
    if (!product?.images) return [PLACEHOLDER];
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        return parsed.length > 0 ? parsed : [PLACEHOLDER];
      } catch {
        return [product.images];
      }
    }
    return product.images.length > 0 ? product.images : [PLACEHOLDER];
  };

  const getSizes = () => {
    if (!product?.sizes) return [];
    if (typeof product.sizes === 'string') {
      try {
        return JSON.parse(product.sizes);
      } catch {
        return [product.sizes];
      }
    }
    return product.sizes;
  };

  // Handle review image upload - accepts event or direct files array
  const handleReviewImageUpload = async (eventOrFiles) => {
    // Support both file input events and direct file arrays (from drag-drop)
    let files;
    if (eventOrFiles.target && eventOrFiles.target.files) {
      files = Array.from(eventOrFiles.target.files);
    } else if (eventOrFiles instanceof FileList || Array.isArray(eventOrFiles)) {
      files = Array.from(eventOrFiles);
    } else {
      return;
    }
    
    if (files.length === 0) return;
    
    // Limit to 5 images total
    const remainingSlots = 5 - reviewImages.length;
    if (remainingSlots <= 0) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    const filesToUpload = files.slice(0, remainingSlots);
    
    setUploadingImages(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach(file => formData.append('review_images', file));
      
      const res = await fetch('/api/products/reviews/upload-images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setReviewImages(prev => [...prev, ...data.images]);
        toast.success(`${data.images.length} image(s) uploaded`);
      } else {
        toast.error(data.message || 'Failed to upload images');
      }
    } catch (error) {
      toast.error('Failed to upload images');
    }
    setUploadingImages(false);
  };

  // Remove review image
  const removeReviewImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Drag handlers for reordering images
  const handleImageDragStart = (index) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    
    // Reorder images
    const newImages = [...reviewImages];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setReviewImages(newImages);
    setDraggedImageIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to submit a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          review: reviewText,
          images: reviewImages
        })
      });

      const data = await res.json();
      if (res.ok) {
        modal.success('Review Submitted', 'Thank you for your feedback!');
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewText('');
        setReviewImages([]);
        // Refresh product to update reviews
        fetchProduct();
      } else {
        modal.error('Error', data.message || 'Failed to submit review');
      }
    } catch (error) {
      modal.error('Error', 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  // Handle helpful vote
  const handleHelpfulClick = async (reviewId) => {
    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to vote on reviews.');
      return;
    }

    try {
      const res = await fetch(`/api/products/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Update the review's helpful count in product.reviews
        setProduct(prev => ({
          ...prev,
          reviews: prev.reviews.map(r => 
            r.id === reviewId ? { ...r, helpful_count: data.helpful_count } : r
          )
        }));
        // Track vote status
        setHelpfulVotes(prev => ({ ...prev, [reviewId]: data.voted }));
      }
    } catch (error) {
      modal.error('Error', 'Failed to vote');
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const fullStar = rating >= i + 1;
      const halfStar = rating >= i + 0.5 && rating < i + 1;
      
      stars.push(
        <div
          key={i}
          className={`star-wrapper ${interactive ? 'interactive' : ''}`}
          style={{ display: 'inline-block', position: 'relative' }}
        >
          {interactive ? (
            <>
              {/* Left half - for half star */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '50%',
                  height: '100%',
                  cursor: 'pointer',
                  zIndex: 1
                }}
                onClick={() => onRate(i + 0.5)}
              />
              {/* Right half - for full star */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: '50%',
                  height: '100%',
                  cursor: 'pointer',
                  zIndex: 1
                }}
                onClick={() => onRate(i + 1)}
              />
            </>
          ) : null}
          <Star
            size={interactive ? 32 : 16}
            fill={fullStar ? 'var(--accent-gold)' : halfStar ? 'url(#half-star-gradient)' : 'none'}
            stroke={fullStar || halfStar ? 'var(--accent-gold)' : 'var(--text-muted)'}
            className={interactive ? 'star-interactive' : ''}
            style={interactive ? { cursor: 'pointer' } : {}}
          />
          {halfStar && (
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <linearGradient id="half-star-gradient">
                  <stop offset="50%" stopColor="var(--accent-gold)" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
      );
    }
    return stars;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="product-detail-page loading">
        <div className="container">
          <div className="product-detail-skeleton">
            <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-lg)' }}></div>
            <div className="skeleton-content">
              <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 16 }}></div>
              <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 16 }}></div>
              <div className="skeleton" style={{ height: 100, marginBottom: 16 }}></div>
              <div className="skeleton" style={{ height: 50, width: '40%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page not-found">
        <div className="container">
          <h2>Product not found</h2>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  const images = getImages();
  const sizes = getSizes();
  const basePrice = parseFloat(product.metal_price) + parseFloat(product.making_charges);
  const gst = basePrice * (parseFloat(product.gst_percent || 3) / 100);
  const regularTotalPrice = basePrice + gst;
  
  // Calculate flash sale price if applicable
  const hasFlashSale = flashSale && flashSale.is_active;
  const flashSalePrice = hasFlashSale 
    ? (flashSale.flash_price 
        ? parseFloat(flashSale.flash_price) 
        : basePrice * (1 - flashSale.discount_percentage / 100))
    : null;
  const flashSaleGst = flashSalePrice ? flashSalePrice * (parseFloat(product.gst_percent || 3) / 100) : 0;
  const flashSaleTotalPrice = flashSalePrice ? flashSalePrice + flashSaleGst : null;
  
  // Final price to use
  const totalPrice = hasFlashSale ? flashSaleTotalPrice : regularTotalPrice;

  return (
    <>
    <SEO 
      title={product.name}
      description={product.description || `${product.name} - ${product.purity} ${product.metal_type} jewelry from Aabhar. ${product.weight_grams}g, crafted with excellence.`}
      image={images[0]}
      type="product"
      keywords={`${product.name}, ${product.category}, ${product.metal_type}, ${product.purity}, Indian jewelry, Aabhar`}
      product={{
        name: product.name,
        description: product.description,
        price: totalPrice,
        image: images[0],
        images: images,
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.review_count,
        category: product.category,
        sku: product.sku || product.id
      }}
    />
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products">Jewelry</Link>
          <ChevronRight size={14} />
          <Link to={`/products?category=${product.category}`}>{product.category}</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-grid">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="gallery-main" onClick={() => setShowZoom(true)}>
              <img src={images[selectedImage]} alt={product.name} />
              <button className="zoom-btn">
                <ZoomIn size={20} />
              </button>
              {/* Badges - Left Side */}
              <div className="product-detail-badges">
                {hasFlashSale && (
                  <div className="flash-sale-badge-detail">
                    <Zap size={16} />
                    {flashSale.discount_percentage}% OFF
                  </div>
                )}
                {Boolean(product.is_featured) && (
                  <span className="badge badge-gold">Featured</span>
                )}
                {(product.stock === 0 || product.stock === '0') && (
                  <span className="badge badge-error">Out of Stock</span>
                )}
              </div>
              {/* Timer - Right Side */}
              {hasFlashSale && (
                <div className="flash-timer-right">
                  <FlashSaleTimer endTime={flashSale.end_time} size="small" />
                </div>
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

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <span className="product-category">{product.category}</span>
              <h1>{product.name}</h1>
              
              {product.rating > 0 && (
                <div className="product-rating">
                  <div className="stars">
                    {Array(5).fill(0).map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} 
                      />
                    ))}
                  </div>
                  <span>{product.rating}</span>
                  <a 
                    href="#reviews-section" 
                    className="rating-count"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    ({product.review_count} reviews)
                  </a>
                </div>
              )}
            </div>

            <div className="product-description">
              <p>{product.description}</p>
            </div>

            {/* Price Breakdown */}
            <div className={`price-section ${hasFlashSale ? 'has-flash-sale' : ''}`}>
              <div className="price-main">
                {hasFlashSale && (
                  <span className="original-price-crossed">{formatPrice(regularTotalPrice)}</span>
                )}
                <span className={`total-price ${hasFlashSale ? 'flash-price' : ''}`}>{formatPrice(totalPrice)}</span>
                <span className="price-note">incl. GST</span>
                {hasFlashSale && (
                  <span className="savings-badge">
                    You save {formatPrice(regularTotalPrice - totalPrice)} ({flashSale.discount_percentage}%)
                  </span>
                )}
              </div>
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Metal Price ({product.purity} {product.metal_type})</span>
                  <span>{formatPrice(product.metal_price)}</span>
                </div>
                <div className="price-row">
                  <span>Making Charges</span>
                  <span>{formatPrice(product.making_charges)}</span>
                </div>
                {hasFlashSale && (
                  <div className="price-row flash-discount">
                    <span>Flash Sale Discount ({flashSale.discount_percentage}%)</span>
                    <span>-{formatPrice(basePrice - flashSalePrice)}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>GST (3%)</span>
                  <span>{formatPrice(hasFlashSale ? flashSaleGst : gst)}</span>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="product-specs">
              <div className="spec">
                <span className="spec-label">Metal</span>
                <span className="spec-value">{product.purity} {product.metal_type}</span>
              </div>
              <div className="spec">
                <span className="spec-label">Weight</span>
                <span className="spec-value">{product.weight_grams}g (approx)</span>
              </div>
              {product.certification && (
                <div className="spec">
                  <span className="spec-label">Certification</span>
                  <span className="spec-value">{product.certification}</span>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {sizes.length > 0 && sizes[0] !== 'Standard' && (
              <div className="size-section">
                <div className="size-header">
                  <span>Select Size</span>
                  <button className="size-guide-btn">
                    <Ruler size={14} /> Size Guide
                  </button>
                </div>
                <div className="size-options">
                  {sizes.map((size) => (
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
            <div className="quantity-section">
              <span>Quantity</span>
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
              </div>
              <span className="stock-info">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Actions */}
            <div className="product-detail-actions">
              <button 
                className={`btn-add-cart ${inCart ? 'in-cart' : ''} ${(product.stock === 0 || product.stock === '0') ? 'out-of-stock' : ''}`}
                onClick={handleCartToggle}
                disabled={isProcessing}
              >
                {inCart ? <Check size={20} /> : <ShoppingBag size={20} />}
                {inCart ? 'In Cart' : 'Add to Cart'}
              </button>
              <button 
                className={`btn-buy-now ${(product.stock === 0 || product.stock === '0') ? 'out-of-stock' : ''}`}
                onClick={handleBuyNow}
                disabled={isProcessing}
              >
                Buy Now
              </button>
              <button 
                className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
                onClick={toggleWishlist}
                disabled={isProcessing}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <ShareButtons product={product} />
            </div>

            {/* Alert Buttons */}
            <div className="alert-buttons-section">
              <AlertButton 
                productId={product.id} 
                productStock={parseInt(product.stock)} 
                alertType="back_in_stock" 
              />
              <AlertButton 
                productId={product.id} 
                productStock={parseInt(product.stock)} 
                alertType="price_drop" 
              />
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="trust-badge">
                <Shield size={18} />
                <span>BIS Hallmarked</span>
              </div>
              <div className="trust-badge">
                <Truck size={18} />
                <span>Free Shipping</span>
              </div>
              <div className="trust-badge">
                <RotateCcw size={18} />
                <span>15-Day Returns</span>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="estimated-delivery">
              <div className="delivery-icon">
                <Calendar size={20} />
              </div>
              <div className="delivery-info">
                <span className="delivery-label">Estimated Delivery</span>
                <span className="delivery-date">
                  {(() => {
                    const today = new Date();
                    const minDays = 5;
                    const maxDays = 7;
                    const minDate = new Date(today);
                    const maxDate = new Date(today);
                    minDate.setDate(today.getDate() + minDays);
                    maxDate.setDate(today.getDate() + maxDays);
                    const formatDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="reviews-section">
          <div className="reviews-header">
            <div className="reviews-summary">
              <h2>Customer Reviews</h2>
              <div className="rating-summary">
                <div className="stars-display">
                  {renderStars(Math.round(parseFloat(product.rating) || 0))}
                </div>
                <span className="rating-text">
                  {parseFloat(product.rating || 0).toFixed(1)} out of 5
                </span>
                <Link to={`/products/${id}/reviews`} className="review-count clickable">
                  ({product.review_count || 0} reviews)
                </Link>
              </div>
            </div>
            {isAuthenticated ? (
              <button 
                className="btn btn-primary"
                onClick={() => setShowReviewModal(true)}
              >
                Write a Review
              </button>
            ) : (
              <Link to="/login" className="btn btn-secondary">
                Login to Review
              </Link>
            )}
          </div>

          {/* Reviews List - Show max 3 reviews */}
          <div className="reviews-list">
            {product.reviews && product.reviews.length > 0 ? (
              <>
                {product.reviews.slice(0, 3).map((rev) => (
                  <div key={rev.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {rev.user_avatar ? (
                            <img 
                              src={rev.user_avatar.startsWith('http') ? rev.user_avatar : `http://localhost:5000${rev.user_avatar}`} 
                              alt={rev.user_name} 
                            />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <span className="reviewer-name">{rev.user_name}</span>
                      </div>
                      <div className="review-rating">
                        {renderStars(rev.rating)}
                      </div>
                    </div>
                    {(rev.comment || rev.review) && (
                      <p className="review-text">{rev.comment || rev.review}</p>
                    )}
                    {/* Review Images */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="review-card-images">
                        {rev.images.map((img, idx) => (
                          <div key={idx} className="review-card-image">
                            <img src={img} alt={`Review ${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Footer: Date left, Helpful right */}
                    <div className="review-footer">
                      <span className="review-date">
                        <Calendar size={14} />
                        {formatDate(rev.created_at)}
                      </span>
                      <button 
                        className={`helpful-btn ${helpfulVotes[rev.id] ? 'voted' : ''}`}
                        onClick={() => handleHelpfulClick(rev.id)}
                      >
                        <ThumbsUp size={14} /> Helpful ({rev.helpful_count || 0})
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* View All Reviews Button */}
                {product.reviews.length > 3 && (
                  <Link to={`/products/${id}/reviews`} className="view-all-reviews-btn">
                    View All {product.review_count || product.reviews.length} Reviews
                  </Link>
                )}
              </>
            ) : (
              <div className="no-reviews">
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && (
        <div className="zoom-modal" onClick={() => setShowZoom(false)}>
          <img src={images[selectedImage]} alt={product.name} />
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Write a Review</h3>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="rating-selector">
                <label>Your Rating</label>
                <div className="stars-selector">
                  {renderStars(reviewRating, true, setReviewRating)}
                </div>
              </div>
              
              <div className="review-input">
                <label>Your Review (optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={3}
                ></textarea>
              </div>
              
              {/* Image Upload Dropzone */}
              <div className="review-images-section">
                <label>Add Photos (optional, max 5)</label>
                
                {/* Dropzone */}
                {reviewImages.length < 5 && (
                  <label 
                    className={`review-dropzone ${uploadingImages ? 'uploading' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        handleReviewImageUpload(files);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReviewImageUpload}
                      disabled={uploadingImages}
                      style={{ display: 'none' }}
                    />
                    {uploadingImages ? (
                      <div className="dropzone-uploading">
                        <div className="uploading-spinner"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <Upload size={24} />
                        <span>Drag & drop images or click to browse</span>
                        <small>{5 - reviewImages.length} slots remaining</small>
                      </div>
                    )}
                  </label>
                )}
                
                {/* Image Previews - Draggable for reordering */}
                {reviewImages.length > 0 && (
                  <div className="review-images-grid">
                    <small className="drag-hint">Drag images to reorder</small>
                    {reviewImages.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`review-image-preview ${draggedImageIndex === idx ? 'dragging' : ''}`}
                        draggable
                        onDragStart={() => handleImageDragStart(idx)}
                        onDragOver={(e) => handleImageDragOver(e, idx)}
                        onDragEnd={handleImageDragEnd}
                      >
                        <img src={img} alt={`Review ${idx + 1}`} />
                        <span className="image-order">{idx + 1}</span>
                        <button 
                          type="button" 
                          className="remove-image-btn"
                          onClick={() => removeReviewImage(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="review-modal-actions">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingReview || uploadingImages}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      <div className="container">
        <ProductQA productId={product?.id} />
        <RecommendedProducts productId={product?.id} title="You May Also Like" limit={4} />
        <RecentlyViewed currentProductId={product?.id} maxDisplay={6} />
      </div>
    </div>
    </>
  );
};

export default ProductDetail;
