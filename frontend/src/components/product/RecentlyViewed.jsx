import { Link } from 'react-router-dom';
import { X, Clock, Trash2 } from 'lucide-react';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import './RecentlyViewed.css';

const RecentlyViewed = ({ currentProductId = null, maxDisplay = 6 }) => {
  const { recentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Filter out current product if on product detail page
  const displayProducts = recentlyViewed
    .filter(p => p.id !== currentProductId)
    .slice(0, maxDisplay);

  if (displayProducts.length === 0) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <section className="recently-viewed-section">
      <div className="recently-viewed-header">
        <div className="header-left">
          <Clock size={20} />
          <h3>Recently Viewed</h3>
        </div>
        {displayProducts.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={clearRecentlyViewed}
            title="Clear all"
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="recently-viewed-grid">
        {displayProducts.map((product) => (
          <div key={product.id} className="recently-viewed-item">
            <button 
              className="remove-item-btn"
              onClick={(e) => {
                e.preventDefault();
                removeFromRecentlyViewed(product.id);
              }}
              title="Remove"
            >
              <X size={14} />
            </button>
            <Link to={`/products/${product.id}`} className="item-link">
              <div className="item-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="item-info">
                <p className="item-category">{product.category}</p>
                <h4 className="item-name">{product.name}</h4>
                <p className="item-price">{formatPrice(product.price)}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
