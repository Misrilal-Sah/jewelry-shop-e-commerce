import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Plus, Edit, Trash2, Search, Image, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, Archive, RotateCcw, 
  ChevronLeft, ChevronRight, ImagePlus, X, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';

const Products = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  
  // Core data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  
  // Filter state
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  
  // Background upload modal
  const [bgModal, setBgModal] = useState(false);
  const [bgTab, setBgTab] = useState('upload'); // 'upload' or 'list'
  const [bgName, setBgName] = useState('');
  const [bgFile, setBgFile] = useState(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [bgDragging, setBgDragging] = useState(false);
  const [backgrounds, setBackgrounds] = useState([]);
  const [bgLoading, setBgLoading] = useState(false);
  const [deleteBgModal, setDeleteBgModal] = useState({ show: false, bg: null });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [isAuthenticated, user, authLoading, currentPage, pageSize, showInactive, sortConfig]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        includeInactive: showInactive.toString()
      });
      
      if (sortConfig.key) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }
      
      console.log('=== FETCH PRODUCTS ===');
      console.log('Params:', params.toString());
      console.log('showInactive:', showInactive);
      console.log('sortConfig:', sortConfig);
      
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Response:', data);
        setProducts(data.products || []);
        setTotalProducts(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting handler
  const handleSort = (key) => {
    let direction = 'ASC';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ASC') direction = 'DESC';
      else if (sortConfig.direction === 'DESC') {
        // Reset to no sorting
        setSortConfig({ key: null, direction: null });
        return;
      }
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Get sort icon for column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="sort-icon neutral" />;
    }
    if (sortConfig.direction === 'ASC') {
      return <ChevronUp size={14} className="sort-icon asc" />;
    }
    return <ChevronDown size={14} className="sort-icon desc" />;
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (product) => {
    setDeleteModal({ show: true, product });
  };

  const handleDeleteConfirm = async (permanent = false) => {
    const { product } = deleteModal;
    if (!product) return;
    
    try {
      const url = permanent 
        ? `/api/admin/products/${product.id}?permanent=true`
        : `/api/admin/products/${product.id}`;
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        if (permanent) {
          setProducts(products.filter(p => p.id !== product.id));
        } else {
          // Update product to inactive in local state
          setProducts(products.map(p => 
            p.id === product.id ? { ...p, is_active: false } : p
          ));
        }
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleteModal({ show: false, product: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, product: null });
  };

  const handleRestore = async (product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ is_active: true })
      });
      
      if (res.ok) {
        toast.success('Product restored');
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, is_active: true } : p
        ));
      }
    } catch (error) {
      toast.error('Failed to restore product');
    }
  };

  const formatPrice = (product) => {
    const total = parseFloat(product.metal_price) + parseFloat(product.making_charges || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(total);
  };

  const getFirstImage = (images) => {
    try {
      const imgs = typeof images === 'string' ? JSON.parse(images) : images;
      return imgs && imgs.length > 0 ? imgs[0] : null;
    } catch {
      return null;
    }
  };

  // Handle background upload
  const handleBgUpload = async () => {
    if (!bgName.trim() || !bgFile) {
      toast.error('Please provide name and image');
      return;
    }
    
    setBgUploading(true);
    const formData = new FormData();
    formData.append('name', bgName);
    formData.append('image', bgFile);
    
    try {
      const res = await fetch('/api/backgrounds', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        toast.success('Background added successfully!');
        setBgModal(false);
        setBgName('');
        setBgFile(null);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to add background');
      }
    } catch (err) {
      toast.error('Failed to upload background');
    } finally {
      setBgUploading(false);
    }
  };

  // Fetch backgrounds for modal
  const fetchBackgrounds = async () => {
    setBgLoading(true);
    try {
      const res = await fetch('/api/backgrounds');
      if (res.ok) {
        setBackgrounds(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch backgrounds');
    } finally {
      setBgLoading(false);
    }
  };

  // Delete background
  const handleDeleteBg = async () => {
    const id = deleteBgModal.bg?.id;
    if (!id) return;
    
    try {
      const res = await fetch(`/api/backgrounds/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Background deleted');
        setBackgrounds(prev => prev.filter(b => b.id !== id));
        setDeleteBgModal({ show: false, bg: null });
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Client-side search filter
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(totalProducts / pageSize);

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Enhanced Delete Modal */}
      {deleteModal.show && (
        <div className="confirm-modal-overlay" onClick={handleDeleteCancel}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3 className="confirm-modal-title">Delete Product?</h3>
            <p className="confirm-modal-message">
              What would you like to do with "<strong>{deleteModal.product?.name}</strong>"?
            </p>
            <div className="confirm-modal-actions three-buttons">
              <button className="btn btn-secondary" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={() => handleDeleteConfirm(false)}>
                <Archive size={16} /> Set Inactive
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteConfirm(true)}>
                <Trash2 size={16} /> Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar />

      <main className="admin-content">
        <header className="admin-header">
          <h1>Products</h1>
          <div className="admin-header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => { setBgModal(true); fetchBackgrounds(); }}
            >
              <ImagePlus size={18} /> Backgrounds
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/products/new')}
            >
              <Plus size={18} /> Add Product
            </button>
          </div>
        </header>

        {/* Table Controls: Search, Filter, Page Size */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Products Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table sortable-table">
            <thead>
              <tr>
                <th>Image</th>
                <th className="sortable-header" onClick={() => handleSort('name')}>
                  Product {getSortIcon('name')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('category')}>
                  Category {getSortIcon('category')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('metal_type')}>
                  Metal {getSortIcon('metal_type')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('metal_price')}>
                  Price {getSortIcon('metal_price')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('stock')}>
                  Stock {getSortIcon('stock')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('is_active')}>
                  Status {getSortIcon('is_active')}
                </th>
                {(hasPermission('products', 'edit') || hasPermission('products', 'delete')) && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={(hasPermission('products', 'edit') || hasPermission('products', 'delete')) ? 8 : 7} className="loading-cell">Loading...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={(hasPermission('products', 'edit') || hasPermission('products', 'delete')) ? 8 : 7} className="empty-cell">
                    <div className="empty-state-inline">
                      <Package size={48} className="empty-icon" />
                      <h3>No Products Found</h3>
                      <p>Start building your jewelry collection by adding your first product.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const img = getFirstImage(product.images);
                  return (
                    <tr key={product.id} className={!product.is_active ? 'inactive-row' : ''}>
                      <td>
                        {img ? (
                          <img 
                            src={img} 
                            alt={product.name} 
                            className="product-thumbnail"
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <div 
                            className="no-image" 
                            style={{ 
                              width: 48, height: 48, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-secondary)', borderRadius: 4
                            }}
                          >
                            <Image size={20} color="var(--text-muted)" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="product-cell">
                          <span className="product-name">{product.name}</span>
                        </div>
                      </td>
                      <td className="capitalize">{product.category}</td>
                      <td className="capitalize">{product.purity} {product.metal_type}</td>
                      <td>{formatPrice(product)}</td>
                      <td>
                        <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {(hasPermission('products', 'edit') || hasPermission('products', 'delete')) && (
                        <td>
                          <div className="action-btns">
                            {hasPermission('products', 'edit') && (
                              <button 
                                className="action-btn edit"
                                onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {hasPermission('products', 'edit') && !product.is_active && (
                              <button 
                                className="action-btn restore"
                                onClick={() => handleRestore(product)}
                                title="Restore"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                            {hasPermission('products', 'delete') && (
                              <button 
                                className="action-btn delete"
                                onClick={() => handleDeleteClick(product)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
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

      {/* Background Upload Modal */}
      {bgModal && (
        <div className="confirm-modal-overlay" onClick={() => setBgModal(false)}>
          <div className="confirm-modal bg-upload-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setBgModal(false)}>
              <X size={20} />
            </button>
            <h3 className="confirm-modal-title">
              <ImagePlus size={24} /> Backgrounds
            </h3>
            
            {/* Tab Navigation */}
            <div className="bg-tabs">
              <button 
                className={`bg-tab ${bgTab === 'upload' ? 'active' : ''}`}
                onClick={() => setBgTab('upload')}
              >
                <Upload size={16} /> Upload New
              </button>
              <button 
                className={`bg-tab ${bgTab === 'list' ? 'active' : ''}`}
                onClick={() => { setBgTab('list'); fetchBackgrounds(); }}
              >
                <Image size={16} /> View All ({backgrounds.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-tab-content">
              {bgTab === 'upload' ? (
                /* Upload Tab */
                <div className="bg-upload-form">
                  <div className="form-group">
                    <label className="form-label">Background Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Gold Silk"
                      value={bgName}
                      onChange={e => setBgName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Background Image</label>
                    <div 
                      className={`bg-dropzone ${bgFile ? 'has-file' : ''} ${bgDragging ? 'dragging' : ''}`}
                      onClick={() => document.getElementById('bg-file-input').click()}
                      onDragOver={e => { e.preventDefault(); setBgDragging(true); }}
                      onDragLeave={() => setBgDragging(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setBgDragging(false);
                        if (e.dataTransfer.files[0]) setBgFile(e.dataTransfer.files[0]);
                      }}
                    >
                      {bgFile ? (
                        <>
                          <img src={URL.createObjectURL(bgFile)} alt="Preview" />
                          <span>{bgFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={32} />
                          <span>Click or drag image here</span>
                        </>
                      )}
                      <input
                        id="bg-file-input"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => setBgFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary full-width"
                    onClick={handleBgUpload}
                    disabled={bgUploading || !bgName.trim() || !bgFile}
                  >
                    {bgUploading ? 'Uploading...' : 'Add Background'}
                  </button>
                </div>
              ) : (
                /* List Tab */
                <div className="bg-list-tab">
                  {bgLoading ? (
                    <p className="bg-loading">Loading...</p>
                  ) : backgrounds.length === 0 ? (
                    <p className="bg-empty">No backgrounds yet. Upload one!</p>
                  ) : (
                    <div className="bg-list">
                      {backgrounds.map(bg => (
                        <div key={bg.id} className="bg-list-item">
                          <img src={bg.image_url} alt={bg.name} />
                          <span>{bg.name}</span>
                          <button 
                            className="btn-icon-danger"
                            onClick={() => setDeleteBgModal({ show: true, bg })}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Background Confirmation Modal */}
      {deleteBgModal.show && (
        <div className="confirm-modal-overlay" onClick={() => setDeleteBgModal({ show: false, bg: null })}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal-icon danger">
              <AlertTriangle size={48} />
            </div>
            <h3 className="confirm-modal-title">Delete Background?</h3>
            <p className="confirm-modal-message">
              Are you sure you want to delete "<strong>{deleteBgModal.bg?.name}</strong>"?
              This cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setDeleteBgModal({ show: false, bg: null })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteBg}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
