-- Email Control Center Tables
-- Run this SQL to create the required tables

-- Email Campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('newsletter', 'offers', 'festive', 'arrivals', 'custom') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content JSON,
  status ENUM('draft', 'scheduled', 'sent', 'cancelled') DEFAULT 'draft',
  recipient_type ENUM('subscribers', 'registered', 'all') DEFAULT 'subscribers',
  scheduled_at DATETIME,
  sent_at DATETIME,
  recipient_count INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_at)
);

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('newsletter', 'offers', 'festive', 'arrivals', 'custom') NOT NULL,
  subject VARCHAR(255),
  content JSON,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type)
);

-- Insert default templates
INSERT INTO email_templates (name, type, subject, content, is_default) VALUES
('Welcome Newsletter', 'newsletter', 'Welcome to Aabhar Newsletter! 💎', '{"title": "Thank You", "subtitle": "for subscribing", "message": "You''re now part of an exclusive community that appreciates the art of fine jewelry."}', TRUE),
('Special Offers', 'offers', '🎁 Special Offer: {{discount}}% OFF at Aabhar!', '{"discount": "20", "code": "SPARKLE20", "validUntil": "31st December 2024"}', TRUE),
('Festive Greetings', 'festive', '🪔 {{festival}} Greetings from Aabhar!', '{"festival": "Festive Season", "greeting": "Wishing you joy, prosperity, and sparkle!"}', TRUE),
('New Arrivals', 'arrivals', '✨ New Arrivals at Aabhar - Be the First!', '{"products": []}', TRUE);
