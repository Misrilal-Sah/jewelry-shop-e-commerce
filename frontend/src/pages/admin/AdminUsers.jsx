import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Search, Mail, Phone, Calendar, Plus, Trash2, X, Key, Menu,
  ChevronLeft, ChevronRight, ChevronDown, ChevronsUpDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import RolesManagement from './RolesManagement';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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

  // Role selection for new admins
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Inline role edit dropdown
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdmins();
    fetchAssignableRoles();
  }, [isAuthenticated, user, authLoading, currentPage, pageSize, sortConfig]);

  // Fetch roles that current user can assign
  const fetchAssignableRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles/assignable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignableRoles(data.roles || []);
        // Set default role
        if (data.roles?.length > 0) {
          const defaultRole = data.roles.find(r => r.name === 'default_staff') || data.roles[0];
          setSelectedRoleId(defaultRole.id);
        }
      }
    } catch (error) {
      console.error('Fetch assignable roles error:', error);
    }
  };

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

  // Handle inline role change
  const handleRoleChange = async (adminId, newRoleId) => {
    try {
      const res = await fetch(`/api/admin/users/${adminId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roleId: newRoleId })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Update local state
        setAdmins(prev => prev.map(admin => 
          admin.id === adminId 
            ? { ...admin, role_id: newRoleId, role_name: data.admin.role_name }
            : admin
        ));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update role');
    } finally {
      setOpenRoleDropdown(null);
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
        body: JSON.stringify({ 
          email: validatedUser.email,
          roleId: selectedRoleId 
        })
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
      <AdminSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="admin-content">
        <div className="admin-header">
          <button
            className="mobile-menu-toggle-admin"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="page-title">Admin Users & Roles</h1>
          <span className="page-count">{activeTab === 'users' ? `${totalAdmins} admin users` : 'Manage Permissions'}</span>
        </div>

        {/* Horizontal Tabs */}
        <div className="cd-tabs">
          <button 
            className={`cd-tab ${activeTab === 'users' ? 'active' : ''}`} 
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> Users
          </button>
          <button 
            className={`cd-tab ${activeTab === 'roles' ? 'active' : ''}`} 
            onClick={() => setActiveTab('roles')}
          >
            <Key size={18} /> Roles & Permissions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'roles' ? (
          <RolesManagement />
        ) : (
          <>
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
                <th>Role</th>
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
                  <td colSpan="6" className="loading-cell">Loading admins...</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
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
                      {/* Super Admin roles cannot be changed */}
                      {admin.role_name === 'Super Admin' ? (
                        <div className="inline-role-dropdown locked">
                          <div className="role-dropdown-trigger disabled" title="Super Admin role cannot be changed">
                            <span className="role-badge-inline super-admin">{admin.role_name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-role-dropdown">
                          <div 
                            className="role-dropdown-trigger"
                            onClick={() => setOpenRoleDropdown(openRoleDropdown === admin.id ? null : admin.id)}
                          >
                            <span className="role-badge-inline">{admin.role_name || 'No Role'}</span>
                            <ChevronDown size={14} className={openRoleDropdown === admin.id ? 'rotated' : ''} />
                          </div>
                          {openRoleDropdown === admin.id && (
                            <div className="role-dropdown-options">
                              {assignableRoles.map(role => (
                                <div 
                                  key={role.id}
                                  className={`role-dropdown-option ${admin.role_id === role.id ? 'selected' : ''}`}
                                  onClick={() => {
                                    if (admin.role_id !== role.id) {
                                      handleRoleChange(admin.id, role.id);
                                    } else {
                                      setOpenRoleDropdown(null);
                                    }
                                  }}
                                >
                                  {role.display_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
          </>
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
              
              {/* Role Selection */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Assign Role</label>
                <select 
                  className="form-input"
                  value={selectedRoleId || ''}
                  onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                >
                  {assignableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
                <small className="form-hint">Select the role to assign to this admin user.</small>
              </div>
              
              <div className="warning-box">
                <p><strong>⚠️ Important:</strong></p>
                <p>You are about to grant admin privileges to this user with the selected role's permissions.</p>
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
