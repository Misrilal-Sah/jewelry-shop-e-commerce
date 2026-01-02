-- Additional FAQs for missing topics
-- Run this script to add more FAQs

INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
-- Reviews
('How do I add a review?', 'To add a product review: 1) Go to the product page of an item you purchased, 2) Scroll down to the Reviews section, 3) Click "Write a Review", 4) Rate the product (1-5 stars) and write your feedback. You can only review products you have purchased.', 'Products', 1, 36),
('Can I edit my review?', 'Yes! You can edit your review within 30 days of posting. Go to the product page, find your review, and click the edit icon.', 'Products', 1, 37),

-- Wishlist specific
('How to add products to wishlist?', 'To add products to your wishlist: 1) Browse any product you like, 2) Click the heart icon on the product card or product detail page, 3) The item will be saved to your wishlist. View all wishlist items by clicking the heart icon in the header.', 'Account', 1, 55),

-- Login/Signup
('How do I sign up?', 'To create an account: 1) Click the user icon in the top right corner, 2) Click "Register", 3) Enter your name, email, phone number, 4) Verify your phone with OTP, 5) Set a password. You can also sign up with Google for faster registration!', 'Account', 1, 56),
('How do I login?', 'To login: Click the user icon in the top right, enter your email and password, and click Login. You can also use "Login with Google" for quick access.', 'Account', 1, 57),

-- Cart
('How do I add items to cart?', 'To add items to your cart: 1) Browse products and click on a product you like, 2) Select size/variant if applicable, 3) Click "Add to Cart". You can view your cart by clicking the shopping bag icon in the header.', 'Orders', 1, 45),

-- Checkout
('How do I checkout?', 'To complete your purchase: 1) Click the cart icon, 2) Review your items, 3) Click "Proceed to Checkout", 4) Enter/select your delivery address, 5) Choose payment method, 6) Apply coupon if you have one, 7) Click "Place Order".', 'Orders', 1, 46),

-- Gold/Silver jewelry
('Do you sell gold jewelry?', 'Yes! We offer a wide range of 22K and 18K gold jewelry including necklaces, rings, bangles, earrings, and bridal sets. All our gold is BIS Hallmarked for authenticity.', 'Products', 1, 38),
('Do you sell silver jewelry?', 'Yes! We have a beautiful collection of 925 Sterling Silver jewelry including chains, bracelets, anklets, and earrings. Perfect for daily wear!', 'Products', 1, 39),
('Do you sell diamond jewelry?', 'Yes! We offer IGI/GIA certified diamond jewelry including engagement rings, necklaces, earrings, and tennis bracelets. All diamonds come with authenticity certificates.', 'Products', 1, 40);

SELECT 'Additional FAQs added successfully!' as Status;
