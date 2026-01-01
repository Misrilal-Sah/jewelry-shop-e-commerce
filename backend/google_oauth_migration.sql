-- Google OAuth Migration
-- Add columns for Google Sign-In support

ALTER TABLE users 
  ADD COLUMN google_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN auth_provider ENUM('local', 'google') DEFAULT 'local';

-- Add index for faster Google ID lookups
CREATE INDEX idx_google_id ON users(google_id);
