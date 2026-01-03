-- RBAC (Role-Based Access Control) Database Migration
-- Run this in your MySQL client

-- ============================================
-- 1. CREATE ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSON NOT NULL,
  can_assign_roles JSON,
  is_system BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 2. ADD role_id TO USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN role_id INT;
ALTER TABLE users ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- ============================================
-- 3. INSERT SUPER ADMIN ROLE (is_system = TRUE)
-- ============================================
INSERT INTO roles (name, display_name, description, permissions, can_assign_roles, is_system) VALUES (
  'super_admin',
  'Super Admin',
  'Full system access. Can manage all roles and permissions.',
  JSON_OBJECT(
    'dashboard', JSON_OBJECT('view', true),
    'products', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'orders', JSON_OBJECT('view', true, 'update_status', true, 'delete', true),
    'customers', JSON_OBJECT('view', true, 'edit', true, 'delete', true),
    'coupons', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'flash_sales', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'bulk_orders', JSON_OBJECT('view', true, 'update_status', true, 'delete', true),
    'testimonials', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'faqs', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'blog', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'reports', JSON_OBJECT('view', true),
    'email', JSON_OBJECT('view', true, 'send', true),
    'users', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true),
    'common_details', JSON_OBJECT('view', true, 'edit', true),
    'logs', JSON_OBJECT('view', true),
    'roles', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', true)
  ),
  '["all"]',
  TRUE
);

-- ============================================
-- 4. INSERT DEFAULT STAFF ROLE
-- ============================================
INSERT INTO roles (name, display_name, description, permissions, can_assign_roles, is_system, created_by) VALUES (
  'default_staff',
  'Default Staff',
  'Default role for new admin users. Access to basic content management without delete permissions.',
  JSON_OBJECT(
    'dashboard', JSON_OBJECT('view', true),
    'products', JSON_OBJECT('view', false, 'create', false, 'edit', false, 'delete', false),
    'orders', JSON_OBJECT('view', true, 'update_status', true, 'delete', false),
    'customers', JSON_OBJECT('view', false, 'edit', false, 'delete', false),
    'coupons', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', false),
    'flash_sales', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', false),
    'bulk_orders', JSON_OBJECT('view', true, 'update_status', true, 'delete', false),
    'testimonials', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', false),
    'faqs', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', false),
    'blog', JSON_OBJECT('view', true, 'create', true, 'edit', true, 'delete', false),
    'reports', JSON_OBJECT('view', false),
    'email', JSON_OBJECT('view', false, 'send', false),
    'users', JSON_OBJECT('view', false, 'create', false, 'edit', false, 'delete', false),
    'common_details', JSON_OBJECT('view', false, 'edit', false),
    'logs', JSON_OBJECT('view', false),
    'roles', JSON_OBJECT('view', false, 'create', false, 'edit', false, 'delete', false)
  ),
  '[]',
  TRUE,
  NULL
);

-- ============================================
-- 5. UPDATE EXISTING ADMIN USERS TO SUPER ADMIN
-- ============================================
-- Get the super_admin role id
SET @super_admin_id = (SELECT id FROM roles WHERE name = 'super_admin');

-- Assign super_admin role to all existing admin users
UPDATE users SET role_id = @super_admin_id WHERE role = 'admin';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- SELECT * FROM roles;
-- SELECT id, name, email, role, role_id FROM users WHERE role = 'admin';
-- DESCRIBE roles;
