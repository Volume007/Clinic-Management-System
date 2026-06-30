const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  const userDataPath = app.getPath('userData');
  const dbTarget = path.join(userDataPath, 'clinic.db');

  if (app.isPackaged && !fs.existsSync(dbTarget)) {
    const dbSource = path.join(process.resourcesPath, 'clinic.db');
    if (fs.existsSync(dbSource)) {
      fs.copyFileSync(dbSource, dbTarget);
    }
  }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Set USER_DATA_PATH for the backend so it writes clinic.db to AppData instead of the readonly asar
  process.env.USER_DATA_PATH = app.getPath('userData');

  // Let the backend run
  require('./backend/server.js');

  // Load the web app
  // Wait a short moment to ensure Express is listening
  setTimeout(() => {
    // The backend uses process.env.PORT || 5000
    mainWindow.loadURL('http://localhost:5000');
  }, 1000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
