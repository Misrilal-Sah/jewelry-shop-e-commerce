import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Mail, Zap,
  Plus, Edit2, Trash2, X, Star, Quote, Upload, HelpCircle, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';
import './FlashSales.css';

const Testimonials = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'display_order', direction: 'ASC' });
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_location: '',
    customer_image: '',
    testimonial_text: '',
    rating: 5,
    display_order: 0,
    is_active: true
  });

  // Rating options including half stars
  const ratingOptions = [
    { value: 5, label: '★★★★★ (5 Stars)' },
    { value: 4.5, label: '★★★★½ (4.5 Stars)' },
    { value: 4, label: '★★★★ (4 Stars)' },
    { value: 3.5, label: '★★★½ (3.5 Stars)' },
    { value: 3, label: '★★★ (3 Stars)' },
    { value: 2.5, label: '★★½ (2.5 Stars)' },
    { value: 2, label: '★★ (2 Stars)' },
    { value: 1.5, label: '★½ (1.5 Stars)' },
    { value: 1, label: '★ (1 Star)' }
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchTestimonials();
  }, [isAuthenticated, user, authLoading]);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/testimonials/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (error) {
      console.error('Fetch testimonials error:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTestimonial(null);
    setFormData({
      customer_name: '',
      customer_location: '',
      customer_image: '',
      testimonial_text: '',
      rating: 5,
      display_order: 0,
      is_active: true
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      customer_name: testimonial.customer_name || '',
      customer_location: testimonial.customer_location || '',
      customer_image: testimonial.customer_image || '',
      testimonial_text: testimonial.testimonial_text || '',
      rating: testimonial.rating || 5,
      display_order: testimonial.display_order || 0,
      is_active: testimonial.is_active
    });
    setImagePreview(testimonial.customer_image || null);
    setShowModal(true);
  };

  // Handle image upload to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('folder', 'jewllery_shop/others');

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, customer_image: data.url }));
        setImagePreview(data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, customer_image: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name.trim() || !formData.testimonial_text.trim()) {
      toast.error('Customer name and testimonial text are required');
      return;
    }

    try {
      const url = editingTestimonial 
        ? `/api/testimonials/admin/${editingTestimonial.id}`
        : '/api/testimonials/admin';
      
      const res = await fetch(url, {
        method: editingTestimonial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingTestimonial ? 'Testimonial updated!' : 'Testimonial created!');
        setShowModal(false);
        fetchTestimonials();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to save testimonial');
      }
    } catch (error) {
      toast.error('Failed to save testimonial');
    }
  };

  const openDeleteModal = (testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!testimonialToDelete) return;
    
    try {
      const res = await fetch(`/api/testimonials/admin/${testimonialToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Testimonial deleted');
        setDeleteModalOpen(false);
        setTestimonialToDelete(null);
        fetchTestimonials();
      } else {
        toast.error('Failed to delete testimonial');
      }
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`full-${i}`} size={14} fill="#d4af37" color="#d4af37" />
        ))}
        {hasHalfStar && (
          <div style={{ position: 'relative', display: 'inline-flex', width: '14px', height: '14px' }}>
            <Star size={14} fill="none" color="var(--text-muted)" style={{ position: 'absolute' }} />
            <Star size={14} fill="#d4af37" color="#d4af37" style={{ position: 'absolute', clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star key={`empty-${i}`} size={14} fill="none" color="var(--text-muted)" />
        ))}
      </div>
    );
  };

  // Sorting handler
  const handleSort = (key) => {
    let direction = 'ASC';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ASC') {
        direction = 'DESC';
      } else if (sortConfig.direction === 'DESC') {
        setSortConfig({ key: null, direction: null });
        return;
      }
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="sort-icon neutral" />;
    }
    if (sortConfig.direction === 'ASC') {
      return <ChevronUp size={14} className="sort-icon asc" />;
    }
    return <ChevronDown size={14} className="sort-icon desc" />;
  };

  // Avatar fallback helper
  const getAvatarFallback = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Sort and paginate testimonials
  const sortedTestimonials = [...testimonials].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'ASC' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedTestimonials.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTestimonials = sortedTestimonials.slice(startIndex, startIndex + pageSize);

  if (authLoading) {
    return <div className="admin-page"><div className="admin-loading">Loading...</div></div>;
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="admin-logo">
            <span className="logo-text">Aabhar</span>
            <span className="logo-accent">Admin</span>
          </Link>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="nav-item"><LayoutDashboard size={18} /> Dashboard</Link>
          <Link to="/admin/products" className="nav-item"><Package size={18} /> Products</Link>
          <Link to="/admin/orders" className="nav-item"><ShoppingCart size={18} /> Orders</Link>
          <Link to="/admin/customers" className="nav-item"><Users size={18} /> Customers</Link>
          <Link to="/admin/coupons" className="nav-item"><Tag size={18} /> Coupons</Link>
          <Link to="/admin/flash-sales" className="nav-item"><Zap size={18} /> Flash Sales</Link>
          <Link to="/admin/bulk-orders" className="nav-item"><Package size={18} /> Bulk Orders</Link>
          <Link to="/admin/testimonials" className="nav-item active"><Quote size={18} /> Testimonials</Link>
          <Link to="/admin/faqs" className="nav-item"><HelpCircle size={18} /> FAQs</Link>
          <Link to="/admin/blog" className="nav-item"><FileText size={18} /> Blog</Link>
          <Link to="/admin/reports" className="nav-item"><BarChart3 size={18} /> Reports</Link>
          <Link to="/admin/users" className="nav-item"><Shield size={18} /> Admin Users</Link>
          <Link to="/admin/email-center" className="nav-item"><Mail size={18} /> Email Center</Link>
          <Link to="/admin/logs" className="nav-item"><Activity size={18} /> Logs</Link>
        </nav>
        <div className="sidebar-footer">
          <Link to="/" className="back-to-store">← Back to Store</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>Customer Testimonials</h1>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Testimonial
          </button>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="toolbar-controls">
            <div className="page-size-control">
              <span>Show:</span>
              <div className="custom-select">
                <div 
                  className={`custom-select-trigger ${pageSizeOpen ? 'open' : ''}`}
                  onClick={() => setPageSizeOpen(!pageSizeOpen)}
                >
                  <span>{pageSize}</span>
                  <ChevronDown size={16} className={`select-arrow ${pageSizeOpen ? 'rotated' : ''}`} />
                </div>
                {pageSizeOpen && (
                  <div className="custom-select-options">
                    {[10, 20, 30, 50].map(size => (
                      <div 
                        key={size}
                        className={`custom-select-option ${pageSize === size ? 'selected' : ''}`}
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                          setPageSizeOpen(false);
                        }}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="admin-loading">Loading testimonials...</div>
          ) : testimonials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <Quote size={64} strokeWidth={1} />
              </div>
              <h3>No Testimonials Yet</h3>
              <p>Add your first customer testimonial to display on the homepage.</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                Add Testimonial
              </button>
            </div>
          ) : (
            <>
            <table className="admin-table sortable-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Testimonial</th>
                  <th className="sortable-header" onClick={() => handleSort('rating')}>
                    Rating {getSortIcon('rating')}
                  </th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTestimonials.map(testimonial => (
                  <tr key={testimonial.id}>
                    <td>
                      <div className="customer-cell">
                        {testimonial.customer_image ? (
                          <img 
                            src={testimonial.customer_image} 
                            alt={testimonial.customer_name}
                            className="customer-avatar"
                          />
                        ) : (
                          <div className="customer-avatar-fallback">
                            {getAvatarFallback(testimonial.customer_name)}
                          </div>
                        )}
                        <div>
                          <strong>{testimonial.customer_name}</strong>
                          {testimonial.customer_location && (
                            <span className="customer-location">{testimonial.customer_location}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="testimonial-preview">
                        {testimonial.testimonial_text.length > 100 
                          ? testimonial.testimonial_text.substring(0, 100) + '...'
                          : testimonial.testimonial_text}
                      </div>
                    </td>
                    <td>
                      <div className="stars-cell">{renderStars(testimonial.rating)}</div>
                    </td>
                    <td>{testimonial.display_order}</td>
                    <td>
                      <span className={`status-badge ${testimonial.is_active ? 'active' : 'inactive'}`}>
                        {testimonial.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          onClick={() => openEditModal(testimonial)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => openDeleteModal(testimonial)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} testimonials
                </div>
                <div className="pagination-controls">
                  <button 
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>
            <h2>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customer_name}
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="e.g. Priya Sharma"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customer_location}
                    onChange={e => setFormData({...formData, customer_location: e.target.value})}
                    placeholder="e.g. Mumbai"
                  />
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="form-group">
                <label className="form-label">Customer Photo</label>
                <div className="image-upload-area">
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button type="button" className="remove-image-btn" onClick={removeImage}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="upload-placeholder"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files && files.length > 0) {
                          // Create a fake event to pass to handleImageUpload
                          handleImageUpload({ target: { files: [files[0]] } });
                        }
                      }}
                    >
                      <Upload size={32} />
                      <span>{uploading ? 'Uploading...' : 'Click or drop photo here'}</span>
                      <span className="upload-hint">Max 5MB, JPG/PNG</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label required">Testimonial</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={formData.testimonial_text}
                  onChange={e => setFormData({...formData, testimonial_text: e.target.value})}
                  placeholder="Write the customer's testimonial..."
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select
                    className="form-input"
                    value={formData.rating}
                    onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                  >
                    {ratingOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.display_order}
                    onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="custom-checkbox"></span>
                  <span className="checkbox-text">Active (show on homepage)</span>
                </label>
              </div>
              
              <div className="form-actions centered">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDeleteModalOpen(false)}>
              <X size={18} />
            </button>
            <div className="delete-icon-wrapper">
              <AlertTriangle size={48} />
            </div>
            <h2>Delete Testimonial</h2>
            <p>Are you sure you want to delete this testimonial?</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleDelete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Testimonials;
