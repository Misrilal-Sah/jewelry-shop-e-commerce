import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, Facebook, Instagram, Twitter, 
  Youtube, CreditCard, Shield, Truck, RotateCcw 
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated, token } = useAuth();
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch subscription state from DB on mount for logged-in users
  useEffect(() => {
    const fetchSubscriptionState = async () => {
      if (!isAuthenticated || !token) return;
      
      try {
        const res = await fetch('/api/email/preferences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsSubscribed(data.newsletter === true || data.newsletter === 1);
        }
      } catch (error) {
        console.error('Failed to fetch subscription state');
      }
    };
    
    fetchSubscriptionState();
  }, [isAuthenticated, token]);

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate(path);
  };

  // Subscribe logged-in user using their account email
  const handleAuthenticatedSubscribe = async () => {
    if (!user?.email) return;
    
    // Already subscribed - show info toast
    if (isSubscribed) {
      toast.info('You are already subscribed to our newsletter!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ newsletter: true, offers: true, festive: true, others: true })
      });
      
      if (res.ok) {
        setIsSubscribed(true);
        toast.success('Successfully subscribed to newsletter!');
      } else {
        toast.error('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle guest newsletter subscription
  const handleGuestSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Successfully subscribed!');
        setNewsletterEmail('');
      } else {
        toast.error(data.message || 'Failed to subscribe');
      }
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="footer">
      {/* Trust Badges */}
      <div className="footer-trust">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <Shield className="trust-icon" />
              <div>
                <h4>100% Certified</h4>
                <p>BIS Hallmarked Jewelry</p>
              </div>
            </div>
            <div className="trust-item">
              <Truck className="trust-icon" />
              <div>
                <h4>Free Shipping</h4>
                <p>On orders above ₹10,000</p>
              </div>
            </div>
            <div className="trust-item">
              <RotateCcw className="trust-icon" />
              <div>
                <h4>Easy Returns</h4>
                <p>15-day return policy</p>
              </div>
            </div>
            <div className="trust-item">
              <CreditCard className="trust-icon" />
              <div>
                <h4>Secure Payment</h4>
                <p>100% secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* About */}
            <div className="footer-section">
              <Link to="/" className="footer-logo">
                <img 
                  src="https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855787/jewllery_shop/logos/alankara-emblem.png" 
                  alt="Aabhar" 
                  className="logo-emblem"
                />
                <span className="logo-divider">|</span>
                <span className="logo-text">Aabhar</span>
              </Link>
              <p className="footer-about">
                Premium Indian jewelry crafted with love and tradition. 
                Explore our exquisite collection of gold, diamond, silver, 
                and platinum jewelry for every occasion.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
                <a href="#" className="social-link" aria-label="Youtube">
                  <Youtube size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h3 className="footer-title">Quick Links</h3>
              <ul className="footer-links">
                <li><a href="/products" onClick={(e) => handleLinkClick(e, '/products')}>All Jewelry</a></li>
                <li><a href="/products?category=rings" onClick={(e) => handleLinkClick(e, '/products?category=rings')}>Rings</a></li>
                <li><a href="/products?category=necklaces" onClick={(e) => handleLinkClick(e, '/products?category=necklaces')}>Necklaces</a></li>
                <li><a href="/products?category=earrings" onClick={(e) => handleLinkClick(e, '/products?category=earrings')}>Earrings</a></li>
                <li><a href="/products?category=bangles" onClick={(e) => handleLinkClick(e, '/products?category=bangles')}>Bangles</a></li>
                <li><a href="/products?collection=wedding" onClick={(e) => handleLinkClick(e, '/products?collection=wedding')}>Bridal Collection</a></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="footer-section">
              <h3 className="footer-title">Customer Service</h3>
              <ul className="footer-links">
                <li><a href="/contact" onClick={(e) => handleLinkClick(e, '/contact')}>Contact Us</a></li>
                <li><a href="/faq" onClick={(e) => handleLinkClick(e, '/faq')}>FAQ</a></li>
                <li><a href="/shipping" onClick={(e) => handleLinkClick(e, '/shipping')}>Shipping Info</a></li>
                <li><a href="/returns" onClick={(e) => handleLinkClick(e, '/returns')}>Returns & Exchange</a></li>
                <li><a href="/size-guide" onClick={(e) => handleLinkClick(e, '/size-guide')}>Size Guide</a></li>
                <li><a href="/care" onClick={(e) => handleLinkClick(e, '/care')}>Jewelry Care</a></li>
                <li><a href="/bulk-order" onClick={(e) => handleLinkClick(e, '/bulk-order')}>Bulk Orders</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-section">
              <h3 className="footer-title">Contact Us</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <Phone size={16} />
                  <span>+91 98765 43210</span>
                </div>
                <div className="contact-item">
                  <Mail size={16} />
                  <span>support@Aabhar.in</span>
                </div>
                <div className="contact-item">
                  <MapPin size={16} />
                  <span>123 Jewelry Lane, Mumbai, Maharashtra 400001</span>
                </div>
              </div>

              {/* Newsletter */}
              <div className="newsletter">
                <h4>Subscribe to Newsletter</h4>
                {isAuthenticated ? (
                  <button 
                    className={`newsletter-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                    onClick={handleAuthenticatedSubscribe}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Subscribing...' : isSubscribed ? '✓ Subscribed' : 'Subscribe Now'}
                  </button>
                ) : (
                  <form className="newsletter-form" onSubmit={handleGuestSubscribe}>
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '...' : 'Subscribe'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} Aabhar. All rights reserved.</p>
            <div className="footer-legal">
              <a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy')}>Privacy Policy</a>
              <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms')}>Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
