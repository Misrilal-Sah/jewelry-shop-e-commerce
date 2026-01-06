import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Check, Share2, Copy, X, Eye, ThumbsUp, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
import { apiFetch } from '../config/api';
import EmptyState from '../components/ui/EmptyState';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const { addToCart, isInCart } = useCart();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStatus, setShareStatus] = useState({ isSharing: false, shareCode: null, viewCount: 0, likeCount: 0 });
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;
    
    window.scrollTo(0, 0);
    
    if (!isAuthenticated) {
      navigate('/login?redirect=/wishlist');
      return;
    }
    fetchWishlist();
    fetchShareStatus();
  }, [isAuthenticated, authLoading]);

  const fetchWishlist = async () => {
    try {
      const res = await apiFetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await apiFetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(items.filter(item => item.id !== productId));
      toast.info('Removed from wishlist');
    } catch (error) {
      console.error('Remove wishlist error:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (product) => {
    if (processing === product.id) return;
    
    // Check if already in cart
    if (isInCart(product.id)) {
      toast.warning('Already in cart');
      return;
    }
    
    setProcessing(product.id);
    await addToCart(product, 1);
    // No toast for success - cart sidebar opens instead
    setProcessing(null);
  };

  const formatPrice = (product) => {
    // Use backend total_price if available (includes flash sale)
    if (product.total_price) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(product.total_price);
    }
    // Fallback to calculated price
    const total = (parseFloat(product.metal_price) + parseFloat(product.making_charges)) * 1.03;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(total);
  };
  
  const formatOriginalPrice = (product) => {
    const total = (parseFloat(product.original_price || product.metal_price) + parseFloat(product.making_charges || 0)) * 1.03;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(total);
  };

  const PLACEHOLDER = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_400,h_400/jewllery_shop/logos/alankara-emblem.png';

  const getImage = (product) => {
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          return JSON.parse(product.images)[0] || PLACEHOLDER;
        } catch {
          return product.images;
        }
      }
      return product.images[0] || PLACEHOLDER;
    }
    return PLACEHOLDER;
  };

  // Share functions
  const fetchShareStatus = async () => {
    try {
      const res = await apiFetch('/api/wishlist/share/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShareStatus(data);
      }
    } catch (error) {
      console.error('Fetch share status error:', error);
    }
  };

  const handleShare = async () => {
    setGeneratingLink(true);
    try {
      const res = await apiFetch('/api/wishlist/share', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShareStatus({ isSharing: true, shareCode: data.shareCode, viewCount: 0 });
        setShowShareModal(true);
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
    setGeneratingLink(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/wishlist/shared/${shareStatus.shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleDisableShare = async () => {
    try {
      await apiFetch('/api/wishlist/share', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareStatus({ isSharing: false, shareCode: null, viewCount: 0 });
      setShowShareModal(false);
      toast.info('Sharing disabled');
    } catch (error) {
      toast.error('Failed to disable sharing');
    }
  };

  const getShareUrl = () => `${window.location.origin}/wishlist/shared/${shareStatus.shareCode}`;

  const shareText = 'Check out my jewelry wishlist!';
  const socialLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + getShareUrl())}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`,
    instagram: getShareUrl(), // Instagram doesn't have direct sharing, copy link instead
    gmail: `mailto:?subject=${encodeURIComponent('My Jewelry Wishlist')}&body=${encodeURIComponent(shareText + '\n\n' + getShareUrl())}`
  };

  if (loading) {
    return (
      <div className="wishlist-page loading">
        <div className="container">
          <div className="skeleton" style={{ height: 150, marginBottom: 16 }}></div>
          <div className="skeleton" style={{ height: 150 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          {items.length > 0 && (
            <div className="wishlist-actions">
              {shareStatus.isSharing && (
                <div className="share-stats-inline">
                  <span className="share-status">
                    <Eye size={14} /> {shareStatus.viewCount} views
                  </span>
                  <span className="share-status">
                    <ThumbsUp size={14} /> {shareStatus.likeCount || 0} likes
                  </span>
                </div>
              )}
              <button 
                className={`btn ${shareStatus.isSharing ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => shareStatus.isSharing ? setShowShareModal(true) : handleShare()}
                disabled={generatingLink}
              >
                <Share2 size={16} />
                {generatingLink ? 'Generating...' : shareStatus.isSharing ? 'Share Settings' : 'Share Wishlist'}
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState 
            type="wishlist" 
            title="Your wishlist is empty"
            description="Save items you love by clicking the heart icon on products."
            actionText="Explore Products"
            actionLink="/products"
          />
        ) : (
          <div className="wishlist-grid">
            {items.map((item) => (
              <div key={item.id} className="wishlist-item">
                <Link to={`/products/${item.id}`} className="item-image">
                  <img src={getImage(item)} alt={item.name} />
                </Link>
                <div className="item-info">
                  <Link to={`/products/${item.id}`} className="item-name">{item.name}</Link>
                  <span className="item-meta">{item.purity} {item.metal_type}</span>
                </div>
                <div className={`item-price ${item.flash_sale_applied ? 'has-flash-sale' : ''}`}>
                  {item.flash_sale_applied && (
                    <>
                      <span className="flash-badge-wishlist"><Zap size={12} /> {item.flash_sale_discount}% OFF</span>
                      <span className="original-price-struck">{formatOriginalPrice(item)}</span>
                    </>
                  )}
                  <span className={item.flash_sale_applied ? 'discounted-price' : ''}>{formatPrice(item)}</span>
                </div>
                <div className="item-actions">
                  <button 
                    className={`btn ${isInCart(item.id) ? 'btn-secondary' : 'btn-primary'} btn-sm`} 
                    onClick={() => handleAddToCart(item)}
                    disabled={processing === item.id}
                  >
                    {isInCart(item.id) ? (
                      <><Check size={16} /> In Cart</>
                    ) : (
                      <><ShoppingBag size={16} /> Add to Cart</>
                    )}
                  </button>
                  <button className="remove-btn" onClick={() => removeFromWishlist(item.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>
            
            <h2><Share2 size={24} /> Share Your Wishlist</h2>
            
            <div className="share-link-box">
              <input 
                type="text" 
                readOnly 
                value={getShareUrl()} 
                className="share-link-input"
              />
              <button className="btn btn-primary" onClick={handleCopyLink}>
                <Copy size={16} /> Copy
              </button>
            </div>

            <div className="share-stats">
              <div className="stat-item">
                <Eye size={16} />
                <span>{shareStatus.viewCount} views</span>
              </div>
              <div className="stat-item">
                <ThumbsUp size={16} />
                <span>{shareStatus.likeCount || 0} likes</span>
              </div>
            </div>

            <div className="social-share">
              <p>Share on:</p>
              <div className="social-buttons-grid">
                {/* WhatsApp */}
                <a 
                  href={socialLinks.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-icon-btn whatsapp"
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
                {/* Facebook */}
                <a 
                  href={socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-icon-btn facebook"
                  title="Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
                {/* X (Twitter) */}
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-icon-btn twitter"
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter</span>
                </a>
                {/* Instagram */}
                <button 
                  className="social-icon-btn instagram"
                  title="Copy link & open Instagram"
                  onClick={() => {
                    navigator.clipboard.writeText(getShareUrl());
                    toast.success('Link copied! Paste in Instagram');
                    window.open('https://www.instagram.com/', '_blank');
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  <span>Instagram</span>
                </button>
                {/* Gmail */}
                <a 
                  href={socialLinks.gmail} 
                  className="social-icon-btn gmail"
                  title="Gmail"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                  <span>Gmail</span>
                </a>
              </div>
            </div>

            <button className="btn btn-ghost disable-share" onClick={handleDisableShare}>
              Disable Sharing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
