import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Mail, Zap, Settings,
  FileText, Quote, HelpCircle, Plus, Edit2, Trash2, Eye, Search, Calendar, Save, X,
  ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Upload, Image, BookOpen, Activity
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useModal } from '../../components/ui/Modal';
import './Admin.css';
import './FlashSales.css';
import './AdminBlog.css';

const AdminBlog = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  const modal = useModal();
  const fileInputRef = useRef(null);
  
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Image upload states
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'DESC' });
  
  // Custom dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category: 'General',
    tags: '',
    status: 'draft',
    read_time: 5
  });

  // React Quill modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchPosts();
    fetchCategories();
  }, [isAuthenticated, user, authLoading]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
        setCategoryDropdownOpen(false);
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      const res = await fetch(`/api/blog/admin/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: '',
      category: categories[0]?.name || 'General',
      tags: '',
      status: 'draft',
      read_time: 5
    });
    setShowModal(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      category: post.category || 'General',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : 
            (typeof post.tags === 'string' ? JSON.parse(post.tags || '[]').join(', ') : ''),
      status: post.status,
      read_time: post.read_time || 5
    });
    setShowModal(true);
  };

  const handleDeletePost = async (id, coverImage) => {
    modal.confirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/blog/admin/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            if (coverImage && coverImage.includes('cloudinary.com')) {
              await fetch('/api/admin/delete-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ url: coverImage })
              }).catch(err => console.error('Image delete error:', err));
            }
            toast.success('Post deleted successfully');
            fetchPosts();
          } else {
            toast.error('Failed to delete post');
          }
        } catch (error) {
          toast.error('Error deleting post');
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const postData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      const method = editingPost ? 'PUT' : 'POST';
      const url = editingPost 
        ? `/api/blog/admin/posts/${editingPost.id}`
        : '/api/blog/admin/posts';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      if (res.ok) {
        toast.success(`Post ${editingPost ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        fetchPosts();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save post');
      }
    } catch (error) {
      toast.error('Error saving post');
    }
  };

  // Image upload handlers
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    uploadFormData.append('folder', 'others');

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, cover_image: data.url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleRemoveImage = async () => {
    if (formData.cover_image && formData.cover_image.includes('cloudinary.com')) {
      try {
        await fetch('/api/admin/delete-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ url: formData.cover_image })
        });
      } catch (err) {
        console.error('Image delete error:', err);
      }
    }
    setFormData(prev => ({ ...prev, cover_image: '' }));
  };

  const generateSlug = (title) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Auto-calculate read time from content (approx 200 words per minute)
  const calculateReadTime = (htmlContent) => {
    if (!htmlContent) return 1;
    // Strip HTML tags and get plain text
    const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(' ').filter(word => word.length > 0).length;
    const minutes = Math.ceil(wordCount / 200);
    return Math.max(1, minutes); // Minimum 1 minute
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
  const filteredPosts = posts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    if (searchQuery && !post.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Apply sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal, bVal;
    
    switch (sortConfig.key) {
      case 'title':
        aVal = a.title?.toLowerCase() || '';
        bVal = b.title?.toLowerCase() || '';
        break;
      case 'category':
        aVal = a.category?.toLowerCase() || '';
        bVal = b.category?.toLowerCase() || '';
        break;
      case 'created_at':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      case 'view_count':
        aVal = parseInt(a.view_count) || 0;
        bVal = parseInt(b.view_count) || 0;
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
  const totalItems = sortedPosts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPosts = sortedPosts.slice(startIndex, startIndex + pageSize);

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
          <Link to="/admin/faqs" className="nav-item"><HelpCircle size={18} /> FAQs</Link>
          <Link to="/admin/blog" className="nav-item active"><FileText size={18} /> Blog</Link>
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
          <h1><FileText size={24} /> Blog Posts</h1>
          <button className="btn btn-primary" onClick={handleNewPost}>
            <Plus size={18} /> New Post
          </button>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-tabs">
            {['all', 'published', 'draft'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filterStatus === f ? 'active' : ''}`}
                onClick={() => { setFilterStatus(f); setCurrentPage(1); }}
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
                <th className="sortable-header" onClick={() => handleSort('title')}>
                  Title {getSortIcon('title')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('category')}>
                  Category {getSortIcon('category')}
                </th>
                <th>Status</th>
                <th className="sortable-header" onClick={() => handleSort('created_at')}>
                  Date {getSortIcon('created_at')}
                </th>
                <th className="sortable-header" onClick={() => handleSort('view_count')}>
                  Views {getSortIcon('view_count')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="loading-cell">Loading...</td></tr>
              ) : paginatedPosts.length === 0 ? (
                <tr><td colSpan="7" className="empty-cell">
                  <div className="empty-state">
                    <div className="empty-illustration">
                      <BookOpen size={64} strokeWidth={1} />
                    </div>
                    <h3>No blog posts yet</h3>
                    <p>Start sharing your jewelry expertise with the world!</p>
                    <button className="btn btn-primary" onClick={handleNewPost}>
                      <Plus size={16} /> Create Your First Post
                    </button>
                  </div>
                </td></tr>
              ) : (
                paginatedPosts.map(post => (
                  <tr key={post.id}>
                    <td>
                      {post.cover_image ? (
                        <img src={post.cover_image} alt="" className="post-thumbnail" />
                      ) : (
                        <div className="no-image-placeholder">
                          <Image size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="post-title-info">
                        <span className="post-title">{post.title}</span>
                        <span className="post-slug-cell">/{post.slug}</span>
                      </div>
                    </td>
                    <td><span className="category-badge">{post.category}</span></td>
                    <td>
                      <span className={`status-badge ${post.status}`}>
                        {post.status}
                      </span>
                    </td>
                    <td>{formatDate(post.published_at || post.created_at)}</td>
                    <td><Eye size={14} /> {post.view_count}</td>
                    <td>
                      <div className="action-btns">
                        {post.status === 'published' && (
                          <a 
                            href={`/blog/${post.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="action-btn"
                            title="View"
                          >
                            <Eye size={16} />
                          </a>
                        )}
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditPost(post)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeletePost(post.id, post.cover_image)}
                          title="Delete"
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
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} posts
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content blog-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>
            <h2>{editingPost ? 'Edit Post' : 'New Post'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (!editingPost) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    placeholder="Enter post title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="post-url-slug"
                  />
                </div>
              </div>

              <div className="form-row form-row-3">
                <div className="form-group">
                  <label>Category</label>
                  <div className="custom-select">
                    <div 
                      className={`custom-select-trigger ${categoryDropdownOpen ? 'open' : ''}`}
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    >
                      <span>{formData.category}</span>
                      <ChevronDown size={16} className={`select-arrow ${categoryDropdownOpen ? 'rotated' : ''}`} />
                    </div>
                    {categoryDropdownOpen && (
                      <div className="custom-select-options">
                        {categories.map(cat => (
                          <div 
                            key={cat.id}
                            className={`custom-select-option ${formData.category === cat.name ? 'selected' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, category: cat.name });
                              setCategoryDropdownOpen(false);
                            }}
                          >
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <div className="custom-select">
                    <div 
                      className={`custom-select-trigger ${statusDropdownOpen ? 'open' : ''}`}
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    >
                      <span>{formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</span>
                      <ChevronDown size={16} className={`select-arrow ${statusDropdownOpen ? 'rotated' : ''}`} />
                    </div>
                    {statusDropdownOpen && (
                      <div className="custom-select-options">
                        {['draft', 'published'].map(s => (
                          <div 
                            key={s}
                            className={`custom-select-option ${formData.status === s ? 'selected' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, status: s });
                              setStatusDropdownOpen(false);
                            }}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Read Time (auto)</label>
                  <input
                    type="number"
                    value={formData.read_time}
                    readOnly
                    min="1"
                    title="Auto-calculated from content"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cover Image</label>
                {formData.cover_image ? (
                  <div className="image-preview-box">
                    <img src={formData.cover_image} alt="Cover" />
                    <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
                      <X size={16} /> 
                    </button>
                  </div>
                ) : (
                  <div 
                    className={`dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileSelect}
                      hidden
                    />
                    {uploading ? (
                      <div className="dropzone-content">
                        <div className="upload-spinner"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <Upload size={32} />
                        <p>Drag and drop an image here</p>
                        <span>or click to select</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <div className="quill-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        content: value,
                        read_time: calculateReadTime(value)
                      });
                    }}
                    modules={quillModules}
                    placeholder="Write your blog post content here..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="jewelry, gold, tips"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} />
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
