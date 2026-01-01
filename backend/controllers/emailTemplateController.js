const pool = require('../config/db');
const emailService = require('../services/emailService');

// Get all templates
const getTemplates = async (req, res) => {
  try {
    const type = req.query.type;
    
    let query = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const [templates] = await pool.query(query, params);
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const [templates] = await pool.query(
      'SELECT * FROM email_templates WHERE id = ?',
      [id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(templates[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create template
const createTemplate = async (req, res) => {
  try {
    const { name, type, subject, content } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO email_templates (name, type, subject, content) VALUES (?, ?, ?, ?)',
      [name, type, subject, JSON.stringify(content || {})]
    );

    res.status(201).json({
      message: 'Template created successfully',
      template: { id: result.insertId, name, type, subject }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, subject, content } = req.body;

    const [existing] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    await pool.query(
      `UPDATE email_templates SET 
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        subject = COALESCE(?, subject),
        content = COALESCE(?, content)
       WHERE id = ?`,
      [name, type, subject, content ? JSON.stringify(content) : null, id]
    );

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT is_default FROM email_templates WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (existing[0].is_default) {
      return res.status(400).json({ message: 'Cannot delete default templates' });
    }

    await pool.query('DELETE FROM email_templates WHERE id = ?', [id]);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Preview template with data
const previewTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const customContent = req.body.content;

    const [templates] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (templates.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const template = templates[0];
    const content = customContent || (typeof template.content === 'string' 
      ? JSON.parse(template.content) 
      : template.content);

    let html;
    switch (template.type) {
      case 'newsletter':
        html = emailService.getWelcomeNewsletterTemplate('preview@example.com');
        break;
      case 'offers':
        html = emailService.getSpecialOffersTemplate('preview@example.com', content);
        break;
      case 'festive':
        html = emailService.getFestiveEmailTemplate('preview@example.com', content);
        break;
      case 'arrivals':
        html = emailService.getNewArrivalsTemplate('preview@example.com', content.products || []);
        break;
      default:
        html = '<p>Preview not available for this template type</p>';
    }

    res.json({ html, template });
  } catch (error) {
    console.error('Preview template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Preview template by type (for campaign preview)
const previewByType = async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Type is required' });
    }

    let html;
    switch (type) {
      case 'newsletter':
        html = emailService.getWelcomeNewsletterTemplate('preview@example.com');
        break;
      case 'offers':
        html = emailService.getSpecialOffersTemplate('preview@example.com', content || {});
        break;
      case 'festive':
        html = emailService.getFestiveEmailTemplate('preview@example.com', content || {});
        break;
      case 'arrivals':
        html = emailService.getNewArrivalsTemplate('preview@example.com', content?.products || []);
        break;
      default:
        html = '<p>Preview not available for this template type</p>';
    }

    res.json({ html, type });
  } catch (error) {
    console.error('Preview by type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  previewByType
};
