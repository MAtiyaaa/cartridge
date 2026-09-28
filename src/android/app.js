// Android-only behaviour of the main window. Loaded only by main-android.js.
import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Native } from './native.js';
import { cart } from './bridge.js';

const REPO = import.meta.env.VITE_CART_REPO || 'abdu2304/cartridge';
let settings = {}; // config.android
const opt = (k) => settings[k] !== false; // every Android option defaults to on

// ---------------------------------------------------------------- interface size
// The UI is laid out for a 1280x720+ canvas. The WebView scales that canvas to the screen
// (wide viewport), and the Interface size setting (Electron zoom factor) shrinks the canvas.
let zoom = 1;
function applyViewport() {
  const aspect = screen.width && screen.height ? Math.max(screen.width, screen.height) / Math.min(screen.width, screen.height) : 16 / 9;
  const landscape = innerWidth >= innerHeight;
  const w = Math.round(landscape ? Math.max(1280, 720 * aspect) / zoom : 800 / zoom);
  let m = document.querySelector('meta[name=viewport]');
  if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
  m.content = `width=${w}, user-scalable=no`;
}

// ---------------------------------------------------------------- updates (APK from GitHub Releases)
let upd = { state: 'idle', supported: true };
const setUpd = (s) => { upd = { ...s, supported: true, current: cart.version }; cart.emit('update', upd); };
const newer = (a, b) => {
  const pa = String(a).replace(/^v/, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};
async function checkUpdate() {
  if (['checking', 'downloading'].includes(upd.state)) return upd;
  setUpd({ state: 'checking' });
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('GitHub answered ' + r.status);
    const rel = await r.json();
    const apk = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
    if (!apk || !newer(rel.tag_name, cart.version)) { setUpd({ state: 'current', version: cart.version }); return upd; }
    const version = String(rel.tag_name).replace(/^v/, '');
    setUpd({ state: 'downloading', version, percent: 0 });
    const sub = await Native.addListener('updateProgress', (p) => setUpd({ state: 'downloading', version, percent: p.percent }));
    try { await Native.downloadUpdate({ url: apk.browser_download_url }); } finally { sub.remove(); }
    setUpd({ state: 'ready', version });
  } catch (e) {
    setUpd({ state: 'error', error: e.message });
    throw e;
  }
  return upd;
}

// ---------------------------------------------------------------- controller
// The native side reads the gamepad (buttons, d-pad, sticks, triggers) and sends
// { action, down } using the same action names as nav.js. Held directions repeat like nav.js.
const REPEATABLE = new Set(['up', 'down', 'left', 'right', 'lt', 'rt']);
const held = new Map(); // action -> repeat timer (null for buttons that do not repeat)
function pad({ dispatch, markRepeat }, { action, down }) {
  if (down && held.has(action)) return; // d-pads that report both keys and hat axes
  clearTimeout(held.get(action));
  held.delete(action);
  if (!down) return;
  held.set(action, null);
  dispatch(action);
  if (!REPEATABLE.has(action)) return;
  const again = (ms) => held.set(action, setTimeout(() => { markRepeat(); dispatch(action); again(70); }, ms));
  again(300);
}

// Registered before the app mounts, so the first update:get etc. are answered here
export function beforeMount() {
  cart.override('clip:read', async () => String((await Clipboard.read().catch(() => ({}))).value || '').trim().slice(0, 4000));
  cart.override('update:get', () => ({ ...upd, current: cart.version }));
  cart.override('update:check', checkUpdate);
  cart.override('update:install', () => Native.installUpdate());
  cart.override('app:quit', () => Native.quit());
  cart.override('app:relaunch', () => location.reload());
  cart.override('app:fullscreen', () => { settings.immersive = !opt('immersive'); Native.setImmersive({ on: opt('immersive') }); return cart.call('config:set', { android: { immersive: settings.immersive } }); });
  cart.override('app:screenshot', () => { throw new Error('Use your device’s screenshot shortcut'); });
  cart.on('android:zoom', (z) => { zoom = z || 1; applyViewport(); });
  cart.on('android:open', ({ url }) => url && Native.openUrl({ url }));
  cart.on('android:quit', () => Native.quit());
  cart.on('android:reload', () => location.reload());
  cart.on('android:fullscreen', (on) => Native.setImmersive({ on }));
  applyViewport();
  const css = document.createElement('style');
  // Real touch on Android: let the WebView scroll natively (smooth, with momentum) and tap cleanly
  css.textContent = 'html, body { touch-action: pan-x pan-y; } [data-scroll] { overscroll-behavior: contain; } * { -webkit-tap-highlight-color: transparent; }';
  document.head.appendChild(css);
  addEventListener('resize', () => { applyViewport(); cart.call('android:size', { w: innerWidth, h: innerHeight }).catch(() => {}); });
  return cart.call('android:hello', { w: innerWidth, h: innerHeight }).then((h) => { cart.version = h.version; zoom = h.zoom || 1; applyViewport(); });
}

export async function afterMount() {
  const { store, call, go, tab, confirm, saveConfig } = await import('../store.js');
  const nav = await import('../nav.js');
  const { dispatch } = nav;
  const { watch } = await import('vue');
  const readSettings = () => { settings = store.config?.android || {}; };
  readSettings();
  watch(() => store.config?.android, readSettings, { deep: true });

  Native.setImmersive({ on: opt('immersive') }).catch(() => {});
  Native.addListener('pad', (e) => pad(nav, e));
  App.addListener('backButton', () => dispatch('back'));
  App.addListener('resume', () => { call('android:resume').catch(() => {}); });

  // Keep downloads alive in the background with a foreground notification
  let busy = false;
  let lastNote = 0;
  const note = () => {
    const active = store.downloads.filter((d) => ['queued', 'downloading'].includes(d.status));
    const cur = active.find((d) => d.status === 'downloading');
    const pct = cur && cur.total ? Math.round((cur.received / cur.total) * 100) : 0;
    return { busy: active.length > 0, title: active.length > 1 ? `Downloading ${active.length} games` : `Downloading ${cur?.name || active[0]?.name || ''}`, percent: pct };
  };
  cart.on('android:busy', (b) => { busy = b; if (opt('backgroundDownloads') || !b) Native.setBusy({ ...note(), busy: b }).catch(() => {}); });
  watch(() => store.downloads, () => {
    if (!busy || !opt('backgroundDownloads') || Date.now() - lastNote < 1000) return;
    lastNote = Date.now();
    Native.setBusy(note()).catch(() => {});
  });

  if (opt('autoUpdate')) setTimeout(() => checkUpdate().catch(() => {}), 15000);

  // Games are saved straight into the ROM folders, which needs "All files access" on Android 11+
  const st = await Native.storageStatus().catch(() => ({ granted: true }));
  if (!st.granted && await confirm('Allow file access', 'Cartridge saves games straight into your ROM folders (like ROMs/nds or ROMs/ps2) so ES-DE and your emulators see them. Android needs you to allow access to all files for that.', 'Open settings')) {
    Native.requestStorage().catch(() => {});
  }

  // ---------------- second screen (AYN Thor and other dual-screen devices)
  const { base, token } = cart.server;
  const companionUrl = `${base}/ui/index.html?companion=1&port=${new URL(base).port}&k=${token}`;
  const refreshCompanion = async () => {
    const d = await Native.displays().catch(() => ({ secondary: null }));
    store.androidDisplays = d;
    if (d.secondary && opt('dualScreen')) Native.showCompanion({ url: companionUrl }).catch(() => {});
    else Native.hideCompanion().catch(() => {});
  };
  Native.addListener('displays', refreshCompanion);
  watch(() => store.config?.android?.dualScreen, refreshCompanion);
  refreshCompanion();

  // The companion has its own copy of the library; it only needs to know what the top screen shows
  let focusedId = null, t = null;
  const publish = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const romId = store.route.name === 'game' ? Number(store.route.params.romId) : focusedId;
      call('android:companion:state', { route: store.route.name, romId: romId || null }).catch(() => {});
    }, 100);
  };
  document.addEventListener('focusin', (e) => {
    const m = /^rom-(\d+)$/.exec(e.target?.dataset?.key || '');
    focusedId = m ? +m[1] : store.route.name === 'game' ? focusedId : null;
    publish();
  });
  watch(() => [store.route.name, store.route.params.romId], publish);

  cart.on('android:companion:cmd', (c) => {
    if (c.pad) return dispatch(c.pad);
    if (c.tab) return c.tab === 'search' ? go('search') : tab(c.tab);
    if (c.open && c.romId) go('game', { romId: c.romId });
    if (c.dualScreen === false) saveConfig({ android: { dualScreen: false } });
  });
  cart.on('android:reconnected', () => call('library:get').then(() => {}).catch(() => {}));
}
