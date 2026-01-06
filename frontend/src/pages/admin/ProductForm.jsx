import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Package, X, Save, ArrowLeft, ImagePlus, AlertCircle, ChevronDown, Sparkles, GripVertical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { apiFetch } from '../../config/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ImageEnhancer from '../../components/admin/ImageEnhancer';
import './Admin.css';

const API_URL = 'http://localhost:5000';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [localFiles, setLocalFiles] = useState([]); // Store actual files for new products
  const [enhanceIndex, setEnhanceIndex] = useState(null); // Index of image being enhanced
  const [fileDragging, setFileDragging] = useState(false); // For drag-drop file upload
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'rings',
    collection: 'daily',
    metal_type: 'gold',
    purity: '22K',
    weight_grams: '',
    price: '', // Direct price input
    gst_percent: '3',
    gemstone_type: '',
    stock: '0',
    is_featured: false,
    is_active: true,
    is_new: false,
    is_bestseller: false,
    is_limited: false
  });

  // Dynamic dropdown options from API
  const [categoryOptions, setCategoryOptions] = useState([
    { value: 'rings', label: 'Rings' },
    { value: 'necklaces', label: 'Necklaces' },
    { value: 'earrings', label: 'Earrings' },
    { value: 'bangles', label: 'Bangles' }
  ]);

  const [collectionOptions, setCollectionOptions] = useState([
    { value: 'daily', label: 'Daily Wear' },
    { value: 'festive', label: 'Festive' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'modern', label: 'Modern' }
  ]);

  // Fetch categories and collections from API on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          fetch('/api/common/categories/public'),
          fetch('/api/common/collections/public')
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          if (cats.length > 0) {
            setCategoryOptions(cats.map(c => ({ 
              value: c.name, 
              label: c.display_name || c.name.charAt(0).toUpperCase() + c.name.slice(1) 
            })));
          }
        }
        if (colRes.ok) {
          const cols = await colRes.json();
          if (cols.length > 0) {
            setCollectionOptions(cols.map(c => ({ 
              value: c.name, 
              label: c.display_name || c.name.charAt(0).toUpperCase() + c.name.slice(1) 
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch dropdown options:', error);
      }
    };
    fetchOptions();
  }, []);

  const metalOptions = [
    { value: 'gold', label: 'Gold' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'silver', label: 'Silver' },
    { value: 'platinum', label: 'Platinum' }
  ];

  const purityOptions = [
    { value: '24K', label: '24K' },
    { value: '22K', label: '22K' },
    { value: '18K', label: '18K' },
    { value: '14K', label: '14K' },
    { value: '925', label: '925 Silver' },
    { value: '950', label: '950 Platinum' }
  ];

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return;
    
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    if (isEdit) {
      fetchProduct();
    }
  }, [isAuthenticated, user, id, authLoading]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const product = data.product;
        // Calculate price from metal_price + making_charges for existing products
        const totalPrice = (parseFloat(product.metal_price) || 0) + (parseFloat(product.making_charges) || 0);
        setFormData({
          name: product.name || '',
          description: product.description || '',
          category: product.category || 'rings',
          collection: product.collection || 'daily',
          metal_type: product.metal_type || 'gold',
          purity: product.purity || '22K',
          weight_grams: product.weight_grams || '',
          price: totalPrice.toString(),
          gst_percent: product.gst_percent || '3',
          gemstone_type: product.gemstone_type || '',
          stock: product.stock || '0',
          is_featured: product.is_featured || false,
          is_active: product.is_active !== false,
          is_new: product.is_new || false,
          is_bestseller: product.is_bestseller || false,
          is_limited: product.is_limited || false
        });
        try {
          const imgs = typeof product.images === 'string' 
            ? JSON.parse(product.images) 
            : product.images || [];
          setImages(imgs.slice(0, 5)); // Max 5 images
        } catch {
          setImages([]);
        }
      }
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Prevent negative values for weight, price, stock
    if ((name === 'weight_grams' || name === 'price' || name === 'stock') && parseFloat(value) < 0) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Reset file input so same file can be selected again
    e.target.value = '';
    
    if (files.length === 0) return;
    
    console.log('=== UPLOAD DEBUG ===');
    console.log('isEdit:', isEdit);
    console.log('Current images state:', images);
    console.log('Files to upload:', files.length);
    
    // Max 5 images total
    const remainingSlots = 5 - images.length;
    console.log('Remaining slots:', remainingSlots);
    
    if (remainingSlots <= 0) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (!isEdit) {
      // For new products, store files and preview locally
      const previews = filesToAdd.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...previews].slice(0, 5));
      setLocalFiles(prev => [...prev, ...filesToAdd].slice(0, 5));
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    filesToAdd.forEach(file => formDataUpload.append('images', file));
    
    try {
      console.log('Sending upload request to:', `/api/admin/products/${id}/images`);
      
      const res = await apiFetch(`/api/admin/products/${id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('=== UPLOAD RESPONSE ===');
        console.log('Backend returned images:', data.images);
        setImages(data.images.slice(0, 5));
        toast.success('Images uploaded');
      } else {
        const error = await res.json();
        console.error('Upload error:', error);
        toast.error(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload exception:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Handle file drop for drag-and-drop upload
  const handleFileDrop = (e) => {
    e.preventDefault();
    setFileDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    
    // Simulate file input change event
    const fakeEvent = { target: { files, value: '' } };
    handleImageUpload(fakeEvent);
  };

  const handleDeleteImage = async (index) => {
    console.log('Delete image at index:', index); // Debug
    
    if (!isEdit) {
      // For new products, just remove from local state
      setImages(prev => {
        const newImages = [...prev];
        newImages.splice(index, 1);
        return newImages;
      });
      setLocalFiles(prev => {
        const newFiles = [...prev];
        newFiles.splice(index, 1);
        return newFiles;
      });
      toast.success('Image removed');
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/products/${id}/images/${index}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
        toast.success('Image deleted');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  // Helper to get full image URL
  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('blob:') || img.startsWith('http')) return img;
    return API_URL + img;
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    
    // Simple swap using array copy
    const newImages = [...images];
    const temp = newImages[dragIndex];
    newImages[dragIndex] = newImages[dropIndex];
    newImages[dropIndex] = temp;
    
    // Also swap local files if they exist (for new products)
    if (!isEdit && localFiles.length > 0 && localFiles[dragIndex] && localFiles[dropIndex]) {
      const newFiles = [...localFiles];
      const tempFile = newFiles[dragIndex];
      newFiles[dragIndex] = newFiles[dropIndex];
      newFiles[dropIndex] = tempFile;
      setLocalFiles(newFiles);
    }
    
    setImages(newImages);
    setDragIndex(null);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    if (isEdit && images.length > 0) {
      try {
        await apiFetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ images })
        });
      } catch (error) {
        console.error('Failed to save image order');
      }
    }
  };

  // Handle enhanced image replacement
  const handleEnhanced = async (newImageUrl) => {
    if (enhanceIndex === null) return;
    
    const newImages = [...images];
    newImages[enhanceIndex] = newImageUrl;
    setImages(newImages);
    
    // If editing, save the updated images
    if (isEdit) {
      try {
        await apiFetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ images: newImages })
        });
        toast.success('Image enhanced and saved!');
      } catch (error) {
        console.error('Failed to save enhanced image');
        toast.error('Enhancement saved locally, will be applied on next save');
      }
    } else {
      toast.success('Image enhanced! Will be saved with product.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.weight_grams || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';
      
      const priceValue = parseFloat(formData.price) || 0;
      
      const payload = {
        ...formData,
        images: images.filter(img => !img.startsWith('blob:')),
        weight_grams: parseFloat(formData.weight_grams) || 0,
        metal_price: priceValue, // Store price as metal_price for DB compatibility
        making_charges: 0,
        gst_percent: parseFloat(formData.gst_percent) || 3,
        stock: parseInt(formData.stock) || 0
      };

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        
        // If new product with local files, upload them now
        if (!isEdit && localFiles.length > 0 && data.id) {
          const formDataUpload = new FormData();
          localFiles.forEach(file => formDataUpload.append('images', file));
          
          await apiFetch(`/api/admin/products/${data.id}/images`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formDataUpload
          });
        }
        
        toast.success(isEdit ? 'Product updated!' : 'Product created!');
        navigate('/admin/products');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to save product');
      }
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Custom Dropdown Component
  const CustomSelect = ({ name, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const selectedOption = options.find(opt => opt.value === value);
    
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSelect = (optionValue) => {
      onChange({ target: { name, value: optionValue } });
      setIsOpen(false);
    };
    
    return (
      <div className="custom-select" ref={dropdownRef}>
        <div 
          className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedOption?.label || 'Select...'}</span>
          <ChevronDown size={16} className={`select-arrow ${isOpen ? 'rotated' : ''}`} />
        </div>
        {isOpen && (
          <div className="custom-select-options">
            {options.map(option => (
              <div
                key={option.value}
                className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-page admin-no-footer">
        <div className="admin-loading">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-no-footer">
      <AdminSidebar />

      <main className="admin-content">
        <header className="admin-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/admin/products')}>
              <ArrowLeft size={18} />
            </button>
            <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </header>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Left Column - Basic Info */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-group">
                <label className="form-label required">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Diamond Solitaire Ring"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="4"
                  placeholder="Describe the product..."
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <CustomSelect 
                    name="category" 
                    value={formData.category} 
                    options={categoryOptions}
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Collection</label>
                  <CustomSelect 
                    name="collection" 
                    value={formData.collection} 
                    options={collectionOptions}
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Images */}
            <div className="form-section">
              <h3 className="section-title">Product Images</h3>
              
              <div 
                className={`image-upload-area ${fileDragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setFileDragging(true); }}
                onDragLeave={() => setFileDragging(false)}
                onDrop={handleFileDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  hidden
                />
                
                <div className="image-grid-5">
                  {/* Primary Image Slot */}
                  <div className="image-slot primary-slot">
                    {images[0] ? (
                      <div 
                        className={`image-item large ${dragIndex === 0 ? 'dragging' : ''} ${dragIndex !== null ? 'drop-target' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 0)}
                      >
                        {/* Grip handle for dragging */}
                        <div 
                          className="image-grip"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            handleDragStart(0);
                          }}
                          onDragEnd={handleDragEnd}
                          title="Drag to reorder"
                        >
                          <GripVertical size={16} />
                        </div>
                        <img src={getImageUrl(images[0])} alt="Primary" />
                        <button 
                          type="button"
                          className="image-delete-btn"
                          onClick={(e) => { e.stopPropagation(); handleDeleteImage(0); }}
                        >
                          <X size={18} />
                        </button>
                        {/* Enhance button for all images */}
                        <button 
                          type="button"
                          className="image-enhance-btn"
                          onClick={(e) => { e.stopPropagation(); setEnhanceIndex(0); }}
                          title="Enhance Image"
                        >
                          <Sparkles size={12} /> Enhance
                        </button>
                        <span className="primary-badge">PRIMARY</span>
                      </div>
                    ) : (
                      <div 
                        className="image-placeholder large"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus size={32} />
                        <span>Add Primary</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Small Images Grid */}
                  <div className="small-images-grid">
                    {[1, 2, 3, 4].map((slot) => (
                      <div key={slot} className="image-slot small-slot">
                        {images[slot] ? (
                          <div 
                            className={`image-item small ${dragIndex === slot ? 'dragging' : ''} ${dragIndex !== null ? 'drop-target' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, slot)}
                          >
                            {/* Grip handle for dragging */}
                            <div 
                              className="image-grip small"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = 'move';
                                handleDragStart(slot);
                              }}
                              onDragEnd={handleDragEnd}
                              title="Drag to reorder"
                            >
                              <GripVertical size={12} />
                            </div>
                            <img src={getImageUrl(images[slot])} alt={`Image ${slot + 1}`} />
                            <button 
                              type="button"
                              className="image-delete-btn"
                              onClick={(e) => { e.stopPropagation(); handleDeleteImage(slot); }}
                            >
                              <X size={16} />
                            </button>
                            {/* Enhance button for all images */}
                            <button 
                              type="button"
                              className="image-enhance-btn"
                              onClick={(e) => { e.stopPropagation(); setEnhanceIndex(slot); }}
                              title="Enhance Image"
                            >
                              <Sparkles size={10} />
                            </button>
                            <span className="image-number">{slot + 1}</span>
                          </div>
                        ) : (
                          <div 
                            className="image-placeholder small"
                            onClick={() => images.length < 5 && fileInputRef.current?.click()}
                          >
                            <ImagePlus size={18} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {uploading && (
                  <div className="upload-progress">Uploading...</div>
                )}
                
                <p className="image-hint">
                  Drag any image to rearrange positions. First image = Primary.
                </p>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="form-section">
              <h3 className="section-title">Metal & Pricing</h3>
              
              <div className="form-row triple">
                <div className="form-group">
                  <label className="form-label">Metal Type</label>
                  <CustomSelect 
                    name="metal_type" 
                    value={formData.metal_type} 
                    options={metalOptions}
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purity</label>
                  <CustomSelect 
                    name="purity" 
                    value={formData.purity} 
                    options={purityOptions}
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Weight (grams)</label>
                  <input
                    type="number"
                    name="weight_grams"
                    value={formData.weight_grams}
                    onChange={handleChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-input price-input"
                    min="0"
                    placeholder="Enter product price"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GST (%)</label>
                  <input
                    type="number"
                    name="gst_percent"
                    value={formData.gst_percent}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    placeholder="3"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Gemstone Type</label>
                <input
                  type="text"
                  name="gemstone_type"
                  value={formData.gemstone_type}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Diamond, Ruby, Emerald"
                />
              </div>
            </div>

            {/* Stock & Status Section */}
            <div className="form-section">
              <h3 className="section-title">Inventory & Status</h3>
              
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  placeholder="0"
                />
                {parseInt(formData.stock) <= 5 && parseInt(formData.stock) > 0 && (
                  <div className="stock-warning">
                    <AlertCircle size={14} />
                    Low stock warning
                  </div>
                )}
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Featured Product
                  <small>Show on homepage featured section</small>
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Active
                  <small>Product is visible to customers</small>
                </label>
              </div>
              
              <h4 className="section-subtitle" style={{marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Product Tags</h4>
              <div className="checkbox-group tags-group">
                <label className="checkbox-label tag-checkbox">
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={formData.is_new}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  New Arrival
                  <small>Display "NEW" badge on product</small>
                </label>
                
                <label className="checkbox-label tag-checkbox">
                  <input
                    type="checkbox"
                    name="is_bestseller"
                    checked={formData.is_bestseller}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Bestseller
                  <small>Display "BESTSELLER" badge</small>
                </label>
                
                <label className="checkbox-label tag-checkbox">
                  <input
                    type="checkbox"
                    name="is_limited"
                    checked={formData.is_limited}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Limited Edition
                  <small>Display "LIMITED" badge</small>
                </label>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Image Enhancer Modal */}
      {enhanceIndex !== null && images[enhanceIndex] && (
        <ImageEnhancer
          imageUrl={getImageUrl(images[enhanceIndex])}
          onEnhanced={handleEnhanced}
          onClose={() => setEnhanceIndex(null)}
        />
      )}
    </div>
  );
};

export default ProductForm;
