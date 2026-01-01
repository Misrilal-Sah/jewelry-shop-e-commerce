-- Fix product 1 images (it was broken by bad query)
UPDATE products SET images = '["/images/diamond_ring_1766431016790.png"]' WHERE id = 1;

-- Show all products
SELECT id, name, images FROM products;
