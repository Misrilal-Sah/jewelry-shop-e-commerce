import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Mail, Plus, Edit2, Trash2, Search, X, ChevronDown, ChevronLeft, ChevronRight, 
  ChevronUp, Send, Calendar, Clock, Eye, FileText, UserCheck, RefreshCw,
  AlertTriangle, ChevronsUpDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';

const EmailCenter = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard stats
  const [stats, setStats] = useState({
    subscribers: 0,
    campaigns: { total: 0, sent: 0, scheduled: 0, drafts: 0 },
    recentCampaigns: []
  });
  
  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignPageSize, setCampaignPageSize] = useState(10);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [campaignPageSizeOpen, setCampaignPageSizeOpen] = useState(false);
  const [campaignSortField, setCampaignSortField] = useState('created_at');
  const [campaignSortOrder, setCampaignSortOrder] = useState('DESC');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [debouncedCampaignSearch, setDebouncedCampaignSearch] = useState('');
  
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  
  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscriberPageSize, setSubscriberPageSize] = useState(10);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberPageSizeOpen, setSubscriberPageSizeOpen] = useState(false);
  const [subscriberSortField, setSubscriberSortField] = useState('subscribed_at');
  const [subscriberSortOrder, setSubscriberSortOrder] = useState('DESC');
  const [subscriberTypeFilter, setSubscriberTypeFilter] = useState('all');
  const [subscriberTypeFilterOpen, setSubscriberTypeFilterOpen] = useState(false);
  
  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [campaignToSend, setCampaignToSend] = useState(null);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [campaignPreviewMode, setCampaignPreviewMode] = useState(false);
  const [campaignPreviewHtml, setCampaignPreviewHtml] = useState('');
  const [showViewCampaignModal, setShowViewCampaignModal] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState(null);
  
  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'newsletter',
    subject: '',
    content: {
      discount: '20',
      code: 'SPARKLE20',
      validUntil: '',
      festival: '',
      greeting: ''
    },
    scheduled_at: '',
    recipient_type: 'subscribers'
  });
  
  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false);

  const campaignTypes = [
    { value: 'newsletter', label: 'Newsletter', icon: '📧' },
    { value: 'offers', label: 'Special Offers', icon: '🎁' },
    { value: 'festive', label: 'Festive Greetings', icon: '🪔' },
    { value: 'arrivals', label: 'New Arrivals', icon: '✨' }
  ];

  const recipientTypes = [
    { value: 'subscribers', label: 'Newsletter Subscribers', icon: '📬', desc: 'Users who subscribed to newsletter' },
    { value: 'registered', label: 'Registered Users', icon: '👤', desc: 'Users with accounts' },
    { value: 'all', label: 'All Recipients', icon: '👥', desc: 'Both subscribers and registered users' }
  ];

  const subscriberFilterTypes = [
    { value: 'all', label: 'All', icon: '👥' },
    { value: 'registered', label: 'Registered', icon: '👤' },
    { value: 'newsletter_only', label: 'Non Registered', icon: '📬' }
  ];

  const statusColors = {
    draft: 'status-pending',
    scheduled: 'status-processing',
    sent: 'status-delivered',
    cancelled: 'status-cancelled'
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'subscribers') fetchSubscribers();
  }, [activeTab, campaignPage, campaignPageSize, campaignSortField, campaignSortOrder, debouncedCampaignSearch, subscriberPage, subscriberPageSize, subscriberSearch, subscriberSortField, subscriberSortOrder, subscriberTypeFilter]);

  // Debounce campaign search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCampaignSearch(campaignSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [campaignSearch]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setCampaignPageSizeOpen(false);
        setSubscriberPageSizeOpen(false);
        setTypeDropdownOpen(false);
        setRecipientDropdownOpen(false);
        setSubscriberTypeFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/email/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const res = await fetch(
        `/api/admin/email/campaigns?page=${campaignPage}&limit=${campaignPageSize}&sortBy=${campaignSortField}&sortOrder=${campaignSortOrder}&search=${debouncedCampaignSearch}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns);
        setTotalCampaigns(data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleCampaignSort = (field) => {
    if (campaignSortField === field) {
      setCampaignSortOrder(campaignSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setCampaignSortField(field);
      setCampaignSortOrder('DESC');
    }
    setCampaignPage(1);
  };

  const getCampaignSortIcon = (field) => {
    if (campaignSortField !== field) return <ChevronsUpDown size={14} />;
    return campaignSortOrder === 'ASC' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await fetch('/api/admin/email/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setSubscribersLoading(true);
      const res = await fetch(
        `/api/admin/email/subscribers?page=${subscriberPage}&limit=${subscriberPageSize}&search=${subscriberSearch}&sortBy=${subscriberSortField}&sortOrder=${subscriberSortOrder}&type=${subscriberTypeFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers);
        setTotalSubscribers(data.pagination.total);
      }
    } catch (error) {
      console.error('Fetch subscribers error:', error);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const handleSubscriberSort = (field) => {
    if (subscriberSortField === field) {
      setSubscriberSortOrder(subscriberSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSubscriberSortField(field);
      setSubscriberSortOrder('DESC');
    }
    setSubscriberPage(1);
  };

  const getSortIcon = (field) => {
    if (subscriberSortField !== field) return <ChevronsUpDown size={14} />;
    return subscriberSortOrder === 'ASC' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject) {
      toast.error('Name and subject are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Campaign created successfully');
        setShowCampaignModal(false);
        resetCampaignForm();
        fetchCampaigns();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  const handleCreateAndSend = async () => {
    if (!campaignForm.name || !campaignForm.subject) {
      toast.error('Name and subject are required');
      return;
    }

    try {
      // First create the campaign
      const createRes = await fetch('/api/admin/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });
      const createData = await createRes.json();
      
      if (!createRes.ok) {
        toast.error(createData.message);
        return;
      }

      // Then send it immediately
      setShowCampaignModal(false);
      setShowLoadingModal(true);

      const sendRes = await fetch(`/api/admin/email/campaigns/${createData.campaign.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const sendData = await sendRes.json();

      setShowLoadingModal(false);

      if (sendRes.ok) {
        setSuccessMessage(`Campaign created and sent to ${sendData.sentCount} subscribers!`);
        setShowSuccessModal(true);
        resetCampaignForm();
        fetchCampaigns();
        fetchStats();
      } else {
        toast.error(sendData.message);
      }
    } catch (error) {
      setShowLoadingModal(false);
      toast.error('Failed to create and send campaign');
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;

    try {
      const res = await fetch(`/api/admin/email/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Campaign updated successfully');
        setShowCampaignModal(false);
        setEditingCampaign(null);
        resetCampaignForm();
        fetchCampaigns();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignToSend) return;

    setShowSendConfirmModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaignToSend.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      setShowLoadingModal(false);

      if (res.ok) {
        setSuccessMessage(`Campaign sent to ${data.sentCount} subscribers!`);
        setShowSuccessModal(true);
        fetchCampaigns();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      setShowLoadingModal(false);
      toast.error('Failed to send campaign');
    } finally {
      setCampaignToSend(null);
    }
  };

  const handleScheduleCampaign = async (campaignId, scheduledAt) => {
    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scheduled_at: scheduledAt })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Campaign scheduled successfully');
        fetchCampaigns();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to schedule campaign');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const endpoint = deleteType === 'campaign' 
        ? `/api/admin/email/campaigns/${itemToDelete.id}`
        : `/api/admin/email/subscribers/${itemToDelete.id}`;
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        if (deleteType === 'campaign') {
          fetchCampaigns();
          fetchStats();
        } else {
          fetchSubscribers();
          fetchStats();
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType('');
    }
  };

  const handlePreviewTemplate = async (templateId) => {
    try {
      const res = await fetch(`/api/admin/email/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      
      if (res.ok) {
        // Inject custom scrollbar CSS into the preview HTML
        const scrollbarCSS = `
          <style>
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #d4af37, #b7953f); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #e5c158, #d4af37); }
            html { scrollbar-width: thin; scrollbar-color: #d4af37 #1a1a1a; }
          </style>
        `;
        const htmlWithScrollbar = data.html.replace('</head>', scrollbarCSS + '</head>');
        setPreviewHtml(htmlWithScrollbar);
        setShowPreviewModal(true);
      } else {
        toast.error('Failed to load preview');
      }
    } catch (error) {
      toast.error('Failed to load preview');
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      type: 'newsletter',
      subject: '',
      content: {
        discount: '20',
        code: 'SPARKLE20',
        validUntil: '',
        festival: '',
        greeting: ''
      },
      scheduled_at: '',
      recipient_type: 'subscribers'
    });
    setCampaignPreviewMode(false);
    setCampaignPreviewHtml('');
  };

  const handlePreviewCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject) {
      toast.error('Name and subject are required for preview');
      return;
    }

    try {
      // Generate preview HTML based on campaign type
      const res = await fetch(`/api/admin/email/templates/preview-by-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: campaignForm.type,
          content: campaignForm.content
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Inject custom scrollbar CSS
        const scrollbarCSS = `
          <style>
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #d4af37, #b7953f); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #e5c158, #d4af37); }
            html { scrollbar-width: thin; scrollbar-color: #d4af37 #1a1a1a; }
          </style>
        `;
        const htmlWithScrollbar = data.html.replace('</head>', scrollbarCSS + '</head>');
        setCampaignPreviewHtml(htmlWithScrollbar);
        setCampaignPreviewMode(true);
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  };

  const handleBackToForm = () => {
    setCampaignPreviewMode(false);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    const content = typeof campaign.content === 'string' 
      ? JSON.parse(campaign.content) 
      : campaign.content || {};
    setCampaignForm({
      name: campaign.name,
      type: campaign.type,
      subject: campaign.subject,
      content,
      scheduled_at: campaign.scheduled_at || '',
      recipient_type: campaign.recipient_type || 'subscribers'
    });
    setCampaignPreviewMode(false);
    setShowCampaignModal(true);
  };

  const openSendConfirm = (campaign) => {
    setCampaignToSend(campaign);
    setShowSendConfirmModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalCampaignPages = Math.ceil(totalCampaigns / campaignPageSize);
  const totalSubscriberPages = Math.ceil(totalSubscribers / subscriberPageSize);

  if (authLoading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>Email Center</h1>
          <div className="header-actions">
            <span className="header-count">{stats.subscribers} subscribers</span>
            {activeTab === 'campaigns' && (
              <button className="btn btn-primary" onClick={() => {
                resetCampaignForm();
                setEditingCampaign(null);
                setShowCampaignModal(true);
              }}>
                <Plus size={18} /> New Campaign
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="email-tabs">
          <button 
            className={`email-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button 
            className={`email-tab ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <Send size={16} /> Campaigns
          </button>
          <button 
            className={`email-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={16} /> Templates
          </button>
          <button 
            className={`email-tab ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribers')}
          >
            <UserCheck size={16} /> Subscribers
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="email-dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><UserCheck size={24} /></div>
                <div className="stat-info">
                  <span className="stat-value">{stats.subscribers}</span>
                  <span className="stat-label">Total Subscribers</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Send size={24} /></div>
                <div className="stat-info">
                  <span className="stat-value">{stats.campaigns?.sent || 0}</span>
                  <span className="stat-label">Campaigns Sent</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Clock size={24} /></div>
                <div className="stat-info">
                  <span className="stat-value">{stats.campaigns?.scheduled || 0}</span>
                  <span className="stat-label">Scheduled</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FileText size={24} /></div>
                <div className="stat-info">
                  <span className="stat-value">{stats.campaigns?.drafts || 0}</span>
                  <span className="stat-label">Drafts</span>
                </div>
              </div>
            </div>

            <div className="recent-campaigns-section">
              <h3>Recent Campaigns</h3>
              {stats.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                <div className="recent-campaigns-list">
                  {stats.recentCampaigns.map(campaign => (
                    <div key={campaign.id} className="recent-campaign-item">
                      <div className="campaign-type-icon">
                        {campaignTypes.find(t => t.value === campaign.type)?.icon || '📧'}
                      </div>
                      <div className="campaign-info">
                        <strong>{campaign.name}</strong>
                        <span>{campaign.subject}</span>
                      </div>
                      <span className={`status-badge ${statusColors[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No campaigns yet. Create your first campaign!</p>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="campaigns-section">
            <div className="admin-toolbar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                />
              </div>
              <div className="toolbar-controls">
                <div className="page-size-control">
                  <span>Show:</span>
                  <div className="custom-select">
                    <div 
                      className={`custom-select-trigger ${campaignPageSizeOpen ? 'open' : ''}`}
                      onClick={() => setCampaignPageSizeOpen(!campaignPageSizeOpen)}
                    >
                      <span>{campaignPageSize}</span>
                      <ChevronDown size={16} className={`select-arrow ${campaignPageSizeOpen ? 'rotated' : ''}`} />
                    </div>
                    {campaignPageSizeOpen && (
                      <div className="custom-select-options">
                        {[10, 20, 30, 50].map(size => (
                          <div 
                            key={size}
                            className={`custom-select-option ${campaignPageSize === size ? 'selected' : ''}`}
                            onClick={() => {
                              setCampaignPageSize(size);
                              setCampaignPage(1);
                              setCampaignPageSizeOpen(false);
                            }}
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={fetchCampaigns}>
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>

            {campaignsLoading ? (
              <div className="loading-state">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <Send size={48} />
                <h3>No Campaigns Yet</h3>
                <p>Create your first email campaign to reach your subscribers.</p>
                <button className="btn btn-primary" onClick={() => setShowCampaignModal(true)}>
                  <Plus size={18} /> Create Campaign
                </button>
              </div>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => handleCampaignSort('name')}>
                          Campaign {getCampaignSortIcon('name')}
                        </th>
                        <th className="sortable" onClick={() => handleCampaignSort('type')}>
                          Type {getCampaignSortIcon('type')}
                        </th>
                        <th>Status</th>
                        <th className="sortable" onClick={() => handleCampaignSort('scheduled_at')}>
                          Scheduled {getCampaignSortIcon('scheduled_at')}
                        </th>
                        <th>Recipients</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(campaign => (
                        <tr key={campaign.id}>
                          <td>
                            <div className="campaign-cell">
                              <strong>{campaign.name}</strong>
                              <span className="campaign-subject">{campaign.subject}</span>
                            </div>
                          </td>
                          <td>
                            <span className="type-badge">
                              {campaignTypes.find(t => t.value === campaign.type)?.icon}{' '}
                              {campaignTypes.find(t => t.value === campaign.type)?.label}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${statusColors[campaign.status]}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td>{formatDate(campaign.scheduled_at)}</td>
                          <td>{campaign.recipient_count || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              {campaign.status === 'sent' && (
                                <button 
                                  className="action-btn view" 
                                  title="View Details"
                                  onClick={() => {
                                    setViewingCampaign(campaign);
                                    setShowViewCampaignModal(true);
                                  }}
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                              {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                <button 
                                  className="action-btn edit" 
                                  title="Edit"
                                  onClick={() => openEditCampaign(campaign)}
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              {campaign.status === 'draft' && (
                                <button 
                                  className="action-btn primary" 
                                  title="Send Now"
                                  onClick={() => openSendConfirm(campaign)}
                                >
                                  <Send size={16} />
                                </button>
                              )}
                              {campaign.status !== 'sent' && (
                                <button 
                                  className="action-btn delete" 
                                  title="Delete"
                                  onClick={() => {
                                    setItemToDelete(campaign);
                                    setDeleteType('campaign');
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalCampaignPages > 1 && (
                  <div className="pagination-container">
                    <div className="pagination-buttons">
                      <button 
                        className="page-btn"
                        disabled={campaignPage === 1}
                        onClick={() => setCampaignPage(campaignPage - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="page-info">
                        Page {campaignPage} of {totalCampaignPages}
                      </span>
                      <button 
                        className="page-btn"
                        disabled={campaignPage === totalCampaignPages}
                        onClick={() => setCampaignPage(campaignPage + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="templates-section">
            {templatesLoading ? (
              <div className="loading-state">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <h3>No Templates</h3>
                <p>Templates will appear here once created.</p>
              </div>
            ) : (
              <div className="templates-grid">
                {templates.map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-icon">
                      {campaignTypes.find(t => t.value === template.type)?.icon || '📧'}
                    </div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <span className="template-type">{template.type}</span>
                      {template.is_default && <span className="default-badge">Default</span>}
                    </div>
                    <div className="template-actions">
                      <button 
                        className="btn btn-ghost"
                        onClick={() => handlePreviewTemplate(template.id)}
                      >
                        <Eye size={16} /> Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="subscribers-section">
            <div className="admin-toolbar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                />
              </div>
              <div className="toolbar-controls">
                <div className="page-size-control">
                  <span>Show:</span>
                  <div className="custom-select">
                    <div 
                      className={`custom-select-trigger ${subscriberPageSizeOpen ? 'open' : ''}`}
                      onClick={() => setSubscriberPageSizeOpen(!subscriberPageSizeOpen)}
                    >
                      <span>{subscriberPageSize}</span>
                      <ChevronDown size={16} className={`select-arrow ${subscriberPageSizeOpen ? 'rotated' : ''}`} />
                    </div>
                    {subscriberPageSizeOpen && (
                      <div className="custom-select-options">
                        {[10, 20, 30, 50].map(size => (
                          <div 
                            key={size}
                            className={`custom-select-option ${subscriberPageSize === size ? 'selected' : ''}`}
                            onClick={() => {
                              setSubscriberPageSize(size);
                              setSubscriberPage(1);
                              setSubscriberPageSizeOpen(false);
                            }}
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="page-size-control">
                  <span>Type:</span>
                  <div className="custom-select">
                    <div 
                      className={`custom-select-trigger ${subscriberTypeFilterOpen ? 'open' : ''}`}
                      onClick={() => setSubscriberTypeFilterOpen(!subscriberTypeFilterOpen)}
                    >
                      <span>
                        {subscriberFilterTypes.find(t => t.value === subscriberTypeFilter)?.icon}{' '}
                        {subscriberFilterTypes.find(t => t.value === subscriberTypeFilter)?.label}
                      </span>
                      <ChevronDown size={16} className={`select-arrow ${subscriberTypeFilterOpen ? 'rotated' : ''}`} />
                    </div>
                    {subscriberTypeFilterOpen && (
                      <div className="custom-select-options">
                        {subscriberFilterTypes.map(filterType => (
                          <div 
                            key={filterType.value}
                            className={`custom-select-option ${subscriberTypeFilter === filterType.value ? 'selected' : ''}`}
                            onClick={() => {
                              setSubscriberTypeFilter(filterType.value);
                              setSubscriberPage(1);
                              setSubscriberTypeFilterOpen(false);
                            }}
                          >
                            {filterType.icon} {filterType.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={fetchSubscribers}>
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>

            {subscribersLoading ? (
              <div className="loading-state">Loading subscribers...</div>
            ) : subscribers.length === 0 ? (
              <div className="empty-state">
                <UserCheck size={48} />
                <h3>No Subscribers</h3>
                <p>Subscribers will appear here when users sign up for your newsletter.</p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => handleSubscriberSort('email')}>
                          Email {getSortIcon('email')}
                        </th>
                        <th className="sortable" onClick={() => handleSubscriberSort('subscribed_at')}>
                          Subscribed On {getSortIcon('subscribed_at')}
                        </th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map(sub => (
                        <tr key={sub.id}>
                          <td>{sub.email}</td>
                          <td>{formatDate(sub.subscribed_at)}</td>
                          <td>
                            <span className={`type-badge ${sub.user_id ? 'registered' : 'newsletter'}`}>
                              {sub.user_id ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${sub.is_active ? 'status-delivered' : 'status-cancelled'}`}>
                              {sub.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="action-btn delete" 
                              title="Remove"
                              onClick={() => {
                                setItemToDelete(sub);
                                setDeleteType('subscriber');
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalSubscriberPages > 1 && (
                  <div className="pagination-container">
                    <div className="page-size-control">
                      <span>Show:</span>
                      <div className="custom-select">
                        <div 
                          className={`custom-select-trigger ${subscriberPageSizeOpen ? 'open' : ''}`}
                          onClick={() => setSubscriberPageSizeOpen(!subscriberPageSizeOpen)}
                        >
                          <span>{subscriberPageSize}</span>
                          <ChevronDown size={16} className={`select-arrow ${subscriberPageSizeOpen ? 'rotated' : ''}`} />
                        </div>
                        {subscriberPageSizeOpen && (
                          <div className="custom-select-options">
                            {[20, 50, 100].map(size => (
                              <div 
                                key={size}
                                className={`custom-select-option ${subscriberPageSize === size ? 'selected' : ''}`}
                                onClick={() => {
                                  setSubscriberPageSize(size);
                                  setSubscriberPage(1);
                                  setSubscriberPageSizeOpen(false);
                                }}
                              >
                                {size}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pagination-buttons">
                      <button 
                        className="page-btn"
                        disabled={subscriberPage === 1}
                        onClick={() => setSubscriberPage(subscriberPage - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="page-info">
                        Page {subscriberPage} of {totalSubscriberPages}
                      </span>
                      <button 
                        className="page-btn"
                        disabled={subscriberPage === totalSubscriberPages}
                        onClick={() => setSubscriberPage(subscriberPage + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Create/Edit Campaign Modal */}
      {showCampaignModal && (
        <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
          <div className="modal-content campaign-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <button className="modal-close" onClick={() => setShowCampaignModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            {/* Form Mode */}
            {!campaignPreviewMode && (
            <div className="modal-body">
              <div className="form-group">
                <label>Campaign Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Diwali Special Offers"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Email Type</label>
                <div className="custom-select">
                  <div 
                    className={`custom-select-trigger ${typeDropdownOpen ? 'open' : ''}`}
                    onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  >
                    <span>
                      {campaignTypes.find(t => t.value === campaignForm.type)?.icon}{' '}
                      {campaignTypes.find(t => t.value === campaignForm.type)?.label}
                    </span>
                    <ChevronDown size={16} className={`select-arrow ${typeDropdownOpen ? 'rotated' : ''}`} />
                  </div>
                  {typeDropdownOpen && (
                    <div className="custom-select-options">
                      {campaignTypes.map(type => (
                        <div 
                          key={type.value}
                          className={`custom-select-option ${campaignForm.type === type.value ? 'selected' : ''}`}
                          onClick={() => {
                            setCampaignForm({...campaignForm, type: type.value});
                            setTypeDropdownOpen(false);
                          }}
                        >
                          {type.icon} {type.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Send To</label>
                <div className="custom-select">
                  <div 
                    className={`custom-select-trigger ${recipientDropdownOpen ? 'open' : ''}`}
                    onClick={() => setRecipientDropdownOpen(!recipientDropdownOpen)}
                  >
                    <span>
                      {recipientTypes.find(t => t.value === campaignForm.recipient_type)?.icon}{' '}
                      {recipientTypes.find(t => t.value === campaignForm.recipient_type)?.label}
                    </span>
                    <ChevronDown size={16} className={`select-arrow ${recipientDropdownOpen ? 'rotated' : ''}`} />
                  </div>
                  {recipientDropdownOpen && (
                    <div className="custom-select-options">
                      {recipientTypes.map(recipient => (
                        <div 
                          key={recipient.value}
                          className={`custom-select-option ${campaignForm.recipient_type === recipient.value ? 'selected' : ''}`}
                          onClick={() => {
                            setCampaignForm({...campaignForm, recipient_type: recipient.value});
                            setRecipientDropdownOpen(false);
                          }}
                        >
                          <div className="recipient-option">
                            <span>{recipient.icon} {recipient.label}</span>
                            <small>{recipient.desc}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Subject Line</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 🎁 Special Offer: 25% OFF this Diwali!"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                />
              </div>

              {/* Type-specific fields */}
              {campaignForm.type === 'offers' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount %</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="20"
                        value={campaignForm.content.discount}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm, 
                          content: {...campaignForm.content, discount: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Promo Code</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="SPARKLE20"
                        value={campaignForm.content.code}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm, 
                          content: {...campaignForm.content, code: e.target.value.toUpperCase()}
                        })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Valid Until</label>
                    <input
                      type="date"
                      className="form-input"
                      value={campaignForm.content.validUntil}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm, 
                        content: {...campaignForm.content, validUntil: e.target.value}
                      })}
                    />
                  </div>
                </>
              )}

              {campaignForm.type === 'festive' && (
                <>
                  <div className="form-group">
                    <label>Festival Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Diwali, Christmas, New Year"
                      value={campaignForm.content.festival}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm, 
                        content: {...campaignForm.content, festival: e.target.value}
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Greeting Message</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      placeholder="Wishing you joy, prosperity, and sparkle!"
                      value={campaignForm.content.greeting}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm, 
                        content: {...campaignForm.content, greeting: e.target.value}
                      })}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={campaignForm.scheduled_at}
                  onChange={(e) => setCampaignForm({...campaignForm, scheduled_at: e.target.value})}
                />
                <p className="form-hint">Leave empty to save as draft, or use Send Instantly in preview</p>
              </div>
            </div>
            )}

            {/* Preview Mode */}
            {campaignPreviewMode && (
              <div className="modal-body preview-body">
                <iframe
                  srcDoc={campaignPreviewHtml}
                  className="email-preview-iframe"
                  title="Campaign Preview"
                />
              </div>
            )}

            <div className="modal-actions">
              {campaignPreviewMode ? (
                <>
                  <button className="btn btn-ghost" onClick={handleBackToForm}>
                    ← Back to Edit
                  </button>
                  {!editingCampaign && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleCreateAndSend}
                    >
                      <Send size={16} /> Send Instantly
                    </button>
                  )}
                  <button 
                    className="btn btn-primary" 
                    onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                  >
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={() => setShowCampaignModal(false)}>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handlePreviewCampaign}
                  >
                    <Eye size={16} /> Preview {editingCampaign ? '& Update' : 'Campaign'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirmModal && campaignToSend && (
        <div className="modal-overlay" onClick={() => setShowSendConfirmModal(false)}>
          <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Campaign</h2>
              <button className="modal-close" onClick={() => setShowSendConfirmModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon-wrapper">
                <Send size={48} />
              </div>
              <p className="confirm-message">
                You are about to send "<strong>{campaignToSend.name}</strong>" to all <strong>{stats.subscribers}</strong> subscribers.
              </p>
              <div className="warning-box">
                <p><strong>⚠️ This action cannot be undone.</strong></p>
                <p>Make sure you have reviewed the email content before sending.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowSendConfirmModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSendCampaign}>
                <Send size={16} /> Send Now
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
            <h2 className="modal-title">Sending Campaign</h2>
            <p className="modal-message">
              Please wait while we send emails to all subscribers...
            </p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content modal-success" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <Send size={48} />
            </div>
            <h2 className="modal-title">Campaign Sent!</h2>
            <p className="modal-message">{successMessage}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this {deleteType}?</p>
              <div className="delete-target">
                <strong>{deleteType === 'campaign' ? itemToDelete.name : itemToDelete.email}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteItem}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Email Preview</h2>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body preview-body">
              <iframe 
                srcDoc={previewHtml}
                title="Email Preview"
                className="email-preview-iframe"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowPreviewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Campaign Details Modal */}
      {showViewCampaignModal && viewingCampaign && (
        <div className="modal-overlay" onClick={() => setShowViewCampaignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Campaign Details</h3>
              <button className="modal-close" onClick={() => setShowViewCampaignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="campaign-details">
                <div className="detail-row">
                  <span className="detail-label">Campaign Name:</span>
                  <span className="detail-value">{viewingCampaign.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">
                    {campaignTypes.find(t => t.value === viewingCampaign.type)?.icon} {campaignTypes.find(t => t.value === viewingCampaign.type)?.label}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{viewingCampaign.subject}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Recipients:</span>
                  <span className="detail-value">
                    {recipientTypes.find(t => t.value === viewingCampaign.recipient_type)?.icon || '👥'} {recipientTypes.find(t => t.value === viewingCampaign.recipient_type)?.label || 'All'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${statusColors[viewingCampaign.status]}`}>
                    {viewingCampaign.status.charAt(0).toUpperCase() + viewingCampaign.status.slice(1)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sent At:</span>
                  <span className="detail-value">{formatDate(viewingCampaign.sent_at)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Recipients Count:</span>
                  <span className="detail-value highlight">{viewingCampaign.recipient_count || 0}</span>
                </div>
                {viewingCampaign.content && (
                  <div className="detail-section">
                    <h4>Content Details</h4>
                    {(() => {
                      const content = typeof viewingCampaign.content === 'string' 
                        ? JSON.parse(viewingCampaign.content) 
                        : viewingCampaign.content;
                      return Object.entries(content).map(([key, value]) => (
                        value && (
                          <div className="detail-row" key={key}>
                            <span className="detail-label">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="detail-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        )
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowViewCampaignModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCenter;
