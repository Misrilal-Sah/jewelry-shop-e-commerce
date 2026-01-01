const pool = require('../config/db');

// Get wishlist
const getWishlist = async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT w.id, w.product_id, w.created_at, p.*,
              fs.id as flash_sale_id, fs.discount_percentage, fs.flash_price, fs.end_time as flash_end_time
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN flash_sales fs ON p.id = fs.product_id 
         AND fs.is_active = TRUE 
         AND fs.start_time <= NOW() 
         AND fs.end_time > NOW()
       WHERE w.user_id = ? AND p.is_active = TRUE
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    
    // Calculate item prices with flash sale discount
    const enrichedItems = items.map(item => {
      const basePrice = parseFloat(item.metal_price) + parseFloat(item.making_charges);
      let itemPrice = basePrice;
      let flashSaleApplied = false;
      let flashSaleDiscount = 0;
      
      if (item.flash_sale_id) {
        flashSaleApplied = true;
        flashSaleDiscount = parseFloat(item.discount_percentage);
        itemPrice = item.flash_price 
          ? parseFloat(item.flash_price) 
          : basePrice * (1 - flashSaleDiscount / 100);
      }
      
      const gst = itemPrice * (parseFloat(item.gst_percent || 3) / 100);
      const totalPrice = itemPrice + gst;
      
      return {
        ...item,
        item_price: itemPrice,
        original_price: basePrice,
        total_price: totalPrice,
        flash_sale_applied: flashSaleApplied,
        flash_sale_discount: flashSaleDiscount
      };
    });
    
    res.json(enrichedItems);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;

    // Check if already in wishlist
    const [existing] = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already in wishlist' });
    }

    await pool.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, product_id]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM wishlist WHERE product_id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if product is in wishlist
const checkWishlist = async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.json({ inWishlist: existing.length > 0 });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate unique share code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate or get existing share link
const generateShareLink = async (req, res) => {
  try {
    // Check if user already has an active share link
    const [existing] = await pool.query(
      'SELECT share_code FROM wishlist_shares WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );

    if (existing.length > 0) {
      return res.json({ shareCode: existing[0].share_code });
    }

    // Generate new share code
    const shareCode = generateCode();
    await pool.query(
      'INSERT INTO wishlist_shares (user_id, share_code) VALUES (?, ?)',
      [req.user.id, shareCode]
    );

    res.json({ shareCode });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shared wishlist (public)
const getSharedWishlist = async (req, res) => {
  try {
    const { shareCode } = req.params;

    // Get share info
    const [shares] = await pool.query(
      `SELECT ws.*, u.name as user_name 
       FROM wishlist_shares ws
       JOIN users u ON ws.user_id = u.id
       WHERE ws.share_code = ? AND ws.is_active = TRUE`,
      [shareCode]
    );

    if (shares.length === 0) {
      return res.status(404).json({ message: 'Wishlist not found or no longer shared' });
    }

    const share = shares[0];

    // Increment view count and get updated value
    await pool.query(
      'UPDATE wishlist_shares SET view_count = view_count + 1 WHERE id = ?',
      [share.id]
    );

    // Get wishlist items
    const [items] = await pool.query(
      `SELECT w.id, w.product_id, w.created_at, p.* 
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? AND p.is_active = TRUE
       ORDER BY w.created_at DESC`,
      [share.user_id]
    );

    // Return current view_count (before increment) since React StrictMode calls twice
    res.json({
      userName: share.user_name,
      viewCount: share.view_count,
      likeCount: share.like_count || 0,
      shareId: share.id,
      items
    });
  } catch (error) {
    console.error('Get shared wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Disable wishlist sharing
const disableShare = async (req, res) => {
  try {
    await pool.query(
      'UPDATE wishlist_shares SET is_active = FALSE WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Sharing disabled' });
  } catch (error) {
    console.error('Disable share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get share status
const getShareStatus = async (req, res) => {
  try {
    const [shares] = await pool.query(
      'SELECT share_code, view_count, like_count, is_active FROM wishlist_shares WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );
    
    if (shares.length === 0) {
      return res.json({ isSharing: false });
    }

    res.json({
      isSharing: true,
      shareCode: shares[0].share_code,
      viewCount: shares[0].view_count,
      likeCount: shares[0].like_count
    });
  } catch (error) {
    console.error('Get share status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like/Unlike shared wishlist (requires auth)
const likeSharedWishlist = async (req, res) => {
  try {
    const { shareCode } = req.params;
    const userId = req.user.id;

    // Check if share exists
    const [shares] = await pool.query(
      'SELECT id, like_count FROM wishlist_shares WHERE share_code = ? AND is_active = TRUE',
      [shareCode]
    );

    if (shares.length === 0) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    const shareId = shares[0].id;

    // Check if user already liked
    const [existingLike] = await pool.query(
      'SELECT id FROM wishlist_likes WHERE user_id = ? AND share_id = ?',
      [userId, shareId]
    );

    if (existingLike.length > 0) {
      // Unlike - remove the like
      await pool.query('DELETE FROM wishlist_likes WHERE user_id = ? AND share_id = ?', [userId, shareId]);
      await pool.query('UPDATE wishlist_shares SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [shareId]);
      
      const [updated] = await pool.query('SELECT like_count FROM wishlist_shares WHERE id = ?', [shareId]);
      
      res.json({ 
        liked: false,
        likeCount: updated[0].like_count,
        message: 'Unliked' 
      });
    } else {
      // Like - add the like
      await pool.query('INSERT INTO wishlist_likes (user_id, share_id) VALUES (?, ?)', [userId, shareId]);
      await pool.query('UPDATE wishlist_shares SET like_count = like_count + 1 WHERE id = ?', [shareId]);
      
      const [updated] = await pool.query('SELECT like_count FROM wishlist_shares WHERE id = ?', [shareId]);
      
      res.json({ 
        liked: true,
        likeCount: updated[0].like_count,
        message: 'Liked!' 
      });
    }
  } catch (error) {
    console.error('Like wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user has liked a shared wishlist
const checkWishlistLike = async (req, res) => {
  try {
    const { shareCode } = req.params;
    const userId = req.user.id;

    const [shares] = await pool.query(
      'SELECT id FROM wishlist_shares WHERE share_code = ? AND is_active = TRUE',
      [shareCode]
    );

    if (shares.length === 0) {
      return res.json({ liked: false });
    }

    const [like] = await pool.query(
      'SELECT id FROM wishlist_likes WHERE user_id = ? AND share_id = ?',
      [userId, shares[0].id]
    );

    res.json({ liked: like.length > 0 });
  } catch (error) {
    console.error('Check like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  generateShareLink,
  getSharedWishlist,
  disableShare,
  getShareStatus,
  likeSharedWishlist,
  checkWishlistLike
};
