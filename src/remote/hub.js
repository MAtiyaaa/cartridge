// The phone app's connection to every Cartridge device on the network.
// Each device has its own address and per-phone token (remembered in this browser). The selected
// device backs window.cart, so the shared store and views work unchanged; the others stay
// connected for the device list and the combined downloads.
import { reactive, computed } from 'vue';

const LS = 'cartridge.remote.v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(LS) || '{}'); } catch {}
const phoneId = saved.phoneId || (crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now());

export const hub = reactive({
  phoneId,
  devices: saved.devices || {}, // id -> { id, name, kind, address, port, token, online, info, dls, lastSeen }
  selected: saved.selected || '',
  ready: false,
  here: '', // the device that served this page
  link: null, // { title, url, code, from }: a device asked this phone to open a link
});
function persist() {
  const devices = {};
  for (const [id, d] of Object.entries(hub.devices)) devices[id] = { id, name: d.name, kind: d.kind, address: d.address, port: d.port, base: d.base || '', token: d.token || '' };
  try { localStorage.setItem(LS, JSON.stringify({ phoneId, devices, selected: hub.selected })); } catch {}
}

export const phoneName = (() => {
  const ua = navigator.userAgent;
  const dev = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? ((ua.match(/Android [^;]+; ([^;)]+)/) || [])[1] || 'Android phone').trim() : 'Browser';
  const br = /CriOS|Chrome/.test(ua) ? 'Chrome' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : '';
  return br ? `${dev} · ${br}` : dev;
})();

// A device opened through a tunnel (https://cartridge.example.com) is reached at that address;
// the others on the Wi-Fi at http://<ip>:<port>.
const baseOf = (d) => d.base || `http://${d.address}:${d.port}`;
const HERE = () => ({ address: location.hostname, port: Number(location.port) || (location.protocol === 'https:' ? 443 : 80), base: location.origin });
export const selectedDevice = computed(() => hub.devices[hub.selected] || null);
export const pairedDevices = computed(() => Object.values(hub.devices).filter((d) => d.token));

// ------------------------------------------------------------- per-device client
const streams = new Map(); // id -> EventSource
const listeners = new Map(); // channel -> Set(fn) for the selected device (window.cart.on)

function imgUrl(d, query) { return `${baseOf(d)}/romimg/?_k=${d.token}&${query}`; }
const ROMIMG = /romimg:\/\/img\/\?([^\s"')]*)/g;
function rewrite(d, v) {
  if (typeof v === 'string') return v.includes('romimg://') ? v.replace(ROMIMG, (_, q) => imgUrl(d, q)) : v;
  if (Array.isArray(v)) return v.map((x) => rewrite(d, x));
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = rewrite(d, v[k]); return o; }
  return v;
}

export async function callOn(id, ch, arg) {
  const d = hub.devices[id];
  if (!d?.token) throw new Error('Not connected to this device');
  const r = await fetch(`${baseOf(d)}/ipc/${encodeURIComponent(ch)}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-cart-token': d.token }, body: JSON.stringify({ arg }),
  });
  if (r.status === 403) { forgetToken(id); throw new Error(`${d.name} no longer knows this phone. Connect again.`); }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  return rewrite(d, j.data);
}

function openStream(id) {
  const d = hub.devices[id];
  if (!d?.token || streams.has(id)) return;
  const es = new EventSource(`${baseOf(d)}/events?_k=${d.token}`);
  es.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    const data = rewrite(d, m.data);
    if (m.ch === 'downloads') d.dls = data;
    if (m.ch === 'remote:link' && data?.url) hub.link = { ...data, from: d.name };
    if (id === hub.selected) for (const fn of listeners.get(m.ch) || []) { try { fn(data); } catch (err) { console.error(err); } }
  };
  es.onopen = () => { d.online = true; };
  es.onerror = () => { d.online = false; };
  streams.set(id, es);
}
function closeStream(id) { streams.get(id)?.close(); streams.delete(id); }
function forgetToken(id) { const d = hub.devices[id]; if (d) { d.token = ''; closeStream(id); persist(); } }

// window.cart for the shared store/views: always the selected device
export const cart = {
  nativeTouch: true,
  call: (ch, arg) => callOn(hub.selected, ch, arg),
  on(ch, fn) {
    if (!listeners.has(ch)) listeners.set(ch, new Set());
    listeners.get(ch).add(fn);
    return () => listeners.get(ch)?.delete(fn);
  },
  img: (q) => (selectedDevice.value ? imgUrl(selectedDevice.value, q) : ''),
};

// ------------------------------------------------------------- finding devices
// with this phone's token, so the device can say whether it still knows us
async function hello(address, port, token = '', base = '') {
  const r = await fetch(`${base || `http://${address}:${port}`}/hello${token ? `?_k=${encodeURIComponent(token)}` : ''}`, { signal: AbortSignal.timeout(4000) });
  return r.json();
}
function upsert(p) {
  const d = hub.devices[p.id] || (hub.devices[p.id] = { id: p.id, token: '', online: false, info: null, dls: [] });
  Object.assign(d, { name: p.name, kind: p.kind || d.kind, address: p.address || d.address, port: p.port || d.port, lastSeen: Date.now() });
  if (p.base) d.base = p.base;
  if ('login' in p) d.login = !!p.login; // this device asks for a username and password
  return d;
}
export async function discover() {
  // the device that served this page, then everyone it knows about
  const here = HERE();
  try {
    const known = Object.values(hub.devices).find((d) => d.base === here.base);
    const me = await hello(here.address, here.port, known?.token || '', here.base);
    upsert({ ...me, ...here });
    hub.here = me.id;
    // through a tunnel (https) the other devices' Wi-Fi addresses can't be reached, so only this one is listed
    const peers = location.protocol === 'https:' ? [] : await (await fetch('/peers')).json();
    for (const p of peers) if (!p.self) upsert(p);
  } catch {}
  // devices remembered from before, maybe on another address now: check they answer
  await Promise.all(Object.values(hub.devices).map(async (d) => {
    try { const h = await hello(d.address, d.port, d.token, d.base); upsert({ ...h, address: d.address, port: d.port }); d.online = true; if (!h.paired && d.token) forgetToken(d.id); }
    catch { d.online = false; }
  }));
  for (const d of Object.values(hub.devices)) if (d.token && d.online) openStream(d.id);
  if (!hub.selected || !hub.devices[hub.selected]?.token) hub.selected = pairedDevices.value.find((d) => d.online)?.id || pairedDevices.value[0]?.id || '';
  persist();
  hub.ready = true;
}
export async function addByAddress(text) {
  const t = String(text).trim();
  // a full https address (a tunnel) is used as is; a bare ip or name gets the usual port
  const u = new URL(/^https?:\/\//i.test(t) ? t : `http://${t.includes(':') ? t : t + ':47280'}`);
  const base = u.origin;
  const port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80);
  const h = await hello(u.hostname, port, '', base);
  if (h.app !== 'cartridge') throw new Error('No Cartridge there');
  const d = upsert({ ...h, address: u.hostname, port, base: /^https:/.test(base) || !u.port ? base : '' });
  d.online = true;
  persist();
  return d;
}

// ------------------------------------------------------------- pairing
async function post(d, p, body) {
  const r = await fetch(`${baseOf(d)}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  return j.data;
}
export const pairStart = (id) => post(hub.devices[id], '/pair/start', { phoneId, name: phoneName });
export async function pairFinish(id, code) {
  const res = await post(hub.devices[id], '/pair/finish', { phoneId, code });
  connected(id, res.token);
}
export async function pairLogin(id, user, pass) {
  const res = await post(hub.devices[id], '/pair/login', { phoneId, name: phoneName, user, pass });
  connected(id, res.token);
}
export async function pairWithQr(secret) {
  const here = HERE();
  const res = await post(here, '/pair/qr', { phoneId, name: phoneName, secret });
  const me = await hello(here.address, here.port, '', here.base);
  upsert({ ...me, ...here });
  connected(res.id, res.token);
}
function connected(id, token) {
  const d = hub.devices[id];
  d.token = token; d.online = true;
  openStream(id);
  hub.selected = id;
  persist();
}
export async function disconnect(id) {
  try { await callOn(id, 'remote:unpair'); } catch {}
  forgetToken(id);
  if (hub.selected === id) hub.selected = pairedDevices.value[0]?.id || '';
  persist();
}
export function select(id) { if (hub.devices[id]?.token) { hub.selected = id; persist(); } }

// ------------------------------------------------------------- live device info (battery, storage, downloads)
async function refreshInfo() {
  await Promise.all(pairedDevices.value.map(async (d) => {
    try {
      d.info = await callOn(d.id, 'remote:info');
      if (!d.dls?.length) d.dls = await callOn(d.id, 'dl:list');
      d.online = true;
    } catch { d.online = false; }
  }));
}
setInterval(refreshInfo, 5000);
setInterval(() => discover().catch(() => {}), 20000);
export const refresh = refreshInfo;

// ------------------------------------------------------------- display helpers
export const kindIcon = (k) => (k === 'android' ? 'mdiNintendoSwitch' : k === 'deck' ? 'mdiSteam' : 'mdiMonitor');
export const kindLabel = (k) => (k === 'android' ? 'Handheld' : k === 'deck' ? 'Steam Deck' : 'Computer');
export function batteryIcon(b) {
  if (!b) return 'mdiBatteryUnknown';
  if (b.charging) return 'mdiBatteryCharging';
  const l = Math.round(b.level / 10) * 10;
  return l >= 100 ? 'mdiBattery' : l <= 0 ? 'mdiBatteryOutline' : 'mdiBattery' + l;
}
export const pct = (d) => (d?.total ? Math.min(100, Math.round((d.received / d.total) * 100)) : 0);
// an image from a specific device (cover of a download queued there)
export const imgOn = (d, p) => (p && d?.token ? imgUrl(d, 'u=' + encodeURIComponent(p)) : '');
