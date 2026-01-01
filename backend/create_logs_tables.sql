-- Logging System Tables
-- Run: mysql -u root -proot aabhar < create_logs_tables.sql

-- Audit Logs: WHO did WHAT (admin actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  admin_name VARCHAR(100),
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE') NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT,
  description TEXT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin (admin_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created (created_at)
);

-- System Logs: CloudWatch-like application logs
CREATE TABLE IF NOT EXISTS system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level ENUM('error', 'warn', 'info', 'debug') NOT NULL,
  message TEXT NOT NULL,
  meta JSON,
  source VARCHAR(100),
  request_id VARCHAR(36),
  user_id INT,
  ip_address VARCHAR(45),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  response_time INT,
  stack_trace TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_created (created_at),
  INDEX idx_request (request_id),
  INDEX idx_endpoint (endpoint)
);
