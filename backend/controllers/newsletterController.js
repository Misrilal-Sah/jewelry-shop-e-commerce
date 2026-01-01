const db = require('../config/db');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if already subscribed
    const [existing] = await db.execute(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    // Insert new subscriber
    await db.execute(
      'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())',
      [email]
    );

    res.json({ 
      success: true, 
      message: 'Thank you for subscribing! You will receive updates and exclusive offers.' 
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Failed to subscribe. Please try again.' });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [result] = await db.execute(
      'DELETE FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Email not found in our subscribers list' });
    }

    res.json({ success: true, message: 'You have been unsubscribed successfully' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe. Please try again.' });
  }
};

// Unsubscribe from email link (one-click)
exports.unsubscribeFromLink = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.send(getUnsubscribePageHTML('error', 'Invalid unsubscribe link'));
    }

    // Delete from newsletter_subscribers table
    const [result] = await db.execute(
      'DELETE FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    // Also update email_preferences if exists
    await db.execute(
      'UPDATE email_preferences SET newsletter = FALSE WHERE email = ?',
      [email]
    );

    if (result.affectedRows === 0) {
      return res.send(getUnsubscribePageHTML('info', 'This email is not in our subscribers list'));
    }

    res.send(getUnsubscribePageHTML('success', 'You have been successfully unsubscribed from our newsletter'));
  } catch (error) {
    console.error('Newsletter unsubscribe from link error:', error);
    res.send(getUnsubscribePageHTML('error', 'Something went wrong. Please try again.'));
  }
};

// Generate HTML page for unsubscribe result
const getUnsubscribePageHTML = (type, message) => {
  const bgColor = type === 'success' ? '#2a5a2a' : type === 'error' ? '#8B0000' : '#d4af37';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Unsubscribe - Aabhar</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background-color: #1a1a1a; 
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 40px;
      max-width: 500px;
    }
    .logo {
      font-size: 24px;
      color: #d4af37;
      margin-bottom: 30px;
      letter-spacing: 3px;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: ${bgColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 25px;
      font-size: 36px;
    }
    h1 { 
      font-size: 24px; 
      margin-bottom: 15px;
      color: ${bgColor === '#d4af37' ? '#fff' : bgColor === '#2a5a2a' ? '#4ade80' : '#ef4444'};
    }
    p { 
      color: #888; 
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      padding: 14px 35px;
      background: linear-gradient(135deg, #d4af37, #b7953f);
      color: #000;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✦ Aabhar ✦</div>
    <div class="icon">${icon}</div>
    <h1>${type === 'success' ? 'Unsubscribed!' : type === 'error' ? 'Oops!' : 'Note'}</h1>
    <p>${message}</p>
    <a href="https://Aabhar.in" class="btn">Visit Our Store</a>
  </div>
</body>
</html>
  `;
};
