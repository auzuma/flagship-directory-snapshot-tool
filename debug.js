// Debug helper for Electron
const fs = require('fs');
const path = require('path');
const util = require('util');

// Create a log file in the app directory
const logFile = path.join(__dirname, 'electron-debug.log');

// Clear the log file on startup
try {
  fs.writeFileSync(logFile, '');
} catch (err) {
  console.error('Failed to clear log file:', err);
}

// Override console methods to also write to file
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

function formatMessage(...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'string') return arg;
    return util.inspect(arg, { depth: null });
  }).join(' ');
  
  return `[${timestamp}] ${message}`;
}

function writeToLog(type, ...args) {
  try {
    const formattedMessage = formatMessage(...args);
    const logMessage = `[${type.toUpperCase()}] ${formattedMessage}\n`;
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    originalConsole.error('Failed to write to log file:', err);
  }
}

// Override console methods
console.log = function(...args) {
  originalConsole.log(...args);
  writeToLog('log', ...args);
};

console.error = function(...args) {
  originalConsole.error(...args);
  writeToLog('error', ...args);
};

console.warn = function(...args) {
  originalConsole.warn(...args);
  writeToLog('warn', ...args);
};

console.info = function(...args) {
  originalConsole.info(...args);
  writeToLog('info', ...args);
};

// Add a global error handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Helper function to dump environment information
function dumpEnvironmentInfo() {
  console.log('Node.js version:', process.version);
  console.log('Electron path:', process.versions.electron ? `v${process.versions.electron}` : 'Not in Electron');
  console.log('Process type:', process.type || 'main');
  console.log('Process ID:', process.pid);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('App path:', __dirname);
  
  // Log loaded modules
  try {
    console.log('Loaded modules:');
    const modules = Object.keys(require.cache).map(id => {
      return path.relative(__dirname, id);
    });
    console.log(modules);
  } catch (err) {
    console.error('Failed to log modules:', err);
  }
}

// Export helpers
module.exports = {
  dumpEnvironmentInfo,
  logFile
};

// Run environment dump on load
dumpEnvironmentInfo();
