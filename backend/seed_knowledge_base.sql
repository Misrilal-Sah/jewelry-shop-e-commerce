-- Chatbot Knowledge Base Schema and Comprehensive Data
-- This contains detailed information about every aspect of Aabhar Jewelry Shop

-- Create the knowledge base table
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  keywords VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_topic (topic),
  INDEX idx_category (category),
  INDEX idx_keywords (keywords(100))
);

-- =============================================
-- PAGES CATEGORY
-- =============================================

-- Homepage
INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('homepage', 'Pages', 'Homepage Overview', 
'The homepage (/) is the main landing page of Aabhar Jewelry Shop. It features:
1. Hero Banner - Rotating promotional banners showcasing latest collections
2. Featured Products - Curated selection of popular jewelry pieces
3. Categories Section - Quick links to Gold, Diamond, Silver, Platinum collections
4. Flash Sales - Time-limited deals with countdown timer
5. Testimonials - Customer reviews and experiences
6. Newsletter Signup - Subscribe for offers and updates
7. Trust Badges - Free Shipping, Easy Returns, Authentic Jewelry, Secure Payment', 
'homepage,home,main page,landing,hero,banner,featured,categories'),

('products_page', 'Pages', 'Products Page', 
'The Products page (/products) displays all jewelry items with powerful filtering:
1. Category Filter - Gold, Diamond, Silver, Platinum, Bridal
2. Price Range Slider - Filter by minimum and maximum price
3. Material Filter - 22K Gold, 18K Gold, Silver, Platinum
4. Sort Options - Price Low to High, High to Low, Newest, Popular
5. Grid/List View - Toggle between display modes
6. Quick View - Hover over product for quick preview without leaving page
7. Pagination - Browse through pages of products
8. Search - Find specific products by name or description', 
'products,collection,catalog,browse,filter,sort,search,jewelry,shop'),

('product_detail', 'Pages', 'Product Detail Page', 
'The Product Detail page (/products/{id}) shows complete product information:
1. Image Gallery - Multiple product images with zoom functionality
2. Product Info - Name, price, material, weight, dimensions
3. Size Selection - Choose ring size, chain length, etc.
4. Add to Cart - Select quantity and add to shopping cart
5. Add to Wishlist - Click heart icon to save for later
6. Share Buttons - Share on WhatsApp, Facebook, Twitter
7. Product Description - Detailed description and specifications
8. Reviews Section - Customer reviews with star ratings
9. Q&A Section - Ask questions about the product
10. Related Products - Similar items you might like
11. Recently Viewed - Products you browsed earlier', 
'product,detail,view,images,specifications,reviews,questions,related'),

('cart_page', 'Pages', 'Cart Page', 
'The Cart page (/cart) manages your shopping cart:
1. Cart Items - List of all products with images, names, prices
2. Quantity Selector - Increase/decrease item quantity
3. Remove Item - Click trash icon to remove from cart
4. Apply Coupon - Enter coupon code for discounts
5. Price Summary - Subtotal, discount, shipping, total
6. Continue Shopping - Go back to browse more products
7. Proceed to Checkout - Move to payment
8. Save for Later - Move items to wishlist
9. Empty Cart Message - Shown when cart is empty with "Shop Now" button', 
'cart,basket,shopping cart,items,quantity,remove,coupon,checkout'),

('checkout_page', 'Pages', 'Checkout Page', 
'The Checkout page (/checkout) completes your purchase:
1. Delivery Address - Select saved address or add new one
2. Address Form - Name, phone, street, city, state, pincode
3. Payment Method - Cards, UPI, Net Banking, EMI, COD
4. Order Summary - Items, quantities, prices
5. Apply Coupon - Last chance to apply discount code
6. Place Order - Confirm and submit order
7. Razorpay Integration - Secure payment processing
8. Order Confirmation - Success message with order ID
9. Guest Checkout - Not available, login required', 
'checkout,payment,address,delivery,place order,pay,razorpay,upi,card'),

('profile_page', 'Pages', 'Profile Page', 
'The Profile page (/profile) manages your account information:
1. Personal Info - Name, email, phone number
2. Edit Profile - Click edit icon to update details
3. Addresses Section - Manage delivery addresses
4. Add New Address - Click "Add Address" button
5. Set Default Address - Star icon to mark as default
6. Delete Address - Remove saved addresses
7. Birthday & Anniversary - Add dates for special discount coupons
8. Password Change - Update your password
9. Email Preferences - Manage notification settings
10. Order History Link - Quick link to your orders', 
'profile,account,personal,information,edit,update,addresses,birthday,anniversary,password'),

('orders_page', 'Pages', 'My Orders Page', 
'The Orders page (/orders) shows your order history:
1. Order List - All past orders with dates and status
2. Order Status - Pending, Confirmed, Shipped, Delivered, Cancelled
3. Order Details - Click order to see full details
4. Track Order - View tracking number and delivery updates
5. Download Invoice - Get PDF invoice for order
6. Return/Exchange - Initiate return within 15 days
7. Cancel Order - Cancel within 24 hours if not shipped
8. Reorder - Quickly reorder past purchase
9. Order ID Format - ORD-XXXX (e.g., ORD-1234)', 
'orders,order history,my orders,track,status,invoice,return,cancel'),

('wishlist_page', 'Pages', 'Wishlist Page', 
'The Wishlist page (/wishlist) saves your favorite items:
1. Wishlist Items - All products you saved
2. Add to Cart - Move items to shopping cart
3. Remove Item - Click X to remove from wishlist
4. Share Wishlist - Get shareable link for family/friends
5. Price Drop Alerts - Get notified when price decreases
6. Move to Cart - Add multiple items at once
7. Empty Wishlist - Message shown when no items saved
8. Wishlist Icon - Heart icon in header shows count', 
'wishlist,favorites,saved items,heart,share,price alert');

-- =============================================
-- ACCOUNT & AUTH CATEGORY  
-- =============================================

INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('login', 'Account', 'Login Process', 
'How to login to your Aabhar account:
1. Click the user icon in the top right header
2. Click "Login" or you will see the login form
3. Enter your registered email address
4. Enter your password
5. Click "Login" button
6. Alternative: Click "Continue with Google" for Google login
7. If you forgot password, click "Forgot Password?" link
8. After successful login, you are redirected to homepage
9. Your name appears in the header when logged in', 
'login,sign in,log in,email,password,google login,authenticate'),

('signup', 'Account', 'Signup/Registration Process', 
'How to create a new Aabhar account:
1. Click the user icon in the top right header
2. Click "Register" or "Create Account"
3. Enter your full name
4. Enter your email address
5. Enter your phone number (10 digits)
6. Click "Send OTP" to verify phone
7. Enter the 6-digit OTP received via SMS
8. Create a strong password (minimum 8 characters)
9. Confirm your password
10. Click "Create Account"
11. Alternative: Click "Sign up with Google" for quick registration
12. Account created! You are now logged in', 
'signup,register,create account,new account,registration,otp,verify'),

('forgot_password', 'Account', 'Forgot Password Recovery', 
'How to reset your forgotten password:
1. Go to the login page
2. Click "Forgot Password?" link below the login button
3. Enter your registered email address
4. Click "Send OTP"
5. Check your email for the 6-digit OTP
6. Enter the OTP on the verification screen
7. Create a new password (minimum 8 characters)
8. Confirm your new password
9. Click "Reset Password"
10. Password changed! You can now login with new password', 
'forgot password,reset password,recover account,lost password,change password,otp'),

('change_password', 'Account', 'Change Password', 
'How to change your password when logged in:
1. Login to your account
2. Go to Profile page (click your name in header)
3. Scroll to "Security" or "Password" section
4. Click "Change Password"
5. Enter your current password
6. Enter your new password (minimum 8 characters)
7. Confirm the new password
8. Click "Update Password"
9. Password changed successfully!', 
'change password,update password,new password,security,password change'),

('addresses', 'Account', 'Managing Delivery Addresses', 
'How to manage your delivery addresses:
1. Go to Profile page
2. Scroll to "Saved Addresses" section
3. To ADD new address:
   - Click "+ Add New Address"
   - Fill in: Name, Phone, Street, City, State, Pincode
   - Optionally set as default
   - Click "Save Address"
4. To EDIT address:
   - Click the pencil/edit icon on the address card
   - Modify the details
   - Click "Update"
5. To DELETE address:
   - Click the trash icon on the address card
   - Confirm deletion
6. To SET DEFAULT:
   - Click the star icon on any address
   - This address will be pre-selected at checkout', 
'address,addresses,delivery address,add address,edit address,default address,shipping address'),

('email_preferences', 'Account', 'Email Notification Settings', 
'Manage your email preferences:
1. Go to Profile page
2. Find "Email Preferences" section
3. Toggle ON/OFF for:
   - Order Updates - Shipping and delivery notifications
   - Promotional Emails - Sales, offers, new arrivals
   - Newsletter - Weekly jewelry trends and tips
   - Price Drop Alerts - When wishlist items go on sale
   - Back in Stock - When out-of-stock items return
4. Click "Save Preferences"
5. Unsubscribe link available in all marketing emails', 
'email,preferences,notifications,newsletter,unsubscribe,marketing emails');

-- =============================================
-- FEATURES CATEGORY
-- =============================================

INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('search', 'Features', 'Product Search', 
'How to search for products:
1. Click the search icon (magnifying glass) in the header
2. Type product name, material, or category
3. Press Enter or click search icon
4. Results page shows matching products
5. Search suggestions appear as you type
6. Search works on: product names, descriptions, materials, categories
7. Empty search shows "No products found" with suggestions
8. Recent searches are saved for quick access', 
'search,find,look for,search bar,search products'),

('filters', 'Features', 'Product Filters', 
'How to filter products:
1. Go to Products page
2. Use the filter panel on the left side
3. Available filters:
   - Category: Gold, Diamond, Silver, Platinum, Bridal
   - Price Range: Drag slider or enter min/max values
   - Material: 22K Gold, 18K Gold, 925 Silver
   - Gender: Men, Women, Unisex
   - Availability: In Stock only
4. Filters apply instantly
5. Active filters shown as chips at top
6. Click "X" on chip to remove filter
7. Click "Clear All" to reset filters', 
'filter,filters,category,price range,material,refine'),

('sorting', 'Features', 'Sort Products', 
'How to sort products:
1. Go to Products page
2. Find the "Sort by" dropdown (usually top right)
3. Available sort options:
   - Relevance (default)
   - Price: Low to High
   - Price: High to Low
   - Newest First
   - Most Popular
   - Rating: High to Low
4. Click any option to apply
5. Page refreshes with sorted products
6. Works with filters applied', 
'sort,sorting,order by,arrange,price low high'),

('wishlist_feature', 'Features', 'Wishlist Feature', 
'How to use the wishlist:
1. To ADD to wishlist:
   - On product card: Click the heart icon
   - On product page: Click "Add to Wishlist" button
   - Heart turns solid/filled when added
2. To VIEW wishlist:
   - Click heart icon in header
   - Or go to /wishlist page
3. To REMOVE from wishlist:
   - Click filled heart icon again
   - Or click X on wishlist page
4. To SHARE wishlist:
   - Go to wishlist page
   - Click "Share Wishlist" button
   - Copy the generated link
   - Share with family/friends
5. Wishlist count shows in header', 
'wishlist,favorites,save,heart icon,share wishlist'),

('reviews', 'Features', 'Product Reviews', 
'How to use product reviews:
1. To READ reviews:
   - Go to any product page
   - Scroll to "Reviews" section
   - See star rating and customer feedback
   - Filter by star rating
2. To WRITE a review:
   - You must have purchased the product
   - Go to the product page
   - Click "Write a Review" button
   - Select star rating (1-5)
   - Write your review text
   - Optionally upload photos
   - Click "Submit Review"
3. Reviews are moderated before publishing
4. Helpful votes: Click "Helpful" on reviews you like', 
'review,reviews,rating,star rating,feedback,write review'),

('questions', 'Features', 'Product Q&A', 
'How to use Product Questions:
1. Go to any product page
2. Scroll to "Questions & Answers" section
3. To ASK a question:
   - Click "Ask a Question" button
   - Type your question about the product
   - Click "Submit"
   - Questions are answered by our team
4. To VIEW answers:
   - Browse existing Q&A
   - Questions sorted by most recent
5. You get notified when your question is answered', 
'questions,q&a,ask question,product questions,answers'),

('quick_view', 'Features', 'Quick View', 
'How to use Quick View:
1. Go to Products page
2. Hover over any product card
3. Click the "Quick View" button (eye icon)
4. A popup shows product details:
   - Product images
   - Name and price
   - Quick description
   - Add to Cart button
   - View Full Details link
5. No page navigation needed
6. Close by clicking X or outside the popup', 
'quick view,preview,popup,hover,quick look');

-- =============================================
-- UI & SHORTCUTS CATEGORY
-- =============================================

INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('keyboard_shortcuts', 'UI', 'Keyboard Shortcuts', 
'Available keyboard shortcuts on Aabhar:
1. Ctrl+K or Cmd+K - Open Command Palette (search anywhere)
2. / - Focus on search bar
3. Esc - Close modals/popups
4. Arrow Keys - Navigate in dropdowns
5. Enter - Select/confirm action
Note: Shortcuts work when not typing in input fields.
Access full shortcut list from Command Palette.', 
'keyboard,shortcuts,hotkeys,keys,ctrl k,command,shortcut'),

('command_palette', 'UI', 'Command Palette', 
'How to use Command Palette:
1. Press Ctrl+K (Windows) or Cmd+K (Mac)
2. A search popup appears
3. Type to search for:
   - Products by name
   - Pages (Cart, Orders, Profile)
   - Actions (Login, Logout)
   - Categories (Gold, Diamond)
4. Use arrow keys to navigate results
5. Press Enter to select
6. Press Esc to close
7. Recent searches shown first
8. Fuzzy search finds partial matches', 
'command palette,cmd k,ctrl k,quick search,spotlight,search anywhere'),

('theme_toggle', 'UI', 'Dark/Light Theme', 
'How to switch themes:
1. Look for sun/moon icon in the header
2. Click to toggle between:
   - Light Mode (sun icon) - White background
   - Dark Mode (moon icon) - Dark background
3. Theme preference is saved automatically
4. Applies to all pages instantly
5. Uses system preference by default
6. Chat widget also follows theme', 
'theme,dark mode,light mode,toggle,sun moon,appearance'),

('notifications', 'UI', 'Notifications', 
'How to view notifications:
1. Click bell icon in the header
2. Dropdown shows recent notifications:
   - Order status updates
   - Price drop alerts
   - Back in stock alerts
   - Promotional offers
3. Unread count shows as badge
4. Click notification to view details
5. "Mark all as read" option available
6. Go to /notifications for full history
7. Manage preferences in Profile > Email Preferences', 
'notifications,bell,alerts,updates,notify');

-- =============================================
-- POLICIES CATEGORY
-- =============================================

INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('shipping_policy', 'Policies', 'Shipping Policy', 
'Aabhar Jewelry Shipping Policy:
1. FREE SHIPPING on orders above ₹10,000
2. Standard Shipping: ₹99 (5-7 business days)
3. Express Shipping: ₹199 (2-3 business days)
4. Delivery Areas: All India (All PIN codes)
5. Courier Partners: BlueDart, Delhivery, FedEx
6. Tracking: Tracking number sent via SMS & email
7. Signature Required: For orders above ₹25,000
8. Safe Packaging: Tamper-proof, insured packaging
9. No International Shipping currently
10. Delivery attempts: 3 attempts before return', 
'shipping,delivery,courier,tracking,free shipping,shipping cost'),

('returns_policy', 'Policies', 'Returns & Exchange Policy', 
'Aabhar Jewelry Returns Policy:
1. Return Window: 15 days from delivery
2. Condition: Items must be unworn, with original tags
3. Non-Returnable: Customized/engraved items, earrings (hygiene)
4. Process:
   - Go to My Orders
   - Click "Return" on the order
   - Select reason
   - Schedule pickup
5. Refund: Within 5-7 business days after receiving item
6. Exchange: Choose different size/product
7. Return Shipping: FREE for all returns
8. Quality Issues: Full refund + compensation', 
'returns,refund,exchange,return policy,money back,15 days'),

('privacy_policy', 'Policies', 'Privacy Policy', 
'Key points of our Privacy Policy:
1. Data Collection: Name, email, phone, address, payment info
2. Usage: Order processing, delivery, customer support
3. Security: SSL encryption, PCI-DSS compliant payments
4. Sharing: Never sold to third parties
5. Cookies: Used for site functionality and analytics
6. Marketing: Only with your consent, easy opt-out
7. Data Retention: As long as account is active
8. Rights: Access, modify, delete your data
9. Contact: privacy@aabhar.com for queries
10. Full policy available at /privacy-policy', 
'privacy,data,personal information,security,gdpr'),

('cookies', 'Policies', 'Cookie Policy', 
'How cookies are used on Aabhar:
1. Essential Cookies: Login session, cart items (required)
2. Analytics Cookies: Page views, user behavior (Google Analytics)
3. Marketing Cookies: Ad personalization (optional)
4. Preference Cookies: Theme, language settings
5. Cookie Consent: Banner appears on first visit
6. Accept All: All cookies enabled
7. Customize: Choose which cookies to allow
8. Managing Cookies: Browser settings to clear/block
9. Impact: Some features may not work without cookies
10. More info: /cookie-policy page', 
'cookies,cookie policy,consent,tracking,analytics'),

('terms_conditions', 'Policies', 'Terms & Conditions', 
'Key Terms and Conditions:
1. Account: Must be 18+ to create account
2. Accuracy: We strive for accurate product info
3. Pricing: Prices may change, errors will be corrected
4. Orders: We reserve right to refuse/cancel orders
5. Payment: All transactions in INR
6. Intellectual Property: All content owned by Aabhar
7. User Content: Reviews must be truthful
8. Liability: Limited to order value
9. Disputes: Governed by Indian law, Mumbai jurisdiction
10. Changes: Terms may be updated with notice
11. Full terms at /terms-and-conditions', 
'terms,conditions,legal,agreement,policy');

-- =============================================
-- PRODUCTS & COLLECTIONS
-- =============================================

INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('gold_jewelry', 'Products', 'Gold Jewelry Collection', 
'Aabhar Gold Jewelry:
1. Purity: 22K (916) and 18K (750) gold
2. Hallmarking: All gold is BIS Hallmarked
3. Types: Necklaces, Rings, Bangles, Earrings, Chains
4. Styles: Traditional, Modern, Bridal, Daily Wear
5. Weight: From 2g lightweight to 100g+ heavy pieces
6. Certificate: Hallmark certificate with every purchase
7. Making Charges: 8-15% depending on design complexity
8. Buyback: Up to 90% value on exchange
9. Gold Rate: Updated daily based on market price', 
'gold,22k,18k,hallmark,gold jewelry,gold rate,bangles,necklace'),

('diamond_jewelry', 'Products', 'Diamond Jewelry Collection', 
'Aabhar Diamond Jewelry:
1. Certification: IGI and GIA certified diamonds
2. 4Cs: Cut, Clarity, Color, Carat specifications
3. Types: Rings, Pendants, Earrings, Bracelets, Tennis Bracelets
4. Settings: Prong, Bezel, Pave, Channel
5. Metal: Set in 18K Gold or Platinum
6. Solitaires: Engagement rings with center diamonds
7. Certificate: Diamond certificate included
8. Sizes: From 0.10 carat to 2+ carats available
9. Lab Diamonds: Coming soon!', 
'diamond,diamonds,igi,gia,solitaire,engagement ring,certification'),

('silver_jewelry', 'Products', 'Silver Jewelry Collection', 
'Aabhar Silver Jewelry:
1. Purity: 925 Sterling Silver
2. Hallmarking: BIS 925 hallmarked
3. Types: Chains, Bracelets, Anklets, Rings, Earrings
4. Finish: Oxidized, Polished, Rhodium-plated
5. Stones: With/without gemstones and CZ
6. Price Range: ₹500 - ₹15,000
7. Care: Keep dry, store in pouch
8. Tarnish: Anti-tarnish coating included
9. Perfect for: Daily wear, gifting', 
'silver,sterling silver,925,anklet,bracelet,oxidized');

-- =============================================
-- SPECIAL FEATURES
-- =============================================

INSERT INTO chatbot_knowledge (topic, category, title, content, keywords) VALUES
('flash_sales', 'Features', 'Flash Sales', 
'Flash Sales at Aabhar:
1. Location: Flash Sales section on homepage and /flash-sales
2. Duration: Limited time (24-72 hours typically)
3. Countdown: Timer shows remaining time
4. Discounts: Up to 30-50% off on select items
5. Limited Stock: Items can sell out quickly
6. Notifications: Subscribe to get flash sale alerts
7. Quick Checkout: Fast process for flash items
8. No Coupons: Flash sale prices are final
9. Returns: Standard return policy applies', 
'flash sale,sale,discount,limited time,countdown,deals,offers'),

('bulk_orders', 'Features', 'Bulk & Corporate Orders', 
'Bulk Orders for weddings, corporate gifts:
1. Page: /bulk-order
2. Minimum: 10 pieces per order
3. Discount: Special bulk pricing (10-25% off)
4. Customization: Engraving, packaging options
5. Process:
   - Fill bulk order form
   - We contact you within 24 hours
   - Quote provided based on requirements
   - Advance payment required
6. Delivery: 7-14 days depending on quantity
7. Uses: Corporate gifts, wedding favors, resellers
8. Contact: bulkorders@aabhar.com', 
'bulk order,wholesale,corporate,wedding,bulk discount,reseller'),

('gift_cards', 'Features', 'Gift Cards', 
'Aabhar Gift Cards (Coming Soon):
1. Denominations: ₹1000, ₹2500, ₹5000, ₹10000
2. Validity: 1 year from purchase
3. Delivery: Email delivery (instant)
4. Usage: Apply code at checkout
5. Partial Use: Balance saved for next purchase
6. Non-refundable: Cannot be exchanged for cash
7. Gifting: Perfect for birthdays, anniversaries
8. Currently: Feature coming soon!', 
'gift card,gift voucher,gift certificate,present');

SELECT 'Chatbot Knowledge Base populated successfully!' as Status, COUNT(*) as Total_Records FROM chatbot_knowledge;
