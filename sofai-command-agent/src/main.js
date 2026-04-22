const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const WebSocket = require('ws');
const fs = require('fs');

let mainWindow;
let pythonProcess;
let wsServer;
let wss;

// Handle Windows startup
if (require('electron-squirrel-startup')) app.quit();

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load a simple status page
  mainWindow.loadFile('src/status.html');
  mainWindow.on('closed', () => (mainWindow = null));
};

// Start Python backend and WebSocket server
const startBackend = async () => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../system_commander.py');
    
    // Start Python process
    PythonShell.run(pythonScript, { pythonPath: process.env.PYTHON_PATH || 'python' }, (err, results) => {
      if (err) {
        console.error('Python error:', err);
        reject(err);
      }
    });

    // Give Python time to start, then set up WebSocket server
    setTimeout(() => {
      wss = new WebSocket.Server({ port: 5001 });
      
      wss.on('connection', (ws) => {
        console.log('Client connected via WebSocket');
        
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            handleCommand(data, ws);
          } catch (err) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
          }
        });

        ws.on('close', () => console.log('Client disconnected'));
      });

      console.log('WebSocket server started on ws://localhost:5001');
      resolve();
    }, 2000);
  });
};

// Handle commands from WebSocket
const handleCommand = async (data, ws) => {
  try {
    const response = await fetch('http://localhost:5000/execute-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    ws.send(JSON.stringify({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    }));
  } catch (err) {
    ws.send(JSON.stringify({
      success: false,
      error: err.message
    }));
  }
};

// Create system tray icon
const createTray = () => {
  const iconPath = path.join(__dirname, 'icon.ico');
  const tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Status: Running', enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('SofAi Command Agent - Active');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
};

// App lifecycle
app.on('ready', async () => {
  try {
    await startBackend();
    createWindow();
    createTray();
  } catch (err) {
    console.error('Failed to start:', err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// IPC handlers
ipcMain.handle('get-status', () => {
  return {
    running: true,
    version: '1.0.0',
    port: 5001,
    api: 'ws://localhost:5001'
  };
});

// Register as Windows service on install
if (process.platform === 'win32') {
  const Service = require('node-windows').Service;
  
  const svc = new Service({
    name: 'SofAi Command Agent',
    description: 'Local AI command execution service',
    script: path.join(__dirname, 'main.js'),
    nodeOptions: ['--harmony']
  });

  svc.on('install', () => {
    console.log('Service installed');
    svc.start();
  });

  svc.on('uninstall', () => {
    console.log('Service uninstalled');
  });
}
