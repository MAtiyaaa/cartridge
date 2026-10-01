// cartridge:// links from other apps, like the Fuse launcher (docs/FUSE_BRIDGE.md): open the page a link
// points at. The desktop gets links from the command line (electron/main.js), Android from its intents
// (src/android/fuse.js). Both builds use this file.
import { store, go, tab, call, toast, resync, romById } from './store.js';
import { parseDeepLink, findPlatform } from './android/deeplink.js';

const TABS = new Set(['home', 'library', 'downloads', 'consoles', 'settings']);

// polls until ok() or ms passed; resolves with ok()
const until = (ok, ms) => new Promise((resolve) => {
  const t0 = Date.now();
  const check = () => (ok() || Date.now() - t0 > ms ? resolve(!!ok()) : setTimeout(check, 100));
  check();
});

// A link from Fuse starts a fresh history, so Back on its page ends the visit (on Android, back to Fuse).
// Other links keep it, like any other way of opening a page.
function show(link, name, params = {}) {
  if (link.from === 'fuse') { store.history = []; store.route = { name, params }; return; }
  if (store.route.name !== name || JSON.stringify(store.route.params) !== JSON.stringify(params)) go(name, params);
}

// link: from parseDeepLink. keyOf: console aliases (Android passes consoleKey).
export async function openLink(link, { keyOf } = {}) {
  if (!link) return;
  // Cartridge may still be starting: settings first, then the library for games and consoles
  if (!(await until(() => store.config, 20000)) || !store.config.configured) return; // Setup is showing
  if (['game', 'platform', 'bios', 'upload'].includes(link.route)) await until(() => store.lib, 20000);
  store.quickMenu = false;
  const { route, params } = link;
  if (TABS.has(route)) return tab(route);
  if (route === 'sync') { resync(); return tab('home'); }
  if (route === 'search') { store.lastSearch = params.q; return show(link, 'search'); } // no console filter in Search: platform is ignored
  if (route === 'upload') {
    // a game from Fuse to upload to RomM: its page checks the files and asks first (views/FuseUpload.vue)
    store.fuseUpload = { request: params.request || null, json: params.json || null, keyOf: keyOf || null, at: Date.now() };
    return show(link, 'fuse-upload', { at: store.fuseUpload.at });
  }
  if (route === 'game') {
    if (romById(params.romId)) return show(link, 'game', { romId: params.romId });
    tab('library');
    return toast('That game isn’t in your library', 'info');
  }
  // platform and bios: a console's page has its BIOS files too (the BIOS button)
  const p = findPlatform(store.lib?.platforms, params.slug, keyOf);
  if (p) return show(link, 'platform', { platformId: p.id });
  tab('consoles');
  toast('That console isn’t in your library', 'info');
}

// Desktop: a link on the command line, or handed over by a second launch. main.js keeps it until taken.
export function desktopLinks() {
  const take = () => call('app:deeplink').then((url) => url && openLink(parseDeepLink(url))).catch(() => {});
  window.cart.on('deeplink', take);
  take();
}
