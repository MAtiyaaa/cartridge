// Cartridge's own web server, shared by the desktop app and the Android app.
//
//  - Loopback (127.0.0.1, Android only): the Android WebViews talk to the backend here, with full
//    access through a random local token.
//  - Network ("Phone remote", off by default): phones on the same Wi-Fi open /remote/, pair once
//    (a code shown on this device, or a QR that skips it) and then get a per-phone token that
//    unlocks a short allowlist: library, downloads, highlighted game, controls. Never settings,
//    files, server credentials or deletes.
//
// API (both listeners): POST /ipc/<channel> { arg } -> { ok, data | error }, GET /events (SSE),
// GET /romimg/?... (images). Network extras: /hello, /peers, /pair/*, /remote/ (the phone app).
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

// What a paired phone may call. Everything else is refused on the network listener.
const LAN_CHANNELS = new Set([
  'config:get', 'app:info', 'library:get', 'installed:get', 'art:all', 'logo:get', 'syslogo:get', 'icon:get',
  'platforms:paths', 'dl:list', 'dl:add', 'dl:cancel', 'dl:retry', 'dl:clear', 'dl:move', 'dl:pauseAll', 'dl:resumeAll', 'api:get',
  'remote:info', 'remote:get', 'remote:cmd', 'remote:unpair',
  'upload:list', 'upload:start', 'upload:cancel', // Upload to RomM (start is limited to detected files and phone uploads)
]);
// Events a phone receives (the rest stay on the device)
const LAN_EVENTS = new Set(['library', 'installed', 'installed-changed', 'downloads', 'sync', 'remote:state', 'remote:config', 'remote:info', 'logos-progress', 'remote:link', 'upload']);
const API_OK = /^\/api\/roms\/\d+$/; // RomM reads a phone may make through the device (game details)

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const rand = (n) => crypto.randomBytes(n).toString('hex');

// Config without secrets: RomM login, API keys and paired phones never leave the device
function publicConfig(c) {
  if (!c) return c;
  const { server = {}, ra = {}, sgdbKey, remote, ...rest } = c;
  return { ...rest, server: { mode: server.mode, localUrl: server.localUrl, remoteUrl: server.remoteUrl }, ra: { user: ra.user || '' }, sgdbKey: sgdbKey ? 'set' : '' };
}

function lanAddresses() {
  const out = [];
  try {
    for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  } catch {} // Android can refuse to list interfaces; the app then tells us its Wi-Fi address
  return out;
}

module.exports = function createRemoteServer(opts) {
  const { invoke, handleImage, uiDir, remoteDir, dataDir, version, kind = 'pc', log = () => {} } = opts;
  const FILE = path.join(dataDir, 'remote.json');
  let st = {};
  try { st = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
  st = { id: st.id || rand(8), name: st.name || defaultName(), enabled: !!st.enabled, port: st.port || 47280, phones: st.phones || {}, login: st.login || null };
  const save = () => { try { fs.writeFileSync(FILE, JSON.stringify(st, null, 2)); } catch (e) { log('remote save failed', e.message); } };
  save();

  function defaultName() {
    const h = os.hostname() || '';
    if (kind === 'android') return 'Android handheld';
    return /^(localhost|steamdeck)$/i.test(h) ? (h.toLowerCase() === 'steamdeck' ? 'Steam Deck' : 'Cartridge') : h || 'Cartridge';
  }

  const localToken = opts.localToken || rand(18);
  let extraAddress = ''; // the Android app reports its Wi-Fi address here
  let battery = null; // { level, charging } from the UI
  let companion = null; // what the device's main screen is showing (for second screens)
  let lan = null; // network listener
  let discovery = null;
  const clients = new Set(); // { res, lan }
  let pairing = null; // { phoneId, name, code, expires, tries }
  let pairLockUntil = 0;
  const qrSecrets = new Map(); // secret -> expires

  // ------------------------------------------------------------- events
  function write(c, ch, data) {
    try { c.res.write(`data: ${JSON.stringify({ ch, data: data === undefined ? null : data })}\n\n`); } catch {}
  }
  // toLocal=false: the event already reached the device's own window (desktop broadcast)
  function send(ch, data, toLocal = true) {
    if (ch === 'upload') phoneUploadSettled(data);
    const pub = ch === 'remote:config' ? publicConfig(data) : data;
    for (const c of clients) {
      if (!c.lan) write(c, ch, data);
      else if (LAN_EVENTS.has(ch)) write(c, ch, pub);
    }
    if (toLocal) opts.emitLocal?.(ch, data); // desktop: forward to the window
  }
  setInterval(() => { for (const c of clients) { try { c.res.write(': ping\n\n'); } catch {} } }, 20000).unref();
  const phonesOnline = () => [...clients].filter((c) => c.lan).length;

  // ------------------------------------------------------------- device info
  function addresses() { const a = lanAddresses(); if (extraAddress && !a.includes(extraAddress)) a.unshift(extraAddress); return a; }
  async function storage() {
    const cfg = await invokeData('config:get').catch(() => null);
    const dirs = new Set();
    if (cfg?.romsRoot) dirs.add(cfg.romsRoot);
    for (const p of Object.values(cfg?.paths || {})) if (p) dirs.add(path.dirname(p));
    const out = [];
    for (const d of dirs) {
      let dir = d;
      while (dir && !fs.existsSync(dir)) { const up = path.dirname(dir); if (up === dir) break; dir = up; }
      try { const s = await fs.promises.statfs(dir); out.push({ path: d, free: s.bavail * s.bsize, total: s.blocks * s.bsize }); } catch {}
    }
    // one entry per disk
    const seen = new Set();
    return out.filter((s) => { const k = s.total + ':' + Math.round(s.free / 1e8); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  async function info() {
    const dls = await invokeData('dl:list').catch(() => []);
    const cur = (dls || []).find((d) => d.status === 'downloading') || (dls || []).find((d) => d.status === 'queued');
    return {
      id: st.id, name: st.name, kind, version, battery,
      addresses: addresses(), port: st.port,
      downloading: cur ? { name: cur.name, received: cur.received, total: cur.total, speed: cur.speed, status: cur.status, count: dls.filter((d) => ['queued', 'downloading'].includes(d.status)).length } : null,
      storage: await storage(),
    };
  }
  async function invokeData(ch, arg) {
    const r = await invoke(ch, arg);
    if (!r || !r.ok) throw new Error(r?.error || 'failed');
    return r.data;
  }

  // ------------------------------------------------------------- pairing
  function issueToken(phoneId, name) {
    const token = rand(24);
    st.phones[phoneId] = { name: String(name || 'Phone').slice(0, 60), hash: sha(token), pairedAt: Date.now(), lastSeen: Date.now() };
    save();
    send('remote:settings', settingsView());
    return token;
  }
  function phoneFor(token) {
    if (!token) return null;
    const h = sha(token);
    for (const [id, p] of Object.entries(st.phones)) if (p.hash === h) return { id, p };
    return null;
  }
  // Sign-in for phones (Settings → Phone remote): with a username and password set, every phone signs
  // in with them instead of a code or QR, so the device can sit behind a tunnel like Cloudflare.
  // The password is kept only as a salted scrypt hash; wrong tries lock sign-in for a minute.
  const pwHash = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
  let loginFails = 0;
  function pairLogin({ phoneId, name, user, pass }) {
    if (!st.enabled) throw new Error('Phone remote is off on this device');
    if (!st.login) throw new Error('This device uses a code instead');
    if (Date.now() < pairLockUntil) throw new Error('Too many wrong tries. Wait a minute and try again.');
    if (!phoneId) throw new Error('Missing phone id');
    const a = Buffer.from(pwHash(pass || '', st.login.salt), 'hex'), b = Buffer.from(st.login.hash, 'hex');
    const ok = String(user || '').trim().toLowerCase() === st.login.user.toLowerCase() && crypto.timingSafeEqual(a, b);
    if (!ok) {
      if (++loginFails >= 5) { loginFails = 0; pairLockUntil = Date.now() + 60e3; log('remote: sign-in locked after wrong tries'); }
      throw new Error('Wrong username or password');
    }
    loginFails = 0;
    return { token: issueToken(String(phoneId).slice(0, 64), name), id: st.id, name: st.name };
  }
  function setLogin(l) {
    if (!l || l.off) st.login = null;
    else {
      const user = String(l.user || '').trim().slice(0, 40), pass = String(l.pass || '');
      if (!user) throw new Error('Choose a username');
      if (pass.length < 6) throw new Error('Use at least 6 characters for the password');
      const salt = rand(16);
      st.login = { user, salt, hash: pwHash(pass, salt) };
    }
    return removePhones('all'); // every phone signs in again with the new rule
  }

  function pairStart({ phoneId, name }) {
    if (!st.enabled) throw new Error('Phone remote is off on this device');
    if (st.login) throw new Error('This device asks for a username and password');
    if (Date.now() < pairLockUntil) throw new Error('Too many wrong codes. Try again in a minute.');
    if (!phoneId) throw new Error('Missing phone id');
    const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
    pairing = { phoneId: String(phoneId).slice(0, 64), name: String(name || 'Phone').slice(0, 60), code, expires: Date.now() + 120e3, tries: 0 };
    send('remote:pair', { name: pairing.name, code, expires: pairing.expires });
    return { expires: pairing.expires, device: st.name };
  }
  function pairFinish({ phoneId, code }) {
    if (!pairing || pairing.phoneId !== phoneId || Date.now() > pairing.expires) throw new Error('The code expired. Ask for a new one.');
    if (String(code) !== pairing.code) {
      if (++pairing.tries >= 5) { pairing = null; pairLockUntil = Date.now() + 60e3; send('remote:pair:done', { ok: false }); throw new Error('Too many wrong codes. Try again in a minute.'); }
      throw new Error('Wrong code');
    }
    const token = issueToken(pairing.phoneId, pairing.name);
    pairing = null;
    send('remote:pair:done', { ok: true });
    return { token, id: st.id, name: st.name };
  }
  function pairQr({ phoneId, name, secret }) {
    if (st.login) throw new Error('This device asks for a username and password');
    const exp = qrSecrets.get(secret);
    if (!exp || Date.now() > exp) throw new Error('This QR code expired. Show a new one on the device.');
    qrSecrets.delete(secret);
    return { token: issueToken(String(phoneId).slice(0, 64), name), id: st.id, name: st.name };
  }
  function newQr() {
    const secret = rand(12);
    qrSecrets.set(secret, Date.now() + 5 * 60e3);
    const host = addresses()[0];
    return { secret, url: host ? `http://${host}:${st.port}/remote/${st.login ? '' : `?pair=${secret}`}` : '', expires: Date.now() + 5 * 60e3 }; // with sign-in on, the QR only opens the page
  }

  // ------------------------------------------------------------- settings (device only)
  function settingsView() {
    return {
      enabled: st.enabled, name: st.name, port: st.port, id: st.id, addresses: addresses(), listening: !!lan,
      phones: Object.entries(st.phones).map(([id, p]) => ({ id, name: p.name, pairedAt: p.pairedAt, lastSeen: p.lastSeen })),
      online: phonesOnline(),
      login: st.login ? { user: st.login.user } : null,
    };
  }
  async function setSettings(patch = {}) {
    if (typeof patch.name === 'string' && patch.name.trim()) st.name = patch.name.trim().slice(0, 40);
    if (typeof patch.enabled === 'boolean') st.enabled = patch.enabled;
    save();
    discovery?.update({ name: st.name });
    if (st.enabled && !lan) await startLan();
    if (!st.enabled && lan) stopLan();
    send('remote:settings', settingsView());
    return settingsView();
  }
  function removePhones(id) {
    if (id === 'all') st.phones = {}; else delete st.phones[id];
    save();
    for (const c of [...clients]) if (c.lan && (id === 'all' || c.phoneId === id)) { try { c.res.end(); } catch {} clients.delete(c); }
    send('remote:settings', settingsView());
    return settingsView();
  }

  // Channels the host app registers (desktop: ipcMain, Android: the loopback API)
  const handlers = {
    'remote:settings': () => settingsView(),
    'remote:set': (p) => setSettings(p),
    'remote:qr': () => newQr(),
    'remote:login:set': (l) => setLogin(l),
    'remote:phones:remove': (id) => removePhones(id),
    'remote:pair:deny': () => { pairing = null; send('remote:pair:done', { ok: false, denied: true }); return true; },
    'remote:battery': (b) => { battery = b && typeof b.level === 'number' ? { level: b.level, charging: !!b.charging } : null; return true; },
    'remote:address': (a) => { extraAddress = typeof a === 'string' ? a : ''; return true; },
    'remote:state': (s) => { if (s?.seq && companion?.seq && s.seq < companion.seq) return true; companion = s; send('remote:state', s); return true; }, // older than what we have: dropped
    'remote:get': () => companion,
    'remote:cmd': (c) => { send('remote:cmd', c); return true; },
    'remote:info': () => info(),
    // a link for connected phones to open (RomM's QR sign-in approval page, from Setup)
    'remote:link': (l) => { if (!/^https?:\/\//.test(String(l?.url || ''))) throw new Error('Not a web link'); send('remote:link', { title: String(l.title || '').slice(0, 80), url: l.url, code: String(l.code || '').slice(0, 20) }); return phonesOnline(); },
    'remote:peers': () => peers(),
  };

  // ------------------------------------------------------------- uploads from a phone
  // A file picked on the phone comes in as numbered pieces (small enough for tunnels like Cloudflare,
  // resumable by offset), lands in a temporary folder on the device and goes on to RomM with the
  // device's own Upload to RomM. The temporary copy is deleted once RomM has it (or it failed).
  const UP_DIR = path.join(dataDir, 'phone-uploads');
  const phoneUps = new Map(); // id -> { file, size, platformId }
  const phoneFiles = new Map(); // file -> id, once handed to Upload to RomM
  try { for (const d of fs.readdirSync(UP_DIR)) fs.rmSync(path.join(UP_DIR, d), { recursive: true, force: true }); } catch {} // leftovers from last time
  function phoneUploadStart({ name, size, platformId }) {
    const clean = path.basename(String(name || '')).replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 200);
    if (!clean || clean.startsWith('.')) throw new Error('That file name is not allowed');
    if (!Number(size) || !Number(platformId)) throw new Error('Pick a console first');
    const id = rand(8), dir = path.join(UP_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, clean);
    fs.writeFileSync(file, '');
    phoneUps.set(id, { file, size: Number(size), platformId: Number(platformId) });
    return { id, received: 0 };
  }
  async function phoneUploadChunk(id, offset, req) {
    const u = phoneUps.get(id);
    if (!u) throw Object.assign(new Error('Upload not found. Start it again.'), { code: 404 });
    const have = fs.statSync(u.file).size;
    if (Number(offset) !== have) return { received: have }; // resume from what arrived
    await new Promise((ok, bad) => { const ws = fs.createWriteStream(u.file, { flags: 'a' }); req.pipe(ws); ws.on('finish', ok); ws.on('error', bad); req.on('error', bad); });
    const now = fs.statSync(u.file).size;
    if (now > u.size) { fs.rmSync(path.dirname(u.file), { recursive: true, force: true }); phoneUps.delete(id); throw new Error('More data than the file size'); }
    return { received: now };
  }
  async function phoneUploadFinish(id) {
    const u = phoneUps.get(id);
    if (!u) throw new Error('Upload not found. Start it again.');
    if (fs.statSync(u.file).size !== u.size) throw new Error('The file did not arrive completely');
    phoneUps.delete(id);
    phoneFiles.set(u.file, id);
    await invokeData('upload:start', { path: u.file, platformId: u.platformId });
    return { path: u.file };
  }
  function phoneUploadSettled(d) {
    if (!d?.path || !phoneFiles.has(d.path) || !['done', 'error', 'cancelled'].includes(d.state)) return;
    phoneFiles.delete(d.path);
    fs.rm(path.dirname(d.path), { recursive: true, force: true }, () => {});
  }

  // ------------------------------------------------------------- HTTP
  function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-cart-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  }
  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = []; let size = 0;
      req.on('data', (c) => { size += c.length; if (size > 1e6) req.destroy(); else chunks.push(c); });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }
  const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  function serveFile(res, dir, rel, fallback) {
    const clean = path.normalize(decodeURIComponent(rel || '')).replace(/^(\.\.[/\\])+/, '');
    let file = path.join(dir, clean);
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, fallback);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': /\.html$/.test(file) ? 'no-cache' : 'max-age=86400' });
    fs.createReadStream(file).pipe(res);
  }

  async function localCall(ch, arg) {
    if (handlers[ch]) { try { return { ok: true, data: await handlers[ch](arg) }; } catch (e) { return { ok: false, error: e.message || String(e) }; } }
    return invoke(ch, arg);
  }
  async function lanCall(ch, arg, phone) {
    if (!LAN_CHANNELS.has(ch)) return { ok: false, error: 'Not allowed from a phone' };
    if (ch === 'remote:unpair') { removePhones(phone.id); return { ok: true, data: true }; }
    if (ch === 'api:get' && !API_OK.test(String(arg?.path || ''))) return { ok: false, error: 'Not allowed from a phone' };
    if (ch === 'remote:cmd' && arg?.tab === 'settings') return { ok: false, error: 'Settings stay on the device' };
    // a phone may only upload what Upload to RomM found in the console folders, or a file it sent itself
    if (ch === 'upload:start') {
      const f = String(arg?.path || '');
      const listed = (await invokeData('upload:list').catch(() => ({ files: [] }))).files || [];
      if (!phoneFiles.has(f) && !listed.some((x) => x.path === f)) return { ok: false, error: 'Not allowed from a phone' };
    }
    const r = await localCall(ch, arg);
    if (ch === 'config:get' && r.ok) r.data = publicConfig(r.data);
    if (ch === 'app:info' && r.ok) r.data = { version: r.data?.version, gamescope: r.data?.gamescope };
    return r;
  }

  function makeHandler(isLan) {
    return async (req, res) => {
      cors(res);
      if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
      const url = new URL(req.url, 'http://x');
      const key = req.headers['x-cart-token'] || url.searchParams.get('_k') || '';
      let phone = null;
      const authed = isLan ? !!(phone = phoneFor(key)) : key === localToken;
      if (phone) { phone.p.lastSeen = Date.now(); }
      try {
        // public on the network: who is this, who else is around, pairing, the phone app
        if (isLan && url.pathname === '/hello') return json(res, 200, { app: 'cartridge', id: st.id, name: st.name, kind, version, paired: !!phone, pairing: st.enabled, login: !!st.login });
        if (isLan && url.pathname === '/peers') return json(res, 200, peers());
        if (isLan && url.pathname.startsWith('/pair/')) {
          const body = JSON.parse((await readBody(req)) || '{}');
          const fn = { '/pair/start': pairStart, '/pair/finish': pairFinish, '/pair/qr': pairQr, '/pair/login': pairLogin }[url.pathname];
          if (!fn) { res.writeHead(404); return res.end(); }
          try { return json(res, 200, { ok: true, data: fn(body) }); } catch (e) { return json(res, 200, { ok: false, error: e.message }); }
        }
        if (isLan && (url.pathname === '/' || url.pathname === '/remote')) { res.writeHead(302, { Location: '/remote/' + url.search }); return res.end(); }
        if (isLan && url.pathname.startsWith('/remote/')) return serveFile(res, remoteDir, url.pathname.slice(8), 'remote.html');

        if (isLan && url.pathname.startsWith('/phone-upload/')) {
          if (!authed) return json(res, 403, { ok: false, error: 'Not paired' });
          const [, , id, act] = url.pathname.split('/');
          try {
            if (id === 'start') return json(res, 200, { ok: true, data: phoneUploadStart(JSON.parse((await readBody(req)) || '{}')) });
            if (act === 'finish') return json(res, 200, { ok: true, data: await phoneUploadFinish(id) });
            if (req.method === 'PUT') return json(res, 200, { ok: true, data: await phoneUploadChunk(id, url.searchParams.get('offset'), req) });
          } catch (e) { return json(res, e.code === 404 ? 404 : 200, { ok: false, error: e.message }); }
          res.writeHead(404); return res.end();
        }
        if (url.pathname.startsWith('/ipc/')) {
          if (!authed) return json(res, 403, { ok: false, error: 'Not paired' });
          const ch = decodeURIComponent(url.pathname.slice(5));
          const body = await readBody(req);
          const arg = body ? JSON.parse(body).arg : undefined;
          const out = isLan ? await lanCall(ch, arg, phone) : await localCall(ch, arg);
          return json(res, 200, out === undefined ? { ok: true, data: null } : out);
        }
        if (url.pathname === '/events') {
          if (!authed) { res.writeHead(403); return res.end(); }
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
          res.write(': hi\n\n');
          const c = { res, lan: isLan, phoneId: phone?.id };
          clients.add(c);
          if (isLan) send('remote:settings', settingsView());
          req.on('close', () => { clients.delete(c); if (isLan) send('remote:settings', settingsView()); });
          return;
        }
        if (url.pathname === '/romimg/') {
          if (!authed) { res.writeHead(403); return res.end(); }
          url.searchParams.delete('_k'); url.searchParams.delete('r');
          const r = await handleImage(new Request('http://img/?' + url.searchParams.toString()));
          const headers = {};
          r.headers.forEach((v, k) => { headers[k] = v; });
          headers['Access-Control-Allow-Origin'] = '*';
          if (!headers['cache-control']) headers['Cache-Control'] = 'max-age=86400';
          res.writeHead(r.status, headers);
          return res.end(Buffer.from(await r.arrayBuffer()));
        }
        if (!isLan && url.pathname.startsWith('/ui/')) return serveFile(res, uiDir, url.pathname.slice(4), 'index.html');
        res.writeHead(404); res.end();
      } catch (e) {
        if (!res.headersSent) json(res, 500, { ok: false, error: e.message || String(e) });
        else res.end();
      }
    };
  }

  // ------------------------------------------------------------- listeners
  // Loopback (Android): the main port plus extra ports, because a WebView opens only 6 connections
  // per host:port and both screens share them; images are spread over all of them.
  async function startLocal(port = 0, extra = 7) {
    const h = makeHandler(false);
    const listenOn = (p) => new Promise((resolve) => { const s = http.createServer(h); s.once('error', () => resolve(null)); s.listen(p, '127.0.0.1', () => resolve(s.address().port)); });
    const first = await listenOn(port);
    const more = await Promise.all(Array.from({ length: extra }, () => listenOn(0)));
    return { port: first, ports: [first, ...more.filter(Boolean)], token: localToken, version };
  }
  let starting = null;
  function startLan() {
    if (starting) return starting;
    return (starting = new Promise((resolve) => {
      const s = http.createServer(makeHandler(true));
      s.once('error', (e) => { log('remote: could not listen on port', st.port, e.message); lan = null; resolve(false); });
      s.listen(st.port, '0.0.0.0', () => {
        lan = s;
        log('remote: listening on', addresses().join(', ') || '?', 'port', st.port);
        try {
          discovery = require('./remote-discovery')({ id: st.id, name: st.name, kind, port: st.port, version, log });
        } catch (e) { log('remote: discovery unavailable', e.message); }
        resolve(true);
      });
    }).finally(() => { starting = null; }));
  }
  function stopLan() {
    discovery?.stop(); discovery = null;
    for (const c of [...clients]) if (c.lan) { try { c.res.end(); } catch {} clients.delete(c); }
    try { lan?.close(); } catch {}
    lan = null;
  }
  function peers() {
    const self = { id: st.id, name: st.name, kind, version, address: addresses()[0] || '', port: st.port, self: true };
    return [self, ...(discovery?.peers() || [])];
  }

  if (st.enabled) startLan();

  return {
    handlers,
    send,
    startLocal,
    configChanged: (cfg) => send('remote:config', cfg),
    settings: settingsView,
  };
};
