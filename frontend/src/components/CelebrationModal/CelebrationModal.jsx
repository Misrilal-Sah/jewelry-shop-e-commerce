import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift, Heart, Copy, Check, PartyPopper, Cake, Sparkles } from 'lucide-react';
import './CelebrationModal.css';

const CelebrationModal = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const isBirthday = data.type === 'birthday';
  
  const copyCode = () => {
    navigator.clipboard.writeText(data.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Use Portal to render modal at body level for proper centering
  return createPortal(
    <div className="celebration-modal-overlay" onClick={onClose}>
      <div 
        className={`celebration-modal ${isBirthday ? 'birthday' : 'anniversary'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti/decorations */}
        <div className="confetti-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="confetti" style={{ 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }} />
          ))}
        </div>

        {/* Close button */}
        <button className="celebration-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Header */}
        <div className="celebration-header">
          <div className="celebration-icon">
            {isBirthday ? <Cake size={48} /> : <Heart size={48} />}
          </div>
          <h2>
            {isBirthday ? '🎂 Happy Birthday!' : '💍 Happy Anniversary!'}
          </h2>
          <p className="celebration-subtitle">
            {isBirthday 
              ? 'Wishing you a day filled with joy and sparkle!'
              : 'Celebrating your beautiful journey together!'
            }
          </p>
        </div>

        {/* Gift section */}
        <div className="celebration-gift">
          <div className="gift-badge">
            <Gift size={20} />
            <span>Special Gift for You</span>
          </div>
          
          <div className="discount-amount">
            <span className="discount-value">{data.discount}%</span>
            <span className="discount-label">OFF</span>
          </div>
          
          <p className="discount-description">
            On your next order above ₹{data.minOrder?.toLocaleString()}
          </p>
        </div>

        {/* Coupon code */}
        <div className="coupon-section">
          <p className="coupon-label">Your Exclusive Coupon Code</p>
          <div className="coupon-box">
            <code className="coupon-code">{data.couponCode}</code>
            <button className="copy-btn" onClick={copyCode}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Validity */}
        <div className="validity-info">
          <Sparkles size={16} />
          <span>Valid until {formatDate(data.validUntil)}</span>
        </div>

        {/* CTA */}
        <a href="/products" className="celebration-cta" onClick={onClose}>
          <PartyPopper size={20} />
          Shop Now & Celebrate
        </a>

        {/* Terms */}
        <p className="celebration-terms">
          *Discount applicable on minimum order of ₹{data.minOrder?.toLocaleString()}. 
          Single use only. Cannot be combined with other offers.
        </p>
      </div>
    </div>,
    document.body
  );
};

export default CelebrationModal;

