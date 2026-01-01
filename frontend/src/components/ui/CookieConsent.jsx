import { useState, useEffect } from 'react';
import { Cookie, X, Check, Settings } from 'lucide-react';
import './CookieConsent.css';

const COOKIE_CONSENT_KEY = 'cookieConsent';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted));
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(onlyNecessary));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className={`cookie-consent ${showDetails ? 'expanded' : ''}`}>
        <button className="cookie-close" onClick={handleRejectAll}>
          <X size={18} />
        </button>
        
        <div className="cookie-content">
          <div className="cookie-icon">
            <Cookie size={32} />
          </div>
          
          <div className="cookie-text">
            <h3>We use cookies</h3>
            <p>
              We use cookies to enhance your browsing experience, serve personalized content, 
              and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="cookie-details">
            <div className="cookie-option">
              <div className="cookie-option-info">
                <h4>Necessary Cookies</h4>
                <p>Required for the website to function properly. Cannot be disabled.</p>
              </div>
              <label className="cookie-toggle disabled">
                <input type="checkbox" checked disabled />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="cookie-option">
              <div className="cookie-option-info">
                <h4>Analytics Cookies</h4>
                <p>Help us understand how visitors interact with our website.</p>
              </div>
              <label className="cookie-toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="cookie-option">
              <div className="cookie-option-info">
                <h4>Marketing Cookies</h4>
                <p>Used to deliver personalized advertisements.</p>
              </div>
              <label className="cookie-toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        )}

        <div className="cookie-actions">
          <button 
            className="cookie-btn cookie-btn-settings"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Settings size={16} />
            {showDetails ? 'Hide' : 'Customize'}
          </button>
          
          <div className="cookie-btn-group">
            <button 
              className="cookie-btn cookie-btn-reject"
              onClick={handleRejectAll}
            >
              Reject All
            </button>
            
            {showDetails ? (
              <button 
                className="cookie-btn cookie-btn-accept"
                onClick={handleAcceptSelected}
              >
                <Check size={16} />
                Save Preferences
              </button>
            ) : (
              <button 
                className="cookie-btn cookie-btn-accept"
                onClick={handleAcceptAll}
              >
                <Check size={16} />
                Accept All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
