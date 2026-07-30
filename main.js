const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");

const PET_WINDOW = { width: 260, height: 292 };
const CONTROL_WINDOW = { width: 980, height: 720 };
const VALID_STATES = new Set([
  "idle",
  "running-right",
  "running-left",
  "waving",
  "jumping",
  "failed",
  "waiting",
  "running",
  "review",
]);

let controlWindow = null;
let petWindow = null;
let dragState = null;
let appState = {
  state: "idle",
  paused: false,
  petVisible: true,
};

function createWindowOptions(extra = {}) {
  return {
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    ...extra,
  };
}

function createControlWindow() {
  controlWindow = new BrowserWindow(
    createWindowOptions({
      ...CONTROL_WINDOW,
      minWidth: 820,
      minHeight: 620,
      title: "Codex Pet Lab",
      backgroundColor: "#0f1318",
      autoHideMenuBar: true,
    }),
  );

  controlWindow.loadFile("control.html");
  controlWindow.once("ready-to-show", () => controlWindow.show());
  controlWindow.on("closed", () => {
    controlWindow = null;
  });
}

function defaultPetPosition() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;
  return {
    x: Math.round(x + width - PET_WINDOW.width - 36),
    y: Math.round(y + height - PET_WINDOW.height - 36),
  };
}

function createPetWindow() {
  const initial = defaultPetPosition();
  petWindow = new BrowserWindow(
    createWindowOptions({
      ...PET_WINDOW,
      ...initial,
      title: "Codex Pet",
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      hasShadow: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      focusable: false,
      acceptFirstMouse: true,
    }),
  );

  petWindow.setAlwaysOnTop(true, "floating");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile("pet.html");
  petWindow.once("ready-to-show", () => {
    petWindow.showInactive();
    broadcastState();
  });
  petWindow.on("closed", () => {
    petWindow = null;
  });
}

function send(window, channel, payload) {
  if (window && !window.isDestroyed()) {
    window.webContents.send(channel, payload);
  }
}

function broadcastState() {
  send(controlWindow, "pet:state", appState);
  send(petWindow, "pet:state", appState);
}

function clampPetPosition(x, y) {
  const point = { x: x + PET_WINDOW.width / 2, y: y + PET_WINDOW.height / 2 };
  const display = screen.getDisplayNearestPoint(point);
  const bounds = display.workArea;
  const margin = 8;
  return {
    x: Math.round(
      Math.min(
        Math.max(x, bounds.x - PET_WINDOW.width + 72),
        bounds.x + bounds.width - 72,
      ),
    ),
    y: Math.round(
      Math.min(
        Math.max(y, bounds.y - PET_WINDOW.height + 72),
        bounds.y + bounds.height - 72,
      ),
    ),
  };
}

ipcMain.handle("pet:get-state", () => appState);

ipcMain.on("pet:set-state", (_event, nextState) => {
  if (!VALID_STATES.has(nextState)) return;
  appState = { ...appState, state: nextState, paused: false };
  broadcastState();
});

ipcMain.on("pet:set-paused", (_event, paused) => {
  appState = { ...appState, paused: Boolean(paused) };
  broadcastState();
});

ipcMain.on("pet:toggle-paused", () => {
  appState = { ...appState, paused: !appState.paused };
  broadcastState();
});

ipcMain.on("pet:drag-start", (_event, payload) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  dragState = {
    pointerId: payload.pointerId,
    offsetX: payload.pointerWindowX,
    offsetY: payload.pointerWindowY,
  };
});

ipcMain.on("pet:drag-move", (_event, payload) => {
  if (!petWindow || petWindow.isDestroyed() || !dragState) return;
  if (payload.pointerId !== dragState.pointerId) return;
  const next = clampPetPosition(
    payload.pointerScreenX - dragState.offsetX,
    payload.pointerScreenY - dragState.offsetY,
  );
  petWindow.setPosition(next.x, next.y, false);
  send(controlWindow, "pet:position", next);
});

ipcMain.on("pet:drag-end", (_event, payload) => {
  if (!dragState || payload.pointerId !== dragState.pointerId) return;
  dragState = null;
  if (petWindow && !petWindow.isDestroyed()) {
    send(controlWindow, "pet:position", petWindow.getPosition().reduce(
      (value, item, index) => ({ ...value, [index === 0 ? "x" : "y"]: item }),
      {},
    ));
  }
});

ipcMain.on("pet:pointer-interactive", (_event, isInteractive) => {
  if (!petWindow || petWindow.isDestroyed() || dragState) return;
  if (isInteractive) {
    petWindow.setIgnoreMouseEvents(false);
  } else {
    petWindow.setIgnoreMouseEvents(true, { forward: true });
  }
});

ipcMain.on("pet:toggle-visibility", () => {
  if (!petWindow || petWindow.isDestroyed()) return;
  appState = { ...appState, petVisible: !petWindow.isVisible() };
  if (appState.petVisible) petWindow.showInactive();
  else petWindow.hide();
  broadcastState();
});

ipcMain.on("pet:reset-position", () => {
  if (!petWindow || petWindow.isDestroyed()) return;
  const next = defaultPetPosition();
  petWindow.setPosition(next.x, next.y, false);
  if (!petWindow.isVisible()) petWindow.showInactive();
  appState = { ...appState, petVisible: true };
  send(controlWindow, "pet:position", next);
  broadcastState();
});

ipcMain.on("pet:quit", () => app.quit());

app.whenReady().then(() => {
  createControlWindow();
  createPetWindow();

  app.on("activate", () => {
    if (!controlWindow) createControlWindow();
    if (!petWindow) createPetWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
