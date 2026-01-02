import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Info, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './TestimonialModal.css';

const TestimonialModal = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please share your experience');
      return;
    }
    
    if (text.trim().length < 20) {
      setError('Please write at least 20 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, testimonial_text: text })
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess?.(data.message);
        handleClose();
      } else {
        setError(data.message || 'Failed to submit testimonial');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setText('');
    setError('');
    onClose();
  };

  return createPortal(
    <div className="testimonial-modal-overlay" onClick={handleClose}>
      <div className="testimonial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tm-close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="tm-header">
          <h2>Share Your Experience</h2>
          <p>We'd love to hear about your jewelry shopping experience!</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating - Half Star Support */}
          <div className="tm-rating-section">
            <label>Your Rating</label>
            <div className="tm-stars">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFullFilled = star <= Math.floor(hoverRating || rating);
                const isHalfFilled = !isFullFilled && star === Math.ceil(hoverRating || rating) && (hoverRating || rating) % 1 >= 0.5;
                
                return (
                  <div
                    key={star}
                    className="tm-star-wrapper"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {/* Left half - for .5 rating */}
                    <button
                      type="button"
                      className="tm-star-half left"
                      onClick={() => setRating(star - 0.5)}
                      onMouseEnter={() => setHoverRating(star - 0.5)}
                    />
                    {/* Right half - for full rating */}
                    <button
                      type="button"
                      className="tm-star-half right"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                    />
                    {/* Visual star */}
                    <div className={`tm-star-display ${isFullFilled ? 'filled' : ''} ${isHalfFilled ? 'half' : ''}`}>
                      <Star size={32} />
                      {isHalfFilled && (
                        <div className="tm-star-half-fill">
                          <Star size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="tm-rating-label">{rating} Star{rating !== 1 ? 's' : ''}</div>
          </div>

          {/* Testimonial Text */}
          <div className="tm-text-section">
            <label>Your Experience</label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="Tell us about your experience with our jewelry and service..."
              rows={4}
              maxLength={500}
            />
            <div className="tm-char-count">{text.length}/500</div>
          </div>

          {error && <p className="tm-error">{error}</p>}

          {/* Info Note */}
          <div className="tm-info">
            <Info size={14} />
            <span>Your testimonial will be displayed on our website after admin approval.</span>
          </div>

          {/* Submit Button */}
          <button type="submit" className="tm-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Testimonial
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default TestimonialModal;
