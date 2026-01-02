-- Testimonial Feature Rework - Database Migration
-- Add user_id, status, and is_homepage columns for customer testimonial submissions

-- Add user_id column to link testimonials to users
ALTER TABLE testimonials ADD COLUMN user_id INT NULL AFTER id;
ALTER TABLE testimonials ADD CONSTRAINT fk_testimonial_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add status column for approval workflow (pending, approved, declined)
ALTER TABLE testimonials ADD COLUMN status ENUM('pending', 'approved', 'declined') DEFAULT 'approved' AFTER is_active;

-- Add is_homepage column to control which approved testimonials show on homepage
ALTER TABLE testimonials ADD COLUMN is_homepage TINYINT(1) DEFAULT 0 AFTER status;

-- Update existing testimonials: if active, mark as approved and show on homepage
UPDATE testimonials SET status = 'approved', is_homepage = 1 WHERE is_active = 1;
UPDATE testimonials SET status = 'declined', is_homepage = 0 WHERE is_active = 0;
