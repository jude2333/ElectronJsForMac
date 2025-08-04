const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let secondWindow;

function getExternalDisplay() {
    const all = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    // pick a display that is not the primary; fallback to primary if none
    return all.find(d => d.id !== primary.id) || primary;
}

function createMainWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    mainWindow = new BrowserWindow({
        x: primaryDisplay.bounds.x + 50,
        y: primaryDisplay.bounds.y + 50,
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nativeWindowOpen: true, // if your webapp uses window.open
        },
        // Prevent macOS from auto-tabbing this window with others
        tabbingIdentifier: '',
    });

    mainWindow.loadURL('https://andrsn.in'); // replace with real URL

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Handle message from renderer to open second monitor window
ipcMain.on('open-second-window', (event, dynamicUrl) => {
    const externalDisplay = getExternalDisplay();

    if (!externalDisplay) {
        console.error('No display detected; falling back to primary.');
    }

    // Close existing if any
    if (secondWindow) {
        secondWindow.close();
    }

    // Create window sized to that display but not using native fullscreen
    const { x, y, width, height } = externalDisplay.bounds;
    secondWindow = new BrowserWindow({
        x: x + 10,
        y: y + 10,
        width: Math.max(800, width - 20),
        height: Math.max(600, height - 20),
        webPreferences: {
            contextIsolation: true,
            nativeWindowOpen: true, // if the loaded content spawns new windows
        },
        tabbingIdentifier: '', // opt out of macOS tabbing
        // optionally style on mac:
        // titleBarStyle: 'hiddenInset',
    });

    // If you truly want it full-screen-like without entering macOS full screen space,
    // you can maximize or manually resize instead of `fullscreen: true`
    secondWindow.maximize();

    secondWindow.loadURL(dynamicUrl);

    secondWindow.on('closed', () => {
        secondWindow = null;
    });
});

ipcMain.on('close-second-window', () => {
    if (secondWindow) {
        secondWindow.close();
        secondWindow = null;
    }
});

app.whenReady().then(() => {
    createMainWindow();

    // Update external display if configuration changes
    screen.on('display-added', () => { /* you could re-evaluate if needed */ });
    screen.on('display-removed', () => { /* optionally handle fallback */ });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
