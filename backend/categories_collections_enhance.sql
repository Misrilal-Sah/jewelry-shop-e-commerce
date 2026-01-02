-- =============================================
-- CATEGORIES & COLLECTIONS ENHANCEMENT
-- Adds display_name and is_homepage fields
-- Run this AFTER common_details_migration.sql
-- =============================================

-- 1. ADD DISPLAY_NAME COLUMN TO CATEGORIES
-- First check if column exists to avoid errors
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'display_name');
SET @sql = IF(@columnExists = 0, 
  'ALTER TABLE categories ADD COLUMN display_name VARCHAR(100) AFTER name', 
  'SELECT "display_name already exists in categories" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. ADD IS_HOMEPAGE COLUMN TO CATEGORIES
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_homepage');
SET @sql = IF(@columnExists = 0, 
  'ALTER TABLE categories ADD COLUMN is_homepage BOOLEAN DEFAULT TRUE AFTER is_active', 
  'SELECT "is_homepage already exists in categories" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. ADD DISPLAY_NAME COLUMN TO COLLECTIONS
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' AND COLUMN_NAME = 'display_name');
SET @sql = IF(@columnExists = 0, 
  'ALTER TABLE collections ADD COLUMN display_name VARCHAR(100) AFTER name', 
  'SELECT "display_name already exists in collections" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. ADD IS_HOMEPAGE COLUMN TO COLLECTIONS
SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' AND COLUMN_NAME = 'is_homepage');
SET @sql = IF(@columnExists = 0, 
  'ALTER TABLE collections ADD COLUMN is_homepage BOOLEAN DEFAULT TRUE AFTER is_active', 
  'SELECT "is_homepage already exists in collections" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================
-- POPULATE DISPLAY_NAME FROM CURRENT NAME
-- Current name is capitalized (Rings, Necklaces, etc.)
-- We'll use it as display_name, then set name = slug (lowercase)
-- =============================================

-- 5. Populate display_name with capitalized name (only where NULL)
UPDATE categories SET display_name = name WHERE display_name IS NULL;
UPDATE collections SET display_name = name WHERE display_name IS NULL;

-- 6. Now set name = slug (lowercase version for filtering)
UPDATE categories SET name = slug WHERE slug IS NOT NULL AND slug != '';
UPDATE collections SET name = slug WHERE slug IS NOT NULL AND slug != '';

-- 7. Verify the data - check current state
SELECT 'CATEGORIES' AS table_name, id, name, display_name, slug, is_homepage FROM categories;
SELECT 'COLLECTIONS' AS table_name, id, name, display_name, slug, is_homepage FROM collections;

SELECT 'Migration completed! Categories and Collections enhanced with display_name and is_homepage fields.' AS status;
