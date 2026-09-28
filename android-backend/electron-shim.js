// Android stand-in for the 'electron' module. electron/main.js runs unchanged inside the
// embedded Node runtime (nodejs-mobile); everything it asks of Electron lands here and is
// served to the WebView over a local HTTP server (see android-main.js).
const { EventEmitter } = require('events');
const path = require('path');
const os = require('os');

const bus = new EventEmitter(); // 'send' (channel, data) -> every connected UI
bus.setMaxListeners(0);
const handlers = new Map(); // ipc channel -> fn(event, arg)
const schemes = new Map(); // protocol scheme -> fn(request)
const state = {
  dataDir: process.env.CARTRIDGE_DATA || path.join(os.tmpdir(), 'cartridge'),
  version: '0.0.0',
  size: [1280, 720],
  zoom: 1,
};

const ready = new Promise((resolve) => setImmediate(resolve));
const app = new EventEmitter();
Object.assign(app, {
  isPackaged: true,
  commandLine: { appendSwitch() {}, hasSwitch: () => false },
  setName() {},
  getName: () => 'Cartridge',
  getVersion: () => state.version,
  whenReady: () => ready,
  isReady: () => true,
  requestSingleInstanceLock: () => true, // Android runs one app instance by itself
  disableHardwareAcceleration() {},
  getGPUFeatureStatus: () => ({ android: 'webview' }),
  getPath(name) {
    const home = os.homedir();
    return ({
      userData: state.dataDir,
      appData: path.dirname(state.dataDir),
      home,
      pictures: path.join(home, 'Pictures'),
      downloads: path.join(home, 'Download'),
      documents: path.join(home, 'Documents'),
      temp: os.tmpdir(),
    })[name] || state.dataDir;
  },
  relaunch() { bus.emit('send', 'android:reload', {}); },
  exit() {},
  quit() { bus.emit('send', 'android:quit', {}); },
});

class WebContents extends EventEmitter {
  send(ch, data) { bus.emit('send', ch, data); }
  getZoomFactor() { return state.zoom; }
  setZoomFactor(z) { state.zoom = z; bus.emit('send', 'android:zoom', z); }
  setWindowOpenHandler() {}
  toggleDevTools() {}
  async executeJavaScript() { return ''; }
  async capturePage() { throw new Error('Use the Android screenshot buttons to take a screenshot.'); }
}
let mainWindow = null;
class BrowserWindow extends EventEmitter {
  constructor() { super(); this.webContents = new WebContents(); this.full = true; mainWindow = this; }
  static getAllWindows() { return mainWindow ? [mainWindow] : []; }
  loadFile() { return Promise.resolve(); }
  loadURL() { return Promise.resolve(); }
  setMenuBarVisibility() {}
  isDestroyed() { return false; }
  isMinimized() { return false; }
  restore() {}
  getContentSize() { return state.size; }
  isFullScreen() { return this.full; }
  setFullScreen(v) { this.full = !!v; bus.emit('send', 'android:fullscreen', this.full); }
  focus() {}
  show() {}
}

const ipcMain = { handle: (ch, fn) => handlers.set(ch, fn), removeHandler: (ch) => handlers.delete(ch), on() {} };
const protocol = { registerSchemesAsPrivileged() {}, handle: (scheme, fn) => schemes.set(scheme, fn) };
const shell = {
  openExternal: async (url) => { bus.emit('send', 'android:open', { url }); },
  openPath: async (p) => { bus.emit('send', 'android:open', { path: p }); return ''; },
  showItemInFolder() {},
};
let blockers = 0;
const powerSaveBlocker = {
  start() { blockers++; bus.emit('send', 'android:busy', true); return blockers; },
  stop() { blockers = Math.max(0, blockers - 1); if (!blockers) bus.emit('send', 'android:busy', false); },
  isStarted: () => blockers > 0,
};
const screen = {
  getPrimaryDisplay: () => ({ size: { width: state.size[0], height: state.size[1] }, workAreaSize: { width: state.size[0], height: state.size[1] }, scaleFactor: 1 }),
  getAllDisplays: () => [screen.getPrimaryDisplay()],
};
const clipboard = { readText: () => '', writeText() {} };

module.exports = {
  app, BrowserWindow, ipcMain, protocol, shell, powerSaveBlocker, screen, clipboard,
  nativeImage: require('./native-image'),
  // not part of Electron: used by android-main.js
  __android: { bus, handlers, schemes, state, window: () => mainWindow },
};
