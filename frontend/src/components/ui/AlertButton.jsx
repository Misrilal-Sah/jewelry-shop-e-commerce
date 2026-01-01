import { useState, useEffect } from 'react';
import { Bell, BellOff, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import { useModal } from './Modal';
import './AlertButton.css';

const AlertButton = ({ productId, productStock, alertType = 'back_in_stock', className = '' }) => {
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [alertId, setAlertId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && productId) {
      checkAlertStatus();
    }
  }, [isAuthenticated, token, productId, alertType]);

  const checkAlertStatus = async () => {
    try {
      const res = await fetch(`/api/alerts/check/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data[alertType]);
        setAlertId(data[`${alertType}_id`]);
      }
    } catch (error) {
      console.error('Check alert status error:', error);
    }
  };

  const toggleAlert = async () => {
    if (!isAuthenticated) {
      modal.warning('Login Required', 'Please login to set up product alerts.');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const res = await fetch(`/api/alerts/product/${productId}/${alertType}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setIsSubscribed(false);
          setAlertId(null);
          toast.info('Alert removed');
        }
      } else {
        // Subscribe
        const res = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: productId,
            alert_type: alertType
          })
        });
        if (res.ok) {
          const data = await res.json();
          setIsSubscribed(true);
          setAlertId(data.alert_id);
          toast.success(data.message);
        } else {
          const data = await res.json();
          toast.error(data.message || 'Failed to set alert');
        }
      }
    } catch (error) {
      console.error('Toggle alert error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Only show back_in_stock button if product is out of stock
  if (alertType === 'back_in_stock' && productStock > 0) {
    return null;
  }

  const isBackInStock = alertType === 'back_in_stock';
  const Icon = isBackInStock ? (isSubscribed ? BellOff : Bell) : TrendingDown;
  const label = isBackInStock
    ? (isSubscribed ? 'Remove Alert' : 'Notify When Available')
    : (isSubscribed ? 'Remove Price Alert' : 'Get Price Drop Alert');

  return (
    <button
      className={`alert-button ${isSubscribed ? 'subscribed' : ''} ${alertType} ${className}`}
      onClick={toggleAlert}
      disabled={loading}
    >
      <Icon size={18} />
      <span>{loading ? 'Please wait...' : label}</span>
    </button>
  );
};

export default AlertButton;
