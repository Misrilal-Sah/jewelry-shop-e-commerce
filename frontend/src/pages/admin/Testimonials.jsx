import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, X, Star, Quote, Upload, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  Check, XCircle, Home, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';
import './FlashSales.css';

const Testimonials = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const { hasPermission } = usePermission();
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
  
  // Status filter
  const [statusFilter, setStatusFilter] = useState('all');
  const statusOptions = ['all', 'pending', 'approved', 'declined'];
  
  // Status dropdown for each testimonial
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_location: '',
    customer_image: '',
    testimonial_text: '',
    rating: 5,
    display_order: 0,
    is_active: true,
    status: 'approved',
    is_homepage: 1
  });

  // Rating options (including half stars)
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
      is_active: true,
      status: 'approved',
      is_homepage: 1
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
      is_active: testimonial.is_active,
      status: testimonial.status || 'approved',
      is_homepage: testimonial.is_homepage ?? 1
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

  // Quick status update for approve/decline
  const handleQuickStatusChange = async (id, newStatus, is_homepage) => {
    try {
      const res = await fetch(`/api/testimonials/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, is_homepage })
      });
      if (res.ok) {
        toast.success(`Testimonial ${newStatus}!`);
        fetchTestimonials();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Toggle homepage visibility
  const handleHomepageToggle = async (id, currentStatus, currentIsHomepage) => {
    const newIsHomepage = currentIsHomepage ? 0 : 1;
    try {
      const res = await fetch(`/api/testimonials/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: currentStatus, is_homepage: newIsHomepage })
      });
      if (res.ok) {
        toast.success(newIsHomepage ? 'Testimonial added to homepage!' : 'Testimonial removed from homepage!');
        fetchTestimonials();
      } else {
        toast.error('Failed to update homepage visibility');
      }
    } catch (error) {
      toast.error('Failed to update homepage visibility');
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'approved': return 'active';
      case 'declined': return 'inactive';
      default: return '';
    }
  };

  // Filter by status
  const filteredTestimonials = testimonials.filter(t => 
    statusFilter === 'all' || t.status === statusFilter
  );

  // Sort and paginate testimonials
  const sortedTestimonials = [...filteredTestimonials].sort((a, b) => {
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

  // Count pending
  const pendingCount = testimonials.filter(t => t.status === 'pending').length;

  if (authLoading) {
    return <div className="admin-page"><div className="admin-loading">Loading...</div></div>;
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>Customer Testimonials</h1>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="toolbar-controls">
            {/* Status Filter Tabs */}
            <div className="status-filter-tabs">
              {statusOptions.map(status => (
                <button
                  key={status}
                  className={`status-tab ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === 'pending' && pendingCount > 0 && (
                    <span className="pending-count-badge">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
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
                  <th>Status</th>
                  <th>Homepage</th>
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
                          {testimonial.user_email && (
                            <span className="customer-location">{testimonial.user_email}</span>
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
                    <td>
                      <div className="testimonial-status-dropdown">
                        <div 
                          className={`status-dropdown-trigger ${testimonial.status}`}
                          onClick={() => setOpenStatusDropdown(openStatusDropdown === testimonial.id ? null : testimonial.id)}
                        >
                          <span>{testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}</span>
                          <ChevronDown size={14} className={openStatusDropdown === testimonial.id ? 'rotated' : ''} />
                        </div>
                        {openStatusDropdown === testimonial.id && (
                          <div className="status-dropdown-options">
                            {['pending', 'approved', 'declined'].map(status => (
                              <div 
                                key={status}
                                className={`status-dropdown-option ${status} ${testimonial.status === status ? 'selected' : ''}`}
                                onClick={() => {
                                  if (status !== testimonial.status) {
                                    const newIsHomepage = status === 'approved' ? 1 : 0;
                                    handleQuickStatusChange(testimonial.id, status, newIsHomepage);
                                  }
                                  setOpenStatusDropdown(null);
                                }}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`homepage-toggle ${testimonial.is_homepage ? 'active' : ''}`}
                        onClick={() => handleHomepageToggle(testimonial.id, testimonial.status, testimonial.is_homepage)}
                        title={testimonial.is_homepage ? 'Remove from homepage' : 'Show on homepage'}
                        disabled={testimonial.status !== 'approved'}
                      >
                        <Home size={16} />
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {hasPermission('testimonials', 'edit') && (
                          <button 
                            className="btn-icon" 
                            onClick={() => openEditModal(testimonial)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasPermission('testimonials', 'delete') && (
                          <button 
                            className="btn-icon delete" 
                            onClick={() => openDeleteModal(testimonial)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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

      {/* Edit Modal */}
      {showModal && editingTestimonial && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>
            <h2>Edit Testimonial</h2>
            
            <form onSubmit={handleSubmit}>
              {/* User Info Display - Read Only */}
              <div className="testimonial-user-info">
                {editingTestimonial.customer_image ? (
                  <img 
                    src={editingTestimonial.customer_image} 
                    alt={editingTestimonial.customer_name}
                    className="user-avatar-large"
                  />
                ) : (
                  <div className="user-avatar-large-fallback">
                    {getAvatarFallback(formData.customer_name)}
                  </div>
                )}
                <div className="user-details">
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customer_name}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customer_location || 'Not specified'}
                      disabled
                    />
                  </div>
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
              
              <div className="form-actions centered">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Testimonial
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
