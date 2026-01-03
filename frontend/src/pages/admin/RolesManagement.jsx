import { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit2, Trash2, Save, X, Check, ChevronDown, ChevronUp, Copy,
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Zap, Quote, HelpCircle, 
  FileText, BarChart3, Mail, Settings, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

// Permission categories with their available actions
const PERMISSION_CATEGORIES = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, actions: ['view'] },
  products: { label: 'Products', icon: Package, actions: ['view', 'create', 'edit', 'delete'] },
  orders: { label: 'Orders', icon: ShoppingCart, actions: ['view', 'update_status', 'delete'] },
  customers: { label: 'Customers', icon: Users, actions: ['view', 'edit', 'delete'] },
  coupons: { label: 'Coupons', icon: Tag, actions: ['view', 'create', 'edit', 'delete'] },
  flash_sales: { label: 'Flash Sales', icon: Zap, actions: ['view', 'create', 'edit', 'delete'] },
  bulk_orders: { label: 'Bulk Orders', icon: Package, actions: ['view', 'update_status', 'delete'] },
  testimonials: { label: 'Testimonials', icon: Quote, actions: ['view', 'create', 'edit', 'delete'] },
  faqs: { label: 'FAQs', icon: HelpCircle, actions: ['view', 'create', 'edit', 'delete'] },
  blog: { label: 'Blog', icon: FileText, actions: ['view', 'create', 'edit', 'delete'] },
  reports: { label: 'Reports', icon: BarChart3, actions: ['view'] },
  email: { label: 'Email Center', icon: Mail, actions: ['view', 'send'] },
  users: { label: 'Admin Users', icon: Shield, actions: ['view', 'create', 'edit', 'delete'] },
  common_details: { label: 'Common Details', icon: Settings, actions: ['view', 'edit'] },
  logs: { label: 'Audit Logs', icon: Activity, actions: ['view'] },
  roles: { label: 'Roles & Permissions', icon: Shield, actions: ['view', 'create', 'edit', 'delete'] }
};

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  update_status: 'Update Status',
  send: 'Send'
};

const RolesManagement = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [saving, setSaving] = useState(false);
  
  // New role modal
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', display_name: '', description: '', preset: '' });
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Duplicate role modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState(null);
  const [duplicateRole, setDuplicateRole] = useState({ name: '', display_name: '', description: '' });
  
  // Permission presets
  const [presets, setPresets] = useState({});
  
  // Tab state (roles or templates)
  const [activeTab, setActiveTab] = useState('roles');
  
  // Templates list for management
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplatePermissions, setEditingTemplatePermissions] = useState(null);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', display_name: '', description: '' });
  const [deleteTemplateConfirm, setDeleteTemplateConfirm] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = user?.role_name === 'super_admin';

  useEffect(() => {
    fetchRoles();
    fetchPresets();
    fetchTemplates();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        // Select first role by default
        if (data.roles?.length > 0 && !selectedRole) {
          setSelectedRole(data.roles[0]);
          setEditingPermissions(JSON.parse(JSON.stringify(data.roles[0].permissions)));
        }
      } else if (res.status === 403) {
        toast.error('You do not have permission to manage roles');
      }
    } catch (error) {
      console.error('Fetch roles error:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/admin/roles/presets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets || {});
      }
    } catch (error) {
      console.error('Fetch presets error:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/roles/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditingTemplatePermissions(JSON.parse(JSON.stringify(template.permissions)));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.display_name) {
      toast.error('Name and display name are required');
      return;
    }
    
    try {
      // Get empty permissions template
      const templateRes = await fetch('/api/admin/roles/template', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const templateData = await templateRes.json();
      
      const res = await fetch('/api/admin/roles/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTemplate.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newTemplate.display_name,
          description: newTemplate.description,
          permissions: templateData.template
        })
      });
      
      if (res.ok) {
        toast.success('Template created successfully');
        setShowNewTemplateModal(false);
        setNewTemplate({ name: '', display_name: '', description: '' });
        fetchTemplates();
        fetchPresets();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Create template error:', error);
      toast.error('Failed to create template');
    }
  };

  const handleSaveTemplatePermissions = async () => {
    if (!selectedTemplate || !editingTemplatePermissions) return;
    
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/admin/roles/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: editingTemplatePermissions })
      });
      
      if (res.ok) {
        toast.success('Template updated successfully');
        fetchTemplates();
        fetchPresets();
        setSelectedTemplate(prev => ({ ...prev, permissions: editingTemplatePermissions }));
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const res = await fetch(`/api/admin/roles/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Template deleted successfully');
        setDeleteTemplateConfirm(null);
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setEditingTemplatePermissions(null);
        }
        fetchTemplates();
        fetchPresets();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('Failed to delete template');
    }
  };

  const toggleTemplatePermission = (category, action) => {
    if (!editingTemplatePermissions) return;
    
    setEditingTemplatePermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [action]: !prev[category]?.[action]
      }
    }));
  };

  const toggleAllTemplatePermissions = (category, enabled) => {
    if (!editingTemplatePermissions) return;
    
    const actions = PERMISSION_CATEGORIES[category].actions;
    const newPerms = {};
    actions.forEach(a => { newPerms[a] = enabled; });
    
    setEditingTemplatePermissions(prev => ({
      ...prev,
      [category]: newPerms
    }));
  };

  const hasTemplateChanges = selectedTemplate && editingTemplatePermissions && 
    JSON.stringify(selectedTemplate.permissions) !== JSON.stringify(editingTemplatePermissions);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setEditingPermissions(JSON.parse(JSON.stringify(role.permissions)));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const togglePermission = (category, action) => {
    if (!editingPermissions || selectedRole?.is_system && selectedRole?.name === 'super_admin') return;
    
    setEditingPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [action]: !prev[category]?.[action]
      }
    }));
  };

  const toggleAllInCategory = (category, enable) => {
    if (!editingPermissions || selectedRole?.is_system && selectedRole?.name === 'super_admin') return;
    
    const actions = PERMISSION_CATEGORIES[category].actions;
    setEditingPermissions(prev => ({
      ...prev,
      [category]: Object.fromEntries(actions.map(a => [a, enable]))
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole || !editingPermissions) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: editingPermissions })
      });
      
      if (res.ok) {
        toast.success('Permissions updated successfully');
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Save permissions error:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.display_name) {
      toast.error('Name and display name are required');
      return;
    }
    
    try {
      // Use preset permissions if selected, otherwise get empty template
      let permissions;
      if (newRole.preset && presets[newRole.preset]) {
        permissions = presets[newRole.preset].permissions;
      } else {
        const templateRes = await fetch('/api/admin/roles/template', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const templateData = await templateRes.json();
        permissions = templateData.template;
      }
      
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRole.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: newRole.display_name,
          description: newRole.description,
          permissions,
          can_assign_roles: []
        })
      });
      
      if (res.ok) {
        toast.success('Role created successfully');
        setShowNewRoleModal(false);
        setNewRole({ name: '', display_name: '', description: '', preset: '' });
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to create role');
      }
    } catch (error) {
      console.error('Create role error:', error);
      toast.error('Failed to create role');
    }
  };

  const handleDuplicateRole = async () => {
    if (!duplicateRole.name || !duplicateRole.display_name || !duplicateSource) {
      toast.error('Name and display name are required');
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/roles/${duplicateSource.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: duplicateRole.name,
          display_name: duplicateRole.display_name,
          description: duplicateRole.description
        })
      });
      
      if (res.ok) {
        toast.success('Role duplicated successfully');
        setShowDuplicateModal(false);
        setDuplicateSource(null);
        setDuplicateRole({ name: '', display_name: '', description: '' });
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to duplicate role');
      }
    } catch (error) {
      console.error('Duplicate role error:', error);
      toast.error('Failed to duplicate role');
    }
  };

  const applyPreset = (presetKey) => {
    if (!presets[presetKey] || !selectedRole || selectedRole.name === 'super_admin') return;
    setEditingPermissions(JSON.parse(JSON.stringify(presets[presetKey].permissions)));
    toast.info(`Applied "${presets[presetKey].name}" preset`);
  };

  const handleDeleteRole = async (roleId) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Role deleted successfully');
        setDeleteConfirm(null);
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
          setEditingPermissions(null);
        }
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Delete role error:', error);
      toast.error('Failed to delete role');
    }
  };

  const hasChanges = selectedRole && editingPermissions && 
    JSON.stringify(selectedRole.permissions) !== JSON.stringify(editingPermissions);

  if (!isSuperAdmin) {
    return (
      <div className="roles-no-access">
        <Shield size={48} />
        <h3>Access Restricted</h3>
        <p>Only Super Admin can manage roles and permissions.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="roles-loading">Loading roles...</div>;
  }

  return (
    <div className="roles-management">
      {/* Tab Navigation */}
      <div className="roles-tabs">
        <button 
          className={`roles-tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} /> Roles
        </button>
        <button 
          className={`roles-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={18} /> Permission Templates
        </button>
      </div>

      {activeTab === 'roles' && (
        <>
          {/* Roles List */}
          <div className="roles-sidebar">
            <div className="roles-header">
          <h3>Roles</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowNewRoleModal(true)}>
            <Plus size={16} /> New Role
          </button>
        </div>
        
        <div className="roles-list">
          {roles.map(role => (
            <div 
              key={role.id}
              className={`role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
              onClick={() => handleSelectRole(role)}
            >
              <div className="role-info">
                <span className="role-name">{role.display_name}</span>
                {Boolean(role.is_system) && <span className="role-badge system">System</span>}
              </div>
              <div className="role-actions">
                <button 
                  className="btn-icon"
                  title="Duplicate Role"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setDuplicateSource(role);
                    setDuplicateRole({ 
                      name: '', 
                      display_name: `${role.display_name} Copy`, 
                      description: '' 
                    });
                    setShowDuplicateModal(true);
                  }}
                >
                  <Copy size={14} />
                </button>
                {!Boolean(role.is_system) && (
                  <button 
                    className="btn-icon danger"
                    title="Delete Role"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(role); }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Editor */}
      <div className="permissions-editor">
        {selectedRole ? (
          <>
            <div className="permissions-header">
              <div>
                <h3>{selectedRole.display_name}</h3>
                <p className="role-description">{selectedRole.description || 'No description'}</p>
              </div>
              {hasChanges && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSavePermissions}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            {selectedRole.name === 'super_admin' && (
              <div className="permissions-notice">
                <Shield size={18} />
                <span>Super Admin has full access to all features. Permissions cannot be modified.</span>
              </div>
            )}

            {selectedRole.name !== 'super_admin' && Object.keys(presets).length > 0 && (
              <div className="preset-actions">
                <span className="preset-label">Apply Preset:</span>
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    className="btn btn-sm btn-secondary"
                    onClick={() => applyPreset(key)}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}

            <div className="permissions-grid">
              {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const perms = editingPermissions?.[key] || {};
                const allEnabled = category.actions.every(a => perms[a]);
                const someEnabled = category.actions.some(a => perms[a]);
                const isExpanded = expandedCategories[key];
                const isSuperAdminRole = selectedRole?.name === 'super_admin';

                return (
                  <div key={key} className="permission-category">
                    <div className="category-header" onClick={() => toggleCategory(key)}>
                      <div className="category-left">
                        <Icon size={18} />
                        <span className="category-name">{category.label}</span>
                      </div>
                      <div className="category-right">
                        <div 
                          className={`category-toggle ${allEnabled ? 'all' : someEnabled ? 'some' : 'none'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSuperAdminRole) toggleAllInCategory(key, !allEnabled);
                          }}
                        >
                          {allEnabled ? <Check size={14} /> : someEnabled ? '−' : ''}
                        </div>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="category-actions">
                        {category.actions.map(action => (
                          <label 
                            key={action} 
                            className={`action-checkbox ${isSuperAdminRole ? 'disabled' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={perms[action] || false}
                              onChange={() => togglePermission(key, action)}
                              disabled={isSuperAdminRole}
                            />
                            <span className="checkmark"></span>
                            <span className="action-label">{ACTION_LABELS[action]}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="no-role-selected">
            <Shield size={48} />
            <p>Select a role to view and edit permissions</p>
          </div>
        )}
      </div>

      {/* New Role Modal */}
      {showNewRoleModal && (
        <div className="modal-overlay" onClick={() => setShowNewRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Role</h3>
              <button className="modal-close" onClick={() => setShowNewRoleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Permission Preset</label>
                <select
                  className="preset-dropdown"
                  value={newRole.preset}
                  onChange={e => setNewRole({ ...newRole, preset: e.target.value })}
                >
                  <option value="">Start with no permissions</option>
                  {Object.entries(presets).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role Name (internal)</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., content_manager"
                />
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={newRole.display_name}
                  onChange={e => setNewRole({ ...newRole, display_name: e.target.value })}
                  placeholder="e.g., Content Manager"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newRole.description}
                  onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe what this role can do..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewRoleModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateRole}>
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Role</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the role <strong>{deleteConfirm.display_name}</strong>?</p>
              <p className="text-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteRole(deleteConfirm.id)}>
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Role Modal */}
      {showDuplicateModal && duplicateSource && (
        <div className="modal-overlay" onClick={() => setShowDuplicateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Duplicate Role</h3>
              <button className="modal-close" onClick={() => setShowDuplicateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="permissions-notice" style={{ marginBottom: '1rem' }}>
                <Copy size={18} />
                <span>Creating a copy of <strong>{duplicateSource.display_name}</strong> with the same permissions.</span>
              </div>
              <div className="form-group">
                <label>Role Name (internal)</label>
                <input
                  type="text"
                  value={duplicateRole.name}
                  onChange={e => setDuplicateRole({ ...duplicateRole, name: e.target.value })}
                  placeholder="e.g., content_manager_v2"
                />
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={duplicateRole.display_name}
                  onChange={e => setDuplicateRole({ ...duplicateRole, display_name: e.target.value })}
                  placeholder="e.g., Content Manager v2"
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={duplicateRole.description}
                  onChange={e => setDuplicateRole({ ...duplicateRole, description: e.target.value })}
                  placeholder="Describe what this role can do..."
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDuplicateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleDuplicateRole}>
                <Copy size={16} /> Duplicate Role
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <>
          <div className="roles-sidebar">
            <div className="roles-header">
              <h3>Templates</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowNewTemplateModal(true)}>
                <Plus size={16} /> New Template
              </button>
            </div>
            
            <div className="roles-list">
              {templates.map(template => (
                <div 
                  key={template.id}
                  className={`role-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="role-info">
                    <span className="role-name">{template.display_name}</span>
                    {Boolean(template.is_default) && <span className="role-badge system">Default</span>}
                  </div>
                  <div className="role-actions">
                    <button 
                      className="btn-icon danger"
                      title="Delete Template"
                      onClick={(e) => { e.stopPropagation(); setDeleteTemplateConfirm(template); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="permissions-editor">
            {selectedTemplate ? (
              <>
                <div className="permissions-header">
                  <div>
                    <h3>{selectedTemplate.display_name}</h3>
                    <p className="role-description">{selectedTemplate.description || 'No description'}</p>
                  </div>
                  {hasTemplateChanges && (
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSaveTemplatePermissions}
                      disabled={savingTemplate}
                    >
                      <Save size={16} /> {savingTemplate ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>

                <div className="permissions-grid">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                    const Icon = category.icon;
                    const perms = editingTemplatePermissions?.[key] || {};
                    const allEnabled = category.actions.every(a => perms[a]);
                    const someEnabled = category.actions.some(a => perms[a]);
                    const isExpanded = expandedCategories[key];

                    return (
                      <div key={key} className="permission-category">
                        <div className="category-header" onClick={() => toggleCategory(key)}>
                          <div className="category-left">
                            <Icon size={18} />
                            <span className="category-name">{category.label}</span>
                          </div>
                          <div className="category-right">
                            <label 
                              className="toggle-switch"
                              onClick={e => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={allEnabled}
                                onChange={(e) => toggleAllTemplatePermissions(key, e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="category-actions">
                            {category.actions.map(action => (
                              <label key={action} className="action-checkbox">
                                <input
                                  type="checkbox"
                                  checked={perms[action] || false}
                                  onChange={() => toggleTemplatePermission(key, action)}
                                />
                                <span className="action-label">{ACTION_LABELS[action]}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="no-role-selected">
                <FileText size={48} />
                <p>Select a template to view and edit permissions</p>
              </div>
            )}
          </div>

          {/* New Template Modal */}
          {showNewTemplateModal && (
            <div className="modal-overlay" onClick={() => setShowNewTemplateModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Create New Template</h3>
                  <button className="modal-close" onClick={() => setShowNewTemplateModal(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Template Name (internal)</label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., email_only"
                    />
                  </div>
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={newTemplate.display_name}
                      onChange={e => setNewTemplate({ ...newTemplate, display_name: e.target.value })}
                      placeholder="e.g., Email Only"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newTemplate.description}
                      onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Describe what permissions this template includes..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowNewTemplateModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleCreateTemplate}>
                    Create Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Template Confirmation */}
          {deleteTemplateConfirm && (
            <div className="modal-overlay" onClick={() => setDeleteTemplateConfirm(null)}>
              <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Delete Template</h3>
                  <button className="modal-close" onClick={() => setDeleteTemplateConfirm(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete the template <strong>{deleteTemplateConfirm.display_name}</strong>?</p>
                  <p className="text-warning">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setDeleteTemplateConfirm(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteTemplate(deleteTemplateConfirm.id)}>
                    Delete Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RolesManagement;
