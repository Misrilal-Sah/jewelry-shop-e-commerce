-- Phase 2 Migrations: Alerts and Notifications System
-- Run this file to add the required tables

-- Product Alerts table (Back in Stock & Price Drop subscriptions)
CREATE TABLE IF NOT EXISTS product_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  alert_type ENUM('back_in_stock', 'price_drop') NOT NULL,
  target_price DECIMAL(12,2) NULL,
  original_price DECIMAL(12,2) NULL,
  is_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_alert (user_id, product_id, alert_type)
);

-- In-App Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  image_url VARCHAR(500),
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Add indexes for better query performance
CREATE INDEX idx_alerts_product ON product_alerts(product_id, alert_type, is_notified);
CREATE INDEX idx_alerts_user ON product_alerts(user_id);
