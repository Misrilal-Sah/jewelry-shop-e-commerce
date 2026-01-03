-- Permission Templates Table
-- Stores dynamic permission presets that can be created/edited/deleted by Super Admin

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
);

-- Insert default templates
INSERT INTO permission_templates (name, display_name, description, permissions, is_default) VALUES
('full_access', 'Full Access', 'All permissions except roles and user management', 
 '{"dashboard":{"view":true},"products":{"view":true,"create":true,"edit":true,"delete":true},"orders":{"view":true,"update_status":true,"delete":true},"customers":{"view":true,"edit":true,"delete":true},"coupons":{"view":true,"create":true,"edit":true,"delete":true},"flash_sales":{"view":true,"create":true,"edit":true,"delete":true},"bulk_orders":{"view":true,"update_status":true,"delete":true},"testimonials":{"view":true,"create":true,"edit":true,"delete":true},"faqs":{"view":true,"create":true,"edit":true,"delete":true},"blog":{"view":true,"create":true,"edit":true,"delete":true},"reports":{"view":true},"email":{"view":true,"send":true},"users":{"view":false,"create":false,"edit":false,"delete":false},"common_details":{"view":true,"edit":true},"logs":{"view":true},"roles":{"view":false,"create":false,"edit":false,"delete":false}}',
 TRUE),

('content_only', 'Content Only', 'Manage blog, FAQs, and testimonials only',
 '{"dashboard":{"view":true},"products":{"view":false,"create":false,"edit":false,"delete":false},"orders":{"view":false,"update_status":false,"delete":false},"customers":{"view":false,"edit":false,"delete":false},"coupons":{"view":false,"create":false,"edit":false,"delete":false},"flash_sales":{"view":false,"create":false,"edit":false,"delete":false},"bulk_orders":{"view":false,"update_status":false,"delete":false},"testimonials":{"view":true,"create":true,"edit":true,"delete":true},"faqs":{"view":true,"create":true,"edit":true,"delete":true},"blog":{"view":true,"create":true,"edit":true,"delete":true},"reports":{"view":false},"email":{"view":false,"send":false},"users":{"view":false,"create":false,"edit":false,"delete":false},"common_details":{"view":false,"edit":false},"logs":{"view":false},"roles":{"view":false,"create":false,"edit":false,"delete":false}}',
 TRUE),

('read_only', 'Read Only', 'View-only access to all sections except users and roles',
 '{"dashboard":{"view":true},"products":{"view":true,"create":false,"edit":false,"delete":false},"orders":{"view":true,"update_status":false,"delete":false},"customers":{"view":true,"edit":false,"delete":false},"coupons":{"view":true,"create":false,"edit":false,"delete":false},"flash_sales":{"view":true,"create":false,"edit":false,"delete":false},"bulk_orders":{"view":true,"update_status":false,"delete":false},"testimonials":{"view":true,"create":false,"edit":false,"delete":false},"faqs":{"view":true,"create":false,"edit":false,"delete":false},"blog":{"view":true,"create":false,"edit":false,"delete":false},"reports":{"view":true},"email":{"view":true,"send":false},"users":{"view":false,"create":false,"edit":false,"delete":false},"common_details":{"view":true,"edit":false},"logs":{"view":true},"roles":{"view":false,"create":false,"edit":false,"delete":false}}',
 TRUE),

('sales_manager', 'Sales Manager', 'Manage orders, customers, coupons, flash sales, bulk orders, and view reports',
 '{"dashboard":{"view":true},"products":{"view":true,"create":false,"edit":false,"delete":false},"orders":{"view":true,"update_status":true,"delete":false},"customers":{"view":true,"edit":true,"delete":false},"coupons":{"view":true,"create":true,"edit":true,"delete":true},"flash_sales":{"view":true,"create":true,"edit":true,"delete":true},"bulk_orders":{"view":true,"update_status":true,"delete":false},"testimonials":{"view":false,"create":false,"edit":false,"delete":false},"faqs":{"view":false,"create":false,"edit":false,"delete":false},"blog":{"view":false,"create":false,"edit":false,"delete":false},"reports":{"view":true},"email":{"view":true,"send":true},"users":{"view":false,"create":false,"edit":false,"delete":false},"common_details":{"view":false,"edit":false},"logs":{"view":false},"roles":{"view":false,"create":false,"edit":false,"delete":false}}',
 TRUE);
