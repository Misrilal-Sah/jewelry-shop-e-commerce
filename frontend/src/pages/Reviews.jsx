import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft, User, ThumbsUp, Calendar, ChevronDown, Check, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useModal } from '../components/ui/Modal';
import './Reviews.css';

const Reviews = () => {
  const { id } = useParams();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  
  const [reviews, setReviews] = useState([]);
  const [product, setProduct] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({}); // Track which reviews user has voted on
  const sortRef = useRef(null);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Rated' },
    { value: 'lowest', label: 'Lowest Rated' },
    { value: 'helpful', label: 'Most Helpful' }
  ];

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    fetchProduct();
    fetchReviews();
  }, [id, sortBy]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}/reviews?sortBy=${sortBy}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setRatingDistribution(data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

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
        // Update the review's helpful count
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, helpful_count: data.helpful_count } : r
        ));
        // Track vote status
        setHelpfulVotes(prev => ({ ...prev, [reviewId]: data.voted }));
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentSortLabel = () => {
    return sortOptions.find(o => o.value === sortBy)?.label || 'Newest First';
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setSortOpen(false);
  };

  const getFilteredReviews = () => {
    // Sorting is now done by API, only filter locally
    if (filter === 'all') return reviews;
    return reviews.filter(r => Math.floor(r.rating) === parseInt(filter));
  };

  const getRatingDistributionData = () => {
    return ratingDistribution;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const fillPercentage = Math.min(1, Math.max(0, rating - i));
      stars.push(
        <div key={i} className="star-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
          {/* Empty star background */}
          <Star size={16} fill="none" className="star-empty" />
          {/* Filled star overlay */}
          {fillPercentage > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'hidden',
              width: `${fillPercentage * 100}%`
            }}>
              <Star size={16} fill="currentColor" className="star-filled" />
            </div>
          )}
        </div>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="container">
          <div className="loading-state">Loading reviews...</div>
        </div>
      </div>
    );
  }

  const distribution = getRatingDistributionData();
  const filteredReviews = getFilteredReviews();

  return (
    <div className="reviews-page">
      <div className="container">
        {/* Back Link */}
        <Link to={`/products/${id}`} className="back-nav">
          <ArrowLeft size={18} /> Back to Product
        </Link>

        {/* Product Summary */}
        <div className="reviews-header">
          <div className="product-summary">
            <img src={product?.images?.[0]} alt={product?.name} className="product-thumb" />
            <div>
              <h1>Reviews for {product?.name}</h1>
              <div className="overall-rating">
                <span className="rating-number">{product?.rating}</span>
                <div className="rating-stars">{renderStars(Math.round(product?.rating || 0))}</div>
                <span className="review-count">Based on {product?.review_count} reviews</span>
              </div>
            </div>
          </div>
        </div>

        <div className="reviews-layout">
          {/* Sidebar */}
          <aside className="reviews-sidebar">
            <div className="rating-distribution">
              <h3>Rating Breakdown</h3>
              {[5, 4, 3, 2, 1].map(stars => (
                <button 
                  key={stars}
                  className={`rating-bar ${filter === String(stars) ? 'active' : ''}`}
                  onClick={() => setFilter(filter === String(stars) ? 'all' : String(stars))}
                >
                  <span className="stars">{stars} ★</span>
                  <div className="bar">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(distribution[stars] / reviews.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="count">{distribution[stars]}</span>
                </button>
              ))}
            </div>

            <button 
              className="btn btn-secondary write-review-btn"
              onClick={() => alert('Review submission coming soon!')}
            >
              Write a Review
            </button>
          </aside>

          {/* Reviews List */}
          <div className="reviews-content">
            <div className="reviews-toolbar">
              <span>{filteredReviews.length} reviews</span>
              <div className="sort-dropdown-wrapper" ref={sortRef}>
                <button 
                  className={`sort-dropdown-trigger ${sortOpen ? 'open' : ''}`}
                  onClick={() => setSortOpen(!sortOpen)}
                >
                  <span>{getCurrentSortLabel()}</span>
                  <ChevronDown size={16} />
                </button>
                {sortOpen && (
                  <div className="sort-dropdown-menu">
                    {sortOptions.map(option => (
                      <div 
                        key={option.value}
                        className={`sort-dropdown-option ${sortBy === option.value ? 'active' : ''}`}
                        onClick={() => handleSortChange(option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="reviews-list">
              {filteredReviews.length === 0 ? (
                <div className="no-reviews">No reviews yet for this product.</div>
              ) : (
                filteredReviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer">
                        <div className="avatar">
                          {review.user_avatar ? (
                            <img 
                              src={review.user_avatar.startsWith('http') ? review.user_avatar : `http://localhost:5000${review.user_avatar}`} 
                              alt={review.user_name} 
                            />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <span className="name">{review.user_name}</span>
                          {review.order_id && <span className="verified">✓ Verified Purchase</span>}
                        </div>
                      </div>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    {review.comment && <p className="review-comment">{review.comment}</p>}
                    
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="review-images">
                        {review.images.map((img, idx) => (
                          <div key={idx} className="review-image">
                            <img src={img} alt={`Review image ${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="review-footer">
                      <span className="review-date">
                        <Calendar size={14} />
                        {new Date(review.created_at).toLocaleDateString('en-IN', { 
                          day: 'numeric', month: 'short', year: 'numeric' 
                        })}
                      </span>
                      <button 
                        className={`helpful-btn ${helpfulVotes[review.id] ? 'voted' : ''}`}
                        onClick={() => handleHelpfulClick(review.id)}
                      >
                        <ThumbsUp size={14} /> Helpful ({review.helpful_count || 0})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
