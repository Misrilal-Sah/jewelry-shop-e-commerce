import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, MapPin, CreditCard, User, Mail, Phone, 
  Calendar, DollarSign, Clock, ChevronDown, Gift, Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { apiFetch } from '../../config/api';
import InvoiceTemplate from '../../components/InvoiceTemplate';
import './Admin.css';

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const statuses = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    fetchOrder();
    
    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        toast.error('Failed to load order details');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('Error loading order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const res = await apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrder(prev => ({ ...prev, status: newStatus }));
        setStatusDropdownOpen(false);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return 'var(--text-primary)';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Order Details...</div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="order-view-page">
      <div className="order-view-container">
        {/* Header */}
        <div className="order-view-header">
          <div className="header-left">
            <Link to="/admin/orders" className="back-link-btn">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="page-title">Order #{order.order_number}</h1>
              <p className="page-subtitle">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          
          <div className="header-actions">
            {/* Print Button */}
            <button className="btn btn-secondary print-invoice-btn" onClick={() => window.print()}>
              <Printer size={18} /> Print Invoice
            </button>
            
            {/* Status Dropdown */}
            <div className="custom-select status-dropdown">
              <div 
                className="custom-select-trigger status-trigger"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                style={{ color: getStatusColor(order.status) }}
              >
                <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                <ChevronDown size={14} />
              </div>
              {statusDropdownOpen && (
                <div className="custom-select-options status-options">
                  {statuses.map(s => (
                    <div 
                      key={s}
                      className={`custom-select-option ${order.status === s ? 'selected' : ''}`}
                      onClick={() => updateStatus(s)}
                      style={{ color: getStatusColor(s) }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="order-view-grid">
          {/* Main Info Column */}
          <div className="order-main-col">
            {/* Order Items */}
            <div className="admin-card">
              <div className="card-header">
                <h3><Package size={18} /> Order Items</h3>
                <span className="item-count">{order.items?.length} items</span>
              </div>
              <div className="order-items-list">
                {order.items?.map((item, index) => {
                  // Parse images safely - could be JSON array, URL string, or already an array
                  let imageUrl = '/placeholder.png';
                  if (item.images) {
                    try {
                      if (typeof item.images === 'string') {
                        if (item.images.startsWith('[')) {
                          // JSON array string
                          const parsed = JSON.parse(item.images);
                          imageUrl = parsed[0] || '/placeholder.png';
                        } else {
                          // Direct URL string
                          imageUrl = item.images;
                        }
                      } else if (Array.isArray(item.images)) {
                        imageUrl = item.images[0] || '/placeholder.png';
                      }
                    } catch (e) {
                      imageUrl = '/placeholder.png';
                    }
                  }
                  
                  return (
                    <div key={index} className="admin-order-item">
                      <div className="item-image">
                        <img src={imageUrl} alt={item.product_name} />
                      </div>
                      <div className="item-details">
                        <h4>{item.product_name}</h4>
                        <p className="item-meta">
                          {item.size && <span>Size: {item.size} • </span>}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="item-price">
                        {formatPrice(item.total_price || item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Totals */}
              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal || order.total_amount * 0.97)}</span>
                </div>
                <div className="total-row">
                  <span>GST</span>
                  <span>{formatPrice(order.gst_amount || order.total_amount * 0.03)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="total-row discount-row">
                    <span>
                      Coupon Discount 
                      {order.coupon_code && <span className="coupon-tag"> ({order.coupon_code})</span>}
                    </span>
                    <span className="discount-value">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Shipping</span>
                  <span className="free-shipping">FREE</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="order-sidebar-col">
            {/* Customer Info */}
            <div className="admin-card">
              <h3><User size={18} /> Customer</h3>
              <div className="info-group">
                <div className="info-row">
                  <User size={14} className="info-icon" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="info-row">
                  <Mail size={14} className="info-icon" />
                  <span>{order.customer_email}</span>
                </div>
                {order.customer_phone && (
                  <div className="info-row">
                    <Phone size={14} className="info-icon" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="admin-card">
              <h3><MapPin size={18} /> Shipping Address</h3>
              {order.shipping_address ? (
                <div className="address-box">
                  <p className="addr-name">{order.shipping_address.name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                  <p>{order.shipping_address.pincode}</p>
                  <p className="addr-phone">Phone: {order.shipping_address.phone}</p>
                </div>
              ) : (
                 <p className="no-data">No shipping address</p>
              )}
            </div>

            {/* Payment Info */}
            <div className="admin-card">
              <h3><CreditCard size={18} /> Payment</h3>
              <div className="info-group">
                 <div className="info-row">
                   <span className="label">Method:</span>
                   <span className="value uppercase">{order.payment_method}</span>
                 </div>
                 <div className="info-row">
                   <span className="label">Status:</span>
                   <span className={`status-badge ${order.payment_status || 'pending'}`}>
                     {order.payment_status || 'Pending'}
                   </span>
                 </div>
              </div>
            </div>

            {/* Gift Information */}
            {Boolean(order.is_gift) && (
              <div className="admin-card gift-card">
                <h3><Gift size={18} /> Gift Information</h3>
                <div className="info-group gift-info">
                  <p className="gift-label">🎁 This order is a gift</p>
                  {order.gift_recipient_name && (
                    <div className="info-row">
                      <span className="label">Recipient:</span>
                      <span className="value">{order.gift_recipient_name}</span>
                    </div>
                  )}
                  {order.gift_message && (
                    <div className="gift-message-box">
                      <span className="label">Message:</span>
                      <p className="gift-message">"{order.gift_message}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Template for Printing */}
      <InvoiceTemplate order={order} formatPrice={formatPrice} formatDate={formatDate} />
    </div>
  );
};

export default OrderView;
