-- Feature #21 & #22 Database Migration
-- Run this script to add wishlist sharing and flash sales tables

-- Wishlist Shares Table (Feature #21)
CREATE TABLE IF NOT EXISTS wishlist_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  share_code VARCHAR(32) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_share_code (share_code),
  INDEX idx_user_id (user_id)
);

-- Flash Sales Table (Feature #22)
CREATE TABLE IF NOT EXISTS flash_sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  flash_price DECIMAL(10,2) NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_quantity INT NULL,
  sold_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_active_time (is_active, start_time, end_time)
);
