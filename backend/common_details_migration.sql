-- =============================================
-- COMMON DETAILS MIGRATION
-- Run this SQL to set up site settings, categories, and collections tables
-- =============================================

-- 1. SITE SETTINGS TABLE
-- Stores key-value pairs for dynamic content (hero, footer, contact, social)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('text', 'textarea', 'url', 'email', 'phone', 'image') DEFAULT 'text',
  category ENUM('hero', 'footer', 'contact', 'social', 'general') NOT NULL,
  label VARCHAR(200),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- SEED INITIAL SITE SETTINGS DATA
-- =============================================

-- Hero Section
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, label, display_order) VALUES
('hero_badge', 'PREMIUM INDIAN JEWELRY', 'text', 'hero', 'Hero Badge Text', 1),
('hero_title', 'Exquisite Jewelry', 'text', 'hero', 'Hero Title (Line 1)', 2),
('hero_title_highlight', 'for Every Occasion', 'text', 'hero', 'Hero Title Highlight (Line 2)', 3),
('hero_description', 'Discover our handcrafted collection of gold, diamond, silver, and platinum jewelry. BIS Hallmarked with lifetime exchange.', 'textarea', 'hero', 'Hero Description', 4);

-- Footer Section
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, label, display_order) VALUES
('footer_description', 'Premium Indian jewelry crafted with love and tradition. Explore our exquisite collection of gold, diamond, silver, and platinum jewelry for every occasion.', 'textarea', 'footer', 'Footer Description', 1);

-- Contact Details
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, label, display_order) VALUES
('contact_phone', '+91 98765 43210', 'phone', 'contact', 'Phone Number', 1),
('contact_email', 'support@Aabhar.in', 'email', 'contact', 'Email Address', 2),
('contact_address', '123 Jewelry Lane, Mumbai, Maharashtra 400001', 'textarea', 'contact', 'Address', 3);

-- Social Media Links
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, label, display_order) VALUES
('social_facebook', 'https://facebook.com/Aabhar', 'url', 'social', 'Facebook URL', 1),
('social_instagram', 'https://instagram.com/Aabhar', 'url', 'social', 'Instagram URL', 2),
('social_twitter', 'https://twitter.com/Aabhar', 'url', 'social', 'Twitter/X URL', 3),
('social_youtube', 'https://youtube.com/Aabhar', 'url', 'social', 'YouTube URL', 4);

-- =============================================
-- SEED EXISTING CATEGORIES FROM PRODUCTS
-- =============================================
INSERT IGNORE INTO categories (name, slug, display_order) 
SELECT DISTINCT category, LOWER(REPLACE(category, ' ', '-')), 
  CASE category
    WHEN 'Rings' THEN 1
    WHEN 'Necklaces' THEN 2
    WHEN 'Earrings' THEN 3
    WHEN 'Bangles' THEN 4
    WHEN 'Bracelets' THEN 5
    WHEN 'Pendants' THEN 6
    ELSE 10
  END
FROM products WHERE category IS NOT NULL AND category != '';

-- =============================================
-- SEED EXISTING COLLECTIONS FROM PRODUCTS
-- =============================================
INSERT IGNORE INTO collections (name, slug, display_order) 
SELECT DISTINCT collection, LOWER(REPLACE(collection, ' ', '-')),
  CASE collection
    WHEN 'Bridal' THEN 1
    WHEN 'Festive' THEN 2
    WHEN 'Daily Wear' THEN 3
    WHEN 'Office Wear' THEN 4
    WHEN 'Party Wear' THEN 5
    ELSE 10
  END
FROM products WHERE collection IS NOT NULL AND collection != '';

-- =============================================
-- ADD category_id AND collection_id TO PRODUCTS
-- =============================================
ALTER TABLE products 
  ADD COLUMN category_id INT NULL AFTER category,
  ADD COLUMN collection_id INT NULL AFTER collection;

-- Link existing products to their category IDs
UPDATE products p
  JOIN categories c ON p.category = c.name
  SET p.category_id = c.id;

-- Link existing products to their collection IDs
UPDATE products p
  JOIN collections co ON p.collection = co.name
  SET p.collection_id = co.id;

-- Add foreign key constraints (optional - comment out if issues)
-- ALTER TABLE products ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
-- ALTER TABLE products ADD CONSTRAINT fk_product_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_collection_id ON products(collection_id);
CREATE INDEX idx_site_settings_category ON site_settings(category);

SELECT 'Migration completed successfully!' AS status;
