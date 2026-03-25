const pool = require('../config/db');

// Get all products with filters
const getProducts = async (req, res) => {
  try {
    const {
      category,
      collection,
      metal_type,
      purity,
      min_price,
      max_price,
      min_weight,
      max_weight,
      gemstone,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    let query = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];

    // Helper: split comma-separated values into an array, trimming whitespace
    const toArray = (val) => val.split(',').map(v => v.trim()).filter(Boolean);

    // Multi-value filters using IN (?)
    if (category) {
      const vals = toArray(category);
      query += ` AND category IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }

    if (collection) {
      const vals = toArray(collection);
      query += ` AND collection IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }

    if (metal_type) {
      const vals = toArray(metal_type);
      query += ` AND metal_type IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }

    if (purity) {
      const vals = toArray(purity);
      query += ` AND purity IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }

    if (min_price) {
      query += ' AND (metal_price + making_charges) >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ' AND (metal_price + making_charges) <= ?';
      params.push(parseFloat(max_price));
    }

    if (min_weight) {
      query += ' AND weight_grams >= ?';
      params.push(parseFloat(min_weight));
    }

    if (max_weight) {
      query += ' AND weight_grams <= ?';
      params.push(parseFloat(max_weight));
    }

    if (gemstone) {
      const vals = toArray(gemstone);
      query += ` AND gemstone_type IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }

    // Sorting
    switch (sort) {
      case 'price_low':
        query += ' ORDER BY (metal_price + making_charges) ASC';
        break;
      case 'price_high':
        query += ' ORDER BY (metal_price + making_charges) DESC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      case 'popular':
        query += ' ORDER BY review_count DESC, rating DESC';
        break;
      default:
        query += ' ORDER BY is_featured DESC, created_at DESC';
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [products] = await pool.query(query, params);

    // Get total count — reuse same filter params (strip last 2 pagination params)
    const countParams = params.slice(0, -2);
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE';
    if (category) {
      const vals = toArray(category);
      countQuery += ` AND category IN (${vals.map(() => '?').join(',')})`;
    }
    if (collection) {
      const vals = toArray(collection);
      countQuery += ` AND collection IN (${vals.map(() => '?').join(',')})`;
    }
    if (metal_type) {
      const vals = toArray(metal_type);
      countQuery += ` AND metal_type IN (${vals.map(() => '?').join(',')})`;
    }
    if (purity) {
      const vals = toArray(purity);
      countQuery += ` AND purity IN (${vals.map(() => '?').join(',')})`;
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get reviews with images and user avatar
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.images, r.helpful_count, r.created_at, 
              u.name as user_name, u.profile_image as user_avatar 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? AND r.is_approved = TRUE 
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    // Parse images JSON for each review
    const parsedReviews = reviews.map(review => ({
      ...review,
      images: review.images ? (typeof review.images === 'string' ? JSON.parse(review.images) : review.images) : []
    }));

    // Get total review count and average rating
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating 
       FROM reviews WHERE product_id = ? AND is_approved = TRUE`,
      [req.params.id]
    );

    const product = {
      ...products[0],
      reviews: parsedReviews,
      review_count: stats[0].total_reviews || 0,
      rating: stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(1) : 0
    };

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products WHERE is_featured = TRUE AND is_active = TRUE ORDER BY created_at DESC LIMIT 8'
    );
    res.json(products);
  } catch (error) {
    console.error('Get featured error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get categories with counts
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM products WHERE is_active = TRUE 
       GROUP BY category`
    );
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const searchTerm = `%${q}%`;
    const [products] = await pool.query(
      `SELECT * FROM products 
       WHERE is_active = TRUE AND (name LIKE ? OR description LIKE ? OR category LIKE ?)
       ORDER BY rating DESC LIMIT 20`,
      [searchTerm, searchTerm, searchTerm]
    );

    res.json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a review with optional images (authenticated)
const addReview = async (req, res) => {
  try {
    const { rating, title, review, images } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate images (max 5)
    const reviewImages = images && Array.isArray(images) ? images.slice(0, 5) : null;

    // Check if user already reviewed this product
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [productId, userId]
    );
    
    if (existing.length > 0) {
      // Update existing review
      await pool.query(
        `UPDATE reviews SET rating = ?, title = ?, comment = ?, images = ?, updated_at = NOW() 
         WHERE product_id = ? AND user_id = ?`,
        [rating, title || null, review || null, reviewImages ? JSON.stringify(reviewImages) : null, productId, userId]
      );
    } else {
      // Insert new review (auto-approved for simplicity)
      await pool.query(
        `INSERT INTO reviews (product_id, user_id, rating, title, comment, images, is_approved) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [productId, userId, rating, title || null, review || null, reviewImages ? JSON.stringify(reviewImages) : null]
      );
    }

    // Update product rating and review count
    const [stats] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
       FROM reviews WHERE product_id = ? AND is_approved = TRUE`,
      [productId]
    );

    await pool.query(
      'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
      [stats[0].avg_rating || 0, stats[0].count || 0, productId]
    );

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reviews for a product with sorting
const getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
    const productId = req.params.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order based on sortBy parameter
    let orderClause = 'r.created_at DESC'; // default: newest
    switch (sortBy) {
      case 'oldest':
        orderClause = 'r.created_at ASC';
        break;
      case 'highest':
        orderClause = 'r.rating DESC, r.created_at DESC';
        break;
      case 'lowest':
        orderClause = 'r.rating ASC, r.created_at DESC';
        break;
      case 'helpful':
        orderClause = 'r.helpful_count DESC, r.created_at DESC';
        break;
      default:
        orderClause = 'r.created_at DESC';
    }

    const [reviews] = await pool.query(
      `SELECT r.*, u.name as user_name, u.profile_image as user_avatar
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? AND r.is_approved = TRUE 
       ORDER BY ${orderClause}
       LIMIT ? OFFSET ?`,
      [productId, parseInt(limit), offset]
    );

    // Parse images JSON for each review
    const parsedReviews = reviews.map(review => ({
      ...review,
      images: review.images ? (typeof review.images === 'string' ? JSON.parse(review.images) : review.images) : []
    }));

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND is_approved = TRUE',
      [productId]
    );

    // Get rating distribution
    const [distribution] = await pool.query(
      `SELECT rating, COUNT(*) as count 
       FROM reviews WHERE product_id = ? AND is_approved = TRUE 
       GROUP BY rating`,
      [productId]
    );

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => {
      ratingDistribution[Math.floor(d.rating)] = d.count;
    });

    res.json({
      reviews: parsedReviews,
      ratingDistribution,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle helpful vote on a review
const toggleReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists
    const [reviews] = await pool.query('SELECT id, helpful_count FROM reviews WHERE id = ?', [reviewId]);
    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already voted
    const [existing] = await pool.query(
      'SELECT id FROM review_helpful_votes WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    let voted = false;
    let newCount = reviews[0].helpful_count || 0;

    if (existing.length > 0) {
      // Remove vote
      await pool.query(
        'DELETE FROM review_helpful_votes WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );
      newCount = Math.max(0, newCount - 1);
    } else {
      // Add vote
      await pool.query(
        'INSERT INTO review_helpful_votes (review_id, user_id) VALUES (?, ?)',
        [reviewId, userId]
      );
      newCount = newCount + 1;
      voted = true;
    }

    // Update helpful_count on review
    await pool.query(
      'UPDATE reviews SET helpful_count = ? WHERE id = ?',
      [newCount, reviewId]
    );

    res.json({ 
      message: voted ? 'Marked as helpful' : 'Removed helpful vote',
      helpful_count: newCount,
      voted
    });
  } catch (error) {
    console.error('Toggle helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product recommendations (similar products)
const getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 8;

    // First get the current product details
    const [currentProduct] = await pool.query(
      'SELECT category, metal_price, making_charges FROM products WHERE id = ?',
      [id]
    );

    if (currentProduct.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { category, metal_price, making_charges } = currentProduct[0];
    const totalPrice = parseFloat(metal_price || 0) + parseFloat(making_charges || 0);
    
    // Calculate price range (±30%)
    const minPrice = totalPrice * 0.7;
    const maxPrice = totalPrice * 1.3;

    // Get similar products: same category, similar price, exclude current product
    const [recommendations] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.category = ?
        AND p.id != ?
        AND p.is_active = 1
        AND (p.metal_price + COALESCE(p.making_charges, 0)) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY RAND()
      LIMIT ?
    `, [category, id, minPrice, maxPrice, limit]);

    // If not enough recommendations from same category/price, fill with category-only
    if (recommendations.length < limit) {
      const existingIds = recommendations.map(p => p.id);
      existingIds.push(parseInt(id));
      
      const [moreProducts] = await pool.query(`
        SELECT 
          p.*,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(r.id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.category = ?
          AND p.id NOT IN (?)
          AND p.is_active = 1
        GROUP BY p.id
        ORDER BY RAND()
        LIMIT ?
      `, [category, existingIds, limit - recommendations.length]);

      recommendations.push(...moreProducts);
    }

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get review to find product_id for updating stats
    const [reviews] = await pool.query('SELECT product_id FROM reviews WHERE id = ?', [reviewId]);
    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const productId = reviews[0].product_id;

    // Delete helpful votes first (foreign key constraint)
    await pool.query('DELETE FROM review_helpful_votes WHERE review_id = ?', [reviewId]);
    
    // Delete the review
    await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // Update product rating and review count
    const [stats] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
       FROM reviews WHERE product_id = ? AND is_approved = TRUE`,
      [productId]
    );

    await pool.query(
      'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
      [stats[0].avg_rating || 0, stats[0].count || 0, productId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getCategories,
  searchProducts,
  addReview,
  getProductReviews,
  getRecommendations,
  toggleReviewHelpful,
  deleteReview
};
