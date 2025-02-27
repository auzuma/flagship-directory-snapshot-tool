// Adapter for Python functions to JavaScript
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Generate a snapshot of a directory
function generateSnapshot(rootPath, ignoreList = [], maxWorkers = 8) {
  return new Promise((resolve, reject) => {
    // Convert rootPath to absolute path
    rootPath = path.resolve(rootPath);
    
    // Normalize ignore list
    const normalizedIgnoreSet = new Set();
    for (const ignore of ignoreList) {
      const ignorePath = path.isAbsolute(ignore) 
        ? path.resolve(ignore) 
        : path.resolve(path.join(rootPath, ignore));
      normalizedIgnoreSet.add(ignorePath);
    }
    
    // Automatically exclude common directories
    const commonIgnores = [
      path.resolve(path.join(rootPath, '.git')),
      path.resolve(path.join(rootPath, 'node_modules')),
      path.resolve(path.join(rootPath, '__pycache__')),
      path.resolve(path.join(rootPath, 'venv')),
      path.resolve(path.join(rootPath, 'dist')),
      path.resolve(path.join(rootPath, 'build')),
    ];
    
    for (const ignore of commonIgnores) {
      normalizedIgnoreSet.add(ignore);
    }
    
    // Function to check if a path should be ignored
    function shouldIgnore(filePath) {
      for (const ignore of normalizedIgnoreSet) {
        try {
          const relativePath = path.relative(ignore, filePath);
          if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
            return true;
          }
        } catch (error) {
          console.error(`Error checking if ${filePath} should be ignored:`, error);
        }
      }
      return false;
    }
    
    // Function to process a file
    function processFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relPath = path.relative(rootPath, filePath);
        return `---FILESTART: ${relPath}---\n${content}\n---FILEEND---\n\n`;
      } catch (error) {
        console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
        return '';
      }
    }
    
    // Collect all files to process
    const filesToProcess = [];
    function walkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (shouldIgnore(fullPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else {
          filesToProcess.push(fullPath);
        }
      }
    }
    
    try {
      walkDir(rootPath);
      
      // Process files and write to output.md
      let outputContent = '';
      for (const filePath of filesToProcess) {
        const fileContent = processFile(filePath);
        if (fileContent) {
          outputContent += fileContent;
        }
      }
      
      fs.writeFileSync('output.md', outputContent, 'utf-8');
      resolve(outputContent);
    } catch (error) {
      reject(error);
    }
  });
}

// Generate output directory from a snapshot
function generateOutdir(dirname, snapshotContent) {
  return new Promise((resolve, reject) => {
    try {
      // Validate input
      if (!dirname || typeof dirname !== 'string') {
        return reject('Invalid output directory path');
      }
      
      if (!snapshotContent || typeof snapshotContent !== 'string') {
        return reject('Invalid snapshot content');
      }
      
      // Sanitize dirname to ensure it's a valid path
      dirname = path.resolve(dirname);
      
      // Create the output directory if it doesn't exist
      fs.mkdirSync(dirname, { recursive: true });
      
      // Check if the content has the expected format
      if (!snapshotContent.includes('---FILESTART:') || !snapshotContent.includes('---FILEEND---')) {
        return reject('Invalid snapshot format. Snapshot must contain file markers (---FILESTART: and ---FILEEND---)');
      }
      
      // Split content by file markers
      const fileBlocks = snapshotContent.split('---FILESTART: ');
      let filesCreated = 0;
      
      // Skip the first empty block
      for (let i = 1; i < fileBlocks.length; i++) {
        const block = fileBlocks[i];
        
        // Split into filename and content
        const parts = block.split('---\n', 2);
        if (parts.length < 2) continue;
        
        const filename = parts[0].trim();
        
        // Validate filename - must not contain code snippets or unusual characters
        if (!filename || filename.includes('\n') || filename.includes('\\') || 
            filename.includes('const ') || filename.includes('function ') || 
            filename.includes(' = ') || filename.length > 256) {
          console.warn(`Skipping invalid filename: ${filename}`);
          continue;
        }
        
        let content = parts[1];
        
        // Extract content up to FILEEND marker
        const endMarkerIndex = content.indexOf('---FILEEND---');
        if (endMarkerIndex === -1) {
          console.warn(`Skipping file ${filename} - missing end marker`);
          continue;
        }
        
        content = content.substring(0, endMarkerIndex);
        
        try {
          const fullPath = path.join(dirname, filename);
          const parentDir = path.dirname(fullPath);
          
          // Create parent directories if they don't exist
          fs.mkdirSync(parentDir, { recursive: true });
          
          // Write the file
          fs.writeFileSync(fullPath, content, 'utf-8');
          filesCreated++;
        } catch (fileError) {
          console.error(`Error creating file ${filename}: ${fileError.message}`);
        }
      }
      
      if (filesCreated === 0) {
        return reject('No valid files found in the snapshot content');
      }
      
      resolve(`Directory created successfully at ${dirname} with ${filesCreated} files`);
    } catch (error) {
      reject(`Failed to create directory: ${error.message}`);
    }
  });
}

module.exports = {
  generateSnapshot,
  generateOutdir
};
