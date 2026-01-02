-- =============================================
-- UPDATE CATEGORIES AND COLLECTIONS WITH IMAGES AND TAGLINES
-- Run this SQL to update existing data
-- =============================================

-- 1. Add tagline column to collections
ALTER TABLE collections ADD COLUMN tagline VARCHAR(255) AFTER name;

-- 2. Update categories with images from homepage
UPDATE categories SET image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/jxyw8vx454t3mnr2q8is.jpg' WHERE LOWER(name) = 'rings';
UPDATE categories SET image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/ygijqk8osfqg10qmlzuu.jpg' WHERE LOWER(name) = 'necklaces';
UPDATE categories SET image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/expgtk7ilimekmrjewg3.jpg' WHERE LOWER(name) = 'earrings';
UPDATE categories SET image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/gycyiwsxjsof0i0meafg.jpg' WHERE LOWER(name) = 'bangles';

-- 3. Update collections with images and taglines
UPDATE collections SET 
  image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/fhlj3efhaafo5amfefyy.jpg',
  tagline = 'Celebrate your special day'
WHERE LOWER(name) = 'wedding';

UPDATE collections SET 
  image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/expgtk7ilimekmrjewg3.jpg',
  tagline = 'Elegance for everyday'
WHERE LOWER(name) = 'daily' OR LOWER(name) = 'daily wear';

UPDATE collections SET 
  image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/gycyiwsxjsof0i0meafg.jpg',
  tagline = 'Shine at every celebration'
WHERE LOWER(name) = 'festive';

UPDATE collections SET 
  tagline = 'Timeless elegance'
WHERE LOWER(name) = 'modern';

SELECT 'Update completed!' AS status;
