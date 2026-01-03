import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Tag, Shield, Zap, 
  Settings, Mail, Quote, HelpCircle, FileText, Activity
} from 'lucide-react';
import { usePermission } from '../../context/PermissionContext';

// Navigation items configuration
const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', resource: 'dashboard' },
  { path: '/admin/products', icon: Package, label: 'Products', resource: 'products' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders', resource: 'orders' },
  { path: '/admin/customers', icon: Users, label: 'Customers', resource: 'customers' },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons', resource: 'coupons' },
  { path: '/admin/flash-sales', icon: Zap, label: 'Flash Sales', resource: 'flash_sales' },
  { path: '/admin/bulk-orders', icon: Package, label: 'Bulk Orders', resource: 'bulk_orders' },
  { path: '/admin/testimonials', icon: Quote, label: 'Testimonials', resource: 'testimonials' },
  { path: '/admin/faqs', icon: HelpCircle, label: 'FAQs', resource: 'faqs' },
  { path: '/admin/blog', icon: FileText, label: 'Blog', resource: 'blog' },
  { path: '/admin/reports', icon: BarChart3, label: 'Reports', resource: 'reports' },
  { path: '/admin/users', icon: Shield, label: 'Admin Users', resource: 'users' },
  { path: '/admin/email-center', icon: Mail, label: 'Email Center', resource: 'email' },
  { path: '/admin/common-details', icon: Settings, label: 'Common Details', resource: 'common_details' },
  { path: '/admin/logs', icon: Activity, label: 'Logs', resource: 'logs' }
];

const AdminSidebar = () => {
  const location = useLocation();
  const { canViewPage, loading } = usePermission();

  // Filter nav items based on permissions
  const visibleNavItems = NAV_ITEMS.filter(item => {
    // Always show dashboard
    if (item.resource === 'dashboard') return true;
    // Show item if user can view the resource
    return canViewPage(item.resource);
  });

  if (loading) {
    return (
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="admin-logo">
            <span className="logo-text">Aabhar</span>
            <span className="logo-accent">Admin</span>
          </Link>
        </div>
        <nav className="admin-nav">
          <div className="nav-loading">Loading...</div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="admin-logo">
          <span className="logo-text">Aabhar</span>
          <span className="logo-accent">Admin</span>
        </Link>
      </div>
      <nav className="admin-nav">
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.path === '/admin' 
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path);
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Link to="/" className="back-to-store">← Back to Store</Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
