import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Gift, Sparkles, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { apiFetch } from '../config/api';
import './NewsletterPopup.css';

const COUPON_CODE = 'SAVE10';

const NewsletterPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isAuthenticated, token, user } = useAuth();
  const toast = useToast();

  // Check if popup should be shown
  const shouldShowPopup = useCallback(() => {
    // Don't show if already shown in this session
    if (sessionStorage.getItem('newsletter_popup_shown')) return false;
    
    // Don't show if user dismissed it in the last 7 days
    const dismissedAt = localStorage.getItem('newsletter_popup_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return false;
    }
    
    // Don't show if already subscribed
    if (localStorage.getItem('newsletter_subscribed')) return false;
    
    return true;
  }, []);

  // Handle mouse leave (exit intent)
  useEffect(() => {
    if (hasShown || !shouldShowPopup()) return;

    let timeoutId;
    
    const handleMouseLeave = (e) => {
      // Only trigger when mouse leaves from top of viewport
      if (e.clientY <= 0) {
        // Add a small delay to avoid false triggers
        timeoutId = setTimeout(() => {
          if (!hasShown && shouldShowPopup()) {
            setIsVisible(true);
            setHasShown(true);
            sessionStorage.setItem('newsletter_popup_shown', 'true');
          }
        }, 100);
      }
    };

    // Also show after 30 seconds on page (for mobile users who don't have exit intent)
    const mobileTimeout = setTimeout(() => {
      if (!hasShown && shouldShowPopup()) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('newsletter_popup_shown', 'true');
      }
    }, 30000);

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeoutId);
      clearTimeout(mobileTimeout);
    };
  }, [hasShown, shouldShowPopup]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  const handleClose = () => {
    setIsVisible(false);
    if (!showSuccess) {
      localStorage.setItem('newsletter_popup_dismissed', Date.now().toString());
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCopied(true);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isAuthenticated) {
        // Update user preferences
        const res = await apiFetch('/api/auth/email-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ newsletter: true, offers: true, festive: true, others: true })
        });
        
        if (res.ok) {
          localStorage.setItem('newsletter_subscribed', 'true');
          setShowSuccess(true);
        }
      } else {
        // Guest subscription
        const res = await apiFetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('newsletter_subscribed', 'true');
          setShowSuccess(true);
        } else if (data.alreadySubscribed) {
          toast.info('You\'re already subscribed! Here\'s your code anyway.');
          localStorage.setItem('newsletter_subscribed', 'true');
          setShowSuccess(true);
        } else {
          toast.error(data.message || 'Subscription failed');
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="newsletter-popup-overlay" onClick={handleClose}>
      <div className="newsletter-popup" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={handleClose}>
          <X size={20} />
        </button>
        
        <div className="popup-content">
          <div className="popup-icon">
            <Gift size={48} />
            <Sparkles className="sparkle sparkle-1" size={16} />
            <Sparkles className="sparkle sparkle-2" size={12} />
          </div>
          
          {showSuccess ? (
            // Success state with coupon code
            <>
              <h2>🎉 You're In!</h2>
              <p className="popup-subtitle">
                Use code <span className="highlight">{COUPON_CODE}</span> for 10% off
              </p>
              
              <div className="coupon-display">
                <span className="coupon-code">{COUPON_CODE}</span>
                <button 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyCode}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <p className="popup-description">
                Apply this code at checkout. Valid for your first order.
              </p>
              
              <button className="continue-btn" onClick={handleClose}>
                Continue Shopping
              </button>
            </>
          ) : (
            // Form state
            <>
              <h2>Wait! Don't Leave Empty-Handed</h2>
              <p className="popup-subtitle">
                Get <span className="highlight">10% OFF</span> your first order!
              </p>
              
              <p className="popup-description">
                Subscribe to our newsletter for exclusive offers, new arrivals, and jewelry care tips.
              </p>
              
              <form onSubmit={handleSubscribe} className="popup-form">
                <div className="input-wrapper">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Subscribing...' : 'Get My 10% Off'}
                </button>
              </form>
              
              <button className="no-thanks" onClick={handleClose}>
                No thanks, I'll pay full price
              </button>
            </>
          )}
        </div>
        
        <div className="popup-decoration">
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;

