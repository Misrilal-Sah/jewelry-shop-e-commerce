import { forwardRef } from 'react';
import './InvoiceTemplate.css';

const InvoiceTemplate = forwardRef(({ order, formatPrice, formatDate }, ref) => {
  if (!order) return null;

  const PLACEHOLDER = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_400,h_400/jewllery_shop/logos/alankara-emblem.png';

  const getImage = (item) => {
    if (item.images) {
      if (typeof item.images === 'string') {
        try {
          if (item.images.startsWith('[')) {
            const parsed = JSON.parse(item.images);
            return parsed[0] || PLACEHOLDER;
          }
          return item.images;
        } catch {
          return PLACEHOLDER;
        }
      }
      return item.images[0] || PLACEHOLDER;
    }
    return PLACEHOLDER;
  };

  return (
    <div className="invoice-template" ref={ref}>
      {/* Header with Logo */}
      <div className="invoice-header">
        <div className="invoice-brand">
          <h1 className="brand-name">Aabhar</h1>
          <p className="brand-tagline">FINE JEWELRY</p>
        </div>
        <div className="invoice-meta">
          <h2>INVOICE</h2>
          <p className="invoice-number">#{order.order_number || order.id}</p>
          <p className="invoice-date">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Gold Divider */}
      <div className="invoice-divider">
        <div className="divider-line"></div>
        <span className="divider-diamond">◆</span>
        <div className="divider-line"></div>
      </div>

      {/* Customer & Shipping Info */}
      <div className="invoice-info-grid">
        <div className="invoice-info-box">
          <h3>Bill To</h3>
          <p className="customer-name">{order.customer_name || order.shipping_address?.name || order.address?.name}</p>
          <p>{order.customer_email}</p>
          {(order.customer_phone || order.shipping_address?.phone || order.address?.phone) && (
            <p>{order.customer_phone || order.shipping_address?.phone || order.address?.phone}</p>
          )}
        </div>
        <div className="invoice-info-box">
          <h3>Ship To</h3>
          {(order.shipping_address || order.address) ? (
            <>
              <p className="customer-name">{order.shipping_address?.name || order.address?.name}</p>
              <p>{order.shipping_address?.address_line1 || order.address?.address_line1}</p>
              {(order.shipping_address?.address_line2 || order.address?.address_line2) && (
                <p>{order.shipping_address?.address_line2 || order.address?.address_line2}</p>
              )}
              <p>
                {order.shipping_address?.city || order.address?.city}, 
                {order.shipping_address?.state || order.address?.state}
              </p>
              <p>{order.shipping_address?.pincode || order.address?.pincode}</p>
            </>
          ) : (
            <p>Same as billing</p>
          )}
        </div>
        <div className="invoice-info-box">
          <h3>Order Details</h3>
          <p><strong>Status:</strong> <span className="status-pill">{order.status}</span></p>
          <p><strong>Payment:</strong> {order.payment_method?.toUpperCase()}</p>
          <p><strong>Payment Status:</strong> {order.payment_status || 'Pending'}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="invoice-items-section">
        <h3>Order Items</h3>
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="col-item">Item</th>
              <th className="col-qty">Qty</th>
              <th className="col-price">Price</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => {
              const itemTotal = item.total_price || 
                ((parseFloat(item.metal_price || 0) + parseFloat(item.making_charges || 0)) * item.quantity);
              return (
                <tr key={index}>
                  <td className="col-item">
                    <div className="item-cell">
                      <img src={getImage(item)} alt={item.product_name || item.name} />
                      <div>
                        <strong>{item.product_name || item.name}</strong>
                        {item.size && <span className="item-size">Size: {item.size}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="col-qty">{item.quantity}</td>
                  <td className="col-price">{formatPrice(itemTotal / item.quantity)}</td>
                  <td className="col-total">{formatPrice(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals and Gift Row */}
      <div className="invoice-totals-row">
        {/* Gift Section - Left Side */}
        {Boolean(order.is_gift) && (
          <div className="gift-box">
            <h3>🎁 Gift Details</h3>
            {order.gift_recipient_name && (
              <p><strong>Recipient:</strong> {order.gift_recipient_name}</p>
            )}
            {order.gift_message && (
              <p className="gift-message">"{order.gift_message}"</p>
            )}
          </div>
        )}
        
        {/* Spacer if no gift */}
        {!order.is_gift && <div className="gift-spacer"></div>}

        {/* Totals - Right Side */}
        <div className="totals-box">
          <div className="total-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal || order.total_amount * 0.97)}</span>
          </div>
          <div className="total-row">
            <span>GST (3%)</span>
            <span>{formatPrice(order.gst_amount || order.total_amount * 0.03)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="total-row discount">
              <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
              <span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="total-row">
            <span>Shipping</span>
            <span className="free">FREE</span>
          </div>
          <div className="total-row grand-total">
            <span>Total Amount</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="invoice-footer">
        <div className="footer-divider">
          <div className="divider-line"></div>
          <span className="divider-diamond">◆</span>
          <div className="divider-line"></div>
        </div>
        <p className="thank-you">Thank you for shopping with us!</p>
        <div className="footer-info">
          <p>Aabhar Fine Jewelry</p>
          <p>support@Aabhar.com | +91 98765 43210</p>
          <p>www.Aabhar.com</p>
        </div>
        <p className="footer-note">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
