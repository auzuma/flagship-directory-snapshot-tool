// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

console.log('Preload script starting...');

// Try to load the token-counter module
let tokenCounter;
try {
  console.log('Attempting to load token-counter module...');
  tokenCounter = require(path.join(__dirname, 'token-counter.js'));
  console.log('Successfully loaded token-counter module');
} catch (error) {
  console.error('Error loading token-counter module:', error);
  // Provide a fallback token counter
  tokenCounter = {
    countTokens: (text) => {
      if (!text) return 0;
      
      // Simple approximation - count words and newlines
      const tokens = text.split(/[\s,.!?;:()\[\]{}'"<>\/\\|=+\-*&^%$#@~`]+/)
        .filter(token => token.length > 0);
      
      const newlines = (text.match(/\n/g) || []).length;
      
      return tokens.length + newlines;
    }
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  console.log('Setting up contextBridge...');
  
  contextBridge.exposeInMainWorld(
    'api', {
      selectDirectory: () => {
        console.log('Renderer called selectDirectory');
        return ipcRenderer.invoke('select-directory');
      },
      getDirectoryStructure: (dirPath) => {
        console.log(`Renderer called getDirectoryStructure with path: ${dirPath}`);
        return ipcRenderer.invoke('get-directory-structure', dirPath);
      },
      generateSnapshot: (options) => {
        console.log('Renderer called generateSnapshot');
        return ipcRenderer.invoke('generate-snapshot', options);
      },
      recreateDirectory: (options) => {
        console.log('Renderer called recreateDirectory');
        return ipcRenderer.invoke('recreate-directory', options);
      },
      countTokens: (text) => {
        console.log('Renderer called countTokens');
        return tokenCounter.countTokens(text);
      }
    }
  );
  
  console.log('contextBridge setup complete');
} catch (error) {
  console.error('Error in preload script:', error);
}
