-- Add metadata column to notifications table for storing coupon data
-- Run this script to update the notifications table

-- Add metadata column (MySQL doesn't support IF NOT EXISTS for ADD COLUMN)
-- If column already exists, this will fail - which is fine
ALTER TABLE notifications ADD COLUMN metadata JSON DEFAULT NULL;

-- Verify the column was added
DESCRIBE notifications;

SELECT 'Notifications table updated with metadata column!' as Status;

