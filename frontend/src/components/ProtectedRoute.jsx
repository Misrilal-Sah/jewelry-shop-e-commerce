import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';

/**
 * ProtectedRoute - Wraps admin routes with permission checks
 * @param {string} resource - The resource name (e.g., 'products', 'orders')
 * @param {string} action - The action required (default: 'view')
 * @param {React.ReactNode} children - The component to render if allowed
 * @param {string} redirectTo - Where to redirect if not allowed (default: '/admin')
 */
const ProtectedRoute = ({ 
  children, 
  resource, 
  action = 'view',
  redirectTo = '/admin'
}) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { hasPermission, loading: permLoading } = usePermission();

  // Show loading while checking auth
  if (authLoading || permLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Checking permissions...</div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Not an admin - redirect to home
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Check permission for the resource
  if (resource && !hasPermission(resource, action)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Allowed - render children
  return children;
};

export default ProtectedRoute;
