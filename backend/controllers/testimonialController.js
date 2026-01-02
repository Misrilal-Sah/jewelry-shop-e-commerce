const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// Get active testimonials for homepage (public)
const getTestimonials = async (req, res) => {
  try {
    const [testimonials] = await pool.query(
      `SELECT t.*, 
              u.name as user_name, 
              u.profile_image as user_profile_image,
              (SELECT city FROM addresses WHERE user_id = t.user_id AND is_default = 1 LIMIT 1) as user_city
       FROM testimonials t 
       LEFT JOIN users u ON t.user_id = u.id 
       WHERE t.status = 'approved' AND t.is_homepage = 1 
       ORDER BY t.display_order ASC, t.created_at DESC`
    );
    
    // Use user data as fallback if testimonial doesn't have it
    const enrichedTestimonials = testimonials.map(t => ({
      ...t,
      customer_image: t.customer_image || t.user_profile_image,
      customer_location: t.customer_location || t.user_city,
      customer_name: t.customer_name || t.user_name
    }));
    
    res.json(enrichedTestimonials);
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all testimonials (admin)
const getAllTestimonials = async (req, res) => {
  try {
    const [testimonials] = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM testimonials t 
       LEFT JOIN users u ON t.user_id = u.id 
       ORDER BY 
         CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END,
         t.display_order ASC, 
         t.created_at DESC`
    );
    res.json(testimonials);
  } catch (error) {
    console.error('Get all testimonials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit testimonial (customer - requires auth)
const submitTestimonial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, testimonial_text } = req.body;
    
    if (!testimonial_text || !testimonial_text.trim()) {
      return res.status(400).json({ message: 'Testimonial text is required' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Get user's name, email and profile image from database
    const [users] = await pool.query(
      'SELECT name, email, profile_image FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    // Use name if available, otherwise use email username
    const customerName = user.name || user.email?.split('@')[0] || 'Customer';
    const profileImage = user.profile_image || null;
    
    // Get user's city from their default address for location
    const [addresses] = await pool.query(
      'SELECT city FROM addresses WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [userId]
    );
    const location = addresses.length > 0 ? addresses[0].city : null;
    
    const [result] = await pool.query(
      `INSERT INTO testimonials (user_id, customer_name, customer_location, customer_image, testimonial_text, rating, status, is_homepage, display_order)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 0)`,
      [userId, customerName, location, profileImage, testimonial_text.trim(), rating]
    );
    
    // Audit log
    auditLogger.create(userId, customerName, 'TESTIMONIAL', result.insertId, `Customer submitted testimonial (pending approval)`, { rating }, req);
    
    res.status(201).json({ 
      message: 'Thank you! Your testimonial has been submitted and will appear after admin approval.',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Submit testimonial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create testimonial (admin)
const createTestimonial = async (req, res) => {
  try {
    const { customer_name, customer_location, customer_image, testimonial_text, rating, display_order, status, is_homepage } = req.body;
    
    if (!customer_name || !testimonial_text) {
      return res.status(400).json({ message: 'Customer name and testimonial text are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO testimonials (customer_name, customer_location, customer_image, testimonial_text, rating, display_order, status, is_homepage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_location || null, customer_image || null, testimonial_text, rating || 5, display_order || 0, status || 'approved', is_homepage === undefined ? 1 : is_homepage]
    );
    
    // Audit log
    if (req.user) {
      auditLogger.create(req.user.id, req.user.name, 'TESTIMONIAL', result.insertId, `Created testimonial by: ${customer_name}`, { customer_name, rating, status }, req);
    }
    
    res.status(201).json({ message: 'Testimonial created', id: result.insertId });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update testimonial (admin)
const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_location, customer_image, testimonial_text, rating, is_active, display_order, status, is_homepage } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    const oldData = existing[0];
    
    await pool.query(
      `UPDATE testimonials SET 
        customer_name = COALESCE(?, customer_name),
        customer_location = ?,
        customer_image = ?,
        testimonial_text = COALESCE(?, testimonial_text),
        rating = COALESCE(?, rating),
        is_active = COALESCE(?, is_active),
        display_order = COALESCE(?, display_order),
        status = COALESCE(?, status),
        is_homepage = COALESCE(?, is_homepage)
       WHERE id = ?`,
      [customer_name, customer_location, customer_image, testimonial_text, rating, is_active, display_order, status, is_homepage, id]
    );
    
    // Audit log
    if (req.user) {
      const changes = {};
      if (status !== undefined && status !== oldData.status) changes.status = { old: oldData.status, new: status };
      if (is_homepage !== undefined && is_homepage !== oldData.is_homepage) changes.is_homepage = { old: oldData.is_homepage, new: is_homepage };
      
      auditLogger.update(req.user.id, req.user.name, 'TESTIMONIAL', parseInt(id), `Updated testimonial by: ${oldData.customer_name}`, oldData, { ...oldData, status, is_homepage }, req);
    }
    
    res.json({ message: 'Testimonial updated' });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete testimonial (admin) - also deletes Cloudinary image
const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get testimonial to check for image
    const [testimonials] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    
    if (testimonials.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    
    const oldData = testimonials[0];
    const imageUrl = oldData.customer_image;
    
    // Delete from database
    await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);
    
    // Audit log
    if (req.user) {
      auditLogger.delete(req.user.id, req.user.name, 'TESTIMONIAL', parseInt(id), `Deleted testimonial by: ${oldData.customer_name}`, oldData, req);
    }
    
    // Delete from Cloudinary if image exists
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      try {
        const { extractPublicId, deleteImage } = require('../services/cloudinaryService');
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (cloudError) {
        console.error('Cloudinary delete error:', cloudError);
      }
    }
    
    res.json({ message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTestimonials,
  getAllTestimonials,
  submitTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
