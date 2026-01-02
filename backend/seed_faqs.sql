-- Comprehensive FAQ Data for Aabhar Jewelry Shop Chatbot
-- Run this script to populate the FAQs table

-- Clear existing FAQs (optional - comment out if you want to keep existing)
-- DELETE FROM faqs;

-- =============================================
-- SHIPPING & DELIVERY
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('How long does shipping take?', 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 day delivery. All orders above ₹10,000 get FREE shipping!', 'Shipping', 1, 1),
('Do you offer free shipping?', 'Yes! We offer FREE shipping on all orders above ₹10,000. For orders below ₹10,000, a flat shipping fee of ₹99 applies.', 'Shipping', 1, 2),
('Can I track my order?', 'Absolutely! Once your order is shipped, you''ll receive a tracking number via email and SMS. You can also track your order from the "My Orders" section in your account.', 'Shipping', 1, 3),
('Do you ship internationally?', 'Currently, we only ship within India. We are working on expanding to international locations soon!', 'Shipping', 1, 4),
('What courier partners do you use?', 'We use trusted courier partners including BlueDart, Delhivery, and FedEx for safe and secure delivery of your precious jewelry.', 'Shipping', 1, 5);

-- =============================================
-- RETURNS & REFUNDS
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('What is your return policy?', 'We offer a 15-day easy return policy. If you''re not satisfied with your purchase, you can return it within 15 days of delivery for a full refund or exchange. Items must be in original condition with tags attached.', 'Returns', 1, 10),
('How do I return a product?', 'To return a product: 1) Go to My Orders, 2) Select the order and click "Return", 3) Choose your reason, 4) Schedule a pickup. Our team will collect the item and process your refund within 5-7 business days.', 'Returns', 1, 11),
('How long do refunds take?', 'Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited to your original payment method.', 'Returns', 1, 12),
('Can I exchange a product?', 'Yes! You can exchange products within 15 days. If the new item costs more, you''ll pay the difference. If it costs less, we''ll refund the difference.', 'Returns', 1, 13),
('Are there any items that cannot be returned?', 'Customized/personalized jewelry, engraved items, and earrings (for hygiene reasons) cannot be returned unless defective.', 'Returns', 1, 14);

-- =============================================
-- PAYMENT
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('What payment methods do you accept?', 'We accept all major payment methods: Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking, EMI options, and Cash on Delivery (COD) for orders below ₹50,000.', 'Payment', 1, 20),
('Is Cash on Delivery available?', 'Yes! COD is available for orders up to ₹50,000. A nominal COD fee of ₹50 may apply. For orders above ₹50,000, we recommend prepaid payment for security.', 'Payment', 1, 21),
('Do you offer EMI options?', 'Yes! We offer No-Cost EMI on orders above ₹10,000 through major banks. You can choose 3, 6, 9, or 12 month EMI options during checkout.', 'Payment', 1, 22),
('Is my payment information secure?', 'Absolutely! We use Razorpay for payment processing, which is PCI-DSS compliant. Your card details are encrypted and never stored on our servers.', 'Payment', 1, 23),
('Can I pay using UPI?', 'Yes! We accept all UPI payments including Google Pay, PhonePe, Paytm, and BHIM UPI. Just scan the QR code or enter your UPI ID at checkout.', 'Payment', 1, 24);

-- =============================================
-- PRODUCTS & QUALITY
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('Is your jewelry genuine?', 'Yes, 100%! All our gold jewelry comes with BIS Hallmark certification. Diamond jewelry includes IGI/GIA certification. We guarantee authenticity of every piece.', 'Products', 1, 30),
('What gold purity do you offer?', 'We offer 22K (916) gold for traditional jewelry and 18K (750) gold for diamond-studded pieces. All gold jewelry is BIS Hallmarked.', 'Products', 1, 31),
('Are your diamonds certified?', 'Yes! All our diamonds above 0.30 carats come with IGI or GIA certification. The certificate details are provided with your purchase.', 'Products', 1, 32),
('Do you offer customization?', 'Yes! We offer customization for select designs. You can request ring size adjustments, chain length modifications, and even custom engravings. Contact us for personalized designs.', 'Products', 1, 33),
('How do I know my ring size?', 'You can visit our Ring Size Guide page for a printable ring sizer, or visit any local jeweler to get your size measured. Our standard sizes range from 5 to 22.', 'Products', 1, 34),
('What materials do you use?', 'We use 22K and 18K gold, 925 sterling silver, certified diamonds, precious gemstones (ruby, emerald, sapphire), and semi-precious stones. All materials are ethically sourced.', 'Products', 1, 35);

-- =============================================
-- ORDERS
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('How do I track my order?', 'To track your order: 1) Login to your account, 2) Go to "My Orders", 3) Click on your order to see real-time tracking. You can also track using the tracking link sent to your email/SMS.', 'Orders', 1, 40),
('Can I cancel my order?', 'Yes, you can cancel your order within 24 hours of placing it, provided it hasn''t been shipped yet. Go to My Orders and click "Cancel Order". Refund will be processed within 3-5 business days.', 'Orders', 1, 41),
('Can I modify my order after placing it?', 'Order modifications (address change, product swap) are possible within 2 hours of placing the order. Please contact us immediately at support@aabhar.com.', 'Orders', 1, 42),
('Where is my order?', 'You can track your order by: 1) Going to My Orders in your account, or 2) Using the tracking link in your email, or 3) Contacting us with your order ID (format: ORD-XXXX).', 'Orders', 1, 43),
('Why is my order delayed?', 'Delays can occur due to high demand, address verification, or courier issues. If your order is delayed beyond the expected delivery date, please contact us and we''ll expedite it.', 'Orders', 1, 44);

-- =============================================
-- ACCOUNT & WISHLIST
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('How do I create an account?', 'Click on the user icon in the top right, then "Register". Enter your name, email, and phone number, verify with OTP, and your account is ready! You can also signup using Google.', 'Account', 1, 50),
('How do I add products to wishlist?', 'To add products to your wishlist: 1) Browse any product, 2) Click the heart icon on the product card or detail page, 3) View all wishlist items by clicking the heart icon in the header.', 'Account', 1, 51),
('Can I share my wishlist?', 'Yes! Go to your Wishlist page and click "Share Wishlist". You''ll get a unique link that you can share with friends and family.', 'Account', 1, 52),
('How do I reset my password?', 'Click "Forgot Password" on the login page, enter your email, and you''ll receive an OTP. Verify the OTP and set a new password.', 'Account', 1, 53),
('How do I update my profile?', 'Go to your Profile page by clicking your name after login. You can update your name, phone number, addresses, and add birthday/anniversary dates for special discounts!', 'Account', 1, 54);

-- =============================================
-- DISCOUNTS & OFFERS
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('How do I apply a coupon code?', 'At checkout or in your cart, you''ll see a "Apply Coupon" field. Enter your coupon code and click Apply. The discount will be reflected in your total.', 'Offers', 1, 60),
('Do you have any current offers?', 'Check our Flash Sales section for current deals! We regularly offer 10-30% discounts on select collections. Also, add your birthday/anniversary to your profile for special discount coupons!', 'Offers', 1, 61),
('Is there a first-time buyer discount?', 'Yes! New customers get 10% off on their first order. Use code WELCOME10 at checkout. Minimum order value ₹5,000 applies.', 'Offers', 1, 62),
('Do you offer bulk order discounts?', 'Yes! For bulk orders (weddings, corporate gifts), we offer special pricing. Visit our Bulk Order page or contact us for a custom quote.', 'Offers', 1, 63),
('How do birthday discounts work?', 'Add your birthday to your profile, and you''ll receive a special 15% discount coupon valid for 7 days around your birthday! Anniversary discounts of 10% are also available.', 'Offers', 1, 64);

-- =============================================
-- CONTACT & SUPPORT
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('How can I contact customer support?', 'You can reach us via: Email: support@aabhar.com, Phone: +91 98765 43210 (Mon-Sat, 10AM-7PM), WhatsApp: +91 98765 43210, or use this chatbot 24/7!', 'Support', 1, 70),
('What are your store hours?', 'Our online store is open 24/7! Customer support is available Monday to Saturday, 10:00 AM to 7:00 PM IST.', 'Support', 1, 71),
('Do you have physical stores?', 'Yes! Our flagship store is located at 123 Jewelry Lane, Mumbai, Maharashtra 400001. Visit us for an exclusive in-store experience!', 'Support', 1, 72),
('How do I give feedback?', 'We love hearing from you! You can leave product reviews on any product page, or email us at feedback@aabhar.com with your suggestions.', 'Support', 1, 73);

-- =============================================
-- CARE & MAINTENANCE
-- =============================================
INSERT INTO faqs (question, answer, category, is_active, display_order) VALUES
('How do I care for my gold jewelry?', 'Store gold jewelry in a soft cloth or separate compartment. Clean with mild soap and warm water. Avoid harsh chemicals and chlorine. Remove jewelry before swimming or showering.', 'Care', 1, 80),
('How do I clean diamond jewelry?', 'Soak diamond jewelry in warm water with mild dish soap for 20-30 minutes. Use a soft brush to gently clean. Rinse and dry with a lint-free cloth. For professional cleaning, visit our store.', 'Care', 1, 81),
('How should I store my jewelry?', 'Store each piece separately in soft pouches or compartments to prevent scratching. Keep in a cool, dry place away from direct sunlight. Use anti-tarnish strips for silver jewelry.', 'Care', 1, 82),
('Do you offer jewelry repair?', 'Yes! We offer repair services for jewelry purchased from us. Visit our store or contact customer support to arrange repair/maintenance services.', 'Care', 1, 83);

SELECT 'FAQs populated successfully!' as Status, COUNT(*) as Total_FAQs FROM faqs WHERE is_active = 1;
