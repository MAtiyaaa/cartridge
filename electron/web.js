'use strict';
// The web engine (0.9.52, owner: "one place for every outside service"). Every request Cartridge makes to a service
// that isn't the user's own RomM goes through here: GameBanana, Nexus Mods, Romhacking.net, EmuCoreX, GitHub and the
// rest. It gives each of them the same handling, so no feature has to write its own:
// - transport: webFetch (Chromium's network stack in the app, and its browser-check pass for Cloudflare-style sites);
// - pacing: a minimum gap per host (HOSTS), so a list of 50 mods never hammers a site;
// - retries: network errors, timeouts and 5xx are tried again with a short backoff; a 429 waits for Retry-After once;
// - caching: an answer can be kept on disk for a while (cache: name, maxAge), and an old copy is used when the site
//   can't be reached (stale: true), so a game's mod list still opens offline;
// - plain errors: WebError carries a code (offline, notfound, auth, rate, blocked, server, timeout, bad) and a message
//   that names the service, written for people, never a stack trace;
// - keys: the caller passes a key header; the engine never stores, logs or prints a key (headers are not logged).
// No Electron imports here (webFetch guards its own); tests pass fetchImpl, now and sleep.
const fs = require('fs');
const path = require('path');

// per host: the gap between two requests (ms) and the service's name in messages
const HOSTS = {
  'gamebanana.com': { gap: 200, name: 'GameBanana' },
  'api.nexusmods.com': { gap: 250, name: 'Nexus Mods' },
  'www.nexusmods.com': { gap: 500, name: 'Nexus Mods' },
  'www.romhacking.net': { gap: 1200, name: 'Romhacking.net' },
  'romhacking.net': { gap: 1200, name: 'Romhacking.net' },
  'api.github.com': { gap: 100, name: 'GitHub' },
  'github.com': { gap: 100, name: 'GitHub' },
  'raw.githubusercontent.com': { gap: 50, name: 'GitHub' },
  'emucorex.com': { gap: 200, name: 'EmuCoreX' },
};
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const serviceOf = (u) => { const h = hostOf(u); return HOSTS[h]?.name || HOSTS[h.replace(/^www\./, '')]?.name || h.replace(/^www\./, '') || 'The site'; };

class WebError extends Error {
  constructor(code, message, status = 0) { super(message); this.code = code; this.status = status; }
}
const MESSAGES = {
  offline: (s) => `Cartridge can’t reach ${s} right now. Check the connection and try again.`,
  timeout: (s) => `${s} took too long to answer. Try again in a moment.`,
  notfound: (s) => `${s} doesn’t have that page any more.`,
  auth: (s) => `${s} didn’t accept the key. Check it in Settings → Look & Feel → Metadata.`,
  rate: (s) => `${s} asks Cartridge to slow down. Try again in a few minutes.`,
  blocked: (s) => `${s} is refusing requests from Cartridge for now. Try again later.`,
  server: (s) => `${s} is having trouble right now. Try again later.`,
  bad: (s) => `${s} sent an answer Cartridge couldn’t read.`,
};
const err = (code, url, status) => new WebError(code, MESSAGES[code](serviceOf(url)), status);
// network failures that mean "no connection" rather than "the site said no"
const OFFLINE = /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_NETWORK_CHANGED|ERR_CONNECTION_REFUSED|ERR_ADDRESS_UNREACHABLE|fetch failed/i;

function createWeb({ cacheDir = null, log = () => {}, fetchImpl = null, now = Date.now, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const transport = fetchImpl || require('./webFetch');
  const nextAt = new Map(); // host -> earliest time for its next request
  async function pace(url) {
    const h = hostOf(url), gap = HOSTS[h]?.gap ?? 0;
    if (!gap) return;
    const t = now(), at = Math.max(t, nextAt.get(h) || 0);
    nextAt.set(h, at + gap);
    if (at > t) await sleep(at - t);
  }
  const cacheFile = (name) => cacheDir && path.join(cacheDir, String(name).replace(/[^\w.-]+/g, '_') + '.json');
  const readCache = (name) => { const f = cacheFile(name); if (!f) return null; try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  const writeCache = (name, data) => { const f = cacheFile(name); if (!f) return; try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify({ at: now(), data })); fs.renameSync(f + '.tmp', f); } catch {} };

  // one request, with pacing, a timeout and retries; returns the parsed answer
  async function once(url, { as, headers, method, body, timeout, signal }) {
    await pace(url);
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(new Error('timeout')), timeout);
    const stop = () => ctl.abort(signal.reason); if (signal) signal.addEventListener('abort', stop, { once: true });
    let r;
    try { r = await transport(url, { method, body, headers, signal: ctl.signal }); }
    catch (e) {
      if (signal?.aborted) throw e;
      if (ctl.signal.aborted) throw Object.assign(err('timeout', url), { retry: true });
      throw Object.assign(err(OFFLINE.test(`${e.code || ''} ${e.message || ''} ${e.cause?.code || ''}`) ? 'offline' : 'server', url), { retry: true });
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', stop); }
    if (r.status === 404 || r.status === 410) throw err('notfound', url, r.status);
    if (r.status === 401) throw err('auth', url, r.status);
    if (r.status === 429) throw Object.assign(err('rate', url, 429), { wait: Math.min(5000, Number(r.headers?.get?.('retry-after')) * 1000 || 2000) });
    if (r.status === 403) throw err('blocked', url, 403);
    if (r.status >= 500) throw Object.assign(err('server', url, r.status), { retry: true });
    if (!r.ok) throw err('server', url, r.status);
    try {
      if (as === 'json') return await r.json();
      if (as === 'buffer') return Buffer.from(await r.arrayBuffer());
      return await r.text();
    } catch { throw err('bad', url, r.status); }
  }

  // get(url, { as: 'json'|'text'|'buffer', headers, cache: name, maxAge (ms), retry, timeout })
  // with cache: a fresh copy is answered without asking; after a failure an old copy is answered with .stale
  async function get(url, o = {}) {
    const { as = 'json', headers = {}, method = 'GET', body, cache = null, maxAge = 0, retry = 2, timeout = 20000, signal } = o;
    if (cache && method === 'GET') {
      const c = readCache(cache);
      if (c && maxAge && now() - c.at < maxAge) return c.data;
    }
    let last = null;
    for (let i = 0, waited = false; i <= retry; i++) {
      try {
        const data = await once(url, { as, headers, method, body, timeout, signal });
        if (cache && method === 'GET' && as !== 'buffer') writeCache(cache, data);
        return data;
      } catch (e) {
        last = e;
        if (signal?.aborted) throw e;
        if (e.code === 'rate' && !waited) { waited = true; await sleep(e.wait || 2000); i--; continue; }
        if (!e.retry || i === retry) break;
        await sleep(400 * 2 ** i);
      }
    }
    if (cache && method === 'GET') {
      const c = readCache(cache);
      if (c) { log('web: using the saved copy for', serviceOf(url), '(', last?.code, ')'); return markStale(c.data); }
    }
    throw last;
  }
  const markStale = (d) => (d && typeof d === 'object' ? Object.defineProperty(d, 'stale', { value: true, enumerable: false }) : d);
  return { get, json: (u, o) => get(u, { ...o, as: 'json' }), text: (u, o) => get(u, { ...o, as: 'text' }), buffer: (u, o) => get(u, { ...o, as: 'buffer' }), serviceOf, hostOf };
}

module.exports = { createWeb, WebError, HOSTS, MESSAGES, serviceOf, hostOf };
