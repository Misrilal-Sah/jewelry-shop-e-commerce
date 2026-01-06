import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Download, Trash2,
  Activity, AlertCircle, AlertTriangle, Info, Bug,
  Clock, RefreshCw, Filter, Calendar, User, X, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import { useModal } from '../../components/ui/Modal';
import { apiFetch } from '../../config/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';
import './Logs.css';

const Logs = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  const modal = useModal();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('audit');
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(25);
  const [totalAuditLogs, setTotalAuditLogs] = useState(0);
  const [auditFilters, setAuditFilters] = useState({ resourceTypes: [], admins: [] });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditResourceFilter, setAuditResourceFilter] = useState('');
  
  // System logs state
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemPage, setSystemPage] = useState(1);
  const [systemPageSize, setSystemPageSize] = useState(50);
  const [totalSystemLogs, setTotalSystemLogs] = useState(0);
  const [systemStats, setSystemStats] = useState({});
  const [systemLevelFilter, setSystemLevelFilter] = useState('');
  const [systemSearch, setSystemSearch] = useState('');
  
  // Dropdown states
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [resourceDropdownOpen, setResourceDropdownOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Detail modal
  const [viewingLog, setViewingLog] = useState(null);

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE'];
  const levels = ['error', 'warn', 'info', 'debug'];

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPageSizeOpen(false);
        setActionDropdownOpen(false);
        setResourceDropdownOpen(false);
        setLevelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchSystemLogs();
    }
  }, [activeTab]); // Only fetch on tab change - filtering is client-side now

  // Reset page to 1 when filters change
  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditActionFilter, auditResourceFilter]);

  useEffect(() => {
    setSystemPage(1);
  }, [systemSearch, systemLevelFilter]);

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      // Fetch a large batch for client-side filtering
      const params = new URLSearchParams({
        page: 1,
        limit: 1000 // Get all logs for client-side filtering
      });
      
      const res = await apiFetch(`/api/logs/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
        setTotalAuditLogs(data.total);
        setAuditFilters(data.filters);
      }
    } catch (error) {
      console.error('Fetch audit logs error:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    setSystemLoading(true);
    try {
      // Fetch a large batch for client-side filtering
      const params = new URLSearchParams({
        page: 1,
        limit: 1000 // Get all logs for client-side filtering
      });
      
      const res = await apiFetch(`/api/logs/system?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data.logs);
        setTotalSystemLogs(data.total);
        setSystemStats(data.stats || {});
      }
    } catch (error) {
      console.error('Fetch system logs error:', error);
    } finally {
      setSystemLoading(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'audit') {
      setAuditPage(1);
      fetchAuditLogs();
    } else {
      setSystemPage(1);
      fetchSystemLogs();
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await apiFetch(`/api/logs/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Logs exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const handleCleanup = () => {
    modal.confirm(
      'Cleanup Old Logs',
      'Are you sure you want to delete logs older than 30 days? This action cannot be undone.',
      async () => {
        try {
          const res = await apiFetch('/api/logs/cleanup', {
            method: 'DELETE',
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ days: 30 })
          });
          
          if (res.ok) {
            const data = await res.json();
            toast.success(`Cleaned up ${data.auditLogsDeleted + data.systemLogsDeleted} old log entries`);
            fetchAuditLogs();
            fetchSystemLogs();
          }
        } catch (error) {
          toast.error('Failed to cleanup logs');
        }
      }
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'danger',
      LOGIN: 'primary',
      LOGOUT: 'secondary',
      STATUS_CHANGE: 'warning'
    };
    return colors[action] || 'secondary';
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertCircle size={16} />;
      case 'warn': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      case 'debug': return <Bug size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#eab308';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (code) => {
    if (code >= 500) return '#ef4444';
    if (code >= 400) return '#eab308';
    if (code >= 200 && code < 300) return '#22c55e';
    return 'var(--text-secondary)';
  };

  // Client-side filtering for audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = !auditSearch || 
      log.description?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesAction = !auditActionFilter || log.action === auditActionFilter;
    const matchesResource = !auditResourceFilter || log.resource_type === auditResourceFilter;
    return matchesSearch && matchesAction && matchesResource;
  });
  
  // Client-side filtering for system logs
  const filteredSystemLogs = systemLogs.filter(log => {
    const matchesSearch = !systemSearch || 
      log.message?.toLowerCase().includes(systemSearch.toLowerCase()) ||
      log.endpoint?.toLowerCase().includes(systemSearch.toLowerCase());
    const matchesLevel = !systemLevelFilter || log.level === systemLevelFilter;
    return matchesSearch && matchesLevel;
  });
  
  // Paginated data
  const paginatedAuditLogs = filteredAuditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);
  const paginatedSystemLogs = filteredSystemLogs.slice((systemPage - 1) * systemPageSize, systemPage * systemPageSize);
  
  const auditTotalPages = Math.ceil(filteredAuditLogs.length / auditPageSize);
  const systemTotalPages = Math.ceil(filteredSystemLogs.length / systemPageSize);

  if (authLoading) return <div className="admin-layout"><div className="loading">Loading...</div></div>;
  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="admin-layout logs-page">
      {/* Sidebar */}
      <AdminSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="admin-content">
        <div className="admin-header">
          <button 
            className="mobile-menu-toggle-admin"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1><Activity size={24} /> System Logs</h1>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={handleCleanup}>
              <Trash2 size={16} /> Cleanup
            </button>
            <button className="btn btn-ghost" onClick={() => handleExport(activeTab)}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn btn-ghost" onClick={() => activeTab === 'audit' ? fetchAuditLogs() : fetchSystemLogs()}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="email-tabs">
          <button 
            className={`email-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <User size={16} /> Audit Logs
          </button>
          <button 
            className={`email-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Activity size={16} /> System Logs
          </button>
        </div>

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="logs-content">
            {/* Single Row: Search | Actions | Resources | Pagination */}
            <div className="logs-filter-row logs-filter-4col">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by description..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>

              {/* Action Filter */}
              <div className="custom-select audit-filter-select">
                <div 
                  className="custom-select-trigger"
                  onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                >
                  <span>{auditActionFilter || 'All Actions'}</span>
                  <ChevronDown size={14} />
                </div>
                {actionDropdownOpen && (
                  <div className="custom-select-options">
                    <div 
                      className={`custom-select-option ${!auditActionFilter ? 'selected' : ''}`}
                      onClick={() => { setAuditActionFilter(''); setActionDropdownOpen(false); setAuditPage(1); }}
                    >
                      All Actions
                    </div>
                    {actions.map(a => (
                      <div 
                        key={a}
                        className={`custom-select-option ${auditActionFilter === a ? 'selected' : ''}`}
                        onClick={() => { setAuditActionFilter(a); setActionDropdownOpen(false); setAuditPage(1); }}
                        style={{ 
                          color: a === 'CREATE' ? '#22c55e' : 
                                 a === 'UPDATE' ? '#eab308' : 
                                 a === 'DELETE' ? '#ef4444' : 
                                 a === 'LOGIN' ? '#3b82f6' : 
                                 a === 'LOGOUT' ? '#9ca3af' : 
                                 a === 'STATUS_CHANGE' ? '#a855f7' : undefined 
                        }}
                      >
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resource Filter */}
              <div className="custom-select audit-filter-select">
                <div 
                  className="custom-select-trigger"
                  onClick={() => setResourceDropdownOpen(!resourceDropdownOpen)}
                >
                  <span>{auditResourceFilter || 'All Resources'}</span>
                  <ChevronDown size={14} />
                </div>
                {resourceDropdownOpen && (
                  <div className="custom-select-options">
                    <div 
                      className={`custom-select-option ${!auditResourceFilter ? 'selected' : ''}`}
                      onClick={() => { setAuditResourceFilter(''); setResourceDropdownOpen(false); setAuditPage(1); }}
                    >
                      All Resources
                    </div>
                    {auditFilters.resourceTypes.map(r => (
                      <div 
                        key={r}
                        className={`custom-select-option ${auditResourceFilter === r ? 'selected' : ''}`}
                        onClick={() => { setAuditResourceFilter(r); setResourceDropdownOpen(false); setAuditPage(1); }}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="page-size-control">
                <span>Show:</span>
                <div className="custom-select">
                  <div className="custom-select-trigger" onClick={() => setPageSizeOpen(!pageSizeOpen)}>
                    <span>{auditPageSize}</span>
                    <ChevronDown size={14} />
                  </div>
                  {pageSizeOpen && (
                    <div className="custom-select-options">
                      {[10, 25, 50, 100].map(size => (
                        <div key={size} className={`custom-select-option ${auditPageSize === size ? 'selected' : ''}`}
                          onClick={() => { setAuditPageSize(size); setPageSizeOpen(false); setAuditPage(1); }}>
                          {size}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Description</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    <tr><td colSpan="6" className="loading-cell">Loading...</td></tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        <div className="logs-empty-state">
                          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="60" cy="60" r="50" fill="rgba(212, 175, 55, 0.1)" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="2"/>
                            <path d="M45 50H75V80H45V50Z" fill="rgba(212, 175, 55, 0.2)" stroke="#D4AF37" strokeWidth="2"/>
                            <path d="M50 40H80V70" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4 2"/>
                            <circle cx="60" cy="65" r="8" fill="rgba(212, 175, 55, 0.3)"/>
                            <path d="M60 61V69M60 73V75" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M35 85L40 80" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M80 35L85 30" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <h3>No Audit Logs Yet</h3>
                          <p>Admin actions will be recorded here for tracking and accountability.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map(log => (
                      <tr key={log.id}>
                        <td><Clock size={14} style={{opacity: 0.5, marginRight: 4}} />{formatDate(log.created_at)}</td>
                        <td>{log.admin_name || 'System'}</td>
                        <td><span className={`status-badge ${getActionBadge(log.action)}`}>{log.action}</span></td>
                        <td>{log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}</td>
                        <td className="description-cell">{log.description}</td>
                        <td>{log.ip_address || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((auditPage - 1) * auditPageSize) + 1} - {Math.min(auditPage * auditPageSize, filteredAuditLogs.length)} of {filteredAuditLogs.length} logs
                </div>
                <div className="pagination-controls">
                  <button 
                    className="page-btn"
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage(auditPage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: Math.min(5, auditTotalPages) }, (_, i) => {
                    let pageNum;
                    if (auditTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (auditPage <= 3) {
                      pageNum = i + 1;
                    } else if (auditPage >= auditTotalPages - 2) {
                      pageNum = auditTotalPages - 4 + i;
                    } else {
                      pageNum = auditPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn ${auditPage === pageNum ? 'active' : ''}`}
                        onClick={() => setAuditPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="page-btn"
                    disabled={auditPage === auditTotalPages}
                    onClick={() => setAuditPage(auditPage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Logs Tab */}
        {activeTab === 'system' && (
          <div className="logs-content">
            {/* Stats */}
            <div className="log-stats">
              <div className="log-stat error" onClick={() => { setSystemLevelFilter('error'); setSystemPage(1); }}>
                <AlertCircle size={20} />
                <span className="stat-count">{systemStats.levelCounts?.error || 0}</span>
                <span className="stat-label">Errors (24h)</span>
              </div>
              <div className="log-stat warn" onClick={() => { setSystemLevelFilter('warn'); setSystemPage(1); }}>
                <AlertTriangle size={20} />
                <span className="stat-count">{systemStats.levelCounts?.warn || 0}</span>
                <span className="stat-label">Warnings (24h)</span>
              </div>
              <div className="log-stat info" onClick={() => { setSystemLevelFilter('info'); setSystemPage(1); }}>
                <Info size={20} />
                <span className="stat-count">{systemStats.levelCounts?.info || 0}</span>
                <span className="stat-label">Info (24h)</span>
              </div>
              <div className="log-stat debug" onClick={() => { setSystemLevelFilter('debug'); setSystemPage(1); }}>
                <Bug size={20} />
                <span className="stat-count">{systemStats.levelCounts?.debug || 0}</span>
                <span className="stat-label">Debug (24h)</span>
              </div>
            </div>

            {/* Row 1: Search + Level Dropdown + Pagination */}
            <div className="logs-filter-row logs-filter-3col">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by message or endpoint..."
                  value={systemSearch}
                  onChange={(e) => setSystemSearch(e.target.value)}
                />
              </div>

              {/* Level Filter - Centered */}
              <div className="custom-select system-level-filter">
                <div 
                  className="custom-select-trigger"
                  onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
                  style={{ color: systemLevelFilter ? getLevelColor(systemLevelFilter) : undefined }}
                >
                  <span>{systemLevelFilter ? systemLevelFilter.toUpperCase() : 'All Levels'}</span>
                  <ChevronDown size={14} />
                </div>
                {levelDropdownOpen && (
                  <div className="custom-select-options">
                    <div 
                      className={`custom-select-option ${!systemLevelFilter ? 'selected' : ''}`}
                      onClick={() => { setSystemLevelFilter(''); setLevelDropdownOpen(false); setSystemPage(1); }}
                    >
                      All Levels
                    </div>
                    {levels.map(l => (
                      <div 
                        key={l}
                        className={`custom-select-option ${systemLevelFilter === l ? 'selected' : ''}`}
                        onClick={() => { setSystemLevelFilter(l); setLevelDropdownOpen(false); setSystemPage(1); }}
                        style={{ color: getLevelColor(l) }}
                      >
                        {getLevelIcon(l)} {l.toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="page-size-control">
                <span>Show:</span>
                <div className="custom-select">
                  <div className="custom-select-trigger" onClick={() => setPageSizeOpen(!pageSizeOpen)}>
                    <span>{systemPageSize}</span>
                    <ChevronDown size={14} />
                  </div>
                  {pageSizeOpen && (
                    <div className="custom-select-options">
                      {[25, 50, 100, 200].map(size => (
                        <div key={size} className={`custom-select-option ${systemPageSize === size ? 'selected' : ''}`}
                          onClick={() => { setSystemPageSize(size); setPageSizeOpen(false); setSystemPage(1); }}>
                          {size}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Logs Table */}
            <div className="data-table-container">
              <table className="data-table logs-table">
                <thead>
                  <tr>
                    <th style={{width: '140px'}}>Date</th>
                    <th style={{width: '80px'}}>Level</th>
                    <th>Message</th>
                    <th style={{width: '200px'}}>Endpoint</th>
                    <th style={{width: '60px'}}>Status</th>
                    <th style={{width: '70px'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLoading ? (
                    <tr><td colSpan="6" className="loading-cell">Loading...</td></tr>
                  ) : filteredSystemLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        <div className="logs-empty-state">
                          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="60" cy="60" r="50" fill="rgba(212, 175, 55, 0.1)" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="2"/>
                            <path d="M30 75L45 55L55 65L75 40L90 55" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            <circle cx="45" cy="55" r="4" fill="#D4AF37"/>
                            <circle cx="55" cy="65" r="4" fill="#D4AF37"/>
                            <circle cx="75" cy="40" r="4" fill="#D4AF37"/>
                            <circle cx="90" cy="55" r="4" fill="#D4AF37"/>
                            <path d="M35 80H85" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="2" strokeDasharray="4 2"/>
                          </svg>
                          <h3>No System Logs Yet</h3>
                          <p>API requests and system events will be logged here for debugging.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSystemLogs.map(log => (
                      <tr key={log.id} className={`log-row log-${log.level}`}>
                        <td><Clock size={14} style={{opacity: 0.5, marginRight: 4}} />{formatDate(log.created_at)}</td>
                        <td>
                          <span className={`log-level-badge ${log.level}`}>
                            {getLevelIcon(log.level)} {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="message-cell">{log.message}</td>
                        <td className="endpoint-cell">
                          {log.method && <span className={`method-badge ${log.method.toLowerCase()}`}>{log.method}</span>}
                          {log.endpoint}
                        </td>
                        <td style={{ color: getStatusColor(log.status_code) }}>
                          {log.status_code || '-'}
                        </td>
                        <td>{log.response_time ? `${log.response_time}ms` : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {systemTotalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((systemPage - 1) * systemPageSize) + 1} - {Math.min(systemPage * systemPageSize, filteredSystemLogs.length)} of {filteredSystemLogs.length} logs
                </div>
                <div className="pagination-controls">
                  <button 
                    className="page-btn"
                    disabled={systemPage === 1}
                    onClick={() => setSystemPage(systemPage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: Math.min(5, systemTotalPages) }, (_, i) => {
                    let pageNum;
                    if (systemTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (systemPage <= 3) {
                      pageNum = i + 1;
                    } else if (systemPage >= systemTotalPages - 2) {
                      pageNum = systemTotalPages - 4 + i;
                    } else {
                      pageNum = systemPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn ${systemPage === pageNum ? 'active' : ''}`}
                        onClick={() => setSystemPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="page-btn"
                    disabled={systemPage === systemTotalPages}
                    onClick={() => setSystemPage(systemPage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Logs;
