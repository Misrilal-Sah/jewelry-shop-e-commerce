-- Change category and collection columns from ENUM to VARCHAR to accept dynamic values
-- Run this migration in your MySQL client

-- Change category from ENUM to VARCHAR
ALTER TABLE products
MODIFY COLUMN category VARCHAR(100) NOT NULL;

-- Change collection from ENUM to VARCHAR (with default)
ALTER TABLE products
MODIFY COLUMN collection VARCHAR(100) DEFAULT 'daily';

-- Verify the changes
DESCRIBE products;

-- EXPECTED RESULT:
-- category should now be VARCHAR(100) NOT NULL
-- collection should now be VARCHAR(100) DEFAULT 'daily'
