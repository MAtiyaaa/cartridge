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
function pad({ dispatch, markRepeat, input }, { action, down }) {
  input.kb = false;
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
  // The page itself never scrolls: a swipe that reached the end of a list used to carry on and
  // push the whole window up, leaving the Home header cut off after scrolling back.
  css.textContent = 'html, body { touch-action: pan-x pan-y; overflow: hidden; overscroll-behavior: none; } [data-scroll] { overscroll-behavior-y: contain; } * { -webkit-tap-highlight-color: transparent; }';
  document.head.appendChild(css);
  addEventListener('scroll', () => { if (scrollX || scrollY) scrollTo(0, 0); }, { passive: true });
  addEventListener('resize', () => { applyViewport(); cart.call('android:size', { w: innerWidth, h: innerHeight }).catch(() => {}); });
  return cart.call('android:hello', { w: innerWidth, h: innerHeight }).then((h) => { cart.version = h.version; zoom = h.zoom || 1; applyViewport(); });
}

export async function afterMount() {
  const { store, call, go, tab, confirm, saveConfig } = await import('../store.js');
  const nav = await import('../nav.js');
  // the dot on Settings (abdu2304's 0.9.3 Issues): Android counts missing emulators, BIOS and packages to install
  setTimeout(() => { if (store.config?.configured && store.lib) import('./issues.js').then((m) => m.androidIssues()).catch(() => {}); }, 8000);
  const { dispatch } = nav;
  const { watch } = await import('vue');
  // Settings changed on the second screen show up here right away
  cart.on('remote:config', (c) => { if (c && JSON.stringify(c) !== JSON.stringify(store.config)) store.config = c; });
  const readSettings = () => { settings = store.config?.android || {}; };
  readSettings();
  watch(() => store.config?.android, readSettings, { deep: true });

  Native.setImmersive({ on: opt('immersive') }).catch(() => {});
  Native.addListener('pad', (e) => pad(nav, e));
  App.addListener('backButton', () => dispatch('back'));
  App.addListener('resume', () => { call('android:resume').catch(() => {}); });
  // Fuse bridge: cartridge:// links, Back to Fuse, status for other apps (before any dialog below waits)
  (await import('./fuse.js')).startFuse();

  // Keep downloads alive in the background with a foreground notification
  let busy = false;
  let lastNote = 0;
  const note = () => {
    const active = store.downloads.filter((d) => ['queued', 'downloading'].includes(d.status));
    const cur = active.find((d) => d.status === 'downloading');
    const pct = cur && cur.total ? Math.round((cur.received / cur.total) * 100) : 0;
    // uploads from Fuse keep the notification too (after the downloads)
    const up = !active.length ? store.fuseUploads.find((u) => ['waiting', 'uploading', 'scanning'].includes(u.state)) : null;
    if (up) return { busy: true, title: `Uploading ${up.title} to RomM`, percent: up.total ? Math.round((up.sent / up.total) * 100) : 0 };
    return { busy: active.length > 0, title: active.length > 1 ? `Downloading ${active.length} games` : `Downloading ${cur?.name || active[0]?.name || ''}`, percent: pct };
  };
  cart.on('android:busy', (b) => { busy = b; if (opt('backgroundDownloads') || !b) Native.setBusy({ ...note(), busy: b }).catch(() => {}); });
  watch(() => [store.downloads, store.fuseUploads], () => {
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
  const { base, token, ports } = cart.server;
  const companionUrl = `${base}/ui/index.html?companion=1&port=${new URL(base).port}&k=${token}&ports=${ports.join(',')}`;
  const refreshCompanion = async () => {
    const d = await Native.displays().catch(() => ({ secondary: null }));
    store.androidDisplays = d;
    if (d.secondary && opt('dualScreen')) Native.showCompanion({ url: companionUrl }).catch(() => {});
    else Native.hideCompanion().catch(() => {});
  };
  Native.addListener('displays', refreshCompanion);
  watch(() => store.config?.android?.dualScreen, refreshCompanion);
  App.addListener('resume', refreshCompanion); // back in Cartridge: the second screen comes back if it was closed
  refreshCompanion();

  // Face button layout for the second screen's touch controls: Nintendo (A on the right) or
  // Xbox (A at the bottom). Auto goes by the controller's name; Settings → Android can override.
  let layout = 'xbox';
  let publish = () => {};
  const NINTENDO = /nintendo|switch|pro controller|joy-?con|\bns\b/i;
  const readLayout = async () => {
    const pick = store.config?.android?.buttonLayout || 'auto';
    let detected = 'xbox';
    try {
      const { names = [] } = await Native.controllers();
      store.androidPads = names;
      nav.input.padName = names[0] || ''; // for the button icons
      if (names.some((n) => NINTENDO.test(n))) detected = 'nintendo';
    } catch {}
    store.androidLayoutDetected = detected;
    const next = pick === 'auto' ? detected : pick;
    if (next !== layout) { layout = next; publish(); }
  };
  watch(() => store.config?.android?.buttonLayout, readLayout);
  Native.addListener('controllers', readLayout);
  readLayout();

  // What the top screen shows, for the second screen and phones (src/remote/publish.js)
  const remotePub = await import('../remote/publish.js');
  publish = remotePub.publish;
  remotePub.startPublisher({
    extra: () => ({ layout, family: layout === 'nintendo' ? 'nintendo' : undefined }),
    onCmd: (c) => { if (c.dualScreen === false) saveConfig({ android: { dualScreen: false } }); },
  });

  // Phone remote: Android's Node can't always see the Wi-Fi address, and discovery needs a multicast lock
  const remoteNet = async () => {
    try { const { address } = await Native.wifiAddress(); if (address) call('remote:address', address).catch(() => {}); } catch {}
    try { const s = await call('remote:settings'); Native.setDiscovery({ on: !!s.enabled }).catch(() => {}); } catch {}
  };
  cart.on('remote:settings', (s) => { Native.setDiscovery({ on: !!s?.enabled }).catch(() => {}); remoteNet(); });
  App.addListener('resume', remoteNet);
  remoteNet();

  cart.on('android:reconnected', () => call('library:get').then(() => {}).catch(() => {}));
}
