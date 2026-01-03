import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [roleName, setRoleName] = useState(null);
  const [roleDisplayName, setRoleDisplayName] = useState(null);
  const [canAssignRoles, setCanAssignRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      // Get permissions from user object (set after login)
      if (user.permissions) {
        setPermissions(user.permissions);
        setRoleName(user.role_name);
        setRoleDisplayName(user.role_display_name);
        setCanAssignRoles(user.canAssignRoles || []);
        setLoading(false);
      } else {
        // Fetch permissions from API if not in user object
        fetchPermissions();
      }
    } else {
      setPermissions(null);
      setRoleName(null);
      setRoleDisplayName(null);
      setCanAssignRoles([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
        setRoleName(data.role_name);
        setRoleDisplayName(data.role_display_name);
        setCanAssignRoles(data.canAssignRoles || []);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission for a specific resource and action
  const hasPermission = (resource, action) => {
    // Super admin has all permissions
    if (roleName === 'super_admin') return true;
    
    // While still loading, return true to prevent redirect
    // The loading state will be handled by ProtectedRoute
    if (loading || permissions === null) return true;
    
    const resourcePerms = permissions[resource];
    if (!resourcePerms) return false;
    
    return resourcePerms[action] === true;
  };

  // Check if user can view a specific page
  const canViewPage = (page) => {
    return hasPermission(page, 'view');
  };

  // Check if user can perform an action on a resource
  const canPerformAction = (resource, action) => {
    return hasPermission(resource, action);
  };

  // Get all permissions for a resource
  const getResourcePermissions = (resource) => {
    if (roleName === 'super_admin') {
      return { view: true, create: true, edit: true, delete: true, update_status: true, send: true };
    }
    return permissions?.[resource] || {};
  };

  // Check if user is super admin
  const isSuperAdmin = roleName === 'super_admin';

  // Check if user can assign a specific role
  const canAssignRole = (targetRoleName) => {
    if (isSuperAdmin || canAssignRoles.includes('all')) return true;
    return canAssignRoles.includes(targetRoleName);
  };

  const value = {
    permissions,
    roleName,
    roleDisplayName,
    loading,
    hasPermission,
    canViewPage,
    canPerformAction,
    getResourcePermissions,
    isSuperAdmin,
    canAssignRole,
    canAssignRoles
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Custom hook to use permissions
export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionContext;
