# Directory Snapshot Tool - Electron Desktop Application

This is the Electron desktop version of the Directory Snapshot Tool, providing the same functionality as the original Python-based tool but with a native desktop interface.

## Features

- Create snapshots of directory structures and file contents
- Recreate directory structures from snapshots
- Customizable ignore patterns
- Dark/light theme support
- Token counting for AI model compatibility
- Expandable/collapsable folder structure
- Adjustable sidebar width

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/directory-snapshot-tool
   cd directory-snapshot-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   npm start
   ```

## Building the Application

To build the application for your platform:

```bash
npm run build
```

This will create distributable packages in the `dist` directory.

## Usage

### Creating a Snapshot

1. Launch the application
2. Select the "Snapshot" tab (default)
3. Enter a directory path or use the "Browse" button
4. Uncheck any files or folders you want to exclude
5. Add any additional ignore patterns in the "Manual Ignore Patterns" section
6. Click "Generate Snapshot"
7. The snapshot will be displayed and can be copied to clipboard

### Recreating a Directory

1. Launch the application
2. Select the "Recreate" tab
3. Enter the output directory path or use the "Browse" button
4. Paste the snapshot content into the text area
5. Click "Recreate Directory"

## Development

The application is built with:

- Electron - for the desktop application framework
- TailwindCSS - for styling
- Pure JavaScript - for the frontend logic

### Project Structure

- `main.js` - Main Electron process
- `preload.js` - Preload script for secure IPC
- `renderer.js` - Renderer process logic
- `index.html` - Main application UI
- `styles/` - CSS files
- `assets/` - Images and icons

## License

MIT
