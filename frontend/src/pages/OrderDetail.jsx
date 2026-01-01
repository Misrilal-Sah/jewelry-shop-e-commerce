import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, CreditCard, ArrowLeft, Gift, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InvoiceTemplate from '../components/InvoiceTemplate';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isSuccess) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [id, isAuthenticated, isSuccess, authLoading]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Fetch order error:', error);
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

  if (isSuccess) {
    return (
      <div className="order-success-page">
        <div className="container">
          <div className="success-card">
            <CheckCircle size={64} className="success-icon" />
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your order. You will receive a confirmation email shortly.</p>
            <p className="order-id">Order ID: #{id}</p>
            <div className="success-actions">
              <button onClick={() => navigate('/orders')} className="btn btn-primary">
                View All Orders
              </button>
              <button onClick={() => navigate('/products')} className="btn btn-secondary">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }}></div>
          <div className="skeleton" style={{ height: 300 }}></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <h1>Order Not Found</h1>
          <p>The order you're looking for doesn't exist.</p>
          <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <div className="container">
        <Link to="/orders" className="back-link">
          <ArrowLeft size={18} /> Back to Orders
        </Link>

        <div className="order-detail-header">
          <div>
            <h1>Order #{order.order_number || order.id}</h1>
            <p className="order-date">Placed on {formatDate(order.created_at)}</p>
          </div>
          <div className="order-header-actions">
            <button className="btn btn-secondary print-btn" onClick={() => window.print()}>
              <Printer size={18} /> Print Invoice
            </button>
            <span className={`order-status status-${order.status?.toLowerCase()}`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="order-detail-grid">
          {/* Order Items */}
          <div className="order-section">
            <h3><Package size={18} /> Order Items</h3>
            <div className="order-items-list">
              {order.items?.map((item, index) => {
                // Calculate item price - use total_price if available, otherwise calculate
                const itemTotal = item.total_price || 
                  ((parseFloat(item.metal_price || 0) + parseFloat(item.making_charges || 0)) * item.quantity);
                
                return (
                  <div key={index} className="order-item">
                    <div className="order-item-info">
                      <strong>{item.product_name || item.name}</strong>
                      <span className="item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="order-item-price">{formatPrice(itemTotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address */}
          {order.address && (
            <div className="order-section">
              <h3><MapPin size={18} /> Delivery Address</h3>
              <div className="order-address">
                <strong>{order.address.name}</strong>
                <p>{order.address.address_line1}</p>
                {order.address.address_line2 && <p>{order.address.address_line2}</p>}
                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                <p>Phone: {order.address.phone}</p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="order-section">
            <h3><CreditCard size={18} /> Payment</h3>
            <div className="payment-info">
              <p><strong>Method:</strong> {order.payment_method?.toUpperCase()}</p>
              <p><strong>Status:</strong> {order.payment_status || 'Pending'}</p>
            </div>
          </div>

          {/* Gift Information */}
          {Boolean(order.is_gift) && (
            <div className="order-section gift-info-section">
              <h3><Gift size={18} /> Gift Information</h3>
              <div className="gift-details">
                <p><strong>🎁 This order is a gift</strong></p>
                {order.gift_recipient_name && (
                  <p><strong>Recipient:</strong> {order.gift_recipient_name}</p>
                )}
                {order.gift_message && (
                  <p className="gift-message"><strong>Message:</strong> "{order.gift_message}"</p>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="order-section order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal || order.total_amount * 0.97)}</span>
            </div>
            <div className="summary-row">
              <span>GST (3%)</span>
              <span>{formatPrice(order.gst_amount || order.gst || order.total_amount * 0.03)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="summary-row discount-row">
                <span>Coupon Discount {order.coupon_code && <span className="coupon-tag">({order.coupon_code})</span>}</span>
                <span className="discount">-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free">FREE</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Template for Printing */}
      <InvoiceTemplate order={order} formatPrice={formatPrice} formatDate={formatDate} />
    </div>
  );
};

export default OrderDetail;

