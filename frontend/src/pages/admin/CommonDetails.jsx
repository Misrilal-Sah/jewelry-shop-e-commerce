import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import { apiFetch } from '../../config/api';
import { 
  Settings, Tag, Briefcase, Save, Plus, Trash2, Edit2, X, Check, Menu,
  Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube,
  Image as ImageIcon, AlertTriangle, Upload
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';

const CommonDetails = () => {
  const { token } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const fileInputRef = { category: null, collection: null };
  
  // Settings state
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', display_name: '', image: '', is_homepage: true });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Collections state
  const [collections, setCollections] = useState([]);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({ name: '', display_name: '', tagline: '', image: '', is_homepage: true });
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [deleteCollectionConfirm, setDeleteCollectionConfirm] = useState(null);

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, categoriesRes, collectionsRes] = await Promise.all([
        apiFetch('/api/common/settings', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/common/categories', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/common/collections', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        setOriginalSettings(JSON.parse(JSON.stringify(data)));
      }
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (collectionsRes.ok) setCollections(await collectionsRes.json());
    } catch (error) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  // Update setting value
  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category].map(s => 
        s.setting_key === key ? { ...s, setting_value: value } : s
      )
    }));
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const allSettings = Object.values(settings).flat().map(s => ({
        setting_key: s.setting_key,
        setting_value: s.setting_value
      }));
      
      const res = await apiFetch('/api/common/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ settings: allSettings })
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully');
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  // Check for unsaved changes
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // Upload image to Cloudinary
  const uploadImage = async (file, type, id = null) => {
    setUploadingImage(id || 'new');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'jewllery_shop/Others');
      formData.append('prefix', type);
      
      const res = await apiFetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.url;
      } else {
        toast.error('Failed to upload image');
        return null;
      }
    } catch (error) {
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(null);
    }
  };

  // Handle image file selection for new category
  const handleNewCategoryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'category');
    if (url) setNewCategory(prev => ({ ...prev, image: url }));
  };

  // Handle image file selection for editing category
  const handleEditCategoryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'category', editingCategory?.id);
    if (url) setEditingCategory(prev => ({ ...prev, image: url }));
  };

  // Handle image file selection for new collection
  const handleNewCollectionImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'collection');
    if (url) setNewCollection(prev => ({ ...prev, image: url }));
  };

  // Handle image file selection for editing collection
  const handleEditCollectionImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'collection', editingCollection?.id);
    if (url) setEditingCollection(prev => ({ ...prev, image: url }));
  };

  // Category CRUD
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category slug/key is required');
      return;
    }
    // Validate slug format (lowercase, no spaces)
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(newCategory.name)) {
      toast.error('Slug must be lowercase with no spaces (use hyphens). Example: daily-wear');
      return;
    }
    try {
      const res = await apiFetch('/api/common/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        toast.success('Category created');
        setNewCategory({ name: '', display_name: '', image: '', is_homepage: true });
        setShowNewCategory(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to create category');
      }
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async (id) => {
    try {
      const res = await apiFetch(`/api/common/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingCategory)
      });
      if (res.ok) {
        toast.success('Category updated');
        setEditingCategory(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const res = await apiFetch(`/api/common/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Collection CRUD (same pattern)
  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      toast.error('Collection slug/key is required');
      return;
    }
    // Validate slug format (lowercase, no spaces)
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(newCollection.name)) {
      toast.error('Slug must be lowercase with no spaces (use hyphens). Example: daily-wear');
      return;
    }
    try {
      const res = await apiFetch('/api/common/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCollection)
      });
      if (res.ok) {
        toast.success('Collection created');
        setNewCollection({ name: '', display_name: '', tagline: '', image: '', is_homepage: true });
        setShowNewCollection(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to create collection');
      }
    } catch (error) {
      toast.error('Failed to create collection');
    }
  };

  const handleUpdateCollection = async (id) => {
    try {
      const res = await apiFetch(`/api/common/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingCollection)
      });
      if (res.ok) {
        toast.success('Collection updated');
        setEditingCollection(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update collection');
    }
  };

  const handleDeleteCollection = async (id) => {
    try {
      const res = await apiFetch(`/api/common/collections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setDeleteCollectionConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete collection');
    }
  };

  // Render setting input based on type
  const renderSettingInput = (setting) => {
    const value = setting.setting_value || '';
    const onChange = (e) => updateSetting(setting.category, setting.setting_key, e.target.value);
    
    // Read-only mode when not editing
    if (!isEditingSettings) {
      return (
        <div className="setting-value-display">
          {value || <span className="text-muted">Not set</span>}
        </div>
      );
    }
    
    // Edit mode
    if (setting.setting_type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={onChange}
          rows={3}
          className="form-input"
        />
      );
    }
    
    return (
      <input
        type={setting.setting_type === 'email' ? 'email' : setting.setting_type === 'url' ? 'url' : 'text'}
        value={value}
        onChange={onChange}
        className="form-input"
      />
    );
  };

  // Get icon for setting
  const getSettingIcon = (key) => {
    if (key.includes('phone')) return <Phone size={16} />;
    if (key.includes('email')) return <Mail size={16} />;
    if (key.includes('address')) return <MapPin size={16} />;
    if (key.includes('facebook')) return <Facebook size={16} />;
    if (key.includes('instagram')) return <Instagram size={16} />;
    if (key.includes('twitter')) return <Twitter size={16} />;
    if (key.includes('youtube')) return <Youtube size={16} />;
    return <Settings size={16} />;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="admin-content">
      <div className="page-header">
        <button
          className="mobile-menu-toggle-admin"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-content">
          <h1><Settings size={24} /> Common Details</h1>
          <p className="subtitle">Manage homepage content, categories, and collections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="cd-tabs">
        <button 
          className={`cd-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Settings size={16} /> General Info
        </button>
        <button 
          className={`cd-tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <Phone size={16} /> Contact & Social
        </button>
        <button 
          className={`cd-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} /> Categories
        </button>
        <button 
          className={`cd-tab ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <Briefcase size={16} /> Collections
        </button>
      </div>

      {/* General Info Tab (Hero + Footer) */}
      {activeTab === 'general' && (
        <div className="settings-section">
          <div className="section-header">
            <h3>General Info</h3>
            {isEditingSettings ? (
              <div className="section-header-actions">
                <button className="btn btn-secondary" onClick={() => { setIsEditingSettings(false); setSettings(JSON.parse(JSON.stringify(originalSettings))); }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={() => { saveSettings(); setIsEditingSettings(false); }} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setIsEditingSettings(true)}>
                <Edit2 size={16} /> Edit
              </button>
            )}
          </div>
          
          <div className="settings-group">
            <h4>Hero Section</h4>
            <div className="settings-grid">
              {(settings.hero || []).map(setting => (
                <div key={setting.setting_key} className="setting-item">
                  <label>{setting.label}</label>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="settings-group">
            <h4>Footer Section</h4>
            <div className="settings-grid">
              {(settings.footer || []).map(setting => (
                <div key={setting.setting_key} className="setting-item">
                  <label>{setting.label}</label>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact & Social Tab */}
      {activeTab === 'contact' && (
        <div className="settings-section">
          <div className="section-header">
            <h3>Contact & Social</h3>
            {isEditingSettings ? (
              <div className="section-header-actions">
                <button className="btn btn-secondary" onClick={() => { setIsEditingSettings(false); setSettings(JSON.parse(JSON.stringify(originalSettings))); }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={() => { saveSettings(); setIsEditingSettings(false); }} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setIsEditingSettings(true)}>
                <Edit2 size={16} /> Edit
              </button>
            )}
          </div>
          
          <div className="settings-group">
            <h4>Contact Details</h4>
            <div className="settings-grid">
              {(settings.contact || []).map(setting => (
                <div key={setting.setting_key} className="setting-item">
                  <label>
                    {getSettingIcon(setting.setting_key)}
                    {setting.label}
                  </label>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="settings-group">
            <h4>Social Media Links</h4>
            <div className="settings-grid">
              {(settings.social || []).map(setting => (
                <div key={setting.setting_key} className="setting-item">
                  <label>
                    {getSettingIcon(setting.setting_key)}
                    {setting.label}
                  </label>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="categories-section">
          <div className="section-header">
            <h3>Product Categories</h3>
            <button className="btn btn-primary" onClick={() => setShowNewCategory(true)}>
              <Plus size={16} /> Add Category
            </button>
          </div>
          
          {/* New Category Form */}
          {showNewCategory && (
            <div className="cd-item-form">
              <div className="cd-form-row">
                <div className="cd-form-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Gold Rings"
                    value={newCategory.display_name}
                    onChange={(e) => setNewCategory({ ...newCategory, display_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="cd-form-field">
                  <label>Slug/Key <small>(lowercase, no spaces)</small></label>
                  <input
                    type="text"
                    placeholder="e.g. rings"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="cd-form-row">
                <div className="cd-upload-field">
                  <label className="cd-upload-btn">
                    <Upload size={16} />
                    {uploadingImage === 'new' ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewCategoryImage}
                      style={{ display: 'none' }}
                      disabled={uploadingImage === 'new'}
                    />
                  </label>
                  {newCategory.image && (
                    <img src={newCategory.image} alt="Preview" className="cd-upload-preview" />
                  )}
                </div>
                <label className="cd-checkbox-field">
                  <input
                    type="checkbox"
                    checked={newCategory.is_homepage}
                    onChange={(e) => setNewCategory({ ...newCategory, is_homepage: e.target.checked })}
                  />
                  <span>Show on Homepage</span>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => { setShowNewCategory(false); setNewCategory({ name: '', display_name: '', image: '', is_homepage: true }); }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateCategory} disabled={uploadingImage === 'new'}>
                  <Check size={16} /> Create
                </button>
              </div>
            </div>
          )}
          
          {/* Categories List */}
          <div className="cd-items-grid">
            {categories.map(cat => (
              <div key={cat.id} className="cd-item-card">
                {cat.image ? (
                  <img src={cat.image} alt={cat.display_name || cat.name} className="cd-item-image" />
                ) : (
                  <div className="cd-item-placeholder">
                    <ImageIcon size={32} />
                  </div>
                )}
                
                {editingCategory?.id === cat.id ? (
                  <div className="cd-item-edit">
                    <div className="cd-edit-field">
                      <label>Display Name</label>
                      <input
                        type="text"
                        value={editingCategory.display_name || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, display_name: e.target.value })}
                        className="form-input"
                        placeholder="Display Name"
                      />
                    </div>
                    <div className="cd-edit-field">
                      <label>Slug</label>
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="form-input"
                        placeholder="slug"
                      />
                    </div>
                    <label className="cd-checkbox-inline">
                      <input
                        type="checkbox"
                        checked={editingCategory.is_homepage ?? true}
                        onChange={(e) => setEditingCategory({ ...editingCategory, is_homepage: e.target.checked })}
                      />
                      <span>Homepage</span>
                    </label>
                    <div className="cd-upload-field-edit">
                      <label className="cd-upload-btn-sm">
                        <Upload size={14} />
                        {uploadingImage === editingCategory.id ? '...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditCategoryImage}
                          style={{ display: 'none' }}
                          disabled={uploadingImage === editingCategory.id}
                        />
                      </label>
                      {editingCategory.image && (
                        <img src={editingCategory.image} alt="Preview" className="cd-upload-preview-sm" />
                      )}
                    </div>
                    <div className="cd-edit-actions">
                      <button className="btn-icon" onClick={() => setEditingCategory(null)}>
                        <X size={16} />
                      </button>
                      <button className="btn-icon btn-success" onClick={() => handleUpdateCategory(cat.id)} disabled={uploadingImage === editingCategory.id}>
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cd-item-info">
                      <h4>{cat.display_name || cat.name}</h4>
                      <span className="cd-item-slug">Key: {cat.name}</span>
                      <span className="cd-product-count">
                        {cat.product_count || 0} products
                        {cat.is_homepage && <span className="cd-homepage-badge">🏠</span>}
                      </span>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => setEditingCategory({ ...cat })}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => setDeleteConfirm(cat)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
              <div className="modal-content warning-modal" onClick={e => e.stopPropagation()}>
                <AlertTriangle size={48} className="warning-icon" />
                <h3>Delete Category: {deleteConfirm.name}?</h3>
                <p className="warning-text">
                  This will unlink <strong>{deleteConfirm.product_count || 0} products</strong> from this category.
                  Products will NOT be deleted, but will have no category assigned.
                </p>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteCategory(deleteConfirm.id)}>
                    Delete Category
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="categories-section">
          <div className="section-header">
            <h3>Product Collections</h3>
            <button className="btn btn-primary" onClick={() => setShowNewCollection(true)}>
              <Plus size={16} /> Add Collection
            </button>
          </div>
          
          {/* New Collection Form */}
          {showNewCollection && (
            <div className="cd-item-form">
              <div className="cd-form-row">
                <div className="cd-form-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily Wear"
                    value={newCollection.display_name}
                    onChange={(e) => setNewCollection({ ...newCollection, display_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="cd-form-field">
                  <label>Slug/Key <small>(lowercase, no spaces)</small></label>
                  <input
                    type="text"
                    placeholder="e.g. daily"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="form-input"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Tagline (e.g., Celebrate your special day)"
                value={newCollection.tagline}
                onChange={(e) => setNewCollection({ ...newCollection, tagline: e.target.value })}
                className="form-input"
              />
              <div className="cd-form-row">
                <div className="cd-upload-field">
                  <label className="cd-upload-btn">
                    <Upload size={16} />
                    {uploadingImage === 'new' ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewCollectionImage}
                      style={{ display: 'none' }}
                      disabled={uploadingImage === 'new'}
                    />
                  </label>
                  {newCollection.image && (
                    <img src={newCollection.image} alt="Preview" className="cd-upload-preview" />
                  )}
                </div>
                <label className="cd-checkbox-field">
                  <input
                    type="checkbox"
                    checked={newCollection.is_homepage}
                    onChange={(e) => setNewCollection({ ...newCollection, is_homepage: e.target.checked })}
                  />
                  <span>Show on Homepage</span>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => { setShowNewCollection(false); setNewCollection({ name: '', display_name: '', tagline: '', image: '', is_homepage: true }); }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateCollection} disabled={uploadingImage === 'new'}>
                  <Check size={16} /> Create
                </button>
              </div>
            </div>
          )}
          
          {/* Collections List */}
          <div className="cd-items-grid">
            {collections.map(col => (
              <div key={col.id} className="cd-item-card">
                {col.image ? (
                  <img src={col.image} alt={col.name} className="cd-item-image" />
                ) : (
                  <div className="cd-item-placeholder">
                    <ImageIcon size={32} />
                  </div>
                )}
                
                {editingCollection?.id === col.id ? (
                  <div className="cd-item-edit">
                    <div className="cd-edit-field">
                      <label>Display Name</label>
                      <input
                        type="text"
                        value={editingCollection.display_name || ''}
                        onChange={(e) => setEditingCollection({ ...editingCollection, display_name: e.target.value })}
                        className="form-input"
                        placeholder="Display Name"
                      />
                    </div>
                    <div className="cd-edit-field">
                      <label>Slug</label>
                      <input
                        type="text"
                        value={editingCollection.name}
                        onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="form-input"
                        placeholder="slug"
                      />
                    </div>
                    <input
                      type="text"
                      value={editingCollection.tagline || ''}
                      onChange={(e) => setEditingCollection({ ...editingCollection, tagline: e.target.value })}
                      className="form-input"
                      placeholder="Tagline"
                    />
                    <label className="cd-checkbox-inline">
                      <input
                        type="checkbox"
                        checked={editingCollection.is_homepage ?? true}
                        onChange={(e) => setEditingCollection({ ...editingCollection, is_homepage: e.target.checked })}
                      />
                      <span>Homepage</span>
                    </label>
                    <div className="cd-upload-field-edit">
                      <label className="cd-upload-btn-sm">
                        <Upload size={14} />
                        {uploadingImage === editingCollection.id ? '...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditCollectionImage}
                          style={{ display: 'none' }}
                          disabled={uploadingImage === editingCollection.id}
                        />
                      </label>
                      {editingCollection.image && (
                        <img src={editingCollection.image} alt="Preview" className="cd-upload-preview-sm" />
                      )}
                    </div>
                    <div className="cd-edit-actions">
                      <button className="btn-icon" onClick={() => setEditingCollection(null)}>
                        <X size={16} />
                      </button>
                      <button className="btn-icon btn-success" onClick={() => handleUpdateCollection(col.id)} disabled={uploadingImage === editingCollection.id}>
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cd-item-info">
                      <h4>{col.display_name || col.name}</h4>
                      <span className="cd-item-slug">Key: {col.name}</span>
                      {col.tagline && <p className="cd-item-tagline">{col.tagline}</p>}
                      <span className="cd-product-count">
                        {col.product_count || 0} products
                        {col.is_homepage && <span className="cd-homepage-badge">🏠</span>}
                      </span>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => setEditingCollection({ ...col })}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => setDeleteCollectionConfirm(col)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {/* Delete Confirmation Modal */}
          {deleteCollectionConfirm && (
            <div className="modal-overlay" onClick={() => setDeleteCollectionConfirm(null)}>
              <div className="modal-content warning-modal" onClick={e => e.stopPropagation()}>
                <AlertTriangle size={48} className="warning-icon" />
                <h3>Delete Collection: {deleteCollectionConfirm.name}?</h3>
                <p className="warning-text">
                  This will unlink <strong>{deleteCollectionConfirm.product_count || 0} products</strong> from this collection.
                  Products will NOT be deleted, but will have no collection assigned.
                </p>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setDeleteCollectionConfirm(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteCollection(deleteCollectionConfirm.id)}>
                    Delete Collection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </main>
    </div>
  );
};

export default CommonDetails;
