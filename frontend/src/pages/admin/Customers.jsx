import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Zap,
  Search, Mail, Phone, Calendar, ShoppingBag, DollarSign, RefreshCw,
  ChevronLeft, ChevronRight, ChevronDown, ChevronsUpDown, ChevronUp, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';

const Customers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'DESC' });
  
  // Segment filter
  const [segmentFilter, setSegmentFilter] = useState('');
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  
  const segments = [
    { value: '', label: 'All Segments' },
    { value: 'champions', label: 'Champions' },
    { value: 'loyal', label: 'Loyal' },
    { value: 'potential_loyalist', label: 'Potential Loyalist' },
    { value: 'new_customer', label: 'New Customer' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'cant_lose', label: "Can't Lose" },
    { value: 'dormant', label: 'Dormant' },
    { value: 'others', label: 'Others' }
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchCustomers();
  }, [isAuthenticated, user, authLoading, currentPage, pageSize, sortConfig]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
        setSegmentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
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

      const res = await fetch(`/api/admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalCustomers(data.pagination?.total || data.customers?.length || 0);
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatPrice = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
  };

  const recalculateSegments = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/admin/customers/recalculate-segments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Segments updated: ${data.updated} customers processed`);
        fetchCustomers(); // Refresh the list
      } else {
        toast.error('Failed to recalculate segments');
      }
    } catch (error) {
      toast.error('Error recalculating segments');
    } finally {
      setRecalculating(false);
    }
  };

  // Filter customers by search and segment
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesSegment = !segmentFilter || customer.customer_segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  const totalPages = Math.ceil(totalCustomers / pageSize);

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
          <Link to="/admin/customers" className="nav-item active">
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

      {/* Main Content */}
      <main className="admin-content">
        <div className="admin-header">
          <h1 className="page-title">Customers</h1>
          <span className="page-count">{totalCustomers} registered customers</span>
        </div>

        {/* Search & Controls */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
            
            {/* Segment Filter */}
            <div className="custom-select" style={{ minWidth: '200px' }}>
              <div 
                className={`custom-select-trigger ${segmentDropdownOpen ? 'open' : ''}`}
                onClick={() => setSegmentDropdownOpen(!segmentDropdownOpen)}
              >
                <span>{segments.find(s => s.value === segmentFilter)?.label || 'All Segments'}</span>
                <ChevronDown size={16} className={`select-arrow ${segmentDropdownOpen ? 'rotated' : ''}`} />
              </div>
              {segmentDropdownOpen && (
                <div className="custom-select-options">
                  {segments.map(seg => (
                    <div 
                      key={seg.value}
                      className={`custom-select-option ${segmentFilter === seg.value ? 'selected' : ''}`}
                      onClick={() => {
                        setSegmentFilter(seg.value);
                        setSegmentDropdownOpen(false);
                      }}
                    >
                      {seg.value && <span className={`segment-badge segment-${seg.value}`} style={{ marginRight: 8 }}>●</span>}
                      {seg.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recalculate Button */}
            <button 
              className="btn btn-secondary"
              onClick={recalculateSegments}
              disabled={recalculating}
              title="Recalculate customer segments"
            >
              <RefreshCw size={16} className={recalculating ? 'spinning' : ''} />
              {recalculating ? 'Processing...' : 'Recalculate'}
            </button>
            
            {/* Segmentation Info */}
            <div className="segment-info-tooltip">
              <HelpCircle size={18} className="info-icon" />
              <div className="segment-tooltip-content">
                <h4>How Segmentation Works</h4>
                <p><strong>RF Scoring (Recency-Frequency)</strong></p>
                <ul>
                  <li><strong>Recency:</strong> Days since last order (0-7d=5, 8-30d=4, 31-60d=3, 61-120d=2, 120+d=1)</li>
                  <li><strong>Frequency:</strong> Total orders (10+=5, 5-9=4, 3-4=3, 2=2, 1=1)</li>
                </ul>
                <p><strong>Segments:</strong></p>
                <ul>
                  <li>🏆 <strong>Champions:</strong> R≥4, F≥4</li>
                  <li>💜 <strong>Loyal:</strong> R≥3, F≥3</li>
                  <li>💙 <strong>Potential Loyalist:</strong> R≥4, F=2</li>
                  <li>💚 <strong>New Customer:</strong> R=5, F=1</li>
                  <li>🟡 <strong>At Risk:</strong> R=2, F≥3</li>
                  <li>🔴 <strong>Can't Lose:</strong> R≤2, F≥4</li>
                  <li>⚫ <strong>Dormant:</strong> R=1, F≤2</li>
                  <li>⚪ <strong>Others:</strong> All others</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table sortable-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort('name')}>
                  Customer {getSortIcon('name')}
                </th>
                <th>Contact</th>
                <th className="sortable-header" onClick={() => handleSort('created_at')}>
                  Joined {getSortIcon('created_at')}
                </th>
                <th className="sortable-header text-center" onClick={() => handleSort('order_count')}>
                  Orders {getSortIcon('order_count')}
                </th>
                <th className="text-center">Segment</th>
                <th className="sortable-header text-right" onClick={() => handleSort('total_spent')}>
                  Total Spent {getSortIcon('total_spent')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                <td colSpan="6" className="loading-cell">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                <td colSpan="6" className="empty-cell">
                    <div className="empty-state-inline">
                      <Users size={48} className="empty-icon" />
                      <h3>No Customers Yet</h3>
                      <p>When customers register on your store, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">
                          {customer.profile_image ? (
                            <img src={customer.profile_image.startsWith('http') ? customer.profile_image : `http://localhost:5000${customer.profile_image}`} alt={customer.name} />
                          ) : (
                            customer.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="customer-name">
                          <strong>{customer.name || 'Unknown'}</strong>
                          <span className="customer-id">ID: {customer.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-row">
                          <Mail size={14} />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="contact-row">
                            <Phone size={14} />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{formatDate(customer.created_at)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="order-count-badge">
                        {customer.order_count || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`segment-badge segment-${customer.customer_segment || 'others'}`}>
                        {(customer.customer_segment || 'others').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="total-spent">
                        {formatPrice(customer.total_spent)}
                      </span>
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
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCustomers)} of {totalCustomers}
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

export default Customers;
