-- User Preferences Table for storing keyboard shortcuts and other settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  shortcuts_enabled BOOLEAN DEFAULT TRUE,
  custom_shortcuts JSON DEFAULT NULL,
  theme_preference VARCHAR(20) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
