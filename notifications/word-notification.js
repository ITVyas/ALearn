const { BrowserWindow, screen, ipcMain, app } = require('electron');
const sound = require("sound-play");
const path = require('path');

function createWordNotification(title, message) {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;
  
    const notificationWidth = 300; 
    const notificationHeight = 100; 
  
    const x = width - notificationWidth - 20; 
    const y = height - notificationHeight - 20;

    const notificationWindow = new BrowserWindow({
        width: notificationWidth,
        height: notificationHeight,
        x: x,
        y: y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        show: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'notification-preload.js'),
        },
    });

    notificationWindow.loadFile(path.join(__dirname, 'html', 'index.html'));

    notificationWindow.webContents.once('did-finish-load', () => {
        if (!app.MainWindow.isFocused()) app.MainWindow.flashFrame(true);
        let id = setTimeout(() => {
            notificationWindow.close();
        }, 7000);

        notificationWindow.on('close', () => {
            clearTimeout(id);
        });

        notificationWindow.webContents.send('notification-data', { title, message });
        notificationWindow.show(); 
        sound.play(path.join(__dirname, 'notification-sound.mp3'));
    });   
}

ipcMain.on('close-notification', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.close(); 
    app.MainWindow.show();
});

module.exports = { createWordNotification };