-- Add product tags columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT FALSE;

-- Update some products with tags for testing
UPDATE products SET is_new = TRUE WHERE id IN (1, 2, 5);
UPDATE products SET is_bestseller = TRUE WHERE id IN (3, 4, 8);
UPDATE products SET is_limited = TRUE WHERE id IN (6, 7);

-- Add gift message column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_message TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_recipient_name VARCHAR(255) DEFAULT NULL;

-- Create saved_for_later table for cart items saved for later
CREATE TABLE IF NOT EXISTS saved_for_later (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    selected_size VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_for_later_user ON saved_for_later(user_id);

SELECT 'Phase 1 database migrations completed successfully!' AS status;
