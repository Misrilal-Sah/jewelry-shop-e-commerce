const pool = require('../config/db');
const auditLogger = require('../services/auditLogger');

// Get active FAQs (public)
const getFaqs = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM faqs WHERE is_active = TRUE';
    const params = [];
    
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    const [faqs] = await pool.query(query, params);
    res.json(faqs);
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all FAQs (admin)
const getAllFaqs = async (req, res) => {
  try {
    const [faqs] = await pool.query(
      'SELECT * FROM faqs ORDER BY category ASC, display_order ASC, created_at DESC'
    );
    res.json(faqs);
  } catch (error) {
    console.error('Get all FAQs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create FAQ (admin)
const createFaq = async (req, res) => {
  try {
    const { question, answer, category, display_order } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO faqs (question, answer, category, display_order) VALUES (?, ?, ?, ?)',
      [question, answer, category || 'General', display_order || 0]
    );
    
    // Audit log
    if (req.user) {
      auditLogger.create(req.user.id, req.user.name, 'FAQ', result.insertId, `Created FAQ: ${question.substring(0, 50)}...`, { category: category || 'General' }, req);
    }
    
    res.status(201).json({ message: 'FAQ created', id: result.insertId });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update FAQ (admin)
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, display_order, is_active } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    const oldData = existing[0];
    
    await pool.query(
      `UPDATE faqs SET 
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        category = COALESCE(?, category),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [question, answer, category, display_order, is_active, id]
    );
    
    // Audit log
    if (req.user) {
      auditLogger.update(req.user.id, req.user.name, 'FAQ', parseInt(id), `Updated FAQ #${id}`, { is_active: oldData.is_active }, { is_active }, req);
    }
    
    res.json({ message: 'FAQ updated' });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete FAQ (admin)
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get FAQ before deleting for audit log
    const [existing] = await pool.query('SELECT * FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    const oldData = existing[0];
    
    await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
    
    // Audit log
    if (req.user) {
      auditLogger.delete(req.user.id, req.user.name, 'FAQ', parseInt(id), `Deleted FAQ: ${oldData.question.substring(0, 50)}...`, oldData, req);
    }
    
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get FAQ categories (for grouping)
const getFaqCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM faqs WHERE is_active = TRUE ORDER BY category'
    );
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get FAQ categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFaqs,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqCategories
};
