const pool = require('../config/db');

// Get questions for a product (public)
const getProductQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [questions] = await pool.query(
      `SELECT pq.*, u.name as user_name,
       (SELECT COUNT(*) FROM product_answers WHERE question_id = pq.id) as answer_count
       FROM product_questions pq
       JOIN users u ON pq.user_id = u.id
       WHERE pq.product_id = ? AND pq.is_approved = TRUE
       ORDER BY pq.created_at DESC`,
      [id]
    );
    
    // Get answers for each question
    for (let q of questions) {
      const [answers] = await pool.query(
        `SELECT pa.*, u.name as user_name, u.role as user_role
         FROM product_answers pa
         LEFT JOIN users u ON pa.user_id = u.id
         WHERE pa.question_id = ?
         ORDER BY pa.is_official DESC, pa.created_at ASC`,
        [q.id]
      );
      q.answers = answers;
    }
    
    res.json(questions);
  } catch (error) {
    console.error('Get product questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ask a question (authenticated)
const askQuestion = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;
    
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }
    
    // Check if product exists
    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO product_questions (product_id, user_id, question) VALUES (?, ?, ?)',
      [productId, userId, question.trim()]
    );
    
    res.status(201).json({ 
      message: 'Question submitted successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Answer a question (authenticated)
const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'Answer is required' });
    }
    
    // Check if question exists
    const [questions] = await pool.query(
      'SELECT id FROM product_questions WHERE id = ?',
      [questionId]
    );
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO product_answers (question_id, user_id, answer, is_official) VALUES (?, ?, ?, ?)',
      [questionId, userId, answer.trim(), isAdmin]
    );
    
    // Mark question as answered
    await pool.query(
      'UPDATE product_questions SET is_answered = TRUE WHERE id = ?',
      [questionId]
    );
    
    res.status(201).json({ 
      message: 'Answer submitted successfully',
      id: result.insertId,
      is_official: isAdmin
    });
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all questions for admin
const getAllQuestions = async (req, res) => {
  try {
    const { productId, unanswered } = req.query;
    
    let query = `
      SELECT pq.*, u.name as user_name, p.name as product_name,
      (SELECT COUNT(*) FROM product_answers WHERE question_id = pq.id) as answer_count
      FROM product_questions pq
      JOIN users u ON pq.user_id = u.id
      JOIN products p ON pq.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (productId) {
      query += ' AND pq.product_id = ?';
      params.push(productId);
    }
    
    if (unanswered === 'true') {
      query += ' AND pq.is_answered = FALSE';
    }
    
    query += ' ORDER BY pq.created_at DESC';
    
    const [questions] = await pool.query(query, params);
    res.json(questions);
  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete question (admin)
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete answers first
    await pool.query('DELETE FROM product_answers WHERE question_id = ?', [id]);
    
    // Delete question
    const [result] = await pool.query('DELETE FROM product_questions WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete answer (admin)
const deleteAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM product_answers WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    
    res.json({ message: 'Answer deleted' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProductQuestions,
  askQuestion,
  answerQuestion,
  getAllQuestions,
  deleteQuestion,
  deleteAnswer
};
