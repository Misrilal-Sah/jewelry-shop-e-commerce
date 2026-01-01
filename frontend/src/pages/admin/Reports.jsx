import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Mail, Zap,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar,
  ChevronDown, Download, ArrowUpRight, ArrowDownRight, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Admin.css';

const Reports = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalRevenue: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    totalOrders: 0
  });

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [isAuthenticated, user, authLoading, period]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-select')) {
        setPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch sales report
      const salesRes = await fetch(`/api/admin/reports/sales?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (salesRes.ok) {
        const salesResult = await salesRes.json();
        setSalesData(salesResult.sales || []);
        
        // Calculate stats from sales data
        calculateStats(salesResult.sales || []);
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
    const today = now.toISOString().split('T')[0]; // 2025-12-25
    const thisMonth = today.slice(0, 7); // 2025-12
    
    // For today's stats - only works in daily view, otherwise show 0
    const todayData = period === 'daily' 
      ? (sales.find(s => s.period === today) || { orders: 0, revenue: 0 })
      : { orders: 0, revenue: 0 };
    
    // Sum all data for totals
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
    const totalOrders = sales.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
    
    // Week and month calculations depend on period type
    let weekRevenue = 0, weekOrders = 0, monthRevenue = 0, monthOrders = 0;
    
    if (period === 'daily') {
      // Last 7 days for week, last 30 days for month
      const weekData = sales.slice(0, 7);
      const monthData = sales.slice(0, 30);
      weekRevenue = weekData.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      weekOrders = weekData.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
      monthRevenue = monthData.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      monthOrders = monthData.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
    } else if (period === 'monthly') {
      // For monthly view, sum all data
      weekRevenue = totalRevenue;
      weekOrders = totalOrders;
      monthRevenue = totalRevenue;
      monthOrders = totalOrders;
    } else {
      // Weekly view - approximate
      const weekData = sales.slice(0, 1);
      const monthData = sales.slice(0, 4);
      weekRevenue = weekData.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      weekOrders = weekData.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
      monthRevenue = monthData.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
      monthOrders = monthData.reduce((sum, s) => sum + parseInt(s.orders || 0), 0);
    }
    
    setStats({
      todayRevenue: parseFloat(todayData.revenue || 0),
      todayOrders: parseInt(todayData.orders || 0),
      weekRevenue,
      weekOrders,
      monthRevenue,
      monthOrders,
      totalRevenue,
      totalOrders
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

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...salesData.map(s => parseFloat(s.revenue || 0)), 1);

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
          <Link to="/admin/customers" className="nav-item">
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
          <Link to="/admin/reports" className="nav-item active">
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
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Sales performance overview</p>
          </div>
          
          <div className="header-actions">
            {/* Period Selector */}
            <div className="custom-select filter-dropdown">
              <div 
                className={`custom-select-trigger ${periodDropdownOpen ? 'open' : ''}`}
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              >
                <span>{periods.find(p => p.value === period)?.label}</span>
                <ChevronDown size={16} />
              </div>
              {periodDropdownOpen && (
                <div className="custom-select-options">
                  {periods.map(p => (
                    <div 
                      key={p.value}
                      className={`custom-select-option ${period === p.value ? 'selected' : ''}`}
                      onClick={() => {
                        setPeriod(p.value);
                        setPeriodDropdownOpen(false);
                      }}
                    >
                      {p.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button className="btn btn-secondary" onClick={exportToCSV}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Today's Revenue</span>
              <span className="stat-value">{formatCompactPrice(stats.todayRevenue)}</span>
              <span className="stat-orders">{stats.todayOrders} orders</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon weekly">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">This Week</span>
              <span className="stat-value">{formatCompactPrice(stats.weekRevenue)}</span>
              <span className="stat-orders">{stats.weekOrders} orders</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon monthly">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">This Month</span>
              <span className="stat-value">{formatCompactPrice(stats.monthRevenue)}</span>
              <span className="stat-orders">{stats.monthOrders} orders</span>
            </div>
          </div>
          
          <div className="stat-card highlight">
            <div className="stat-icon total">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">{formatCompactPrice(stats.totalRevenue)}</span>
              <span className="stat-orders">{stats.totalOrders} orders</span>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="report-card">
          <div className="report-header">
            <h3><BarChart3 size={18} /> Sales Trend</h3>
            <span className="chart-period">{periods.find(p => p.value === period)?.label} View</span>
          </div>
          
          {loading ? (
            <div className="chart-loading">Loading chart data...</div>
          ) : salesData.length === 0 ? (
            <div className="chart-empty">No sales data available</div>
          ) : (
            <div className="simple-chart">
              <div className="chart-bars">
                {salesData.slice(0, 15).reverse().map((item, index) => (
                  <div key={index} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar"
                      style={{ 
                        height: `${(parseFloat(item.revenue || 0) / maxRevenue) * 100}%`,
                        minHeight: '4px'
                      }}
                      title={`${item.period}: ${formatPrice(item.revenue)} (${item.orders} orders)`}
                    >
                      <span className="bar-tooltip">
                        {formatCompactPrice(item.revenue)}
                      </span>
                    </div>
                    <span className="bar-label">
                      {item.period?.split('-').pop() || index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Sales Table */}
        <div className="report-card">
          <div className="report-header">
            <h3><TrendingUp size={18} /> Recent Sales Data</h3>
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
                  <tr>
                    <td colSpan="4" className="loading-cell">Loading...</td>
                  </tr>
                ) : salesData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">No data available</td>
                  </tr>
                ) : (
                  salesData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="period-cell">
                          <Calendar size={14} />
                          <span>{item.period}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="order-count-badge">{item.orders}</span>
                      </td>
                      <td className="text-right">
                        <span className="total-spent">{formatPrice(item.revenue)}</span>
                      </td>
                      <td className="text-right">
                        <span className="avg-value">
                          {item.orders > 0 ? formatPrice(item.revenue / item.orders) : '₹0'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
