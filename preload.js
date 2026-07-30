const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petAPI", {
  getState: () => ipcRenderer.invoke("pet:get-state"),
  setState: (state) => ipcRenderer.send("pet:set-state", state),
  setPaused: (paused) => ipcRenderer.send("pet:set-paused", paused),
  togglePaused: () => ipcRenderer.send("pet:toggle-paused"),
  dragStart: (payload) => ipcRenderer.send("pet:drag-start", payload),
  dragMove: (payload) => ipcRenderer.send("pet:drag-move", payload),
  dragEnd: (payload) => ipcRenderer.send("pet:drag-end", payload),
  setPointerInteractive: (value) =>
    ipcRenderer.send("pet:pointer-interactive", value),
  toggleVisibility: () => ipcRenderer.send("pet:toggle-visibility"),
  resetPosition: () => ipcRenderer.send("pet:reset-position"),
  quit: () => ipcRenderer.send("pet:quit"),
  onState: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on("pet:state", handler);
    return () => ipcRenderer.removeListener("pet:state", handler);
  },
  onPosition: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on("pet:position", handler);
    return () => ipcRenderer.removeListener("pet:position", handler);
  },
});
