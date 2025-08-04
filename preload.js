const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openSecondWindow: (url) => ipcRenderer.send('open-second-window', url),
    closeSecondWindow: () => ipcRenderer.send('close-second-window')
});
