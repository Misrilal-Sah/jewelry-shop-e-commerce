// Audit Logger Service - Tracks admin actions (who did what)
const pool = require('../config/db');

const logAuditAction = async ({
  adminId,
  adminName,
  action,
  resourceType,
  resourceId = null,
  description,
  oldValue = null,
  newValue = null,
  req = null
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await pool.query(
      `INSERT INTO audit_logs 
       (admin_id, admin_name, action, resource_type, resource_id, description, old_value, new_value, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        adminName,
        action,
        resourceType,
        resourceId,
        description,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent
      ]
    );
    return true;
  } catch (error) {
    console.error('Audit log error:', error);
    return false;
  }
};

// Convenience methods
const auditLogger = {
  create: (adminId, adminName, resourceType, resourceId, description, newValue, req) =>
    logAuditAction({ adminId, adminName, action: 'CREATE', resourceType, resourceId, description, newValue, req }),
  
  update: (adminId, adminName, resourceType, resourceId, description, oldValue, newValue, req) =>
    logAuditAction({ adminId, adminName, action: 'UPDATE', resourceType, resourceId, description, oldValue, newValue, req }),
  
  delete: (adminId, adminName, resourceType, resourceId, description, oldValue, req) =>
    logAuditAction({ adminId, adminName, action: 'DELETE', resourceType, resourceId, description, oldValue, req }),
  
  statusChange: (adminId, adminName, resourceType, resourceId, description, oldValue, newValue, req) =>
    logAuditAction({ adminId, adminName, action: 'STATUS_CHANGE', resourceType, resourceId, description, oldValue, newValue, req }),
  
  login: (adminId, adminName, req) =>
    logAuditAction({ adminId, adminName, action: 'LOGIN', resourceType: 'AUTH', description: `Admin ${adminName} logged in`, req }),
  
  logout: (adminId, adminName, req) =>
    logAuditAction({ adminId, adminName, action: 'LOGOUT', resourceType: 'AUTH', description: `Admin ${adminName} logged out`, req })
};

module.exports = auditLogger;
