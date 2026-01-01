-- RF Customer Segmentation Schema
-- Add these columns to the users table

ALTER TABLE users ADD COLUMN rf_recency TINYINT DEFAULT 0;
ALTER TABLE users ADD COLUMN rf_frequency TINYINT DEFAULT 0;
ALTER TABLE users ADD COLUMN rf_score VARCHAR(3) DEFAULT NULL;
ALTER TABLE users ADD COLUMN customer_segment ENUM('champions','loyal','potential_loyalist','new_customer','at_risk','cant_lose','dormant','others') DEFAULT 'others';
ALTER TABLE users ADD COLUMN last_order_date DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN total_orders INT DEFAULT 0;
ALTER TABLE users ADD COLUMN rf_updated_at DATETIME DEFAULT NULL;

-- Index for segment filtering
CREATE INDEX idx_customer_segment ON users(customer_segment);
