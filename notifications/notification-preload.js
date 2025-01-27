const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notificationAPI', {
    notificationData: (callback) => ipcRenderer.on('notification-data', (_event, value) => callback(value)),
    close: () => ipcRenderer.send('close-notification')
})