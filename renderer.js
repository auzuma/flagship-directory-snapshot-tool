// Renderer process
// const { ipcRenderer } = require('electron');

// DOM Elements
const folderPathInput = document.getElementById('folder-path');
const browseBtn = document.getElementById('browse-btn');
const directoryTree = document.getElementById('directory-tree');
const refreshTreeBtn = document.getElementById('refresh-tree-btn');
const clearSelectionsBtn = document.getElementById('clear-selections-btn');
const sortFilesCheckbox = document.getElementById('sort-files');
const manualIgnoreTextarea = document.getElementById('manual-ignore');
const sideTextTextarea = document.getElementById('side-text');
const generateSnapshotBtn = document.getElementById('generate-snapshot-btn');
const snapshotResult = document.getElementById('snapshot-result');
const tokenCount = document.getElementById('token-count');
const snapshotContent = document.getElementById('snapshot-content');
const copySnapshotBtn = document.getElementById('copy-snapshot-btn');
const themeToggle = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('dark-icon');
const lightIcon = document.getElementById('light-icon');
const sidebarResizeHandle = document.getElementById('sidebar-resize-handle');
const sidebar = document.getElementById('sidebar');

// Tab elements
const snapshotTabBtn = document.getElementById('snapshot-tab-btn');
const recreateTabBtn = document.getElementById('recreate-tab-btn');
const snapshotTab = document.getElementById('snapshot-tab');
const recreateTab = document.getElementById('recreate-tab');

// Recreate tab elements
const outputDirPathInput = document.getElementById('output-dir-path');
const browseOutputBtn = document.getElementById('browse-output-btn');
const snapshotInput = document.getElementById('snapshot-input');
const recreateDirectoryBtn = document.getElementById('recreate-directory-btn');
const recreateResult = document.getElementById('recreate-result');

// Global variables
let directoryStructure = {};
let expandedDirs = new Set();
let checkedItems = new Set();
let uncheckedItems = new Set();
let defaultIgnoredItems = ['.git', 'node_modules', '__pycache__', 'venv', 'dist', 'build'];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Check for saved theme preference
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.documentElement.classList.add('dark');
    darkIcon.classList.add('hidden');
    lightIcon.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    darkIcon.classList.remove('hidden');
    lightIcon.classList.add('hidden');
  }
  
  // Set up event listeners
  setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Directory selection
  browseBtn.addEventListener('click', browseDirectory);
  folderPathInput.addEventListener('change', () => loadDirectoryStructure(folderPathInput.value));
  
  // Directory tree controls
  refreshTreeBtn.addEventListener('click', () => loadDirectoryStructure(folderPathInput.value));
  clearSelectionsBtn.addEventListener('click', clearSelections);
  sortFilesCheckbox.addEventListener('change', () => loadDirectoryStructure(folderPathInput.value));
  
  // Snapshot generation
  generateSnapshotBtn.addEventListener('click', generateSnapshot);
  copySnapshotBtn.addEventListener('click', copySnapshotToClipboard);
  
  // Tab switching
  snapshotTabBtn.addEventListener('click', () => switchTab('snapshot'));
  recreateTabBtn.addEventListener('click', () => switchTab('recreate'));
  
  // Recreate directory
  browseOutputBtn.addEventListener('click', browseOutputDirectory);
  recreateDirectoryBtn.addEventListener('click', recreateDirectory);
  
  // Sidebar resizing
  setupSidebarResize();
}

// Toggle between light and dark themes
function toggleTheme() {
  const isDarkMode = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDarkMode);
  
  if (isDarkMode) {
    darkIcon.classList.add('hidden');
    lightIcon.classList.remove('hidden');
  } else {
    darkIcon.classList.remove('hidden');
    lightIcon.classList.add('hidden');
  }
}

// Switch between tabs
function switchTab(tabName) {
  if (tabName === 'snapshot') {
    snapshotTab.classList.remove('hidden');
    recreateTab.classList.add('hidden');
    snapshotTabBtn.classList.add('active');
    recreateTabBtn.classList.remove('active');
  } else {
    snapshotTab.classList.add('hidden');
    recreateTab.classList.remove('hidden');
    snapshotTabBtn.classList.remove('active');
    recreateTabBtn.classList.add('active');
  }
}

// Browse for a directory
async function browseDirectory() {
  const dirPath = await window.api.selectDirectory();
  if (dirPath) {
    folderPathInput.value = dirPath;
    loadDirectoryStructure(dirPath);
  }
}

// Browse for an output directory
async function browseOutputDirectory() {
  const dirPath = await window.api.selectDirectory();
  if (dirPath) {
    outputDirPathInput.value = dirPath;
  }
}

// Load the directory structure
async function loadDirectoryStructure(dirPath) {
  if (!dirPath) return;
  
  try {
    const structure = await window.api.getDirectoryStructure(dirPath);
    if (structure.error) {
      directoryTree.innerHTML = `<div class="text-red-500">Error: ${structure.error}</div>`;
      return;
    }
    
    directoryStructure = structure;
    renderDirectoryTree();
  } catch (error) {
    directoryTree.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
  }
}

// Render the directory tree
function renderDirectoryTree() {
  if (!directoryStructure || directoryStructure.length === 0) {
    directoryTree.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-sm italic">No files found or directory is empty.</div>';
    return;
  }
  
  const sortedStructure = sortFilesCheckbox.checked 
    ? [...directoryStructure].sort((a, b) => {
        // Directories first, then sort alphabetically
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      })
    : directoryStructure;
  
  directoryTree.innerHTML = '';
  
  for (const item of sortedStructure) {
    const itemElement = createTreeItem(item, 0);
    directoryTree.appendChild(itemElement);
  }
}

// Create a tree item element
function createTreeItem(item, indentLevel) {
  const itemContainer = document.createElement('div');
  itemContainer.className = 'tree-item flex items-start mb-1';
  itemContainer.dataset.path = item.path;
  
  // Create indent spacer
  if (indentLevel > 0) {
    const spacer = document.createElement('div');
    spacer.className = 'tree-indent';
    spacer.style.width = `${indentLevel * 16}px`;
    itemContainer.appendChild(spacer);
  }
  
  // Create arrow for directories
  const arrowContainer = document.createElement('div');
  arrowContainer.className = 'arrow-container w-5 flex items-center';
  
  if (item.isDirectory) {
    const arrow = document.createElement('span');
    arrow.className = 'cursor-pointer select-none';
    arrow.textContent = expandedDirs.has(item.path) ? '▼' : '►';
    arrow.addEventListener('click', () => toggleDirectory(item.path));
    arrowContainer.appendChild(arrow);
  }
  
  itemContainer.appendChild(arrowContainer);
  
  // Create checkbox
  const checkboxContainer = document.createElement('div');
  checkboxContainer.className = 'checkbox-container flex items-center';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'mr-2';
  checkbox.checked = !uncheckedItems.has(item.path) && !item.isDefaultIgnored;
  
  if (item.isDefaultIgnored) {
    uncheckedItems.add(item.path);
  } else if (checkbox.checked) {
    checkedItems.add(item.path);
  }
  
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      checkedItems.add(item.path);
      uncheckedItems.delete(item.path);
    } else {
      uncheckedItems.add(item.path);
      checkedItems.delete(item.path);
    }
    
    // Update child checkboxes if this is a directory
    if (item.isDirectory) {
      const childContainer = itemContainer.querySelector('.children-container');
      if (childContainer) {
        const childCheckboxes = childContainer.querySelectorAll('input[type="checkbox"]');
        childCheckboxes.forEach(childCheckbox => {
          childCheckbox.checked = checkbox.checked;
          childCheckbox.disabled = !checkbox.checked;
          
          const childPath = childCheckbox.closest('.tree-item').dataset.path;
          if (checkbox.checked) {
            checkedItems.add(childPath);
            uncheckedItems.delete(childPath);
          } else {
            uncheckedItems.add(childPath);
            checkedItems.delete(childPath);
          }
        });
      }
    }
  });
  
  checkboxContainer.appendChild(checkbox);
  
  // Create label
  const label = document.createElement('span');
  label.textContent = item.name + (item.isDirectory ? '/' : '');
  label.className = 'select-none';
  checkboxContainer.appendChild(label);
  
  itemContainer.appendChild(checkboxContainer);
  
  // Create container for children (for directories)
  if (item.isDirectory) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'children-container ml-5';
    childrenContainer.style.display = expandedDirs.has(item.path) ? 'block' : 'none';
    
    // If the directory is expanded, load its children
    if (expandedDirs.has(item.path)) {
      loadDirectoryChildren(item.path, childrenContainer, indentLevel + 1);
    }
    
    itemContainer.appendChild(childrenContainer);
  }
  
  return itemContainer;
}

// Toggle directory expansion
async function toggleDirectory(dirPath) {
  const itemElement = document.querySelector(`.tree-item[data-path="${dirPath.replace(/\\/g, '\\\\')}"]`);
  if (!itemElement) return;
  
  const arrow = itemElement.querySelector('.arrow-container span');
  const childrenContainer = itemElement.querySelector('.children-container');
  
  if (expandedDirs.has(dirPath)) {
    // Collapse directory
    expandedDirs.delete(dirPath);
    arrow.textContent = '►';
    childrenContainer.style.display = 'none';
  } else {
    // Expand directory
    expandedDirs.add(dirPath);
    arrow.textContent = '▼';
    childrenContainer.style.display = 'block';
    
    // Load children if not already loaded
    if (childrenContainer.children.length === 0) {
      loadDirectoryChildren(dirPath, childrenContainer, parseInt(itemElement.querySelector('.tree-indent')?.style.width || '0') / 16 + 1);
    }
  }
}

// Load directory children
async function loadDirectoryChildren(dirPath, container, indentLevel) {
  try {
    const children = await window.api.getDirectoryStructure(dirPath);
    
    if (children.error) {
      container.innerHTML = `<div class="text-red-500 ml-5">Error: ${children.error}</div>`;
      return;
    }
    
    // Sort children if needed
    const sortedChildren = sortFilesCheckbox.checked 
      ? [...children].sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        })
      : children;
    
    container.innerHTML = '';
    
    for (const child of sortedChildren) {
      const childElement = createTreeItem(child, indentLevel);
      container.appendChild(childElement);
    }
  } catch (error) {
    container.innerHTML = `<div class="text-red-500 ml-5">Error: ${error.message}</div>`;
  }
}

// Clear all selections
function clearSelections() {
  checkedItems.clear();
  uncheckedItems.clear();
  
  // Reset default ignored items
  directoryStructure.forEach(item => {
    if (item.isDefaultIgnored) {
      uncheckedItems.add(item.path);
    }
  });
  
  // Reload the tree
  renderDirectoryTree();
}

// Generate a snapshot
async function generateSnapshot() {
  const folderPath = folderPathInput.value;
  if (!folderPath) {
    alert('Please select a directory first.');
    return;
  }
  
  // Prepare ignore list
  const ignoreList = [...uncheckedItems];
  
  // Add manual ignore patterns
  const manualPatterns = manualIgnoreTextarea.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);
  
  ignoreList.push(...manualPatterns);
  
  // Show loading state
  generateSnapshotBtn.disabled = true;
  generateSnapshotBtn.textContent = 'Generating...';
  snapshotResult.classList.add('hidden');
  
  try {
    const result = await window.api.generateSnapshot({
      folderPath,
      ignoreList,
      sideText: sideTextTextarea.value
    });
    
    if (result.success) {
      // Display the result
      snapshotContent.textContent = result.content;
      
      // Count tokens using our exposed API
      try {
        const count = window.api.countTokens(result.content);
        tokenCount.textContent = `The following snapshot contains ${count} AI natural language tokens`;
      } catch (error) {
        tokenCount.textContent = 'Token count unavailable';
        console.error('Error counting tokens:', error);
      }
      
      snapshotResult.classList.remove('hidden');
    } else {
      alert(`Error generating snapshot: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message || 'Unknown error'}`);
  } finally {
    generateSnapshotBtn.disabled = false;
    generateSnapshotBtn.textContent = 'Generate Snapshot';
  }
}

// Copy snapshot content to clipboard
function copySnapshotToClipboard() {
  const content = snapshotContent.textContent;
  if (!content) return;
  
  navigator.clipboard.writeText(content)
    .then(() => {
      // Show a temporary "Copied!" message
      const originalText = copySnapshotBtn.innerHTML;
      copySnapshotBtn.innerHTML = '<span class="text-xs">Copied!</span>';
      setTimeout(() => {
        copySnapshotBtn.innerHTML = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Error copying to clipboard:', err);
      alert('Failed to copy to clipboard');
    });
}

// Recreate a directory from a snapshot
async function recreateDirectory() {
  const outputDir = outputDirPathInput.value;
  const snapshotText = snapshotInput.value;
  
  if (!outputDir) {
    alert('Please specify an output directory.');
    return;
  }
  
  if (!snapshotText) {
    alert('Please paste the snapshot content.');
    return;
  }
  
  // Show loading state
  recreateDirectoryBtn.disabled = true;
  recreateDirectoryBtn.textContent = 'Recreating...';
  recreateResult.classList.add('hidden');
  
  try {
    const result = await window.api.recreateDirectory({
      outputDir,
      snapshotContent: snapshotText
    });
    
    recreateResult.classList.remove('hidden');
    
    if (result.success) {
      recreateResult.className = 'mt-4 p-4 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      recreateResult.textContent = result.message;
    } else {
      recreateResult.className = 'mt-4 p-4 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      recreateResult.textContent = `Error: ${result.error}`;
    }
  } catch (error) {
    recreateResult.classList.remove('hidden');
    recreateResult.className = 'mt-4 p-4 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    recreateResult.textContent = `Error: ${error.message || 'Unknown error'}`;
  } finally {
    recreateDirectoryBtn.disabled = false;
    recreateDirectoryBtn.textContent = 'Recreate Directory';
  }
}

// Set up sidebar resizing
function setupSidebarResize() {
  let isResizing = false;
  let startX;
  let startWidth;
  
  sidebarResizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(sidebar).width, 10);
    
    document.documentElement.classList.add('cursor-ew-resize');
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const width = startWidth + (e.clientX - startX);
    
    // Limit minimum and maximum width
    if (width >= 200 && width <= 500) {
      sidebar.style.width = `${width}px`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.documentElement.classList.remove('cursor-ew-resize');
  });
}
