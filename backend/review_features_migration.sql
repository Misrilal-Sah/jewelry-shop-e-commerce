-- Review Features Migration (Features #19 & #20)
-- Run this SQL to add review photos and helpful voting support

-- Add new columns to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSON DEFAULT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create table for tracking helpful votes (prevents duplicate votes)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (review_id, user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_helpful ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_count ON reviews(helpful_count);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

SELECT 'Review features migration completed!' AS status;
