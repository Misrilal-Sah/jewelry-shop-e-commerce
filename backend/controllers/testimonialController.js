const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// Get active testimonials (public)
const getTestimonials = async (req, res) => {
  try {
    const [testimonials] = await pool.query(
      `SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC`
    );
    res.json(testimonials);
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all testimonials (admin)
const getAllTestimonials = async (req, res) => {
  try {
    const [testimonials] = await pool.query(
      `SELECT * FROM testimonials ORDER BY display_order ASC, created_at DESC`
    );
    res.json(testimonials);
  } catch (error) {
    console.error('Get all testimonials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create testimonial (admin)
const createTestimonial = async (req, res) => {
  try {
    const { customer_name, customer_location, customer_image, testimonial_text, rating, display_order } = req.body;
    
    if (!customer_name || !testimonial_text) {
      return res.status(400).json({ message: 'Customer name and testimonial text are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO testimonials (customer_name, customer_location, customer_image, testimonial_text, rating, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_location || null, customer_image || null, testimonial_text, rating || 5, display_order || 0]
    );
    
    // Audit log
    if (req.user) {
      auditLogger.create(req.user.id, req.user.name, 'TESTIMONIAL', result.insertId, `Created testimonial by: ${customer_name}`, { customer_name, rating }, req);
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
    const { customer_name, customer_location, customer_image, testimonial_text, rating, is_active, display_order } = req.body;
    
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
        display_order = COALESCE(?, display_order)
       WHERE id = ?`,
      [customer_name, customer_location, customer_image, testimonial_text, rating, is_active, display_order, id]
    );
    
    // Audit log
    if (req.user) {
      auditLogger.update(req.user.id, req.user.name, 'TESTIMONIAL', parseInt(id), `Updated testimonial by: ${oldData.customer_name}`, { is_active: oldData.is_active }, { is_active }, req);
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
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
