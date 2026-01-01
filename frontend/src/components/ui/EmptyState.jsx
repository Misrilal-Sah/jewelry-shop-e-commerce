import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Package, Search, FileX } from 'lucide-react';
import './EmptyState.css';

const illustrations = {
  cart: (
    <svg viewBox="0 0 200 200" className="empty-illustration">
      <defs>
        <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C5A26D" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#C5A26D" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#cartGrad)"/>
      <path d="M60 70h15l20 50h50l15-35h-75" stroke="#C5A26D" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="95" cy="135" r="8" fill="#C5A26D"/>
      <circle cx="135" cy="135" r="8" fill="#C5A26D"/>
      <path d="M85 90h45" stroke="#C5A26D" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M90 105h35" stroke="#C5A26D" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  wishlist: (
    <svg viewBox="0 0 200 200" className="empty-illustration">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e74c3c" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#e74c3c" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#heartGrad)"/>
      <path d="M100 150c-30-25-55-45-55-70 0-20 15-35 35-35 12 0 20 8 20 8s8-8 20-8c20 0 35 15 35 35 0 25-25 45-55 70z" stroke="#e74c3c" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="80" cy="80" r="5" fill="#e74c3c" opacity="0.5"/>
      <circle cx="120" cy="80" r="5" fill="#e74c3c" opacity="0.5"/>
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 200 200" className="empty-illustration">
      <defs>
        <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3498db" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#3498db" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#boxGrad)"/>
      <rect x="55" y="65" width="90" height="80" rx="8" stroke="#3498db" strokeWidth="4" fill="none"/>
      <path d="M55 90h90" stroke="#3498db" strokeWidth="3"/>
      <path d="M145 90l-15-25H70l-15 25" stroke="#3498db" strokeWidth="4" fill="none" strokeLinejoin="round"/>
      <path d="M100 90v55" stroke="#3498db" strokeWidth="3"/>
      <circle cx="100" cy="120" r="10" fill="#3498db" opacity="0.3"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 200" className="empty-illustration">
      <defs>
        <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#searchGrad)"/>
      <circle cx="90" cy="90" r="35" stroke="#9b59b6" strokeWidth="4" fill="none"/>
      <path d="M115 115l30 30" stroke="#9b59b6" strokeWidth="6" strokeLinecap="round"/>
      <path d="M75 85h30" stroke="#9b59b6" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M75 95h20" stroke="#9b59b6" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 200 200" className="empty-illustration">
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C5A26D" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#C5A26D" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#defaultGrad)"/>
      <rect x="60" y="55" width="80" height="100" rx="8" stroke="#C5A26D" strokeWidth="4" fill="none"/>
      <path d="M75 80h50M75 100h40M75 120h30" stroke="#C5A26D" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M95 130l10 15 20-30" stroke="#C5A26D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
};

const EmptyState = ({ 
  type = 'default', 
  title, 
  description, 
  actionText, 
  actionLink,
  onAction 
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'cart':
        return {
          title: 'Your cart is empty',
          description: 'Looks like you haven\'t added any items to your cart yet.',
          actionText: 'Start Shopping',
          actionLink: '/products'
        };
      case 'wishlist':
        return {
          title: 'Your wishlist is empty',
          description: 'Save your favorite items here by clicking the heart icon.',
          actionText: 'Explore Products',
          actionLink: '/products'
        };
      case 'orders':
        return {
          title: 'No orders yet',
          description: 'When you place an order, it will appear here.',
          actionText: 'Start Shopping',
          actionLink: '/products'
        };
      case 'search':
        return {
          title: 'No results found',
          description: 'Try adjusting your search or filters to find what you\'re looking for.',
          actionText: 'Clear Filters',
          actionLink: null
        };
      default:
        return {
          title: 'Nothing here',
          description: 'This section is empty.',
          actionText: 'Go Home',
          actionLink: '/'
        };
    }
  };

  const defaults = getDefaultContent();

  return (
    <div className="empty-state">
      <div className="empty-state-illustration">
        {illustrations[type] || illustrations.default}
      </div>
      <h2 className="empty-state-title">{title || defaults.title}</h2>
      <p className="empty-state-description">{description || defaults.description}</p>
      {(actionLink || onAction) && (
        actionLink ? (
          <Link to={actionLink} className="empty-state-action btn btn-primary">
            {actionText || defaults.actionText}
          </Link>
        ) : (
          <button onClick={onAction} className="empty-state-action btn btn-primary">
            {actionText || defaults.actionText}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
