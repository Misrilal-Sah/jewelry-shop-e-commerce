/**
 * AI Chatbot Service
 * Handles FAQ answers, order lookup, and AI responses with fallback chain
 */
const pool = require('../config/db');
const axios = require('axios');

// API Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Models
const GROQ_MODEL = 'llama-3.1-8b-instant';
const OPENROUTER_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

/**
 * System prompt to keep chatbot focused on jewelry shop only
 */
const getSystemPrompt = () => {
  return `You are the Aabhar Jewelry Shop AI assistant. You are helpful, friendly, and professional.

IMPORTANT RULES:
1. You ONLY answer questions about Aabhar Jewelry Shop - our products, orders, shipping, returns, and policies.
2. If asked unrelated questions (like general knowledge, jokes, coding, etc.), politely redirect: "I'm here to help with jewelry-related questions only! Ask me about our products, orders, or services."
3. Keep responses concise and helpful (2-4 sentences). Use numbered steps for "how to" questions.
4. Use ₹ for prices (Indian Rupees).
5. If you don't know specific product details, suggest browsing our catalog or contacting support.

ABOUT AABHAR JEWELRY:
- Premium 22K/18K gold, diamond, and 925 sterling silver jewelry
- Free shipping on orders above ₹10,000
- 15-day easy returns and exchanges
- 100% BIS Hallmarked gold, certified diamonds
- Secure payment via Razorpay (Cards, UPI, Net Banking, EMI)
- Cash on Delivery available up to ₹50,000
- First-time discount: 10% off with code WELCOME10

HOW TO GUIDES:
- Add to Wishlist: Click the heart icon on any product
- Add Review: Go to product page > Reviews section > Write a Review (purchase required)
- Track Order: My Account > My Orders > Click order to view status
- Apply Coupon: Add items to cart > Enter code in "Apply Coupon" field
- Add to Cart: Click "Add to Cart" on product page > Proceed to checkout

For order status questions, ask for the order ID (format: ORD-XXXX).
For product recommendations, ask about their preferences (gold/silver/diamond, budget, occasion).`;
};

/**
 * Call Groq API (Primary)
 */
const callGroq = async (messages) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await axios.post(GROQ_API_URL, {
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 500
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return response.data.choices[0].message.content;
};

/**
 * Call OpenRouter API (Fallback)
 */
const callOpenRouter = async (messages, keyIndex = 0) => {
  const keys = [
    process.env.OPENROUTER_KEY_1,
    process.env.OPENROUTER_KEY_2
  ];
  
  const apiKey = keys[keyIndex];
  if (!apiKey) throw new Error(`OPENROUTER_KEY_${keyIndex + 1} not configured`);

  const response = await axios.post(OPENROUTER_API_URL, {
    model: OPENROUTER_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 500
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'Aabhar Jewelry Chatbot'
    }
  });

  return response.data.choices[0].message.content;
};

/**
 * AI with fallback chain: Groq -> OpenRouter #1 -> OpenRouter #2
 */
const aiWithFallback = async (userMessage, conversationHistory = []) => {
  const messages = [
    { role: 'system', content: getSystemPrompt() },
    ...conversationHistory.slice(-5), // Keep last 5 messages for context
    { role: 'user', content: userMessage }
  ];

  // Try Groq first
  try {
    console.log('🤖 Trying Groq API...');
    const response = await callGroq(messages);
    console.log('✅ Groq API success');
    return { response, provider: 'groq' };
  } catch (error) {
    console.log('⚠️ Groq failed:', error.message);
  }

  // Fallback to OpenRouter Key 1
  try {
    console.log('🤖 Trying OpenRouter Key 1...');
    const response = await callOpenRouter(messages, 0);
    console.log('✅ OpenRouter Key 1 success');
    return { response, provider: 'openrouter-1' };
  } catch (error) {
    console.log('⚠️ OpenRouter Key 1 failed:', error.message);
  }

  // Fallback to OpenRouter Key 2
  try {
    console.log('🤖 Trying OpenRouter Key 2...');
    const response = await callOpenRouter(messages, 1);
    console.log('✅ OpenRouter Key 2 success');
    return { response, provider: 'openrouter-2' };
  } catch (error) {
    console.log('❌ All AI providers failed:', error.message);
    throw new Error('All AI providers unavailable. Please try again later.');
  }
};

/**
 * Detect order ID in message
 */
const extractOrderId = (message) => {
  // Match patterns like: ORD-1234, ORD1234, order 1234, #1234
  const patterns = [
    /ORD-?(\d+)/i,
    /order\s*#?\s*(\d+)/i,
    /#(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return `ORD-${match[1]}`;
    }
  }
  return null;
};

/**
 * Lookup order in database
 */
const lookupOrder = async (orderId, userEmail = null) => {
  try {
    let query = `
      SELECT o.id, o.order_id, o.status, o.total, o.created_at, o.tracking_number,
             u.name as customer_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.order_id = ?
    `;
    const params = [orderId];
    
    // If user email provided, verify ownership
    if (userEmail) {
      query += ' AND u.email = ?';
      params.push(userEmail);
    }
    
    const [orders] = await pool.query(query, params);
    
    if (orders.length === 0) {
      return null;
    }
    
    const order = orders[0];
    return {
      orderId: order.order_id,
      status: order.status,
      total: order.total,
      date: order.created_at,
      tracking: order.tracking_number,
      customerName: order.customer_name
    };
  } catch (error) {
    console.error('Order lookup error:', error);
    return null;
  }
};

/**
 * Format order status for display
 */
const formatOrderResponse = (order) => {
  const statusEmoji = {
    'pending': '🕐',
    'confirmed': '✅',
    'processing': '⚙️',
    'shipped': '📦',
    'delivered': '🎉',
    'cancelled': '❌'
  };
  
  const emoji = statusEmoji[order.status.toLowerCase()] || '📋';
  
  let response = `${emoji} **Order ${order.orderId}**\n`;
  response += `Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n`;
  response += `Amount: ₹${parseFloat(order.total).toLocaleString()}\n`;
  response += `Placed: ${new Date(order.date).toLocaleDateString('en-IN')}`;
  
  if (order.tracking) {
    response += `\nTracking: ${order.tracking}`;
  }
  
  if (order.status.toLowerCase() === 'shipped') {
    response += '\n\nYour order is on the way! 🚚';
  } else if (order.status.toLowerCase() === 'delivered') {
    response += '\n\nThank you for shopping with us! ❤️';
  }
  
  return response;
};

/**
 * Search FAQs in database - with improved matching
 */
const searchFAQs = async (query) => {
  try {
    // Skip common words that cause false matches
    const stopWords = ['how', 'do', 'i', 'the', 'a', 'an', 'is', 'can', 'to', 'what', 'where', 'when', 'why', 'are', 'my', 'your', 'you', 'me'];
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));
    
    if (keywords.length === 0) return null;
    
    // For very short queries (1-2 meaningful keywords), require exact phrase match in question
    if (keywords.length <= 2) {
      const [faqs] = await pool.query(`
        SELECT question, answer 
        FROM faqs 
        WHERE is_active = 1 AND LOWER(question) LIKE ?
        LIMIT 1
      `, [`%${keywords.join(' ')}%`]);
      
      if (faqs.length > 0) {
        return faqs[0];
      }
      return null;
    }
    
    // For longer queries, require at least 50% keyword match
    const [faqs] = await pool.query(`
      SELECT question, answer,
        (${keywords.map(() => `(CASE WHEN LOWER(question) LIKE ? THEN 1 ELSE 0 END)`).join(' + ')}) as match_score
      FROM faqs 
      WHERE is_active = 1
      HAVING match_score >= ?
      ORDER BY match_score DESC
      LIMIT 1
    `, [...keywords.map(k => `%${k}%`), Math.ceil(keywords.length * 0.5)]);
    
    if (faqs.length > 0 && faqs[0].match_score > 0) {
      return faqs[0];
    }
    
    return null;
  } catch (error) {
    console.error('FAQ search error:', error);
    return null;
  }
};

/**
 * Search knowledge base for relevant context
 */
const searchKnowledge = async (query) => {
  try {
    const stopWords = ['how', 'do', 'i', 'the', 'a', 'an', 'is', 'can', 'to', 'what', 'where', 'when', 'why', 'are', 'my', 'your', 'you', 'me', 'about'];
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));
    
    if (keywords.length === 0) return [];
    
    // Search keywords in topic, title, keywords columns
    const searchConditions = keywords.map(() => 
      '(LOWER(topic) LIKE ? OR LOWER(title) LIKE ? OR LOWER(keywords) LIKE ?)'
    ).join(' OR ');
    
    const searchParams = keywords.flatMap(k => [`%${k}%`, `%${k}%`, `%${k}%`]);
    
    const [results] = await pool.query(`
      SELECT topic, title, content 
      FROM chatbot_knowledge 
      WHERE is_active = 1 AND (${searchConditions})
      LIMIT 3
    `, searchParams);
    
    return results;
  } catch (error) {
    console.error('Knowledge search error:', error);
    return [];
  }
};

/**
 * Main chat handler
 */
const handleMessage = async (message, conversationHistory = [], userEmail = null) => {
  const userMessage = message.trim();
  
  if (!userMessage) {
    return { 
      response: "Hello! How can I help you with your jewelry needs today?",
      type: 'greeting'
    };
  }
  
  // Check for order ID in message
  const orderId = extractOrderId(userMessage);
  if (orderId) {
    const order = await lookupOrder(orderId, userEmail);
    if (order) {
      return {
        response: formatOrderResponse(order),
        type: 'order',
        data: order
      };
    } else {
      return {
        response: `I couldn't find order ${orderId}. Please check the order ID and try again. If you're logged in, I can only show your orders.`,
        type: 'order_not_found'
      };
    }
  }
  
  // Check FAQs for common questions
  const faq = await searchFAQs(userMessage);
  if (faq) {
    return {
      response: faq.answer,
      type: 'faq',
      data: { question: faq.question }
    };
  }
  
  // Search knowledge base for context
  const knowledge = await searchKnowledge(userMessage);
  let knowledgeContext = '';
  if (knowledge.length > 0) {
    knowledgeContext = '\n\nRELEVANT KNOWLEDGE:\n' + knowledge.map(k => 
      `[${k.title}]\n${k.content}`
    ).join('\n\n');
  }
  
  // Fall back to AI with knowledge context
  try {
    const { response, provider } = await aiWithFallback(userMessage + knowledgeContext, conversationHistory);
    return {
      response,
      type: 'ai',
      provider
    };
  } catch (error) {
    console.error('AI response error:', error);
    return {
      response: "I'm having trouble connecting right now. Please try again in a moment, or contact us at support@aabhar.com",
      type: 'error'
    };
  }
};

/**
 * Get quick action suggestions
 */
const getQuickActions = () => {
  return [
    { label: '📦 Track Order', prompt: 'Where is my order?' },
    { label: '🔄 Returns', prompt: 'What is your return policy?' },
    { label: '🚚 Shipping', prompt: 'How long does shipping take?' },
    { label: '💳 Payment', prompt: 'What payment methods do you accept?' }
  ];
};

module.exports = {
  handleMessage,
  getQuickActions,
  lookupOrder,
  searchFAQs,
  aiWithFallback
};
