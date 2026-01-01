-- Jewelry E-commerce Database Schema (MySQL)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User addresses
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('rings', 'necklaces', 'earrings', 'bangles', 'bridal') NOT NULL,
  collection ENUM('wedding', 'daily', 'festive', 'modern') DEFAULT 'daily',
  metal_type ENUM('gold', 'diamond', 'silver', 'platinum') NOT NULL,
  purity VARCHAR(10),
  weight_grams DECIMAL(10,2) NOT NULL,
  metal_price DECIMAL(12,2) NOT NULL,
  making_charges DECIMAL(12,2) NOT NULL,
  gst_percent DECIMAL(5,2) DEFAULT 3.00,
  gemstone_type VARCHAR(100),
  stock INT DEFAULT 0,
  images JSON,
  sizes JSON,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_item (user_id, product_id, size),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  gst_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled') DEFAULT 'placed',
  payment_method ENUM('upi', 'card', 'netbanking', 'wallet', 'cod') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  shipping_address JSON NOT NULL,
  coupon_code VARCHAR(50),
  discount_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  size VARCHAR(20),
  metal_price DECIMAL(12,2) NOT NULL,
  making_charges DECIMAL(12,2) NOT NULL,
  gst_amount DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@jewelryshop.com', '$2b$10$rQZ5Q5Q5Q5Q5Q5Q5Q5Q5Q.5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'admin');
