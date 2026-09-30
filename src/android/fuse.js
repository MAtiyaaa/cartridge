// Fuse bridge on Android (docs/FUSE_BRIDGE.md): cartridge:// links, Back returning to Fuse, and the status
// other apps read through CartridgeStatusProvider. Loaded by app.js after the app has mounted.
import { App } from '@capacitor/app';
import { Native } from './native.js';
import { cart } from './bridge.js';
import { parseDeepLink } from './deeplink.js';
import { consoleKey } from './emulators.js';
import { openLink } from '../links.js';
import { store, call, setRootBack } from '../store.js';

// Opened by Fuse: Back on the first page goes back to it. Only for that visit: once Cartridge leaves
// the screen (Home button, an emulator, back to Fuse) Back works as usual again.
let fromFuse = false;
let lastUrl = '';
let lastAt = 0;

function receive(url) {
  // a cold start delivers the same link twice (launch URL and appUrlOpen)
  if (!url || (url === lastUrl && Date.now() - lastAt < 3000)) return;
  lastUrl = url;
  lastAt = Date.now();
  const link = parseDeepLink(url);
  if (!link) return;
  if (link.from === 'fuse') fromFuse = true;
  openLink(link, { keyOf: consoleKey });
}

export function startFuse() {
  App.addListener('appUrlOpen', (e) => receive(e?.url));
  App.getLaunchUrl().then((r) => {
    const url = r?.url;
    // the launch URL stays the same after the page reloads (Relaunch): open it once per start
    try { if (!url || sessionStorage.getItem('fuse:launch') === url) return; sessionStorage.setItem('fuse:launch', url); } catch {}
    receive(url);
  }).catch(() => {});
  App.addListener('appStateChange', ({ isActive }) => { if (!isActive) fromFuse = false; });
  setRootBack(() => {
    if (!fromFuse || store.modal || store.quickMenu) return false;
    fromFuse = false;
    Native.returnToCaller().catch(() => {}); // moves the task back; downloads keep going (DownloadService)
    return true;
  });

  // The status snapshot is built by the backend (electron/fuseStatus.js), which sends it when downloads,
  // the connection or the library change (at most every 500 ms). Native keeps it for the provider.
  let last = '';
  const publish = (s) => {
    if (!s) return;
    const key = JSON.stringify({ ...s, updatedAt: 0 });
    if (key === last) return;
    last = key;
    Native.publishStatus(s).catch(() => { last = ''; });
  };
  cart.on('fuse:status', publish);
  const refresh = () => call('fuse:status').then(publish).catch(() => {});
  App.addListener('resume', refresh);
  cart.on('android:reconnected', refresh);
  refresh();
}
