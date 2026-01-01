import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Shield, Mail, Zap,
  BarChart3, Eye, ChevronDown, ChevronUp, ChevronsUpDown,
  ChevronLeft, ChevronRight, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';

const Orders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  // Core data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  
  // Per-row status dropdown
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);

  const statuses = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, authLoading, statusFilter, currentPage, pageSize, sortConfig]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (sortConfig.key) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }
      
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalOrders(data.pagination?.total || data.orders?.length || 0);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Order status updated to ${status}`);
        // Update local state
        setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
    setOpenStatusDropdown(null);
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

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setFilterDropdownOpen(false);
        setPageSizeOpen(false);
        setOpenStatusDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalPages = Math.ceil(totalOrders / pageSize);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#27ae60'; // Green
      case 'cancelled': return '#e74c3c'; // Red
      default: return 'var(--text-primary)'; // Adaptive text color for light/dark mode
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return 'var(--border-color)';
    }
  };

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
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
          <Link to="/admin/orders" className="nav-item active">
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
          <Link to="/admin/users" className="nav-item">
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

      <main className="admin-content">
        <header className="admin-header">
          <h1>Orders</h1>
        </header>

        {/* Toolbar with Filter and Page Size */}
        <div className="admin-toolbar">
          {/* Status Filter Dropdown */}
          <div className="custom-select filter-dropdown">
            <div 
              className={`custom-select-trigger ${filterDropdownOpen ? 'open' : ''}`}
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            >
              <span>{statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'All Orders'}</span>
              <ChevronDown size={16} className={`select-arrow ${filterDropdownOpen ? 'rotated' : ''}`} />
            </div>
            {filterDropdownOpen && (
              <div className="custom-select-options">
                <div 
                  className={`custom-select-option ${statusFilter === '' ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter(''); setFilterDropdownOpen(false); setCurrentPage(1); }}
                >
                  All Orders
                </div>
                {statuses.map(s => (
                  <div 
                    key={s}
                    className={`custom-select-option ${statusFilter === s ? 'selected' : ''}`}
                    onClick={() => { setStatusFilter(s); setFilterDropdownOpen(false); setCurrentPage(1); }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
            )}
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

        {/* Orders Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table sortable-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort('order_number')}>
                  Order # {getSortIcon('order_number')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('customer_name')}>
                  Customer {getSortIcon('customer_name')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('created_at')}>
                  Date {getSortIcon('created_at')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('total_amount')}>
                  Amount {getSortIcon('total_amount')}
                </th>
                <th>Payment</th>
                <th className="sortable-header" onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    <div className="empty-state-inline">
                      <ShoppingCart size={48} className="empty-icon" />
                      <h3>No Orders Yet</h3>
                      <p>When customers place orders, they will appear here for you to manage.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{order.customer_name || 'N/A'}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>{formatPrice(order.total_amount)}</td>
                    <td className="uppercase">{order.payment_method}</td>
                    <td>
                      {/* Custom Status Dropdown */}
                      <div className="custom-select status-dropdown">
                        <div 
                          className="custom-select-trigger status-trigger"
                          onClick={() => setOpenStatusDropdown(openStatusDropdown === order.id ? null : order.id)}
                          style={{ 
                            color: getStatusColor(order.status)
                          }}
                        >
                          <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                          <ChevronDown size={14} />
                        </div>
                        {openStatusDropdown === order.id && (
                          <div className="custom-select-options status-options">
                            {statuses.map(s => (
                              <div 
                                key={s}
                                className={`custom-select-option ${order.status === s ? 'selected' : ''}`}
                                onClick={() => updateOrderStatus(order.id, s)}
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
                      <button 
                        className="action-btn view"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        title="View Order"
                      >
                        <Eye size={16} />
                      </button>
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
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
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
    </div>
  );
};

export default Orders;
