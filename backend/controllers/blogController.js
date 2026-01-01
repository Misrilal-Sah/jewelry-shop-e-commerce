const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// Get all published blog posts (with pagination)
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 9, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = "WHERE status = 'published'";
    const params = [];

    if (category && category !== 'all') {
      whereClause += " AND category = ?";
      params.push(category);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get posts
    const [posts] = await pool.query(
      `SELECT 
        bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image, 
        bp.category, bp.tags, bp.read_time, bp.view_count, bp.published_at,
        u.name as author_name
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       ${whereClause}
       ORDER BY bp.published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single post by slug
const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [posts] = await pool.query(
      `SELECT 
        bp.*, u.name as author_name, u.profile_image as author_image
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       WHERE bp.slug = ? AND bp.status = 'published'`,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[0];

    // Increment view count (in background, don't wait)
    pool.query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?',
      [post.id]
    ).catch(err => console.error('View count update error:', err));

    // Return the current view count + 1 to show updated value
    post.view_count = post.view_count + 1;

    res.json(post);
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT 
        c.*, 
        (SELECT COUNT(*) FROM blog_posts WHERE category = c.name AND status = 'published') as post_count
       FROM blog_categories c
       ORDER BY c.name ASC`
    );

    res.json(categories);
  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get related posts
const getRelatedPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 3 } = req.query;

    // Get current post category
    const [currentPost] = await pool.query(
      'SELECT category FROM blog_posts WHERE id = ?',
      [id]
    );

    if (currentPost.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get related posts from same category
    const [relatedPosts] = await pool.query(
      `SELECT id, title, slug, excerpt, cover_image, category, read_time, published_at
       FROM blog_posts
       WHERE category = ? AND id != ? AND status = 'published'
       ORDER BY published_at DESC
       LIMIT ?`,
      [currentPost[0].category, id, parseInt(limit)]
    );

    res.json(relatedPosts);
  } catch (error) {
    console.error('Get related posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get featured posts (most viewed)
const getFeaturedPosts = async (req, res) => {
  try {
    const { limit = 3 } = req.query;

    const [posts] = await pool.query(
      `SELECT id, title, slug, excerpt, cover_image, category, read_time, view_count, published_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY view_count DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json(posts);
  } catch (error) {
    console.error('Get featured posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all posts (including drafts) for admin
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`,
      params
    );

    const [posts] = await pool.query(
      `SELECT 
        bp.*, u.name as author_name
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       ${whereClause}
       ORDER BY bp.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single post for editing
const getPostById = async (req, res) => {
  try {
    const [posts] = await pool.query(
      'SELECT * FROM blog_posts WHERE id = ?',
      [req.params.id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(posts[0]);
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new post
const createPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, cover_image, category, tags, status, read_time } = req.body;

    // Generate slug if not provided
    const postSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Check if slug exists
    const [existing] = await pool.query('SELECT id FROM blog_posts WHERE slug = ?', [postSlug]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A post with this slug already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO blog_posts 
       (title, slug, excerpt, content, cover_image, category, tags, author_id, status, read_time, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        postSlug,
        excerpt || null,
        content || null,
        cover_image || null,
        category || 'General',
        JSON.stringify(tags || []),
        req.user.id,
        status || 'draft',
        read_time || 5,
        status === 'published' ? new Date() : null
      ]
    );

    // Audit log
    if (req.user) {
      auditLogger.create(req.user.id, req.user.name, 'BLOG_POST', result.insertId, `Created blog post: ${title}`, { status: status || 'draft', category }, req);
    }

    res.status(201).json({
      message: 'Post created successfully',
      post: { id: result.insertId, slug: postSlug }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, cover_image, category, tags, status, read_time } = req.body;

    // Get current post
    const [current] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if slug changed and already exists
    if (slug && slug !== current[0].slug) {
      const [existing] = await pool.query('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [slug, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'A post with this slug already exists' });
      }
    }

    // Set published_at if being published for first time
    let publishedAt = current[0].published_at;
    if (status === 'published' && current[0].status === 'draft') {
      publishedAt = new Date();
    }

    await pool.query(
      `UPDATE blog_posts SET
        title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?,
        category = ?, tags = ?, status = ?, read_time = ?, published_at = ?
       WHERE id = ?`,
      [
        title || current[0].title,
        slug || current[0].slug,
        excerpt !== undefined ? excerpt : current[0].excerpt,
        content !== undefined ? content : current[0].content,
        cover_image !== undefined ? cover_image : current[0].cover_image,
        category || current[0].category,
        JSON.stringify(tags || JSON.parse(current[0].tags || '[]')),
        status || current[0].status,
        read_time || current[0].read_time,
        publishedAt,
        id
      ]
    );

    // Audit log
    if (req.user) {
      auditLogger.update(req.user.id, req.user.name, 'BLOG_POST', parseInt(id), `Updated blog post: ${current[0].title}`, { status: current[0].status }, { status }, req);
    }

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Get post for audit log before deleting
    const [existing] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const oldData = existing[0];

    await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);

    // Audit log
    if (req.user) {
      auditLogger.delete(req.user.id, req.user.name, 'BLOG_POST', parseInt(id), `Deleted blog post: ${oldData.title}`, oldData, req);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Public
  getPosts,
  getPostBySlug,
  getCategories,
  getRelatedPosts,
  getFeaturedPosts,
  // Admin
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
