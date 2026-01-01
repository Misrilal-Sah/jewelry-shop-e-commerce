-- Bulk Order Inquiries Table
-- Run this SQL to create the bulk_order_inquiries table

CREATE TABLE IF NOT EXISTS bulk_order_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  category VARCHAR(100),
  quantity INT,
  budget_range VARCHAR(100),
  message TEXT,
  status ENUM('pending', 'contacted', 'quoted', 'closed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
