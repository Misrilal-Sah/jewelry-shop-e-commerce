import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Mail, Zap, Settings,
  Plus, Edit2, Trash2, X, HelpCircle, Quote, ChevronDown, ChevronUp, Search,
  ChevronsUpDown, ChevronLeft, ChevronRight, AlertTriangle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';
import './FlashSales.css';

const FAQs = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'display_order', direction: 'ASC' });
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  const categoryOptions = ['General', 'Orders', 'Shipping', 'Returns', 'Products', 'Payment', 'Offers', 'Account', 'Support', 'Care'];
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchFaqs();
  }, [isAuthenticated, user, authLoading]);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/faqs/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error('Fetch FAQs error:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      display_order: 0,
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      display_order: faq.display_order || 0,
      is_active: faq.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      const url = editingFaq 
        ? `/api/faqs/admin/${editingFaq.id}`
        : '/api/faqs/admin';
      
      const res = await fetch(url, {
        method: editingFaq ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingFaq ? 'FAQ updated!' : 'FAQ created!');
        setShowModal(false);
        fetchFaqs();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to save FAQ');
      }
    } catch (error) {
      toast.error('Failed to save FAQ');
    }
  };

  const openDeleteModal = (faq) => {
    setFaqToDelete(faq);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!faqToDelete) return;
    
    try {
      const res = await fetch(`/api/faqs/admin/${faqToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('FAQ deleted');
        setDeleteModalOpen(false);
        setFaqToDelete(null);
        fetchFaqs();
      } else {
        toast.error('Failed to delete FAQ');
      }
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
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

  // Filter FAQs by search query and category
  const filteredFaqs = faqs.filter(faq => {
    // Category filter
    if (categoryFilter && faq.category !== categoryFilter) return false;
    
    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      faq.question?.toLowerCase().includes(query) ||
      faq.answer?.toLowerCase().includes(query) ||
      faq.category?.toLowerCase().includes(query)
    );
  });

  // Sort and paginate FAQs
  const sortedFaqs = [...filteredFaqs].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    if (aVal < bVal) return sortConfig.direction === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'ASC' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedFaqs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFaqs = sortedFaqs.slice(startIndex, startIndex + pageSize);

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
          <Link to="/admin/testimonials" className="nav-item"><Quote size={18} /> Testimonials</Link>
          <Link to="/admin/faqs" className="nav-item active"><HelpCircle size={18} /> FAQs</Link>
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
          <h1>FAQs</h1>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add FAQ
          </button>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          {/* Category Filter Dropdown */}
          <div className="category-filter">
            <div className="custom-select" style={{ minWidth: '160px' }}>
              <div 
                className={`custom-select-trigger ${categoryDropdownOpen ? 'open' : ''}`}
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              >
                <span>{categoryFilter || 'All Categories'}</span>
                <ChevronDown size={16} className={`select-arrow ${categoryDropdownOpen ? 'rotated' : ''}`} />
              </div>
              {categoryDropdownOpen && (
                <div className="custom-select-options">
                  <div 
                    className={`custom-select-option ${!categoryFilter ? 'selected' : ''}`}
                    onClick={() => {
                      setCategoryFilter('');
                      setCurrentPage(1);
                      setCategoryDropdownOpen(false);
                    }}
                  >
                    All Categories
                  </div>
                  {categoryOptions.map(cat => (
                    <div 
                      key={cat}
                      className={`custom-select-option ${categoryFilter === cat ? 'selected' : ''}`}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setCurrentPage(1);
                        setCategoryDropdownOpen(false);
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
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

        <div className="admin-card">
          {loading ? (
            <div className="admin-loading">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-illustration">
                <HelpCircle size={48} />
              </div>
              <h3>No FAQs Yet</h3>
              <p>Add frequently asked questions to help your customers.</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                <Plus size={18} /> Add FAQ
              </button>
            </div>
          ) : (
            <>
            <table className="admin-table sortable-table">
              <thead>
                <tr>
                  <th className="sortable-header" onClick={() => handleSort('category')}>
                    Category {getSortIcon('category')}
                  </th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFaqs.map(faq => (
                  <tr key={faq.id}>
                    <td>
                      <span className="category-badge">{faq.category || 'General'}</span>
                    </td>
                    <td>
                      <div className="faq-question-cell">
                        {faq.question.length > 80 ? faq.question.substring(0, 80) + '...' : faq.question}
                      </div>
                    </td>
                    <td>
                      <div className="faq-answer-cell">
                        {faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer}
                      </div>
                    </td>
                    <td>{faq.display_order}</td>
                    <td>
                      <span className={`status-badge ${faq.is_active ? 'active' : 'inactive'}`}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          onClick={() => openEditModal(faq)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => openDeleteModal(faq)}
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
                  Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} FAQs
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
            <h2>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={e => setFormData({...formData, question: e.target.value})}
                  placeholder="Enter the question..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Answer *</label>
                <textarea
                  rows={4}
                  value={formData.answer}
                  onChange={e => setFormData({...formData, answer: e.target.value})}
                  placeholder="Enter the answer..."
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
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
                  <span className="checkbox-text">Active (visible on FAQ page)</span>
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFaq ? 'Update FAQ' : 'Add FAQ'}
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
            <h2>Delete FAQ</h2>
            <p>Are you sure you want to delete this FAQ?</p>
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

export default FAQs;
