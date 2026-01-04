import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Search, Eye, Trash2, X, Menu,
  ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import { useModal } from '../../components/ui/Modal';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';

const BulkOrders = () => {
  const { token } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  const modal = useModal();
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewInquiry, setViewInquiry] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'DESC' });
  
  // Status dropdown state
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  
  const statuses = ['pending', 'contacted', 'quoted', 'closed'];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#eab308';
      case 'contacted': return '#3b82f6';
      case 'quoted': return '#22c55e';
      case 'closed': return '#6b7280';
      default: return 'var(--text-primary)';
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select') && !event.target.closest('.status-dropdown')) {
        setPageSizeOpen(false);
        setOpenStatusDropdown(null);
        setModalStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/bulk-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('Fetch bulk orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/bulk-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast.success('Status updated successfully');
        fetchInquiries();
        if (viewInquiry?.id === id) {
          setViewInquiry({ ...viewInquiry, status: newStatus });
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    modal.confirm(
      'Delete Inquiry',
      'Are you sure you want to delete this inquiry?',
      async () => {
        try {
          const res = await fetch(`/api/bulk-orders/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            toast.success('Inquiry deleted');
            fetchInquiries();
            if (viewInquiry?.id === id) {
              setViewInquiry(null);
            }
          }
        } catch (error) {
          toast.error('Failed to delete inquiry');
        }
      }
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'pending', text: 'Pending' },
      contacted: { class: 'processing', text: 'Contacted' },
      quoted: { class: 'active', text: 'Quoted' },
      closed: { class: 'inactive', text: 'Closed' }
    };
    return badges[status] || badges.pending;
  };

  // Sorting handler
  const handleSort = (key) => {
    let direction = 'ASC';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ASC') direction = 'DESC';
      else if (sortConfig.direction === 'DESC') {
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

  // Filter and sort data
  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter !== 'all' && inquiry.status !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        inquiry.name?.toLowerCase().includes(search) ||
        inquiry.email?.toLowerCase().includes(search) ||
        inquiry.company_name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Apply sorting
  const sortedInquiries = [...filteredInquiries].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal, bVal;
    
    switch (sortConfig.key) {
      case 'name':
        aVal = a.name?.toLowerCase() || '';
        bVal = b.name?.toLowerCase() || '';
        break;
      case 'company_name':
        aVal = a.company_name?.toLowerCase() || '';
        bVal = b.company_name?.toLowerCase() || '';
        break;
      case 'quantity':
        aVal = parseInt(a.quantity) || 0;
        bVal = parseInt(b.quantity) || 0;
        break;
      case 'created_at':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      default:
        aVal = a[sortConfig.key] || '';
        bVal = b[sortConfig.key] || '';
    }
    
    if (aVal < bVal) return sortConfig.direction === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'ASC' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalItems = sortedInquiries.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInquiries = sortedInquiries.slice(startIndex, startIndex + pageSize);

  return (
    <div className="admin-page">
      <AdminSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="admin-content">
        <header className="admin-header">
          <button
            className="mobile-menu-toggle-admin"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1><Package size={24} /> Bulk Order Inquiries</h1>
          <span className="stat-badge">{totalItems} total inquiries</span>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, company..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div className="filter-tabs">
            {['all', 'pending', 'contacted', 'quoted', 'closed'].map(f => (
              <button 
                key={f} 
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setCurrentPage(1); }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          
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

        {/* Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table sortable-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort('name')}>
                  Name {getSortIcon('name')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('company_name')}>
                  Company {getSortIcon('company_name')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('category')}>
                  Category {getSortIcon('category')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('quantity')}>
                  Quantity {getSortIcon('quantity')}
                </th>
                <th>Budget</th>
                <th className="sortable-header" onClick={() => handleSort('created_at')}>
                  Date {getSortIcon('created_at')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="loading-cell">Loading...</td></tr>
              ) : paginatedInquiries.length === 0 ? (
                <tr><td colSpan="8" className="empty-cell">
                  <div className="empty-state-inline">
                    <Package size={48} className="empty-icon" />
                    <h3>No Bulk Order Inquiries Yet</h3>
                    <p>When customers submit bulk order inquiries, they will appear here for you to manage.</p>
                  </div>
                </td></tr>
              ) : (
                paginatedInquiries.map(inquiry => {
                  const badge = getStatusBadge(inquiry.status);
                  return (
                    <tr key={inquiry.id}>
                      <td>
                        <div className="customer-info-cell">
                          <span className="customer-name">{inquiry.name}</span>
                          <span className="customer-email">{inquiry.email}</span>
                        </div>
                      </td>
                      <td>{inquiry.company_name || '-'}</td>
                      <td>{inquiry.category || '-'}</td>
                      <td>{inquiry.quantity || '-'}</td>
                      <td className="budget-cell">{inquiry.budget_range || '-'}</td>
                      <td>{formatDate(inquiry.created_at)}</td>
                      <td>
                        <div className="custom-select status-dropdown">
                          <div 
                            className="custom-select-trigger status-trigger"
                            onClick={() => setOpenStatusDropdown(openStatusDropdown === inquiry.id ? null : inquiry.id)}
                            style={{ color: getStatusColor(inquiry.status) }}
                          >
                            <span>{inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}</span>
                            <ChevronDown size={14} />
                          </div>
                          {openStatusDropdown === inquiry.id && (
                            <div className="custom-select-options status-options">
                              {statuses.map(s => (
                                <div 
                                  key={s}
                                  className={`custom-select-option ${inquiry.status === s ? 'selected' : ''}`}
                                  onClick={() => { handleStatusChange(inquiry.id, s); setOpenStatusDropdown(null); }}
                                  style={{ color: getStatusColor(s) }}
                                >
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button 
                            className="action-btn view" 
                            onClick={() => setViewInquiry(inquiry)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {hasPermission('bulk_orders', 'delete') && (
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDelete(inquiry.id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} inquiries
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

        {/* View Details Modal */}
        {viewInquiry && (
          <div className="modal-overlay" onClick={() => setViewInquiry(null)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setViewInquiry(null)}>
                <X size={18} />
              </button>
              <h2>Bulk Order Inquiry Details</h2>
              
              <div className="inquiry-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <p>{viewInquiry.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p><a href={`mailto:${viewInquiry.email}`}>{viewInquiry.email}</a></p>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <p>{viewInquiry.phone ? <a href={`tel:${viewInquiry.phone}`}>{viewInquiry.phone}</a> : '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Company</label>
                    <p>{viewInquiry.company_name || '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <p>{viewInquiry.category || '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Quantity</label>
                    <p>{viewInquiry.quantity || '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Budget Range</label>
                    <p className="budget-highlight">{viewInquiry.budget_range || '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Date Submitted</label>
                    <p>{formatDate(viewInquiry.created_at)}</p>
                  </div>
                </div>
                
                {viewInquiry.message && (
                  <div className="detail-item full-width">
                    <label>Requirements / Message</label>
                    <div className="message-box" dangerouslySetInnerHTML={{ __html: viewInquiry.message }} />
                  </div>
                )}
                
                <div className="modal-actions">
                  <div className="status-control">
                    <label>Status:</label>
                    <div className="custom-select status-dropdown large">
                      <div 
                        className="custom-select-trigger status-trigger"
                        onClick={() => setModalStatusOpen(!modalStatusOpen)}
                        style={{ color: getStatusColor(viewInquiry.status) }}
                      >
                        <span>{viewInquiry.status.charAt(0).toUpperCase() + viewInquiry.status.slice(1)}</span>
                        <ChevronDown size={14} />
                      </div>
                      {modalStatusOpen && (
                        <div className="custom-select-options status-options">
                          {statuses.map(s => (
                            <div 
                              key={s}
                              className={`custom-select-option ${viewInquiry.status === s ? 'selected' : ''}`}
                              onClick={() => { handleStatusChange(viewInquiry.id, s); setModalStatusOpen(false); }}
                              style={{ color: getStatusColor(s) }}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="btn btn-ghost"
                    onClick={() => setViewInquiry(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BulkOrders;
