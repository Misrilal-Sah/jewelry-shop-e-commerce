-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email)
);
