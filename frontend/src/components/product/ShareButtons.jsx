import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { useToast } from '../ui/Toast';
import './ShareButtons.css';

// WhatsApp icon
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Facebook icon
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Twitter/X icon - with white fill for dark mode
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="twitter-icon">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Instagram icon
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <defs>
      <linearGradient id="instGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#FCAF45"/>
        <stop offset="50%" stopColor="#F77737"/>
        <stop offset="75%" stopColor="#F56040"/>
        <stop offset="100%" stopColor="#C13584"/>
      </linearGradient>
    </defs>
    <path fill="url(#instGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

// Gmail icon
const GmailIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    <path fill="#34A853" d="M0 5.457c0-.904.732-1.636 1.636-1.636h.545l9.818 7.364-9.818 7.364H1.636A1.636 1.636 0 010 16.913V5.457z" opacity="0"/>
  </svg>
);

const ShareButtons = ({ product, positionBelow = false }) => {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowShare(false);
      }
    };
    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShare]);

  if (!product) return null;

  const pageUrl = window.location.href;
  const productName = encodeURIComponent(product.name);
  const productDesc = encodeURIComponent(`Check out ${product.name} at Aabhar Jewelry!`);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${productDesc}%20${encodeURIComponent(pageUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${productDesc}&url=${encodeURIComponent(pageUrl)}`,
    instagram: `https://www.instagram.com/`, // Instagram doesn't support direct share links, opens app
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${productName}&body=${productDesc}%20${encodeURIComponent(pageUrl)}`
  };

  const handleShare = (platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=500');
    setShowShare(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={`share-buttons-container ${positionBelow ? 'position-below' : ''} ${showShare ? 'open' : ''}`} ref={dropdownRef}>
      <button 
        className="share-trigger-btn"
        onClick={(e) => { 
          console.log('[ShareButtons] onClick triggered', { showShare, event: e.type, target: e.target });
          e.stopPropagation(); 
          setShowShare(!showShare); 
        }}
        onTouchStart={(e) => {
          console.log('[ShareButtons] onTouchStart triggered', { showShare, touches: e.touches.length });
        }}
        onTouchEnd={(e) => { 
          console.log('[ShareButtons] onTouchEnd triggered - preventing default and toggling', { showShare });
          e.preventDefault(); 
          e.stopPropagation(); 
          setShowShare(!showShare); 
        }}
        title="Share this product"
        type="button"
      >
        <Share2 size={20} />
      </button>

      {showShare && (
        <div className="share-dropdown">
          <div className="share-dropdown-header">
            <span>Share</span>
            <button onClick={() => setShowShare(false)} className="share-close-btn">
              <X size={16} />
            </button>
          </div>
          
          <div className="share-options">
            <button 
              className="share-option"
              onClick={() => handleShare('whatsapp')}
              title="Share on WhatsApp"
            >
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </button>
            
            <button 
              className="share-option"
              onClick={() => handleShare('facebook')}
              title="Share on Facebook"
            >
              <FacebookIcon />
              <span>Facebook</span>
            </button>
            
            <button 
              className="share-option"
              onClick={() => handleShare('twitter')}
              title="Share on Twitter"
            >
              <TwitterIcon />
              <span>Twitter</span>
            </button>

            <button 
              className="share-option"
              onClick={() => handleShare('instagram')}
              title="Share on Instagram"
            >
              <InstagramIcon />
              <span>Instagram</span>
            </button>

            <button 
              className="share-option"
              onClick={() => handleShare('gmail')}
              title="Share via Gmail"
            >
              <GmailIcon />
              <span>Gmail</span>
            </button>
          </div>
          
          <div className="share-copy-section">
            <input 
              type="text" 
              value={pageUrl} 
              readOnly 
              className="copy-link-input"
            />
            <button 
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={copyLink}
              title={copied ? 'Copied!' : 'Copy link'}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButtons;
