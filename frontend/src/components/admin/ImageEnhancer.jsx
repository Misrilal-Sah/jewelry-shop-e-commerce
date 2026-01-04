import { useState, useEffect } from 'react';
import { Sparkles, X, Check, Loader, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/admin/Admin.css';

/**
 * Image Enhancer Component with Dropdown Background Selector
 */
const ImageEnhancer = ({ imageUrl, onEnhanced, onClose }) => {
  const { token } = useAuth();
  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedBg, setSelectedBg] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch backgrounds from API
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const res = await fetch('/api/backgrounds');
        if (res.ok) {
          const data = await res.json();
          setBackgrounds(data);
          if (data.length > 0) {
            setSelectedBg(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch backgrounds:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBackgrounds();
  }, []);

  const handleEnhance = async () => {
    if (!imageUrl || !selectedBg) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      let res;
      
      // Check if this is a local blob URL or an http URL
      if (imageUrl.startsWith('blob:')) {
        // For blob URLs (new product images), fetch blob and upload as file
        const blobResponse = await fetch(imageUrl);
        const blob = await blobResponse.blob();
        
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');
        formData.append('backgroundUrl', selectedBg.image_url);
        
        res = await fetch('/api/products/enhance-image', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // For http URLs (existing product images), send URL
        res = await fetch('/api/products/enhance-image-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            imageUrl,
            backgroundUrl: selectedBg.image_url,
            backgroundId: selectedBg.id
          })
        });
      }
      
      const data = await res.json();
      
      if (res.ok) {
        setPreviewUrl(data.enhancedUrl);
      } else {
        setError(data.message || 'Enhancement failed');
      }
    } catch (err) {
      setError('Failed to enhance image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onEnhanced(previewUrl);
      onClose();
    }
  };

  return (
    <div className="enhance-overlay" onClick={onClose}>
      <div className="enhance-modal" onClick={e => e.stopPropagation()}>
        <button className="enhance-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h3 className="enhance-title">
          <Sparkles size={20} />
          Enhance Image
        </h3>
        
        <div className="enhance-content">
          {/* Before/After Preview */}
          <div className="enhance-preview">
            <div className="preview-box">
              <span className="preview-label">Original</span>
              <img src={imageUrl} alt="Original" />
            </div>
            <div className="preview-arrow">→</div>
            <div className="preview-box">
              <span className="preview-label">Enhanced</span>
              {previewUrl ? (
                <img src={previewUrl} alt="Enhanced" />
              ) : (
                <div className="preview-placeholder">
                  {processing ? <Loader className="spin" size={24} /> : 'Select background & enhance'}
                </div>
              )}
            </div>
          </div>
          
          {/* Background Dropdown Selector */}
          <div className="background-selector">
            <label>Select Background:</label>
            {loading ? (
              <div className="bg-loading">Loading backgrounds...</div>
            ) : backgrounds.length === 0 ? (
              <div className="bg-empty">No backgrounds available. Add one from Products page.</div>
            ) : (
              <div className="bg-dropdown-wrapper">
                <button 
                  type="button"
                  className="bg-dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedBg ? (
                    <>
                      <img 
                        src={selectedBg.image_url} 
                        alt={selectedBg.name} 
                        className="bg-dropdown-preview"
                      />
                      <span>{selectedBg.name}</span>
                    </>
                  ) : (
                    <span>Select a background</span>
                  )}
                  <ChevronDown size={16} className={dropdownOpen ? 'rotated' : ''} />
                </button>
                
                {dropdownOpen && (
                  <div className="bg-dropdown-menu">
                    {backgrounds.map(bg => (
                      <button
                        key={bg.id}
                        type="button"
                        className={`bg-dropdown-item ${selectedBg?.id === bg.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedBg(bg);
                          setDropdownOpen(false);
                        }}
                      >
                        <img src={bg.image_url} alt={bg.name} className="bg-dropdown-preview" />
                        <span>{bg.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {error && <p className="enhance-error">{error}</p>}
          
          {/* Actions */}
          <div className="enhance-actions">
            {!previewUrl ? (
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleEnhance}
                disabled={processing || !selectedBg}
              >
                {processing ? (
                  <>
                    <Loader className="spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Remove Background & Enhance
                  </>
                )}
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreviewUrl(null)}
                >
                  Try Different
                </button>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirm}
                >
                  <Check size={16} />
                  Use Enhanced Image
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEnhancer;
