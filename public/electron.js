const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.ELECTRON_IS_DEV === '1';

function createWindow() {
  // Create the browser window
  const win = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, isDev ? 'preload.js' : 'preload.js'),
      // Disable web security only in production to allow local file access
      webSecurity: !isDev
    },
    backgroundColor: '#f3f3f3',
    title: 'dec12-full-mock',
    // Ensure app works offline
    show: false // Don't show until ready
  });

  // Show window when ready to prevent flash
  win.once('ready-to-show', () => {
    win.show();
  });

  // Load the app
  if (isDev) {
    // Development: Load from React dev server
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // Production: Load from built files
    // In packaged app, files are in app.asar/build or Resources/build
    const possiblePaths = [
      // Development build path
      path.join(__dirname, 'build', 'index.html'),
      // Packaged app paths
        path.join(process.resourcesPath, 'app.asar', 'build', 'index.html'),
        path.join(process.resourcesPath, 'app', 'build', 'index.html'),
      path.join(process.resourcesPath, 'build', 'index.html'),
      path.join(app.getAppPath(), 'build', 'index.html'),
      path.join(app.getAppPath(), '..', 'build', 'index.html'),
        path.join(process.cwd(), 'build', 'index.html'),
      // Try Resources/build directly
      path.join(__dirname, '..', 'build', 'index.html'),
      path.join(__dirname, '..', '..', 'build', 'index.html')
      ];
      
      let loaded = false;
    for (const indexPath of possiblePaths) {
        try {
        if (fs.existsSync(indexPath)) {
          console.log('Loading from:', indexPath);
          win.loadFile(indexPath);
            loaded = true;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!loaded) {
      console.error('Could not find index.html. Tried paths:', possiblePaths);
      console.error('__dirname:', __dirname);
      console.error('process.resourcesPath:', process.resourcesPath);
      console.error('app.getAppPath():', app.getAppPath());
      console.error('process.cwd():', process.cwd());
      win.loadURL('data:text/html,<h1>Error: Could not find index.html</h1><p>Please rebuild the application.</p><p>Checked paths: ' + possiblePaths.join('<br>') + '</p>');
    }
  }

  // Handle window closed
  win.on('closed', () => {
    app.quit();
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
