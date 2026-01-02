import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Mail, Zap, Settings,
  Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronLeft, ChevronRight, 
  Archive, RotateCcw, AlertTriangle, ChevronUp, ChevronsUpDown, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';

const Coupons = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Filter state
  const [showInactive, setShowInactive] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  
  // Dropdown states
  const [discountTypeOpen, setDiscountTypeOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    start_date: '',
    end_date: ''
  });

  const totalPages = Math.ceil(totalCoupons / pageSize);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchCoupons();
  }, [isAuthenticated, user, authLoading, currentPage, pageSize, showInactive, sortField, sortOrder, searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
        setDiscountTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/coupons?search=${searchQuery}&page=${currentPage}&limit=${pageSize}&showInactive=${showInactive}&sortField=${sortField}&sortOrder=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setTotalCoupons(data.total || 0);
      }
    } catch (error) {
      console.error('Fetch coupons error:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchCoupons();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ChevronsUpDown size={14} />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount: '',
      usage_limit: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || '',
      max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '',
      start_date: coupon.start_date?.split('T')[0] || '',
      end_date: coupon.end_date?.split('T')[0] || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editingCoupon 
      ? `/api/admin/coupons/${editingCoupon.id}`
      : '/api/admin/coupons';
    const method = editingCoupon ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
        })
      });

      if (res.ok) {
        toast.success(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
        setShowModal(false);
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Save coupon error:', error);
      toast.error('Error saving coupon');
    }
  };

  const openDeleteModal = (coupon) => {
    setCouponToDelete(coupon);
    setDeleteModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!couponToDelete) return;
    try {
      const res = await fetch(`/api/admin/coupons/${couponToDelete.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Coupon deactivated');
        setDeleteModalOpen(false);
        setCouponToDelete(null);
        fetchCoupons();
      }
    } catch (error) {
      toast.error('Error deactivating coupon');
    }
  };

  const handleDeleteForever = async () => {
    if (!couponToDelete) return;
    try {
      const res = await fetch(`/api/admin/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Coupon deleted permanently');
        setDeleteModalOpen(false);
        setCouponToDelete(null);
        fetchCoupons();
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (error) {
      toast.error('Error deleting coupon');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchCoupons();
      }
    } catch (error) {
      toast.error('Error toggling coupon');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${parseFloat(coupon.discount_value).toFixed(0)}%`;
    }
    return `₹${parseFloat(coupon.discount_value).toFixed(0)}`;
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();
  const isNotStarted = (startDate) => new Date(startDate) > new Date();

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
          <Link to="/admin/coupons" className="nav-item active"><Tag size={18} /> Coupons</Link>
          <Link to="/admin/flash-sales" className="nav-item"><Zap size={18} /> Flash Sales</Link>
          <Link to="/admin/bulk-orders" className="nav-item"><Package size={18} /> Bulk Orders</Link>
          <Link to="/admin/testimonials" className="nav-item"><Quote size={18} /> Testimonials</Link>
          <Link to="/admin/faqs" className="nav-item"><HelpCircle size={18} /> FAQs</Link>
          <Link to="/admin/blog" className="nav-item"><FileText size={18} /> Blog</Link>
          <Link to="/admin/reports" className="nav-item"><BarChart3 size={18} /> Reports</Link>
          <Link to="/admin/users" className="nav-item"><Shield size={18} /> Admin Users</Link>
          <Link to="/admin/email-center" className="nav-item"><Mail size={18} /> Email Center</Link>
          <Link to="/admin/common-details" className="nav-item"><Settings size={18} /> Common Details</Link>
          <Link to="/admin/logs" className="nav-item"><Activity size={18} /> Logs</Link>
        </nav>
        <div className="sidebar-footer">
          <Link to="/" className="back-to-store">← Back to Store</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>Coupons & Discounts</h1>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Coupon
          </button>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="toolbar-controls">
            <label className="checkbox-toggle">
              <input 
                type="checkbox" 
                checked={showInactive}
                onChange={(e) => {
                  setShowInactive(e.target.checked);
                  setCurrentPage(1);
                }}
              />
              <span className="checkbox-label-text">Show Inactive</span>
            </label>
            
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
                  <div className="custom-select-options scrollable">
                    {[10, 20, 30, 40, 50].map(size => (
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

        {/* Coupons Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table sortable-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('code')}>
                  Code {getSortIcon('code')}
                </th>
                <th>Discount</th>
                <th className="sortable" onClick={() => handleSort('min_order_amount')}>
                  Min Order {getSortIcon('min_order_amount')}
                </th>
                <th>Usage</th>
                <th className="sortable" onClick={() => handleSort('end_date')}>
                  Validity {getSortIcon('end_date')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="loading-cell">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    <div className="empty-state-inline">
                      <Tag size={48} className="empty-icon" />
                      <h3>No Coupons Found</h3>
                      <p>Create discount coupons to attract customers and boost your sales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className={!coupon.is_active ? 'inactive-row' : ''}>
                    <td>
                      <div className="coupon-code">
                        <Tag size={16} />
                        <strong>{coupon.code}</strong>
                        {coupon.description && <span className="coupon-desc">{coupon.description}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="discount-badge">
                        {formatDiscount(coupon)}
                      </span>
                      {coupon.max_discount && (
                        <span className="max-discount">Max: ₹{coupon.max_discount}</span>
                      )}
                    </td>
                    <td>₹{coupon.min_order_amount || 0}</td>
                    <td>
                      <span className="usage-info">
                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                      </span>
                    </td>
                    <td>
                      <div className="validity-dates">
                        <span>{formatDate(coupon.start_date)}</span>
                        <span>to</span>
                        <span>{formatDate(coupon.end_date)}</span>
                      </div>
                    </td>
                    <td>
                      {!coupon.is_active ? (
                        <span className="status-badge inactive">Inactive</span>
                      ) : isExpired(coupon.end_date) ? (
                        <span className="status-badge expired">Expired</span>
                      ) : isNotStarted(coupon.start_date) ? (
                        <span className="status-badge scheduled">Scheduled</span>
                      ) : (
                        <span className="status-badge active">Active</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {coupon.is_active ? (
                          <button className="action-btn archive" onClick={() => handleToggle(coupon.id)} title="Deactivate">
                            <Archive size={16} />
                          </button>
                        ) : (
                          <button className="action-btn restore" onClick={() => handleToggle(coupon.id)} title="Activate">
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button className="action-btn edit" onClick={() => openEditModal(coupon)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => openDeleteModal(coupon)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCoupons)} of {totalCoupons} coupons
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
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && couponToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Delete Coupon?</h3>
            <p>What would you like to do with "{couponToDelete.code}"?</p>
            <div className="delete-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={handleDeactivate}>
                <Archive size={16} /> Set Inactive
              </button>
            </div>
            <button className="btn btn-danger full-width" onClick={handleDeleteForever}>
              <Trash2 size={16} /> Delete Forever
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content coupon-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Coupon Code <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="e.g. SAVE20"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g. 20% off on first order"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Discount Type <span className="required">*</span></label>
                  <div className="custom-select full-width">
                    <div 
                      className={`custom-select-trigger ${discountTypeOpen ? 'open' : ''}`}
                      onClick={() => setDiscountTypeOpen(!discountTypeOpen)}
                    >
                      <span>{formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}</span>
                      <ChevronDown size={16} className={`select-arrow ${discountTypeOpen ? 'rotated' : ''}`} />
                    </div>
                    {discountTypeOpen && (
                      <div className="custom-select-options">
                        <div 
                          className={`custom-select-option ${formData.discount_type === 'percentage' ? 'selected' : ''}`}
                          onClick={() => {
                            setFormData({...formData, discount_type: 'percentage'});
                            setDiscountTypeOpen(false);
                          }}
                        >
                          Percentage (%)
                        </div>
                        <div 
                          className={`custom-select-option ${formData.discount_type === 'fixed' ? 'selected' : ''}`}
                          onClick={() => {
                            setFormData({...formData, discount_type: 'fixed'});
                            setDiscountTypeOpen(false);
                          }}
                        >
                          Fixed Amount (₹)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Discount Value <span className="required">*</span></label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    placeholder={formData.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Min Order Amount</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                    placeholder="e.g. 1000"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Max Discount (for %)</label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                    placeholder="e.g. 500"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Usage Limit</label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Start Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
