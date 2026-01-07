import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Check, ArrowLeft, Tag, X, Loader2, Shield, CreditCard, Banknote, Lock, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../components/ui/Modal';
import { apiFetch } from '../config/api';
import SEO from '../components/SEO';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { 
    items, subtotal, gst, total, finalTotal, clearCart,
    appliedCoupon, discount, applyCoupon, removeCoupon 
  } = useCart();
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const modal = useModal();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isCOD, setIsCOD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', pincode: ''
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Coupon input state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Gift message state
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftRecipientName, setGiftRecipientName] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, items.length, authLoading]);

  const fetchAddresses = async () => {
    try {
      const res = await apiFetch('/api/auth/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find(a => a.is_default) || data[0];
          setSelectedAddress(defaultAddr.id);
        } else {
          setShowAddressForm(true);
        }
      }
    } catch (error) {
      console.error('Fetch addresses error:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newAddress, is_default: addresses.length === 0 })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAddresses();
        setSelectedAddress(data.id);
        setShowAddressForm(false);
        setNewAddress({ name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '' });
      }
    } catch (error) {
      console.error('Add address error:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    modal.loading('Verifying Coupon', 'Please wait while we verify your coupon code...');

    try {
      const res = await apiFetch('/api/cart/coupon/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          code: couponCode,
          cart_total: total
        })
      });

      const data = await res.json();
      modal.hide();

      if (res.ok && data.valid) {
        const couponData = {
          id: data.coupon.id,
          code: data.coupon.code,
          discount_type: data.coupon.discount_type,
          discount_value: data.coupon.discount_value,
          max_discount: data.coupon.max_discount
        };
        applyCoupon(couponData, data.discount);
        setCouponCode('');
        modal.success('Coupon Applied!', <span style={{display:'block',textAlign:'center'}}>You saved ₹{Math.round(data.discount).toLocaleString('en-IN')}!</span>);
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        modal.error('Invalid Coupon', data.message || 'This coupon code is not valid');
      }
    } catch (error) {
      modal.hide();
      setCouponError('Failed to apply coupon');
      modal.error('Error', 'Failed to verify coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderId, razorpayOrderId, amount) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      modal.error('Payment Error', 'Failed to load payment gateway. Please try again.');
      setLoading(false);
      return;
    }

    // Get Razorpay key
    const keyRes = await apiFetch('/api/payment/key');
    const { key } = await keyRes.json();

    const selectedAddr = addresses.find(a => a.id === selectedAddress);

    const options = {
      key: key,
      amount: amount,
      currency: 'INR',
      name: 'Aabhar Jewellery',
      description: `Order #${orderId}`,
      order_id: razorpayOrderId,
      // Enable all payment methods explicitly for Test Mode
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        paylater: true
      },
      handler: async function (response) {
        // Verify payment on backend
        try {
          const verifyRes = await apiFetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            })
          });

          if (verifyRes.ok) {
            clearCart();
            navigate(`/orders/${orderId}?success=true`);
          } else {
            modal.error('Payment Failed', 'Payment verification failed. Please contact support.');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          modal.error('Payment Failed', 'Payment verification failed. Please contact support.');
        }
        setLoading(false);
      },
      prefill: {
        name: selectedAddr?.name || '',
        contact: selectedAddr?.phone || ''
      },
      theme: {
        color: '#D4AF37'
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      modal.error('Payment Failed', response.error.description || 'Payment failed. Please try again.');
      setLoading(false);
    });
    razorpay.open();
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Step 1: Create order in database
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          address_id: selectedAddress,
          payment_method: isCOD ? 'cod' : 'online',
          coupon_id: appliedCoupon?.id || null,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discount,
          is_gift: isGift,
          gift_message: isGift ? giftMessage : null,
          gift_recipient_name: isGift ? giftRecipientName : null
        })
      });

      if (!res.ok) {
        modal.error('Order Failed', 'Failed to create order. Please try again.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      const orderId = data.order.id;

      // Step 2: For COD, just redirect to success
      if (isCOD) {
        clearCart();
        navigate(`/orders/${orderId}?success=true`);
        return;
      }

      // Step 3: For online payment, create Razorpay order
      const paymentRes = await apiFetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      if (!paymentRes.ok) {
        modal.error('Payment Error', 'Failed to initiate payment. Please try again.');
        setLoading(false);
        return;
      }

      const paymentData = await paymentRes.json();

      // Step 4: Open Razorpay checkout
      await handleRazorpayPayment(orderId, paymentData.order.id, paymentData.order.amount);

    } catch (error) {
      console.error('Place order error:', error);
      modal.error('Order Failed', 'Failed to place order. Please try again.');
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

  const getSelectedAddress = () => {
    return addresses.find(a => a.id === selectedAddress);
  };

  return (
    <>
    <SEO 
      title="Checkout"
      description="Complete your jewelry purchase securely."
      noindex={true}
    />
    <div className="checkout-page">
      <div className="container">
        <Link to="/cart" className="back-link">
          <ArrowLeft size={18} /> Back to Cart
        </Link>

        <h1>Checkout</h1>

        {/* Progress Steps - Now only 2 steps */}
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">{step > 1 ? <Check size={16} /> : '1'}</span>
            <span className="step-label">Address</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Review & Pay</span>
          </div>
        </div>

        <div className="checkout-grid">
          <div className="checkout-main">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="checkout-section">
                <h2><MapPin size={20} /> Delivery Address</h2>
                
                <div className="address-list">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`address-card ${selectedAddress === addr.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                      />
                      <div className="address-content">
                        <strong>{addr.name}</strong>
                        <p>{addr.address_line1}</p>
                        {addr.address_line2 && addr.address_line2 !== '0' && <p>{addr.address_line2}</p>}
                        <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="phone">📞 {addr.phone}</p>
                      </div>
                      {Boolean(addr.is_default) && <span className="default-badge">Default</span>}
                    </label>
                  ))}
                </div>

                {showAddressForm ? (
                  <form className="address-form" onSubmit={handleAddAddress}>
                    <h3>Add New Address</h3>
                    <div className="form-grid">
                      <div className="input-group">
                        <label>Full Name</label>
                        <input type="text" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} required />
                      </div>
                      <div className="input-group">
                        <label>Phone</label>
                        <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} required />
                      </div>
                      <div className="input-group full-width">
                        <label>Address Line 1</label>
                        <input type="text" value={newAddress.address_line1} onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })} required />
                      </div>
                      <div className="input-group full-width">
                        <label>Address Line 2 (Optional)</label>
                        <input type="text" value={newAddress.address_line2} onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label>City</label>
                        <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} required />
                      </div>
                      <div className="input-group">
                        <label>State</label>
                        <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} required />
                      </div>
                      <div className="input-group">
                        <label>Pincode</label>
                        <input type="text" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setShowAddressForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Address</button>
                    </div>
                  </form>
                ) : (
                  <button className="btn btn-secondary add-address-btn" onClick={() => setShowAddressForm(true)}>
                    + Add New Address
                  </button>
                )}

                {/* Gift Message Option - Add before review step */}
                <div className="checkout-section gift-section">
                  <h3><Gift size={18} /> Gift Options</h3>
                  <label className={`gift-toggle ${isGift ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={isGift} 
                      onChange={(e) => setIsGift(e.target.checked)}
                    />
                    <span>This is a gift</span>
                    <div className={`toggle-switch ${isGift ? 'on' : ''}`}>
                      <div className="toggle-knob"></div>
                    </div>
                  </label>

                  {isGift && (
                    <div className="gift-form">
                      <div className="input-group">
                        <label>Recipient Name (optional)</label>
                        <input 
                          type="text" 
                          placeholder="Who is this gift for?"
                          value={giftRecipientName}
                          onChange={(e) => setGiftRecipientName(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>Gift Message (optional)</label>
                        <textarea 
                          placeholder="Add a personal message..."
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          rows={3}
                          maxLength={250}
                        />
                        <small>{giftMessage.length}/250 characters</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="section-actions">
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} disabled={!selectedAddress}>
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review & Pay */}
            {step === 2 && (
              <div className="checkout-section">
                <h2><Check size={20} /> Review & Pay</h2>
                
                {/* Delivery Address Summary */}
                <div className="review-section">
                  <div className="review-header">
                    <h3>Delivery Address</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>Change</button>
                  </div>
                  {getSelectedAddress() && (
                    <div className="review-box">
                      <p><strong>{getSelectedAddress().name}</strong></p>
                      <p>{getSelectedAddress().address_line1}</p>
                      <p>{getSelectedAddress().city}, {getSelectedAddress().state} - {getSelectedAddress().pincode}</p>
                      <p>📞 {getSelectedAddress().phone}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="review-section">
                  <h3>Order Items ({items.length})</h3>
                  <div className="review-items">
                    {items.map((item) => (
                      <div key={item.id} className="review-item">
                        <span className="item-name">{item.name} × {item.quantity}</span>
                        <span className="item-price">{formatPrice((parseFloat(item.metal_price) + parseFloat(item.making_charges)) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gift Info Review */}
                {isGift && (
                  <div className="review-section">
                    <div className="review-header">
                      <h3><Gift size={16} /> Gift Information</h3>
                      <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>Edit</button>
                    </div>
                    <div className="review-box gift-review">
                      <p><strong>🎁 This order is a gift</strong></p>
                      {giftRecipientName && <p><strong>To:</strong> {giftRecipientName}</p>}
                      {giftMessage && <p><strong>Message:</strong> "{giftMessage}"</p>}
                    </div>
                  </div>
                )}

                {/* Payment Options */}
                <div className="review-section payment-options">
                  <h3>Payment Method</h3>
                  
                  <label className={`payment-option ${!isCOD ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      checked={!isCOD}
                      onChange={() => setIsCOD(false)}
                    />
                    <div className="payment-option-content">
                      <CreditCard size={24} />
                      <div>
                        <strong>Pay Online</strong>
                        <span>UPI, Cards, Net Banking, Wallets</span>
                      </div>
                    </div>
                    <div className="payment-icons">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1280px-UPI-Logo-vector.svg.png" alt="UPI" height="20" />
                    </div>
                  </label>

                  <label className={`payment-option ${isCOD ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      checked={isCOD}
                      onChange={() => setIsCOD(true)}
                    />
                    <div className="payment-option-content">
                      <Banknote size={24} />
                      <div>
                        <strong>Cash on Delivery</strong>
                        <span>Pay when your order arrives</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="section-actions checkout-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                  <button 
                    className="btn btn-primary btn-lg pay-button" 
                    onClick={handlePlaceOrder} 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="spin" /> Processing...
                      </>
                    ) : isCOD ? (
                      <>Place Order (COD)</>
                    ) : (
                      <>
                        <Lock size={18} /> Pay {formatPrice(finalTotal)}
                      </>
                    )}
                  </button>
                </div>

                {/* Security Badge */}
                <div className="security-info">
                  <Shield size={16} />
                  <span>Payments secured by Razorpay. 100% secure checkout.</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-items">
                {items.map((item) => (
                  <div key={item.id} className="summary-item">
                    <span>{item.name} × {item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="coupon-section">
                <div className="coupon-header" onClick={() => document.getElementById('coupon-input')?.focus()}>
                  <Tag size={16} />
                  <span>Apply Coupon</span>
                </div>
                
                {appliedCoupon ? (
                  <div className="applied-coupon">
                    <div className="coupon-badge">
                      <Tag size={14} />
                      <span>{appliedCoupon.code}</span>
                      <span className="coupon-discount">-{formatPrice(discount)}</span>
                    </div>
                    <button className="remove-coupon" onClick={handleRemoveCoupon}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="coupon-input-group">
                    <input
                      id="coupon-input"
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !couponLoading) handleApplyCoupon(); }}
                    />
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? <Loader2 size={16} className="spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="coupon-error">{couponError}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="price-row">
                  <span>GST (3%)</span>
                  <span>{formatPrice(gst)}</span>
                </div>
                {discount > 0 && (
                  <div className="price-row discount">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Shipping</span>
                  <span className="free">FREE</span>
                </div>
                <div className="price-row total">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Checkout;
