import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, Plus, Edit, Trash2, X, Search, Settings,
  LayoutDashboard, Package, ShoppingCart, Users, Tag, BarChart3, Shield, Mail,
  ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useModal } from '../../components/ui/Modal';
import './Admin.css';
import './FlashSales.css';

const FlashSales = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const toast = useToast();
  const modal = useModal();
  
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'DESC' });
  
  const [formData, setFormData] = useState({
    product_id: '',
    discount_percentage: 20,
    flash_price: '',
    start_time: '',
    end_time: '',
    max_quantity: ''
  });

  useEffect(() => {
    fetchFlashSales();
    fetchProducts();
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFlashSales = async () => {
    try {
      const res = await fetch('/api/flash-sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFlashSales(data);
      }
    } catch (error) {
      console.error('Fetch flash sales error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=500');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editingSale 
      ? `/api/flash-sales/${editingSale.id}`
      : '/api/flash-sales';
    
    const method = editingSale ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingSale ? 'Flash sale updated!' : 'Flash sale created!');
        setShowModal(false);
        resetForm();
        fetchFlashSales();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save flash sale');
      }
    } catch (error) {
      toast.error('Failed to save flash sale');
    }
  };

  const handleDelete = async (id) => {
    modal.confirm(
      'Delete Flash Sale',
      'Are you sure you want to delete this flash sale?',
      async () => {
        try {
          const res = await fetch(`/api/flash-sales/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            toast.success('Flash sale deleted');
            fetchFlashSales();
          }
        } catch (error) {
          toast.error('Failed to delete flash sale');
        }
      }
    );
  };

  const handleToggleActive = async (sale) => {
    try {
      const res = await fetch(`/api/flash-sales/${sale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...sale, is_active: !sale.is_active })
      });
      
      if (res.ok) {
        toast.success(`Flash sale ${sale.is_active ? 'deactivated' : 'activated'}`);
        fetchFlashSales();
      }
    } catch (error) {
      toast.error('Failed to update flash sale');
    }
  };

  const openEditModal = (sale) => {
    setEditingSale(sale);
    setFormData({
      product_id: sale.product_id,
      discount_percentage: sale.discount_percentage,
      flash_price: sale.flash_price || '',
      start_time: formatDateForInput(sale.start_time),
      end_time: formatDateForInput(sale.end_time),
      max_quantity: sale.max_quantity || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSale(null);
    setFormData({
      product_id: '',
      discount_percentage: 20,
      flash_price: '',
      start_time: '',
      end_time: '',
      max_quantity: ''
    });
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSaleStatus = (sale) => {
    const now = new Date();
    const start = new Date(sale.start_time);
    const end = new Date(sale.end_time);
    
    if (!sale.is_active) return 'inactive';
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'active', text: 'Active' },
      upcoming: { class: 'pending', text: 'Upcoming' },
      expired: { class: 'inactive', text: 'Expired' },
      inactive: { class: 'inactive', text: 'Inactive' }
    };
    return badges[status] || badges.inactive;
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
  const filteredSales = flashSales.filter(sale => {
    const status = getSaleStatus(sale);
    if (filter !== 'all' && status !== filter) return false;
    if (searchTerm && !sale.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Apply sorting
  const sortedSales = [...filteredSales].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal, bVal;
    
    switch (sortConfig.key) {
      case 'product_name':
        aVal = a.product_name?.toLowerCase() || '';
        bVal = b.product_name?.toLowerCase() || '';
        break;
      case 'discount_percentage':
        aVal = parseFloat(a.discount_percentage) || 0;
        bVal = parseFloat(b.discount_percentage) || 0;
        break;
      case 'start_time':
        aVal = new Date(a.start_time).getTime();
        bVal = new Date(b.start_time).getTime();
        break;
      case 'end_time':
        aVal = new Date(a.end_time).getTime();
        bVal = new Date(b.end_time).getTime();
        break;
      default:
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
    }
    
    if (aVal < bVal) return sortConfig.direction === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'ASC' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalItems = sortedSales.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSales = sortedSales.slice(startIndex, startIndex + pageSize);

  const getProductImage = (images) => {
    if (!images) return 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_60,h_60/jewllery_shop/logos/alankara-emblem.png';
    try {
      const parsed = typeof images === 'string' ? JSON.parse(images) : images;
      return parsed[0] || 'https://res.cloudinary.com/ddrlxvnsh/image/upload/c_fill,w_60,h_60/jewllery_shop/logos/alankara-emblem.png';
    } catch {
      return images;
    }
  };

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
          <Link to="/admin/orders" className="nav-item">
            <ShoppingCart size={18} /> Orders
          </Link>
          <Link to="/admin/customers" className="nav-item">
            <Users size={18} /> Customers
          </Link>
          <Link to="/admin/coupons" className="nav-item">
            <Tag size={18} /> Coupons
          </Link>
          <Link to="/admin/flash-sales" className="nav-item active">
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
          <Link to="/admin/common-details" className="nav-item">
            <Settings size={18} /> Common Details
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
          <h1><Zap size={24} /> Flash Sales</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} /> Add Flash Sale
          </button>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div className="filter-tabs">
            {['all', 'active', 'upcoming', 'expired', 'inactive'].map(f => (
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
                <th style={{width: '60px'}}>Image</th>
                <th className="sortable-header" onClick={() => handleSort('product_name')}>
                  Product {getSortIcon('product_name')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('discount_percentage')}>
                  Discount {getSortIcon('discount_percentage')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('start_time')}>
                  Start Time {getSortIcon('start_time')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('end_time')}>
                  End Time {getSortIcon('end_time')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="loading-cell">Loading...</td></tr>
              ) : paginatedSales.length === 0 ? (
                <tr><td colSpan="7" className="empty-cell">
                  <div className="empty-state-inline">
                    <Zap size={32} />
                    <p>No flash sales found</p>
                    <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowModal(true); }}>
                      <Plus size={16} /> Create Flash Sale
                    </button>
                  </div>
                </td></tr>
              ) : (
                paginatedSales.map(sale => {
                  const status = getSaleStatus(sale);
                  const badge = getStatusBadge(status);
                  return (
                    <tr key={sale.id}>
                      <td>
                        <img 
                          src={getProductImage(sale.product_images)} 
                          alt="" 
                          className="product-thumbnail"
                        />
                      </td>
                      <td>
                        <span className="product-name">{sale.product_name}</span>
                      </td>
                      <td>
                        <span className="discount-badge">{sale.discount_percentage}% OFF</span>
                        {sale.flash_price && (
                          <div className="flash-price-text">₹{parseFloat(sale.flash_price).toLocaleString()}</div>
                        )}
                      </td>
                      <td>{formatDate(sale.start_time)}</td>
                      <td>{formatDate(sale.end_time)}</td>
                      <td>
                        <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button 
                            className={`toggle-btn ${sale.is_active ? 'active' : ''}`}
                            onClick={() => handleToggleActive(sale)}
                            title={sale.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {sale.is_active ? 'On' : 'Off'}
                          </button>
                          <button className="action-btn edit" onClick={() => openEditModal(sale)} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(sale.id)} title="Delete">
                            <Trash2 size={16} />
                          </button>
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
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} flash sales
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
              <h2>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Product *</label>
                  <select 
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Percentage *</label>
                    <input 
                      type="number"
                      min="1"
                      max="99"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Flash Price (optional)</label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.flash_price}
                      onChange={(e) => setFormData({ ...formData, flash_price: e.target.value })}
                      placeholder="Override price"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input 
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input 
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Max Quantity (optional)</label>
                  <input 
                    type="number"
                    min="1"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSale ? 'Update Flash Sale' : 'Create Flash Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FlashSales;
