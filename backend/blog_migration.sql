-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content LONGTEXT,
  cover_image VARCHAR(500),
  category VARCHAR(100) DEFAULT 'General',
  tags JSON,
  author_id INT,
  status ENUM('draft', 'published') DEFAULT 'draft',
  view_count INT DEFAULT 0,
  read_time INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  post_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Jewelry Care', 'jewelry-care', 'Tips and guides for maintaining your precious jewelry'),
('Style Guide', 'style-guide', 'Fashion tips and styling advice for jewelry'),
('Wedding', 'wedding', 'Bridal jewelry trends and wedding inspiration'),
('Behind the Scenes', 'behind-the-scenes', 'Stories from our craftsmen and artisans'),
('News & Events', 'news-events', 'Latest updates and announcements from Aabhar');

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, category, tags, author_id, status, read_time, published_at) VALUES
(
  'How to Care for Your Gold Jewelry',
  'how-to-care-for-gold-jewelry',
  'Learn the best practices for keeping your gold jewelry sparkling and beautiful for years to come.',
  '<h2>Why Gold Jewelry Care Matters</h2>
<p>Gold jewelry is more than just an accessory—it''s often a treasured heirloom passed down through generations. Proper care ensures your pieces stay brilliant and beautiful for a lifetime.</p>

<h3>Daily Care Tips</h3>
<ul>
<li><strong>Remove before activities:</strong> Take off your gold jewelry before swimming, exercising, or cleaning.</li>
<li><strong>Apply cosmetics first:</strong> Put on perfume, lotion, and makeup before wearing your jewelry to prevent buildup.</li>
<li><strong>Store properly:</strong> Keep each piece in a separate soft cloth pouch to prevent scratching.</li>
</ul>

<h3>Cleaning Your Gold Jewelry at Home</h3>
<p>Mix a few drops of mild dish soap with warm water. Soak your gold jewelry for 15-20 minutes, then gently brush with a soft-bristled toothbrush. Rinse with clean water and pat dry with a soft cloth.</p>

<h3>Professional Cleaning</h3>
<p>We recommend bringing your precious pieces to Aabhar for professional ultrasonic cleaning at least once a year.</p>',
  'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/fhlj3efhaafo5amfefyy.jpg',
  'Jewelry Care',
  '["gold", "care", "cleaning", "tips"]',
  1,
  'published',
  5,
  NOW()
),
(
  'Top 5 Jewelry Trends for 2024',
  'top-jewelry-trends-2024',
  'Discover the hottest jewelry trends that are dominating the fashion world this year.',
  '<h2>What''s Trending in Jewelry This Year</h2>
<p>2024 brings exciting new trends in the jewelry world. From bold statement pieces to delicate layering, here''s what''s making waves.</p>

<h3>1. Chunky Gold Chains</h3>
<p>Bold, substantial gold chains are back in a big way. Whether worn alone or layered, these eye-catching pieces make a statement.</p>

<h3>2. Colored Gemstones</h3>
<p>Move over diamonds—colored gemstones like emeralds, sapphires, and rubies are taking center stage in engagement rings and everyday jewelry.</p>

<h3>3. Vintage-Inspired Designs</h3>
<p>Art Deco and Victorian-era inspired pieces are gaining popularity, offering timeless elegance with a modern twist.</p>

<h3>4. Personalized Jewelry</h3>
<p>Custom engraving, birthstones, and name necklaces continue to be favorites for meaningful, personalized gifts.</p>

<h3>5. Sustainable Jewelry</h3>
<p>Eco-conscious consumers are driving demand for recycled metals and ethically sourced gemstones.</p>',
  'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/ygijqk8osfqg10qmlzuu.jpg',
  'Style Guide',
  '["trends", "fashion", "2024", "style"]',
  1,
  'published',
  4,
  NOW()
),
(
  'Choosing the Perfect Bridal Jewelry',
  'choosing-perfect-bridal-jewelry',
  'A comprehensive guide to selecting jewelry that complements your wedding dress and personal style.',
  '<h2>Your Guide to Bridal Jewelry</h2>
<p>Your wedding day is one of the most important days of your life, and choosing the right jewelry is essential to completing your bridal look.</p>

<h3>Consider Your Neckline</h3>
<p><strong>V-neck:</strong> A pendant or Y-necklace follows the neckline beautifully.<br>
<strong>Strapless:</strong> Statement necklaces and chokers work wonderfully.<br>
<strong>High neck:</strong> Skip the necklace and focus on earrings and hair accessories.</p>

<h3>Match Your Metals to Your Dress</h3>
<p>Pure white gowns pair beautifully with silver or platinum, while ivory or champagne dresses complement gold and rose gold tones.</p>

<h3>Balance is Key</h3>
<p>If your dress is heavily embellished, opt for simpler jewelry. For a minimalist gown, you can go bolder with your accessories.</p>

<h3>Don''t Forget Hair Accessories</h3>
<p>A beautiful mang tikka or hair pins can add that perfect finishing touch to your bridal ensemble.</p>',
  'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855925/jewllery_shop/products/expgtk7ilimekmrjewg3.jpg',
  'Wedding',
  '["wedding", "bridal", "guide", "necklace", "earrings"]',
  1,
  'published',
  6,
  NOW()
);
