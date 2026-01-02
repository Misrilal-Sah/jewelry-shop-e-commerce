import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  BarChart3, AlertTriangle, TrendingUp, IndianRupee, Shield, Mail, Zap, 
  Quote, HelpCircle, FileText, Activity, Settings, PlusCircle, Gift, 
  MessageSquare, Megaphone, Star, Percent, Box
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboardStats();
  }, [isAuthenticated, user, authLoading]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Mock stats for display
  const mockStats = {
    stats: {
      totalOrders: 156,
      totalRevenue: 4850000,
      totalProducts: 48,
      totalCustomers: 234,
      pendingOrders: 12,
      lowStock: 5
    },
    recentOrders: [],
    topProducts: []
  };

  const displayStats = stats || mockStats;

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
          <Link to="/admin" className="nav-item active">
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
          <h1>Dashboard</h1>
          <span className="welcome">Welcome, {user?.name}</span>
        </header>

        {loading ? (
          <div className="loading-grid">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120 }}></div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon revenue">
                  <IndianRupee size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value">{formatPrice(displayStats.stats.totalRevenue)}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orders">
                  <ShoppingCart size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{displayStats.stats.totalOrders}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon products">
                  <Package size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Products</span>
                  <span className="stat-value">{displayStats.stats.totalProducts}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon customers">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Customers</span>
                  <span className="stat-value">{displayStats.stats.totalCustomers}</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="alerts-row">
              {displayStats.stats.pendingOrders > 0 && (
                <div className="alert-card pending">
                  <TrendingUp size={20} />
                  <span>{displayStats.stats.pendingOrders} pending orders need attention</span>
                  <Link to="/admin/orders?status=pending">View</Link>
                </div>
              )}
              {displayStats.stats.lowStock > 0 && (
                <div className="alert-card warning">
                  <AlertTriangle size={20} />
                  <span>{displayStats.stats.lowStock} products running low on stock</span>
                  <Link to="/admin/products?filter=low-stock">View</Link>
                </div>
              )}
            </div>

            {/* Quick Actions - Main */}
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h2><Zap size={20} /> Quick Actions</h2>
              </div>
              <div className="dashboard-actions-grid">
                <Link to="/admin/products/new" className="dashboard-action-item">
                  <div className="dashboard-action-icon add">
                    <PlusCircle size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Add Product</span>
                    <span className="dashboard-action-desc">Create new product listing</span>
                  </div>
                </Link>
                <Link to="/admin/orders" className="dashboard-action-item">
                  <div className="dashboard-action-icon orders">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">View Orders</span>
                    <span className="dashboard-action-desc">Manage customer orders</span>
                  </div>
                </Link>
                <Link to="/admin/products" className="dashboard-action-item">
                  <div className="dashboard-action-icon products">
                    <Package size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">All Products</span>
                    <span className="dashboard-action-desc">View & edit inventory</span>
                  </div>
                </Link>
                <Link to="/admin/customers" className="dashboard-action-item">
                  <div className="dashboard-action-icon customers">
                    <Users size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Customers</span>
                    <span className="dashboard-action-desc">View customer data</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Management & Marketing */}
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h2><Settings size={20} /> Management & Marketing</h2>
              </div>
              <div className="dashboard-actions-grid">
                <Link to="/admin/coupons" className="dashboard-action-item">
                  <div className="dashboard-action-icon coupons">
                    <Percent size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Coupons</span>
                    <span className="dashboard-action-desc">Manage discount codes</span>
                  </div>
                </Link>
                <Link to="/admin/flash-sales" className="dashboard-action-item">
                  <div className="dashboard-action-icon flash">
                    <Zap size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Flash Sales</span>
                    <span className="dashboard-action-desc">Create limited offers</span>
                  </div>
                </Link>
                <Link to="/admin/email" className="dashboard-action-item">
                  <div className="dashboard-action-icon email">
                    <Mail size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Email Center</span>
                    <span className="dashboard-action-desc">Send campaigns</span>
                  </div>
                </Link>
                <Link to="/admin/reports" className="dashboard-action-item">
                  <div className="dashboard-action-icon reports">
                    <BarChart3 size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Reports</span>
                    <span className="dashboard-action-desc">Analytics & insights</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Content Management */}
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h2><FileText size={20} /> Content Management</h2>
              </div>
              <div className="dashboard-actions-grid">
                <Link to="/admin/testimonials" className="dashboard-action-item">
                  <div className="dashboard-action-icon testimonials">
                    <Star size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Testimonials</span>
                    <span className="dashboard-action-desc">Customer reviews</span>
                  </div>
                </Link>
                <Link to="/admin/faqs" className="dashboard-action-item">
                  <div className="dashboard-action-icon faqs">
                    <HelpCircle size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">FAQs</span>
                    <span className="dashboard-action-desc">Manage questions</span>
                  </div>
                </Link>
                <Link to="/admin/blog" className="dashboard-action-item">
                  <div className="dashboard-action-icon blog">
                    <FileText size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Blog</span>
                    <span className="dashboard-action-desc">Write articles</span>
                  </div>
                </Link>
                <Link to="/admin/common-details" className="dashboard-action-item">
                  <div className="dashboard-action-icon settings">
                    <Settings size={24} />
                  </div>
                  <div className="dashboard-action-content">
                    <span className="dashboard-action-title">Site Settings</span>
                    <span className="dashboard-action-desc">Categories & more</span>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
