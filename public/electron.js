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
      preload: path.join(__dirname, isDev ? 'preload.js' : 'preload.js')
    },
    backgroundColor: '#f3f3f3',
    title: 'Manufacturing Cloud Forecast'
  });

  // Load the app
  if (isDev) {
    // Development: Load from React dev server
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // Production: Load from built files
    // In packaged app, files are in app.asar/build
    const indexPath = path.join(__dirname, 'build', 'index.html');
    
    // Try to load the file
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      // Fallback: try alternative paths for packaged app
      const fallbackPaths = [
        path.join(process.resourcesPath, 'app.asar', 'build', 'index.html'),
        path.join(process.resourcesPath, 'app', 'build', 'index.html'),
        path.join(process.cwd(), 'build', 'index.html'),
        path.join(app.getAppPath(), 'build', 'index.html')
      ];
      
      let loaded = false;
      for (const fallbackPath of fallbackPaths) {
        try {
          if (fs.existsSync(fallbackPath)) {
            win.loadFile(fallbackPath);
            loaded = true;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!loaded) {
        console.error('Could not find index.html. Tried:', indexPath, ...fallbackPaths);
        win.loadURL('data:text/html,<h1>Error: Could not find index.html</h1><p>Please rebuild the application.</p>');
      }
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
