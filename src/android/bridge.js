// Android replacement for electron/preload.js. Provides the same window.cart API
// ({ call, on }) but talks to the embedded Node backend over HTTP + Server-Sent Events.
// Also used by the second-screen WebView (companion), which has no Capacitor bridge and
// gets the server address from its URL.
const params = new URLSearchParams(location.search);
export const isCompanion = params.has('companion');

let base = '';
let token = '';
const listeners = new Map(); // channel -> Set(fn)
const overrides = new Map(); // channel -> fn(arg), answered in the WebView instead of Node

function emit(ch, data) {
  for (const fn of listeners.get(ch) || []) { try { fn(data); } catch (e) { console.error(e); } }
}

// Backend payloads carry romimg:// URLs; point them at the local server instead.
const ROMIMG = 'romimg://img/?';
function rewrite(v) {
  if (typeof v === 'string') return v.includes(ROMIMG) ? v.split(ROMIMG).join(`${base}/romimg/?_k=${token}&`) : v;
  if (Array.isArray(v)) return v.map(rewrite);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = rewrite(v[k]); return o; }
  return v;
}

async function call(ch, arg) {
  const own = overrides.get(ch);
  if (own) return own(arg);
  const r = await fetch(`${base}/ipc/${encodeURIComponent(ch)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-cart-token': token },
    body: JSON.stringify({ arg }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  return rewrite(j.data);
}

function on(ch, fn) {
  if (!listeners.has(ch)) listeners.set(ch, new Set());
  listeners.get(ch).add(fn);
  return () => listeners.get(ch)?.delete(fn);
}

function listen() {
  const es = new EventSource(`${base}/events?_k=${token}`);
  es.onmessage = (e) => {
    try { const { ch, data } = JSON.parse(e.data); emit(ch, rewrite(data)); } catch {}
  };
  // A dropped stream reconnects on its own; when it does, refresh what may have been missed
  let wasOpen = false;
  es.onopen = () => { if (wasOpen) emit('android:reconnected', null); wasOpen = true; };
}

export const cart = {
  call,
  on,
  img: (query) => `${base}/romimg/?_k=${token}&${query}`,
  override: (ch, fn) => overrides.set(ch, fn),
  emit,
  get server() { return { base, token }; },
};

// Resolves once the Node backend is reachable
export const ready = (async () => {
  if (isCompanion || params.has('port')) { // companion screen, or the UI opened in a browser for testing
    base = `http://127.0.0.1:${params.get('port')}`;
    token = params.get('k') || '';
  } else {
    const { NodeJS } = await import('capacitor-nodejs');
    const info = await new Promise((resolve) => {
      NodeJS.addListener('server', (e) => resolve(e.args[0]));
      NodeJS.whenReady().then(() => NodeJS.send({ eventName: 'hello', args: [] }));
    });
    base = `http://127.0.0.1:${info.port}`;
    token = info.token;
  }
  window.cart = cart;
  listen();
  return cart;
})();
