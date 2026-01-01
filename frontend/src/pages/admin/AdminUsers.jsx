import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Zap,
  Search, Mail, Phone, Calendar, Plus, Trash2, X,
  ChevronLeft, ChevronRight, ChevronDown, ChevronsUpDown, ChevronUp, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'DESC' });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [validatedUser, setValidatedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [promotedUserName, setPromotedUserName] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdmins();
  }, [isAuthenticated, user, authLoading, currentPage, pageSize, sortConfig]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter admins by search (client-side like Customers page)
  const filteredAdmins = admins.filter(admin => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      admin.name?.toLowerCase().includes(query) ||
      admin.email?.toLowerCase().includes(query)
    );
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      if (sortConfig.key) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
        setTotalAdmins(data.pagination?.total || data.admins?.length || 0);
      }
    } catch (error) {
      console.error('Fetch admins error:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAdmins();
  };

  const handleSort = (key) => {
    let direction = 'ASC';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ASC') direction = 'DESC';
      else {
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

  // Validate email and show confirmation
  const handleValidateEmail = async () => {
    if (!newAdminEmail.trim()) {
      setModalError('Please enter an email address');
      return;
    }
    
    setModalLoading(true);
    setModalError('');
    
    try {
      const res = await fetch(`/api/admin/users/validate?email=${encodeURIComponent(newAdminEmail.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.valid) {
        setValidatedUser(data.user);
        setShowAddModal(false);
        setShowConfirmModal(true);
      } else {
        setModalError(data.message);
      }
    } catch (error) {
      console.error('Validate email error:', error);
      setModalError('Failed to validate email');
    } finally {
      setModalLoading(false);
    }
  };

  // Confirm and promote to admin
  const handleConfirmAddAdmin = async () => {
    if (!validatedUser) return;
    
    // Close confirm, show loading
    setShowConfirmModal(false);
    setShowLoadingModal(true);
    
    try {
      const res = await fetch('/api/admin/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: validatedUser.email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPromotedUserName(validatedUser.name || validatedUser.email);
        setShowLoadingModal(false);
        setShowSuccessModal(true);
        setValidatedUser(null);
        setNewAdminEmail('');
        fetchAdmins();
      } else {
        setShowLoadingModal(false);
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Add admin error:', error);
      setShowLoadingModal(false);
      toast.error('Failed to add admin');
    }
  };

  const closeAddModals = () => {
    setShowAddModal(false);
    setShowConfirmModal(false);
    setShowLoadingModal(false);
    setShowSuccessModal(false);
    setValidatedUser(null);
    setNewAdminEmail('');
    setModalError('');
    setPromotedUserName('');
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setModalLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowDeleteModal(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Remove admin error:', error);
      toast.error('Failed to remove admin');
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalAdmins / pageSize);

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading...</div>
      </div>
    );
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
          <Link to="/admin" className="nav-item">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/admin/products" className="nav-item">
            <Package size={18} /> Products
          </Link>
          <Link to="/admin/orders" className="nav-item">
            <ShoppingCart size={18} /> Orders
          </Link>
          <Link to="/admin/customers" className="nav-item">
            <Users size={18} /> Customers
          </Link>
          <Link to="/admin/coupons" className="nav-item">
            <Tag size={18} /> Coupons
          </Link>
          <Link to="/admin/flash-sales" className="nav-item">
            <Zap size={18} /> Flash Sales
          </Link>
          <Link to="/admin/bulk-orders" className="nav-item">
            <Package size={18} /> Bulk Orders
          </Link>
          <Link to="/admin/testimonials" className="nav-item">
            <Quote size={18} /> Testimonials
          </Link>
          <Link to="/admin/faqs" className="nav-item">
            <HelpCircle size={18} /> FAQs
          </Link>
          <Link to="/admin/blog" className="nav-item">
            <FileText size={18} /> Blog
          </Link>
          <Link to="/admin/reports" className="nav-item">
            <BarChart3 size={18} /> Reports
          </Link>
          <Link to="/admin/users" className="nav-item active">
            <Shield size={18} /> Admin Users
          </Link>
          <Link to="/admin/email-center" className="nav-item">
            <Mail size={18} /> Email Center
          </Link>
          <Link to="/admin/logs" className="nav-item">
            <Activity size={18} /> Logs
          </Link>
        </nav>
        <div className="sidebar-footer">
          <Link to="/" className="back-to-store">← Back to Store</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <div className="admin-header">
          <h1 className="page-title">Admin Users</h1>
          <span className="page-count">{totalAdmins} admin users</span>
        </div>

        {/* Search & Controls */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAdmins()}
            />
          </div>

          <div className="toolbar-controls">
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Admin
            </button>
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

        {/* Admins Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table sortable-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort('name')}>
                  Admin {getSortIcon('name')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('email')}>
                  Email {getSortIcon('email')}
                </th>
                <th>Phone</th>
                <th className="sortable-header" onClick={() => handleSort('created_at')}>
                  Added {getSortIcon('created_at')}
                </th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">Loading admins...</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    <div className="empty-state-inline">
                      <Shield size={48} className="empty-icon" />
                      <h3>No Admins Found</h3>
                      <p>Add administrators to help you manage your jewelry store.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar admin-avatar">
                          {admin.profile_image ? (
                            <img src={admin.profile_image.startsWith('http') ? admin.profile_image : `http://localhost:5000${admin.profile_image}`} alt={admin.name} />
                          ) : (
                            <Shield size={16} />
                          )}
                        </div>
                        <div className="customer-name">
                          <strong>{admin.name || 'Unknown'}</strong>
                          <span className="customer-id">ID: {admin.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-row">
                        <Mail size={14} />
                        <span>{admin.email}</span>
                      </div>
                    </td>
                    <td>
                      {admin.phone ? (
                        <div className="contact-row">
                          <Phone size={14} />
                          <span>{admin.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{formatDate(admin.created_at)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="action-btns">
                        <button 
                          className={`action-btn delete ${admin.id === user?.id ? 'disabled' : ''}`}
                          onClick={() => {
                            if (admin.id === user?.id) {
                              toast.warning("You cannot remove yourself as admin");
                              return;
                            }
                            setSelectedAdmin(admin);
                            setShowDeleteModal(true);
                          }}
                          title={admin.id === user?.id ? "Can't remove yourself" : 'Remove admin'}
                        >
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
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalAdmins)} of {totalAdmins}
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

      {/* Add Admin Modal - Step 1: Enter Email */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Admin User</h2>
              <button className="modal-close" onClick={closeAddModals}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Enter the email address of an existing user to grant them admin privileges.
              </p>
              <div className="form-group">
                <label>User Email</label>
                <input
                  type="email"
                  className={`form-input ${modalError ? 'input-error' : ''}`}
                  placeholder="Enter user's email address"
                  value={newAdminEmail}
                  onChange={(e) => {
                    setNewAdminEmail(e.target.value);
                    setModalError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateEmail()}
                  autoFocus
                />
                {modalError && (
                  <p className="error-message">{modalError}</p>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeAddModals}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleValidateEmail}
                disabled={modalLoading}
              >
                {modalLoading ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Step 2: Confirm Admin Privileges */}
      {showConfirmModal && validatedUser && (
        <div className="modal-overlay" onClick={closeAddModals}>
          <div className="modal-content confirm-admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Admin Access</h2>
              <button className="modal-close" onClick={closeAddModals}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-user-info">
                <Shield size={40} className="confirm-icon" />
                <div className="confirm-user-details">
                  <strong>{validatedUser.name || 'User'}</strong>
                  <span>{validatedUser.email}</span>
                </div>
              </div>
              
              <div className="warning-box">
                <p><strong>⚠️ Important:</strong></p>
                <p>You are about to grant admin privileges to this user. They will have full access to:</p>
                <ul>
                  <li>Manage all products and inventory</li>
                  <li>View and manage customer orders</li>
                  <li>Access sales reports and analytics</li>
                  <li>Manage customer accounts</li>
                  <li>Create and manage discount coupons</li>
                  <li>Add or remove other admins</li>
                </ul>
                <p>An email notification will be sent to inform them of their new role.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeAddModals}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmAddAdmin}
              >
                Confirm & Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {showLoadingModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-loading" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <div className="loading-spinner"></div>
            </div>
            <h2 className="modal-title">Promoting to Admin</h2>
            <p className="modal-message">
              Please wait while we grant admin privileges and send the notification email...
            </p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={closeAddModals}>
          <div className="modal-content modal-success" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <Shield size={48} />
            </div>
            <h2 className="modal-title">Admin Created Successfully!</h2>
            <p className="modal-message">
              <strong>{promotedUserName}</strong> has been promoted to admin.<br/>
              An email notification has been sent to inform them of their new role.
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={closeAddModals}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remove Admin</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove admin privileges from:</p>
              <div className="delete-target">
                <strong>{selectedAdmin.name || selectedAdmin.email}</strong>
                <span>{selectedAdmin.email}</span>
              </div>
              <p className="warning-text">
                This user will be demoted to a regular customer and lose all admin access.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteAdmin}
                disabled={modalLoading}
              >
                {modalLoading ? 'Removing...' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
