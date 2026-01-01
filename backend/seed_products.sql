-- First, update existing 7 products with multiple images
UPDATE products SET images = '["/images/diamond_ring_1766431016790.png", "/images/gold_ring_detail1_1766493867886.png", "/images/gold_ring_detail2_1766493884476.png"]' WHERE id = 1;
UPDATE products SET images = '["/images/gold_necklace_1766431035052.png", "/images/diamond_necklace1_1766493904235.png"]' WHERE id = 2;
UPDATE products SET images = '["/images/diamond_earrings_1766431051378.png", "/images/pearl_earrings1_1766493923480.png"]' WHERE id = 3;
UPDATE products SET images = '["/images/gold_bangles_1766431083755.png", "/images/gold_bangle_set_1766494051129.png"]' WHERE id = 4;
UPDATE products SET images = '["/images/bridal_set_1766431100145.png", "/images/gold_necklace_1766431035052.png", "/images/diamond_earrings_1766431051378.png", "/images/gold_bangles_1766431083755.png"]' WHERE id = 5;
UPDATE products SET images = '["/images/platinum_ring_1766431115720.png", "/images/gold_ring_detail1_1766493867886.png"]' WHERE id = 6;
UPDATE products SET images = '["/images/silver_anklet_1766431136140.png"]' WHERE id = 7;

-- Add 33 more products
-- Categories: rings, necklaces, earrings, bangles, bridal
-- Collections: wedding, daily, festive, modern
-- Metal types: gold, diamond, silver, platinum

-- Rings (8-12)
INSERT INTO products (name, description, category, collection, metal_type, purity, weight_grams, metal_price, making_charges, gst_percent, images, sizes, rating, review_count, stock, is_featured, is_active) VALUES
('Rose Gold Eternity Band', 'A beautiful rose gold eternity band adorned with sparkling diamonds all around.', 'rings', 'daily', 'gold', '18K', 3.2, 85000, 12000, 3, '["/images/gold_ring_detail1_1766493867886.png", "/images/gold_ring_detail2_1766493884476.png"]', '["5","6","7","8","9"]', 4.7, 89, 15, TRUE, TRUE),
('Mens Gold Signet Ring', 'Classic mens signet ring with personalized engraving option. Solid 22K gold.', 'rings', 'daily', 'gold', '22K', 8.5, 145000, 18000, 3, '["/images/gold_ring_detail1_1766493867886.png"]', '["8","9","10","11","12"]', 4.5, 45, 8, FALSE, TRUE),
('Antique Diamond Cluster Ring', 'Vintage inspired diamond cluster ring with intricate filigree work.', 'rings', 'wedding', 'diamond', '18K', 4.8, 195000, 25000, 3, '["/images/diamond_ring_1766431016790.png", "/images/platinum_ring_1766431115720.png"]', '["5","6","7","8"]', 4.9, 156, 5, TRUE, TRUE),
('Platinum Solitaire Band', 'Elegant platinum band with a single brilliant cut diamond.', 'rings', 'wedding', 'platinum', 'PT950', 5.2, 185000, 22000, 3, '["/images/platinum_ring_1766431115720.png", "/images/diamond_ring_1766431016790.png"]', '["5","6","7","8"]', 4.8, 78, 10, TRUE, TRUE),
('Gold Cocktail Ring', 'Statement gold cocktail ring with semi-precious stones.', 'rings', 'festive', 'gold', '22K', 6.8, 115000, 15000, 3, '["/images/gold_ring_detail1_1766493867886.png", "/images/gold_ring_detail2_1766493884476.png"]', '["6","7","8"]', 4.4, 34, 12, FALSE, TRUE);

-- Necklaces (13-18)
INSERT INTO products (name, description, category, collection, metal_type, purity, weight_grams, metal_price, making_charges, gst_percent, images, sizes, rating, review_count, stock, is_featured, is_active) VALUES
('Diamond Tennis Necklace', 'Exquisite tennis necklace featuring premium quality round brilliant diamonds.', 'necklaces', 'wedding', 'diamond', '18K', 25.0, 850000, 95000, 3, '["/images/diamond_necklace1_1766493904235.png"]', '["16inch","18inch"]', 4.9, 234, 3, TRUE, TRUE),
('Gold Chain with Pendant', 'Delicate gold chain with a stunning pendant featuring intricate work.', 'necklaces', 'daily', 'gold', '22K', 12.5, 95000, 12000, 3, '["/images/gold_necklace_1766431035052.png"]', '["16inch","18inch","20inch"]', 4.6, 167, 20, FALSE, TRUE),
('Temple Jewelry Necklace', 'Traditional temple jewelry necklace with goddess Lakshmi motif.', 'necklaces', 'wedding', 'gold', '22K', 65.0, 485000, 55000, 3, '["/images/gold_necklace_1766431035052.png", "/images/bridal_set_1766431100145.png"]', '["Standard"]', 4.8, 98, 4, TRUE, TRUE),
('Layered Gold Necklace', 'Trendy layered gold necklace set with three delicate chains.', 'necklaces', 'modern', 'gold', '18K', 18.0, 125000, 18000, 3, '["/images/diamond_necklace1_1766493904235.png", "/images/gold_necklace_1766431035052.png"]', '["Adjustable"]', 4.5, 76, 15, FALSE, TRUE),
('Platinum Chain Necklace', 'Classic platinum chain with pearl pendant. Timeless elegance.', 'necklaces', 'daily', 'platinum', 'PT950', 15.0, 185000, 22000, 3, '["/images/pearl_earrings1_1766493923480.png"]', '["16inch","18inch"]', 4.7, 112, 8, TRUE, TRUE),
('Kundan Bridal Necklace', 'Magnificent kundan necklace with uncut diamonds and gemstones.', 'necklaces', 'wedding', 'gold', '22K', 85.0, 650000, 85000, 3, '["/images/bridal_set_1766431100145.png", "/images/gold_necklace_1766431035052.png"]', '["Standard"]', 4.9, 45, 2, TRUE, TRUE);

-- Earrings (19-24)
INSERT INTO products (name, description, category, collection, metal_type, purity, weight_grams, metal_price, making_charges, gst_percent, images, sizes, rating, review_count, stock, is_featured, is_active) VALUES
('Jhumka Gold Earrings', 'Traditional South Indian jhumka earrings with intricate gold work.', 'earrings', 'festive', 'gold', '22K', 18.5, 145000, 18000, 3, '["/images/diamond_earrings_1766431051378.png"]', '["Standard"]', 4.7, 189, 12, TRUE, TRUE),
('Diamond Hoop Earrings', 'Modern diamond hoop earrings with pave setting.', 'earrings', 'modern', 'diamond', '18K', 6.8, 165000, 20000, 3, '["/images/diamond_earrings_1766431051378.png", "/images/pearl_earrings1_1766493923480.png"]', '["Small","Medium","Large"]', 4.8, 234, 10, TRUE, TRUE),
('Silver Drop Earrings', 'Elegant silver drop earrings with diamond accent.', 'earrings', 'wedding', 'silver', '925', 8.2, 8500, 2000, 3, '["/images/pearl_earrings1_1766493923480.png"]', '["Standard"]', 4.6, 145, 18, FALSE, TRUE),
('Gold Chandbali Earrings', 'Crescent moon shaped chandbali earrings with kundan work.', 'earrings', 'wedding', 'gold', '22K', 22.0, 175000, 22000, 3, '["/images/diamond_earrings_1766431051378.png"]', '["Standard"]', 4.8, 87, 6, TRUE, TRUE),
('Gold Stud Earrings', 'Simple and elegant gold stud earrings for everyday wear.', 'earrings', 'daily', 'gold', '18K', 2.5, 35000, 5000, 3, '["/images/pearl_earrings1_1766493923480.png"]', '["Standard"]', 4.5, 312, 50, FALSE, TRUE),
('Diamond Cluster Earrings', 'Statement diamond cluster earrings with platinum surround.', 'earrings', 'festive', 'diamond', '18K', 12.0, 225000, 28000, 3, '["/images/diamond_earrings_1766431051378.png"]', '["Standard"]', 4.7, 67, 5, TRUE, TRUE);

-- Bangles (25-30)
INSERT INTO products (name, description, category, collection, metal_type, purity, weight_grams, metal_price, making_charges, gst_percent, images, sizes, rating, review_count, stock, is_featured, is_active) VALUES
('Diamond Kada Bangle', 'Solid gold kada bangle with diamond studding.', 'bangles', 'wedding', 'diamond', '22K', 35.0, 385000, 45000, 3, '["/images/gold_bangles_1766431083755.png", "/images/gold_bangle_set_1766494051129.png"]', '["2.4","2.6","2.8"]', 4.9, 56, 4, TRUE, TRUE),
('Set of 6 Plain Bangles', 'Classic set of 6 plain gold bangles with polished finish.', 'bangles', 'daily', 'gold', '22K', 45.0, 345000, 35000, 3, '["/images/gold_bangle_set_1766494051129.png"]', '["2.2","2.4","2.6","2.8"]', 4.6, 178, 15, FALSE, TRUE),
('Gold Meenakari Bangle Set', 'Colorful meenakari bangle set with traditional enamel work. Set of 4.', 'bangles', 'festive', 'gold', '22K', 55.0, 420000, 55000, 3, '["/images/gold_bangles_1766431083755.png", "/images/gold_bangle_set_1766494051129.png"]', '["2.4","2.6"]', 4.7, 89, 8, TRUE, TRUE),
('Gold Cuff Bangle', 'Modern gold cuff bangle with contemporary design.', 'bangles', 'modern', 'gold', '18K', 25.0, 185000, 22000, 3, '["/images/gold_bangle_set_1766494051129.png"]', '["Adjustable"]', 4.5, 134, 12, FALSE, TRUE),
('Antique Gold Bangles', 'Antique finish gold bangles with traditional motifs. Set of 2.', 'bangles', 'festive', 'gold', '22K', 48.0, 365000, 45000, 3, '["/images/gold_bangles_1766431083755.png"]', '["2.4","2.6","2.8"]', 4.8, 67, 6, TRUE, TRUE),
('Platinum Diamond Bangle', 'Luxurious platinum bangle with channel set diamonds.', 'bangles', 'wedding', 'platinum', 'PT950', 28.0, 485000, 55000, 3, '["/images/gold_bangle_set_1766494051129.png"]', '["2.4","2.6"]', 4.9, 34, 3, TRUE, TRUE);

-- Bridal Sets (31-36)
INSERT INTO products (name, description, category, collection, metal_type, purity, weight_grams, metal_price, making_charges, gst_percent, images, sizes, rating, review_count, stock, is_featured, is_active) VALUES
('Royal Bridal Collection', 'Complete bridal set with necklace, earrings, maang tikka, and bangles.', 'bridal', 'wedding', 'gold', '22K', 180.0, 1350000, 165000, 3, '["/images/bridal_set_1766431100145.png", "/images/gold_necklace_1766431035052.png", "/images/diamond_earrings_1766431051378.png"]', '["Standard"]', 4.9, 28, 2, TRUE, TRUE),
('Diamond Bridal Ensemble', 'Exquisite diamond bridal set featuring Victorian design.', 'bridal', 'wedding', 'diamond', '18K', 85.0, 1250000, 145000, 3, '["/images/bridal_set_1766431100145.png", "/images/diamond_necklace1_1766493904235.png"]', '["Standard"]', 4.9, 19, 1, TRUE, TRUE),
('South Indian Bridal Set', 'Traditional South Indian bridal set with temple jewelry.', 'bridal', 'wedding', 'gold', '22K', 165.0, 1250000, 150000, 3, '["/images/bridal_set_1766431100145.png", "/images/gold_necklace_1766431035052.png"]', '["Standard"]', 4.8, 45, 3, TRUE, TRUE),
('Polki Bridal Collection', 'Stunning polki diamond bridal set with uncut diamonds.', 'bridal', 'wedding', 'gold', '22K', 145.0, 1450000, 175000, 3, '["/images/bridal_set_1766431100145.png"]', '["Standard"]', 4.9, 23, 2, TRUE, TRUE),
('Modern Fusion Bridal Set', 'Contemporary bridal set blending traditional and modern aesthetics.', 'bridal', 'modern', 'gold', '22K', 95.0, 725000, 85000, 3, '["/images/bridal_set_1766431100145.png", "/images/diamond_necklace1_1766493904235.png"]', '["Standard"]', 4.7, 56, 4, TRUE, TRUE),
('Platinum Bridal Collection', 'Regal platinum bridal set featuring diamonds.', 'bridal', 'wedding', 'platinum', 'PT950', 120.0, 1650000, 195000, 3, '["/images/bridal_set_1766431100145.png", "/images/gold_necklace_1766431035052.png"]', '["Standard"]', 4.8, 15, 1, TRUE, TRUE);

-- More products (37-40)
INSERT INTO products (name, description, category, collection, metal_type, purity, weight_grams, metal_price, making_charges, gst_percent, images, sizes, rating, review_count, stock, is_featured, is_active) VALUES
('Gold Nose Ring', 'Delicate gold nose ring with small diamond.', 'rings', 'daily', 'gold', '22K', 0.8, 12000, 2500, 3, '["/images/gold_ring_detail1_1766493867886.png"]', '["Standard"]', 4.4, 234, 25, FALSE, TRUE),
('Silver Payal Anklet Set', 'Sterling silver anklet pair with traditional ghungroo.', 'rings', 'festive', 'silver', '925', 85.0, 18000, 4500, 3, '["/images/silver_anklet_1766431136140.png"]', '["9inch","10inch","11inch"]', 4.5, 189, 20, FALSE, TRUE),
('Gold Mangalsutra', 'Traditional mangalsutra with black beads and gold pendant.', 'necklaces', 'wedding', 'gold', '22K', 12.0, 95000, 12000, 3, '["/images/gold_necklace_1766431035052.png"]', '["18inch","20inch"]', 4.7, 312, 18, TRUE, TRUE),
('Silver Toe Ring Set', 'Set of 4 adjustable silver toe rings with traditional designs.', 'rings', 'festive', 'silver', '925', 8.0, 3500, 1200, 3, '["/images/silver_anklet_1766431136140.png"]', '["Adjustable"]', 4.3, 145, 35, FALSE, TRUE);

SELECT COUNT(*) as total_products FROM products;
