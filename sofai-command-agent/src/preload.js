const { contextBridge, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getStatus: () => ipcMain.invoke('get-status'),
  minimize: () => ipcMain.invoke('minimize-window')
});
