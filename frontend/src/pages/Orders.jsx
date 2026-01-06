import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Eye, ChevronRight, Calendar, CreditCard, Truck, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { apiFetch } from '../config/api';
import EmptyState from '../components/ui/EmptyState';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;
    
    window.scrollTo(0, 0);
    
    if (!isAuthenticated) {
      navigate('/login?redirect=/orders');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, authLoading]);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered': 
        return { class: 'success', label: 'Delivered', icon: '✓' };
      case 'cancelled': 
        return { class: 'error', label: 'Cancelled', icon: '✕' };
      case 'shipped': 
        return { class: 'info', label: 'Shipped', icon: '🚚' };
      case 'processing':
        return { class: 'warning', label: 'Processing', icon: '⏳' };
      default: 
        return { class: 'pending', label: 'Placed', icon: '📦' };
    }
  };

  const copyOrderId = (e, orderNumber) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    toast.success('Order ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="orders-page loading">
        <div className="container">
          <h1>My Orders</h1>
          <div className="orders-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="order-card skeleton-card">
                <div className="skeleton" style={{ height: 140 }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          {orders.length > 0 && (
            <span className="orders-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
          )}
        </div>

        {orders.length === 0 ? (
          <EmptyState 
            type="orders" 
            title="No orders yet"
            description="When you place an order, it will appear here."
            actionText="Start Shopping"
            actionLink="/products"
          />
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const itemCount = order.item_count || 1;
              
              return (
                <Link 
                  key={order.id} 
                  to={`/orders/${order.id}`} 
                  className="order-card"
                >
                  <div className="order-card-left">
                    <div className="order-icon">
                      <Package size={24} />
                    </div>
                    <div className="order-main-info">
                      <div className="order-number-row">
                        <span className="order-number">#{order.order_number}</span>
                        <button 
                          className={`copy-order-btn ${copiedId === order.order_number ? 'copied' : ''}`}
                          onClick={(e) => copyOrderId(e, order.order_number)}
                          title="Copy Order ID"
                        >
                          {copiedId === order.order_number ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="order-meta">
                        <span className="order-date">
                          <Calendar size={14} />
                          {formatDate(order.created_at)}
                        </span>
                        <span className="order-items">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-card-center">
                    <div className="order-detail">
                      <CreditCard size={14} />
                      <span>{order.payment_method?.toUpperCase() || 'COD'}</span>
                    </div>
                    <div className="order-amount">
                      {formatPrice(order.total_amount)}
                    </div>
                  </div>
                  
                  <div className="order-card-status">
                    <span className={`order-status ${statusInfo.class}`}>
                      <span className="status-icon">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <div className="order-card-right">
                    <span className="view-details">
                      View Details <ChevronRight size={16} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
