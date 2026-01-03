const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const blogController = require('../controllers/blogController');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all published posts (with pagination and category filter)
router.get('/posts', blogController.getPosts);

// Get featured posts
router.get('/posts/featured', blogController.getFeaturedPosts);

// Get all categories
router.get('/categories', blogController.getCategories);

// Get related posts
router.get('/posts/:id/related', blogController.getRelatedPosts);

// Get single post by slug (must be after other /posts routes)
router.get('/posts/:slug', blogController.getPostBySlug);

// ============================================
// ADMIN ROUTES (require admin authentication + permission)
// ============================================

// Get all posts (including drafts)
router.get('/admin/posts', authMiddleware, adminMiddleware, requirePermission('blog', 'view'), blogController.getAllPosts);

// Get single post by ID for editing
router.get('/admin/posts/:id', authMiddleware, adminMiddleware, requirePermission('blog', 'view'), blogController.getPostById);

// Create new post
router.post('/admin/posts', authMiddleware, adminMiddleware, requirePermission('blog', 'create'), blogController.createPost);

// Update post
router.put('/admin/posts/:id', authMiddleware, adminMiddleware, requirePermission('blog', 'edit'), blogController.updatePost);

// Delete post
router.delete('/admin/posts/:id', authMiddleware, adminMiddleware, requirePermission('blog', 'delete'), blogController.deletePost);

module.exports = router;


