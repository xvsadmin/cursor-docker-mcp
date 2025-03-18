/**
 * This script links the Docker MCP with Cursor IDE.
 * It copies the built files to the Cursor MCP directory.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine Cursor MCP directory based on OS
let mcpPath;
switch (process.platform) {
  case 'win32':
    mcpPath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Cursor', 'resources', 'app', 'mcps');
    break;
  case 'darwin':
    mcpPath = path.join('/Applications', 'Cursor.app', 'Contents', 'Resources', 'app', 'mcps');
    break;
  case 'linux':
    mcpPath = path.join(os.homedir(), '.config', 'Cursor', 'mcps');
    break;
  default:
    console.error('Unsupported operating system');
    process.exit(1);
}

const dockerMcpPath = path.join(mcpPath, 'docker');

// Create docker MCP directory if it doesn't exist
if (!fs.existsSync(dockerMcpPath)) {
  try {
    fs.mkdirSync(dockerMcpPath, { recursive: true });
    console.log(`Created directory: ${dockerMcpPath}`);
  } catch (err) {
    console.error(`Failed to create directory: ${dockerMcpPath}`, err);
    process.exit(1);
  }
}

// Copy built files to Cursor MCP directory
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist. Please run "npm run build" first.');
  process.exit(1);
}

try {
  // Copy all files from dist to docker MCP directory
  fs.readdirSync(distDir).forEach((file) => {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(dockerMcpPath, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${srcPath} to ${destPath}`);
  });

  // Copy package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const destPackageJsonPath = path.join(dockerMcpPath, 'package.json');
  fs.copyFileSync(packageJsonPath, destPackageJsonPath);
  console.log(`Copied ${packageJsonPath} to ${destPackageJsonPath}`);

  console.log('Successfully linked Docker MCP with Cursor!');
  console.log('Please restart Cursor to apply changes.');
} catch (err) {
  console.error('Failed to copy files:', err);
  process.exit(1);
}