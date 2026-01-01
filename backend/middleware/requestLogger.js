// Request logging middleware
const systemLogger = require('../services/systemLogger');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = systemLogger.generateRequestId();
  
  // Record start time
  const startTime = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Skip logging for static assets and health checks
    const skipPaths = ['/favicon.ico', '/health', '/static'];
    if (skipPaths.some(p => req.originalUrl.startsWith(p))) return;
    
    systemLogger.request(req, res, responseTime);
  });
  
  next();
};

module.exports = requestLogger;
