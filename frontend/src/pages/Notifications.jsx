import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Package, TrendingDown, ShoppingBag, ArrowLeft, Cake, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { apiFetch } from '../config/api';
import CelebrationModal from '../components/CelebrationModal/CelebrationModal';
import './Notifications.css';

const Notifications = () => {
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [celebrationModal, setCelebrationModal] = useState({ isOpen: false, data: null });

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, authLoading]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications?limit=50', {
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

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Check if it's a birthday or anniversary notification
    if (notification.type === 'birthday' || notification.type === 'anniversary') {
      // Parse metadata if it exists
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
        if (!notification.is_read) {
          markAsRead(notification.id);
        }
        return;
      }
    }
    
    // For other notifications with links, navigate
    if (notification.link) {
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'back_in_stock':
        return <Package size={20} />;
      case 'price_drop':
        return <TrendingDown size={20} />;
      case 'order':
        return <ShoppingBag size={20} />;
      case 'birthday':
        return <Cake size={20} />;
      case 'anniversary':
        return <Heart size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="container">
          <div className="notifications-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-title">
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllAsRead}>
              <Check size={16} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon">
              <Bell size={48} />
            </div>
            <h2>No Notifications</h2>
            <p>You're all caught up! Check back later for updates on your orders, price drops, and more.</p>
            <Link to="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`notification-card ${!notification.is_read ? 'unread' : ''} ${notification.type === 'birthday' || notification.type === 'anniversary' ? 'celebration' : ''}`}
              >
                <div className={`notification-icon type-${notification.type}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <h3 className="notification-title">{notification.title}</h3>
                  {notification.message && (
                    <p className="notification-message">{notification.message}</p>
                  )}
                  <span className="notification-time">{formatTime(notification.created_at)}</span>
                </div>
                <div className="notification-actions">
                  {/* Special button for birthday/anniversary */}
                  {(notification.type === 'birthday' || notification.type === 'anniversary') ? (
                    <button 
                      className="view-btn celebration-btn"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      🎁 View Gift
                    </button>
                  ) : notification.link && (
                    <Link 
                      to={notification.link} 
                      className="view-btn"
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      View
                    </Link>
                  )}
                  {!notification.is_read && (
                    <button 
                      className="read-btn"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Modal for Birthday/Anniversary */}
      <CelebrationModal 
        isOpen={celebrationModal.isOpen}
        onClose={() => setCelebrationModal({ isOpen: false, data: null })}
        data={celebrationModal.data}
      />
    </div>
  );
};

export default Notifications;

