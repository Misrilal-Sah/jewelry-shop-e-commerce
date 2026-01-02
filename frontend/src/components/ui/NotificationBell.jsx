import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, X, Package, TrendingDown, ShoppingBag, Cake, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CelebrationModal from '../CelebrationModal/CelebrationModal';
import './NotificationBell.css';

const NotificationBell = () => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState({ isOpen: false, data: null });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Route based on notification type
    if (notification.type === 'birthday' || notification.type === 'anniversary') {
      // Parse metadata and open celebration modal directly
      let metadata = notification.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Failed to parse metadata:', e);
        }
      }
      
      if (metadata) {
        setCelebrationModal({ isOpen: true, data: metadata });
      }
    } else if (notification.link) {
      // Navigate to the specific link (e.g., /orders, /products, etc.)
      navigate(notification.link);
    } else {
      // Default: go to notifications page
      navigate('/notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'back_in_stock':
        return <Package size={16} />;
      case 'price_drop':
        return <TrendingDown size={16} />;
      case 'order':
        return <ShoppingBag size={16} />;
      case 'birthday':
        return <Cake size={16} />;
      case 'anniversary':
        return <Heart size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`action-btn notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="spinner"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="empty-illustration">
                  <Bell size={40} />
                  <div className="empty-sparkles">✨</div>
                </div>
                <p className="empty-title">All Caught Up!</p>
                <p className="empty-subtitle">You'll be notified about stock alerts, price drops, and order updates here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''} ${notification.type === 'birthday' || notification.type === 'anniversary' ? 'celebration' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`notification-icon type-${notification.type}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    {notification.message && (
                      <p className="notification-message">{notification.message}</p>
                    )}
                    <span className="notification-time">{formatTime(notification.created_at)}</span>
                  </div>
                  <button 
                    className="notification-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <Link to="/notifications" className="view-all-link" onClick={() => setIsOpen(false)}>
              View All Notifications
            </Link>
          )}
        </div>
      )}
    </div>

      {/* Celebration Modal for Birthday/Anniversary */}
      <CelebrationModal 
        isOpen={celebrationModal.isOpen}
        onClose={() => setCelebrationModal({ isOpen: false, data: null })}
        data={celebrationModal.data}
      />
    </>
  );
};

export default NotificationBell;
