// Tells second screens (the Thor's bottom screen, phones) what this device's main screen shows,
// and carries out their commands (touch pad presses, open a game, jump to a tab). Shared by the
// Android and desktop builds; also reports the battery for the phone app's device list.
import { watch } from 'vue';
import { store, call, go, tab } from '../store.js';
import { dispatch } from '../nav.js';
import { padKind } from '../pad.js';

let extras = () => ({});
let focused = {}, t = null, started = false, seq = 0;

export function publish() {
  clearTimeout(t);
  t = setTimeout(() => {
    const r = store.route, p = r.params || {};
    const st = { route: r.name, romId: null, platformId: null, collectionId: null };
    if (r.name === 'game') st.romId = Number(p.romId);
    else if (focused.romId) st.romId = focused.romId;
    else if (focused.platformId) st.platformId = focused.platformId;
    else if (focused.collectionId) st.collectionId = focused.collectionId;
    else if (r.name === 'platform') st.platformId = Number(p.platformId);
    else if (r.name === 'collection') st.collectionId = p.collectionId;
    st.seq = Date.now() * 1000 + (++seq % 1000); // requests can arrive out of order: the newest wins (second screen showed an older game)
    st.family = padKind.value; // touch buttons are drawn for the controller used here
    Object.assign(st, extras());
    call('remote:state', st).catch(() => {});
  }, 60);
}

export function startPublisher({ extra, onCmd } = {}) {
  if (extra) extras = extra;
  if (started) return;
  started = true;
  document.addEventListener('focusin', (e) => {
    const m = /^(rom|sys|col)-(.+)$/.exec(e.target?.dataset?.key || '');
    if (!m) return; // buttons and tabs keep showing the last highlighted item
    focused = m[1] === 'rom' ? { romId: +m[2] } : m[1] === 'sys' ? { platformId: +m[2] } : { collectionId: isNaN(+m[2]) ? m[2] : +m[2] };
    publish();
  });
  watch(() => [store.route.name, JSON.stringify(store.route.params)], () => { focused = {}; publish(); });
  watch(() => padKind.value, publish);

  window.cart.on('remote:cmd', (c) => {
    if (!c) return;
    if (c.pad) return dispatch(c.pad);
    if (c.tab) return c.tab === 'search' ? go('search') : tab(c.tab);
    if (c.open && c.romId) go('game', { romId: c.romId });
    if (c.open && c.platformId) go('platform', { platformId: c.platformId });
    if (c.open && c.collectionId) go('collection', { collectionId: c.collectionId });
    onCmd?.(c);
  });

  // battery for the phone app's device list
  navigator.getBattery?.().then((b) => {
    const send = () => call('remote:battery', { level: Math.round(b.level * 100), charging: b.charging }).catch(() => {});
    send(); b.onlevelchange = send; b.onchargingchange = send;
  }).catch(() => {});
  publish();
}
