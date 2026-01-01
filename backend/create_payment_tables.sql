-- Payment Gateway Tables
-- Run this SQL to create payment-related tables

-- Payments table - stores all successful payment records
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50),
  method VARCHAR(50),
  bank VARCHAR(100),
  wallet VARCHAR(50),
  vpa VARCHAR(100),
  card_last4 VARCHAR(4),
  card_network VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_payment_id (razorpay_payment_id)
);

-- Refunds table - stores all refund records
CREATE TABLE IF NOT EXISTS refunds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  razorpay_refund_id VARCHAR(100) UNIQUE,
  payment_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id)
);

-- Add Razorpay columns to orders table if they don't exist
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS paid_at DATETIME,
  ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refunded_at DATETIME;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_razorpay_order ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payment ON orders(razorpay_payment_id);
