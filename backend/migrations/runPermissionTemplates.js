const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  const tableName = 'permission_templates';
  
  try {
    // Check if table exists
    const [tables] = await pool.query(`SHOW TABLES LIKE ?`, [tableName]);
    
    if (tables.length === 0) {
      console.log('📦 Creating permission_templates table...');
      
      // Create table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS permission_templates (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Internal name like "content_only"',
          display_name VARCHAR(100) NOT NULL COMMENT 'Display name like "Content Only"',
          description TEXT COMMENT 'Description of what the preset includes',
          permissions JSON NOT NULL COMMENT 'Permission object matching roles.permissions structure',
          is_default BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a system preset',
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      
      // Insert default templates
      const defaultTemplates = [
        {
          name: 'full_access',
          display_name: 'Full Access',
          description: 'All permissions except roles and user management',
          permissions: {
            dashboard: { view: true },
            products: { view: true, create: true, edit: true, delete: true },
            orders: { view: true, update_status: true, delete: true },
            customers: { view: true, edit: true, delete: true },
            coupons: { view: true, create: true, edit: true, delete: true },
            flash_sales: { view: true, create: true, edit: true, delete: true },
            bulk_orders: { view: true, update_status: true, delete: true },
            testimonials: { view: true, create: true, edit: true, delete: true },
            faqs: { view: true, create: true, edit: true, delete: true },
            blog: { view: true, create: true, edit: true, delete: true },
            reports: { view: true },
            email: { view: true, send: true },
            users: { view: false, create: false, edit: false, delete: false },
            common_details: { view: true, edit: true },
            logs: { view: true },
            roles: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          name: 'content_only',
          display_name: 'Content Only',
          description: 'Manage blog, FAQs, and testimonials only',
          permissions: {
            dashboard: { view: true },
            products: { view: false, create: false, edit: false, delete: false },
            orders: { view: false, update_status: false, delete: false },
            customers: { view: false, edit: false, delete: false },
            coupons: { view: false, create: false, edit: false, delete: false },
            flash_sales: { view: false, create: false, edit: false, delete: false },
            bulk_orders: { view: false, update_status: false, delete: false },
            testimonials: { view: true, create: true, edit: true, delete: true },
            faqs: { view: true, create: true, edit: true, delete: true },
            blog: { view: true, create: true, edit: true, delete: true },
            reports: { view: false },
            email: { view: false, send: false },
            users: { view: false, create: false, edit: false, delete: false },
            common_details: { view: false, edit: false },
            logs: { view: false },
            roles: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          name: 'read_only',
          display_name: 'Read Only',
          description: 'View-only access to all sections except users and roles',
          permissions: {
            dashboard: { view: true },
            products: { view: true, create: false, edit: false, delete: false },
            orders: { view: true, update_status: false, delete: false },
            customers: { view: true, edit: false, delete: false },
            coupons: { view: true, create: false, edit: false, delete: false },
            flash_sales: { view: true, create: false, edit: false, delete: false },
            bulk_orders: { view: true, update_status: false, delete: false },
            testimonials: { view: true, create: false, edit: false, delete: false },
            faqs: { view: true, create: false, edit: false, delete: false },
            blog: { view: true, create: false, edit: false, delete: false },
            reports: { view: true },
            email: { view: true, send: false },
            users: { view: false, create: false, edit: false, delete: false },
            common_details: { view: true, edit: false },
            logs: { view: true },
            roles: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          name: 'sales_manager',
          display_name: 'Sales Manager',
          description: 'Manage orders, customers, coupons, flash sales, bulk orders, and view reports',
          permissions: {
            dashboard: { view: true },
            products: { view: true, create: false, edit: false, delete: false },
            orders: { view: true, update_status: true, delete: false },
            customers: { view: true, edit: true, delete: false },
            coupons: { view: true, create: true, edit: true, delete: true },
            flash_sales: { view: true, create: true, edit: true, delete: true },
            bulk_orders: { view: true, update_status: true, delete: false },
            testimonials: { view: false, create: false, edit: false, delete: false },
            faqs: { view: false, create: false, edit: false, delete: false },
            blog: { view: false, create: false, edit: false, delete: false },
            reports: { view: true },
            email: { view: true, send: true },
            users: { view: false, create: false, edit: false, delete: false },
            common_details: { view: false, edit: false },
            logs: { view: false },
            roles: { view: false, create: false, edit: false, delete: false }
          }
        }
      ];

      for (const template of defaultTemplates) {
        await pool.query(
          `INSERT INTO permission_templates (name, display_name, description, permissions, is_default)
           VALUES (?, ?, ?, ?, TRUE)`,
          [template.name, template.display_name, template.description, JSON.stringify(template.permissions)]
        );
      }
      
      console.log('✅ permission_templates table created with default templates');
    }
  } catch (error) {
    console.error('Migration error:', error.message);
  }
};

module.exports = runMigration;
