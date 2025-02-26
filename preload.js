// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');
const { countTokens } = require('./token-counter');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getDirectoryStructure: (dirPath) => ipcRenderer.invoke('get-directory-structure', dirPath),
    generateSnapshot: (options) => ipcRenderer.invoke('generate-snapshot', options),
    recreateDirectory: (options) => ipcRenderer.invoke('recreate-directory', options),
    countTokens: (text) => countTokens(text)
  }
);
