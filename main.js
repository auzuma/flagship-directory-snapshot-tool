const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { generateSnapshot, generateOutdir } = require('./electron-adapter');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disable sandbox to allow Node.js modules in preload
      worldSafeExecuteJavaScript: true, // Ensure safe JavaScript execution
      enableRemoteModule: false // Keep remote module disabled for security
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');
  
  // Enable DevTools for debugging
  mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC handlers for directory operations
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-directory-structure', (event, dirPath) => {
  console.log(`Received request to get directory structure for: ${dirPath}`);
  
  if (!dirPath) {
    console.error('No directory path provided');
    return { error: 'No directory path provided' };
  }
  
  try {
    console.log(`Getting directory structure for: ${dirPath}`);
    const structure = getDirectoryStructure(dirPath);
    console.log(`Successfully got directory structure with ${structure.length} items`);
    return structure;
  } catch (error) {
    console.error('Error getting directory structure:', error);
    return { error: error.message || 'Unknown error' };
  }
});

ipcMain.handle('generate-snapshot', async (event, { folderPath, ignoreList, sideText }) => {
  try {
    // Use our JavaScript adapter instead of calling Python
    const snapshotContent = await generateSnapshot(folderPath, ignoreList);
    
    // If side text is provided, append it to the output.md file
    if (sideText) {
      try {
        fs.appendFileSync(
          path.join(__dirname, 'output.md'),
          `\n\n==========================================================\n\n${sideText}`
        );
      } catch (err) {
        console.error('Error appending side text:', err);
      }
    }
    
    // Read the generated output.md file
    try {
      const finalContent = fs.readFileSync(
        path.join(__dirname, 'output.md'),
        'utf-8'
      );
      return { success: true, content: finalContent };
    } catch (err) {
      return { success: false, error: `Error reading output.md: ${err.message}` };
    }
  } catch (error) {
    console.error('Error generating snapshot:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('recreate-directory', async (event, { outputDir, snapshotContent }) => {
  try {
    // Use our JavaScript adapter instead of calling Python
    const result = await generateOutdir(outputDir, snapshotContent);
    return { success: true, message: result };
  } catch (error) {
    console.error('Error recreating directory:', error);
    return { success: false, error: typeof error === 'string' ? error : error.message || 'Unknown error' };
  }
});

// Helper function to get directory structure
function getDirectoryStructure(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const structure = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const isDirectory = entry.isDirectory();
      
      structure.push({
        name: entry.name,
        path: fullPath,
        isDirectory,
        isDefaultIgnored: ['.git', 'node_modules', '__pycache__', 'venv', 'dist', 'build'].includes(entry.name)
      });
      
      // Don't recurse into directories here to avoid performance issues
      // The frontend will request children when expanding a directory
    }
    
    return structure;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }
}
