const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let backgroundWindow;
let tray;

function createBackgroundWindow() {
    backgroundWindow = new BrowserWindow({
        width: require('electron').screen.getPrimaryDisplay().workAreaSize.width + 100,
        height: require('electron').screen.getPrimaryDisplay().workAreaSize.height + 100,
        show: false, // Window is hidden
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true
        }
    });

    backgroundWindow.loadFile(path.join(__dirname, 'background.html'));
    // Prevent window from being closed when 'X' is clicked
    // backgroundWindow.webContents.openDevTools();
    backgroundWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
        }
        return false;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'logo2.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Hand Tracking Status',
            enabled: false, // This is just a label
        },
        { type: 'separator' },
        {
            label: 'Pause Tracking',
            click: () => {
                backgroundWindow.webContents.send('pause-tracking');
            }
        },
        {
            label: 'Resume Tracking',
            click: () => {
                backgroundWindow.webContents.send('resume-tracking');
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Hand Tracking (Running)');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
    createBackgroundWindow();
    createTray();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}

// Handle app quit
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
