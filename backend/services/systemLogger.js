// System Logger Service - CloudWatch-like application logging
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Generate unique request ID
const generateRequestId = () => uuidv4();

// Log to database
const logToDatabase = async (level, message, meta = {}) => {
  try {
    await pool.query(
      `INSERT INTO system_logs 
       (level, message, meta, source, request_id, user_id, ip_address, endpoint, method, status_code, response_time, stack_trace) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        level,
        message,
        meta.details ? JSON.stringify(meta.details) : null,
        meta.source || 'app',
        meta.requestId || null,
        meta.userId || null,
        meta.ip || null,
        meta.endpoint || null,
        meta.method || null,
        meta.statusCode || null,
        meta.responseTime || null,
        meta.stack || null
      ]
    );
  } catch (error) {
    // Fallback to console if DB fails
    console.error('System log DB error:', error.message);
  }
};

// Console formatting
const formatConsole = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const prefix = {
    error: '❌ ERROR',
    warn: '⚠️ WARN',
    info: 'ℹ️ INFO',
    debug: '🔍 DEBUG'
  };
  return `[${timestamp}] ${prefix[level] || level.toUpperCase()}: ${message}`;
};

// Main logger object
const systemLogger = {
  error: (message, meta = {}) => {
    console.error(formatConsole('error', message, meta));
    if (meta.error) {
      meta.stack = meta.error.stack;
      meta.details = { ...meta.details, errorMessage: meta.error.message };
    }
    logToDatabase('error', message, meta);
  },

  warn: (message, meta = {}) => {
    console.warn(formatConsole('warn', message, meta));
    logToDatabase('warn', message, meta);
  },

  info: (message, meta = {}) => {
    console.log(formatConsole('info', message, meta));
    logToDatabase('info', message, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatConsole('debug', message, meta));
    }
    logToDatabase('debug', message, meta);
  },

  // Log API request (used by middleware)
  request: (req, res, responseTime) => {
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.originalUrl} - ${statusCode} (${responseTime}ms)`;
    
    logToDatabase(level, message, {
      requestId: req.requestId,
      userId: req.user?.id || null,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode,
      responseTime,
      source: 'api'
    });
  },

  generateRequestId
};

module.exports = systemLogger;
