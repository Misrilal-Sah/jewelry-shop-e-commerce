-- Birthday/Anniversary Email Feature
-- Add date columns and edit tracking to users table

ALTER TABLE users ADD COLUMN birthday DATE DEFAULT NULL;
ALTER TABLE users ADD COLUMN anniversary DATE DEFAULT NULL;
ALTER TABLE users ADD COLUMN birthday_last_edited DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN anniversary_last_edited DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN birthday_edit_count TINYINT DEFAULT 0;
ALTER TABLE users ADD COLUMN anniversary_edit_count TINYINT DEFAULT 0;

-- Index for daily cron to find matching dates efficiently
CREATE INDEX idx_birthday_month_day ON users((MONTH(birthday)), (DAY(birthday)));
CREATE INDEX idx_anniversary_month_day ON users((MONTH(anniversary)), (DAY(anniversary)));
