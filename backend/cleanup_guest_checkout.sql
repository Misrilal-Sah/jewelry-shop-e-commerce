-- Guest Checkout Cleanup Script
-- Run this SQL to remove all guest checkout related columns and restore original constraints

-- =====================================================
-- 1. ORDERS TABLE CLEANUP
-- =====================================================

-- First, delete any guest orders (if any exist) since they won't have valid user_id
DELETE FROM orders WHERE is_guest = 1;

-- Drop guest checkout columns from orders table
ALTER TABLE orders 
  DROP COLUMN IF EXISTS is_guest,
  DROP COLUMN IF EXISTS guest_name,
  DROP COLUMN IF EXISTS guest_email,
  DROP COLUMN IF EXISTS guest_phone;

-- Ensure user_id is NOT NULL (restore original constraint)
-- First check if there are any NULL user_ids
-- DELETE FROM orders WHERE user_id IS NULL;

-- If user_id was made nullable, restore it to NOT NULL
-- Note: Run this only after ensuring no NULL user_ids exist
-- ALTER TABLE orders MODIFY COLUMN user_id INT NOT NULL;

-- =====================================================
-- 2. VERIFICATION QUERIES
-- =====================================================

-- Check orders table structure
DESCRIBE orders;

-- Check if any NULL user_ids exist
SELECT COUNT(*) as null_user_orders FROM orders WHERE user_id IS NULL;

-- =====================================================
-- NOTES:
-- - Google Sign-in columns (google_id, auth_provider) in users table are KEPT
-- - bulk_order_inquiries table is KEPT
-- =====================================================
