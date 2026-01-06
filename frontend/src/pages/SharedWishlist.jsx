import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, User, Eye, ExternalLink, ThumbsUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import { apiFetch } from '../config/api';
import ProductCard from '../components/product/ProductCard';
import './SharedWishlist.css';

const SharedWishlist = () => {
  const { shareCode } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  
  const [wishlistData, setWishlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchSharedWishlist();
    }
  }, [shareCode]);

  useEffect(() => {
    // Check if user has liked this wishlist (requires auth)
    if (isAuthenticated && token) {
      checkLikeStatus();
    }
  }, [shareCode, isAuthenticated, token]);

  const fetchSharedWishlist = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/wishlist/shared/${shareCode}`);
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Wishlist not found');
        return;
      }

      const data = await res.json();
      setWishlistData(data);
    } catch (err) {
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const res = await apiFetch(`/api/wishlist/shared/${shareCode}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
      }
    } catch (err) {
      console.error('Check like status error:', err);
    }
  };

  const handleLike = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to like wishlists.');
      return;
    }
    
    if (liking) return;
    
    setLiking(true);
    try {
      const res = await apiFetch(`/api/wishlist/shared/${shareCode}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setWishlistData(prev => ({ ...prev, likeCount: data.likeCount }));
        setLiked(data.liked);
        toast.success(data.liked ? 'Liked! ❤️' : 'Unliked');
      }
    } catch (err) {
      toast.error('Failed to like');
    }
    setLiking(false);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      return;
    }
    
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="shared-wishlist-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-wishlist-page">
        <div className="container">
          <div className="error-state">
            <Heart size={48} />
            <h2>Wishlist Not Available</h2>
            <p>{error}</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-wishlist-page">
      <div className="container">
        {/* Header */}
        <div className="shared-wishlist-header">
          <div className="header-info">
            <div className="user-badge">
              <User size={20} />
              <span>{wishlistData.userName}'s Wishlist</span>
            </div>
            <h1>Shared Wishlist</h1>
            <div className="meta">
              <span className="item-count">
                <Heart size={16} /> {wishlistData.items.length} items
              </span>
              <span className="view-count">
                <Eye size={16} /> {wishlistData.viewCount} views
              </span>
              <span className="like-count">
                <ThumbsUp size={16} /> {wishlistData.likeCount || 0} likes
              </span>
            </div>
          </div>
          
          {/* Like Button */}
          <button 
            className={`like-wishlist-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
          >
            <ThumbsUp size={20} fill={liked ? 'currentColor' : 'none'} />
            {liking ? 'Processing...' : liked ? 'Liked' : 'Like this Wishlist'}
          </button>
        </div>

        {/* Products Grid */}
        {wishlistData.items.length > 0 ? (
          <div className="shared-wishlist-grid">
            {wishlistData.items.map((product) => (
              <div key={product.id} className="shared-product-card">
                <ProductCard product={product} />
                <button 
                  className="btn btn-primary add-to-cart-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Heart size={48} />
            <h3>This wishlist is empty</h3>
            <p>No items have been added yet</p>
          </div>
        )}

        {/* Browse More */}
        <div className="browse-more">
          <Link to="/products" className="btn btn-ghost">
            <ExternalLink size={18} />
            Browse Our Collection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedWishlist;
