const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'debug.log');

// Clear log file on server start
fs.writeFileSync(logFilePath, `=== Debug Log Started: ${new Date().toISOString()} ===\n`);

const debug = {
  log: (...args) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] LOG: ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    fs.appendFileSync(logFilePath, message);
    console.log(...args); // Also log to console
  },
  
  error: (...args) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ERROR: ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    fs.appendFileSync(logFilePath, message);
    console.error(...args);
  },
  
  info: (...args) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] INFO: ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    fs.appendFileSync(logFilePath, message);
    console.log(...args);
  },

  clear: () => {
    fs.writeFileSync(logFilePath, `=== Log Cleared: ${new Date().toISOString()} ===\n`);
  }
};

module.exports = debug;
