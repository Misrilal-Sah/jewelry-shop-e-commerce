import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar,
  ChevronDown, Download, ArrowUpRight, ArrowDownRight, Package, Users,
  PieChart, Activity, Award, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useToast } from '../../components/ui/Toast';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../../config/cloudinary';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './Admin.css';
import './Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [stats, setStats] = useState({
    todayRevenue: 0, weekRevenue: 0, monthRevenue: 0, totalRevenue: 0,
    todayOrders: 0, weekOrders: 0, monthOrders: 0, totalOrders: 0
  });

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  // Status colors for donut chart
  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444'
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllReports();
  }, [isAuthenticated, user, authLoading, period]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports in parallel
      const [salesRes, categoryRes, topProductsRes, statusRes] = await Promise.all([
        fetch(`/api/admin/reports/sales?period=${period}`, { headers: { Authorization: `Bearer ${token}` }}),
        fetch('/api/admin/reports/categories', { headers: { Authorization: `Bearer ${token}` }}),
        fetch('/api/admin/reports/top-products', { headers: { Authorization: `Bearer ${token}` }}),
        fetch('/api/admin/reports/order-status', { headers: { Authorization: `Bearer ${token}` }})
      ]);
      
      if (salesRes.ok) {
        const salesResult = await salesRes.json();
        setSalesData(salesResult.sales || []);
        calculateStats(salesResult.sales || []);
      }
      
      if (categoryRes.ok) {
        const categoryResult = await categoryRes.json();
        setCategoryData(categoryResult.categories || []);
      }
      
      if (topProductsRes.ok) {
        const topResult = await topProductsRes.json();
        setTopProducts(topResult.products || []);
      }
      
      if (statusRes.ok) {
        const statusResult = await statusRes.json();
        setOrderStatusData(statusResult.statuses || []);
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sales) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const todayData = period === 'daily' 
      ? (sales.find(s => s.period === today) || { orders: 0, revenue: 0 })
      : { orders: 0, revenue: 0 };
    
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
    const totalOrders = sales.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
    
    let weekRevenue = 0, weekOrders = 0, monthRevenue = 0, monthOrders = 0;
    
    if (period === 'daily') {
      const weekData = sales.slice(0, 7);
      const monthData = sales.slice(0, 30);
      weekRevenue = weekData.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      weekOrders = weekData.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
      monthRevenue = monthData.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      monthOrders = monthData.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
    } else {
      weekRevenue = totalRevenue;
      weekOrders = totalOrders;
      monthRevenue = totalRevenue;
      monthOrders = totalOrders;
    }
    
    setStats({
      todayRevenue: parseFloat(todayData.revenue || 0),
      todayOrders: parseInt(todayData.orders || 0),
      weekRevenue, weekOrders, monthRevenue, monthOrders, totalRevenue, totalOrders
    });
  };

  const formatPrice = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactPrice = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return formatPrice(amount);
  };

  // Format date for display (handles daily YYYY-MM-DD, weekly YYYYWW, monthly YYYY-MM)
  const formatDate = (dateStr, viewPeriod = period) => {
    if (!dateStr) return '-';
    const str = String(dateStr);
    
    try {
      // Weekly: YEARWEEK returns number like 202601 (2026, week 01) - 6 digit pure number
      if (/^\d{6}$/.test(str) && !str.includes('-')) {
        const year = str.slice(0, 4);
        const week = str.slice(4);
        return `Week ${parseInt(week)} (${year})`;
      }
      
      // Monthly: 2025-12 format (exactly YYYY-MM)
      if (/^\d{4}-\d{2}$/.test(str)) {
        const [year, month] = str.split('-');
        const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' });
        return `${monthName} ${year}`;
      }
      
      // Daily: YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const parts = str.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-IN', { 
          day: 'numeric', month: 'short', year: 'numeric' 
        });
      }
      
      // ISO timestamp with T
      if (str.includes('T')) {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
      
      return str;
    } catch {
      return str;
    }
  };

  // Format date for chart axis (short)
  const formatDateShort = (dateStr, viewPeriod = period) => {
    if (!dateStr) return '-';
    const str = String(dateStr);
    
    try {
      // Weekly: YEARWEEK returns number like 202601 - 6 digit pure number
      if (/^\d{6}$/.test(str) && !str.includes('-')) {
        return `W${parseInt(str.slice(4))}`;
      }
      
      // Monthly: 2025-12 format (exactly YYYY-MM)
      if (/^\d{4}-\d{2}$/.test(str)) {
        const [year, month] = str.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' });
      }
      
      // Daily: YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const parts = str.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-IN', { 
          day: 'numeric', month: 'short'
        });
      }
      
      // ISO timestamp with T
      if (str.includes('T')) {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
      }
      
      return str;
    } catch {
      return str;
    }
  };

  const exportToCSV = () => {
    if (!salesData.length) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Period', 'Orders', 'Revenue'];
    const rows = salesData.map(s => [s.period, s.orders, s.revenue]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  // Line Chart Component
  const LineChart = ({ data }) => {
    if (!data.length) return <div className="chart-empty-state"><BarChart3 size={48} /><p>No sales data available</p></div>;
    
    const chartData = [...data].slice(0, 15).reverse();
    const maxRevenue = Math.max(...chartData.map(s => parseFloat(s.revenue || 0)), 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 600;
    const height = 280;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const points = chartData.map((item, i) => ({
      x: padding.left + (i / (chartData.length - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - (parseFloat(item.revenue || 0) / maxRevenue) * chartHeight,
      data: item
    }));
    
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1]?.x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
    
    return (
      <div className="line-chart-container">
        <svg className="line-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line className="chart-grid-line" x1={padding.left} y1={padding.top + ratio * chartHeight} x2={width - padding.right} y2={padding.top + ratio * chartHeight} />
              <text className="chart-axis-label" x={padding.left - 8} y={padding.top + ratio * chartHeight + 4} textAnchor="end">
                {formatCompactPrice(maxRevenue * (1 - ratio))}
              </text>
            </g>
          ))}
          
          {/* Area Fill */}
          <path className="chart-area" d={areaPath} />
          
          {/* Line */}
          <path className="chart-line" d={linePath} />
          
          {/* Data Points */}
          {points.map((point, i) => (
            <circle key={i} className="chart-dot" cx={point.x} cy={point.y} r={4}
              onMouseEnter={() => setHoveredPoint({ ...point, index: i })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
          
          {/* X-axis labels */}
          {chartData.map((item, i) => {
            if (chartData.length > 10 && i % 2 !== 0) return null;
            const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
            return (
              <text key={i} className="chart-axis-label" x={x} y={height - 10} textAnchor="middle">
                {formatDateShort(item.period)}
              </text>
            );
          })}
        </svg>
        
        {hoveredPoint && (
          <div className="chart-tooltip" style={{ left: hoveredPoint.x, top: hoveredPoint.y - 50 }}>
            <div>{formatDate(hoveredPoint.data.period)}</div>
            <div className="chart-tooltip-value">{formatPrice(hoveredPoint.data.revenue)}</div>
            <div>{hoveredPoint.data.orders} orders</div>
          </div>
        )}
      </div>
    );
  };

  // Donut Chart Component
  const DonutChart = ({ data }) => {
    if (!data.length) return <div className="chart-empty-state"><PieChart size={48} /><p>No order data available</p></div>;
    
    const total = data.reduce((sum, s) => sum + parseInt(s.count || 0), 0);
    let cumulativePercent = 0;
    
    const getPath = (percent, offset) => {
      const startAngle = offset * 3.6 * (Math.PI / 180);
      const endAngle = (offset + percent) * 3.6 * (Math.PI / 180);
      const x1 = 50 + 40 * Math.cos(startAngle - Math.PI / 2);
      const y1 = 50 + 40 * Math.sin(startAngle - Math.PI / 2);
      const x2 = 50 + 40 * Math.cos(endAngle - Math.PI / 2);
      const y2 = 50 + 40 * Math.sin(endAngle - Math.PI / 2);
      const largeArc = percent > 50 ? 1 : 0;
      return `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };
    
    return (
      <div className="donut-chart-container">
        <svg className="donut-chart-svg" viewBox="0 0 100 100">
          {data.map((item, i) => {
            const percent = parseFloat(item.percentage || 0);
            const path = getPath(percent, cumulativePercent);
            cumulativePercent += percent;
            return (
              <path key={i} className="donut-segment" d={path} fill={statusColors[item.status] || '#6b7280'}
                style={{ transformOrigin: 'center' }}
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="var(--bg-card)" />
          <text x="50" y="48" textAnchor="middle" className="donut-center-text">{total}</text>
          <text x="50" y="58" textAnchor="middle" className="donut-center-label">Orders</text>
        </svg>
        
        <div className="donut-legend">
          {data.map((item, i) => (
            <div key={i} className="donut-legend-item">
              <span className="donut-legend-color" style={{ background: statusColors[item.status] || '#6b7280' }} />
              <span style={{ textTransform: 'capitalize' }}>{item.status}</span>
              <span className="donut-legend-value">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return <div className="admin-page"><div className="admin-loading">Loading...</div></div>;
  }

  return (
    <div className="admin-page">
      <AdminSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />

      <main className="admin-content">
        <div className="admin-header" style={{ marginBottom: '0px' }}>
          <button 
            className="mobile-menu-toggle-admin"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Comprehensive business insights</p>
          </div>
          
          <div className="header-actions">
            <div className="custom-select filter-dropdown">
              <div className={`custom-select-trigger ${periodDropdownOpen ? 'open' : ''}`}
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}>
                <span>{periods.find(p => p.value === period)?.label}</span>
                <ChevronDown size={16} />
              </div>
              {periodDropdownOpen && (
                <div className="custom-select-options">
                  {periods.map(p => (
                    <div key={p.value} className={`custom-select-option ${period === p.value ? 'selected' : ''}`}
                      onClick={() => { setPeriod(p.value); setPeriodDropdownOpen(false); }}>
                      {p.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button className="btn btn-secondary" onClick={exportToCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="reports-grid">
          {/* Stats Cards */}
          <div className="reports-stats-row">
            <div className="report-stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon revenue"><DollarSign size={24} /></div>
                <span className="stat-card-trend up"><ArrowUpRight size={14} /> 12%</span>
              </div>
              <span className="stat-card-value">{formatCompactPrice(stats.todayRevenue)}</span>
              <span className="stat-card-label">Today's Revenue</span>
              <span className="stat-card-orders"><ShoppingBag size={12} /> {stats.todayOrders} orders</span>
            </div>
            
            <div className="report-stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon weekly"><TrendingUp size={24} /></div>
                <span className="stat-card-trend up"><ArrowUpRight size={14} /> 8%</span>
              </div>
              <span className="stat-card-value">{formatCompactPrice(stats.weekRevenue)}</span>
              <span className="stat-card-label">This Week</span>
              <span className="stat-card-orders"><ShoppingBag size={12} /> {stats.weekOrders} orders</span>
            </div>
            
            <div className="report-stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon monthly"><Calendar size={24} /></div>
                <span className="stat-card-trend up"><ArrowUpRight size={14} /> 15%</span>
              </div>
              <span className="stat-card-value">{formatCompactPrice(stats.monthRevenue)}</span>
              <span className="stat-card-label">This Month</span>
              <span className="stat-card-orders"><ShoppingBag size={12} /> {stats.monthOrders} orders</span>
            </div>
            
            <div className="report-stat-card highlight">
              <div className="stat-card-header">
                <div className="stat-card-icon total"><Award size={24} /></div>
              </div>
              <span className="stat-card-value">{formatCompactPrice(stats.totalRevenue)}</span>
              <span className="stat-card-label">Total Revenue</span>
              <span className="stat-card-orders"><ShoppingBag size={12} /> {stats.totalOrders} orders</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="reports-charts-row">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title"><Activity size={18} /> Revenue Trend</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {periods.find(p => p.value === period)?.label} View
                </span>
              </div>
              {loading ? <div className="chart-empty-state">Loading...</div> : <LineChart data={salesData} />}
            </div>
            
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title"><PieChart size={18} /> Order Status</h3>
              </div>
              {loading ? <div className="chart-empty-state">Loading...</div> : <DonutChart data={orderStatusData} />}
            </div>
          </div>

          {/* Analytics Row */}
          <div className="reports-analytics-row">
            {/* Category Sales */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title"><BarChart3 size={18} /> Top Categories</h3>
              </div>
              {loading ? <div className="chart-empty-state">Loading...</div> : (
                <div className="bar-chart-list">
                  {categoryData.slice(0, 5).map((cat, i) => {
                    const maxRev = Math.max(...categoryData.map(c => parseFloat(c.revenue || 0)), 1);
                    const percent = (parseFloat(cat.revenue || 0) / maxRev) * 100;
                    return (
                      <div key={i} className="bar-chart-item">
                        <div className="bar-chart-item-header">
                          <span className="bar-chart-item-label" style={{ textTransform: 'capitalize' }}>{cat.category}</span>
                          <span className="bar-chart-item-value">{formatCompactPrice(cat.revenue)}</span>
                        </div>
                        <div className="bar-chart-bar-bg">
                          <div className="bar-chart-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {categoryData.length === 0 && <div className="chart-empty-state"><Package size={32} /><p>No category data</p></div>}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title"><Award size={18} /> Top Products</h3>
              </div>
              {loading ? <div className="chart-empty-state">Loading...</div> : (
                <div className="top-products-list">
                  {topProducts.map((product, i) => {
                    // Parse images same way as Products.jsx
                    let firstImage = null;
                    try {
                      const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                      firstImage = imgs && imgs.length > 0 ? imgs[0] : null;
                    } catch {}
                    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                    return (
                      <div key={product.id} className="top-product-item">
                        <span className={`top-product-rank ${rankClass}`}>{i + 1}</span>
                        {firstImage ? (
                          <img src={firstImage} alt="" className="top-product-image" onError={(e) => e.target.src = PLACEHOLDER_IMAGE} />
                        ) : (
                          <img src={PLACEHOLDER_IMAGE} alt="" className="top-product-image" />
                        )}
                        <div className="top-product-info">
                          <div className="top-product-name">{product.name}</div>
                          <div className="top-product-category">{product.category}</div>
                        </div>
                        <div className="top-product-stats">
                          <div className="top-product-sold">{product.total_sold} sold</div>
                          <div className="top-product-revenue">{formatCompactPrice(product.revenue)}</div>
                        </div>
                      </div>
                    );
                  })}
                  {topProducts.length === 0 && <div className="chart-empty-state"><Package size={32} /><p>No product data</p></div>}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title"><Users size={18} /> Quick Insights</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="report-stat-card" style={{ padding: 'var(--space-md)' }}>
                  <span className="stat-card-label">Average Order Value</span>
                  <span className="stat-card-value" style={{ fontSize: '1.25rem' }}>
                    {stats.totalOrders > 0 ? formatCompactPrice(stats.totalRevenue / stats.totalOrders) : '₹0'}
                  </span>
                </div>
                <div className="report-stat-card" style={{ padding: 'var(--space-md)' }}>
                  <span className="stat-card-label">Best Day</span>
                  <span className="stat-card-value" style={{ fontSize: '1.25rem' }}>
                    {salesData.length > 0 ? formatDateShort(salesData.reduce((max, s) => parseFloat(s.revenue || 0) > parseFloat(max.revenue || 0) ? s : max, salesData[0])?.period) : '-'}
                  </span>
                </div>
                <div className="report-stat-card" style={{ padding: 'var(--space-md)' }}>
                  <span className="stat-card-label">Active Categories</span>
                  <span className="stat-card-value" style={{ fontSize: '1.25rem' }}>{categoryData.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="sales-table-card">
            <div className="sales-table-header">
              <h3 className="sales-table-title"><TrendingUp size={18} /> Recent Sales Data</h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th className="text-center">Orders</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="loading-cell">Loading...</td></tr>
                  ) : salesData.length === 0 ? (
                    <tr><td colSpan="4" className="empty-cell">No data available</td></tr>
                  ) : (
                    salesData.slice(0, 10).map((item, i) => (
                      <tr key={i}>
                        <td><div className="period-cell"><Calendar size={14} /><span>{formatDate(item.period)}</span></div></td>
                        <td className="text-center"><span className="order-count-badge">{item.orders}</span></td>
                        <td className="text-right"><span className="total-spent">{formatPrice(item.revenue)}</span></td>
                        <td className="text-right">
                          <span className="avg-value">{item.orders > 0 ? formatPrice(item.revenue / item.orders) : '₹0'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
