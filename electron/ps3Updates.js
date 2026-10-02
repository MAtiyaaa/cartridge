// PS3 game updates (0.9.16, owner: like ps3.aldostools.org/updates.html, which reads the same list).
// Sony keeps one list per serial: a0.ww.np.dl.playstation.net/tpl/np/<SERIAL>/<SERIAL>-ver.xml
// <titlepatch titleid=…><tag …><package version="01.01" size=… sha1sum=… url=… ps3_system_ver=…/>…
// 0.9.17: plain HTTP now answers 403, so HTTPS first, as the PS3 update tools do: Sony signs it with
// its own certificate authority, which isn't in the system's list, so certificate checks are off for
// this one host only (each package is still checked against the list's SHA-1). HTTP stays the fallback.
// Updates install in version order through RPCS3's own installer (pkgInstall.install).
const http = require('http');
const https = require('https');

const listUrl = (serial) => `http://a0.ww.np.dl.playstation.net/tpl/np/${serial}/${serial}-ver.xml`;
const attr = (tag, name) => (new RegExp(`\\b${name}="([^"]*)"`).exec(tag) || [])[1] || '';

function parseList(xml) {
  const out = [];
  for (const m of String(xml || '').matchAll(/<package\b[^>]*>/g)) {
    const t = m[0], url = attr(t, 'url'), version = attr(t, 'version');
    if (!url || !/^\d+\.\d+$/.test(version)) continue;
    out.push({ version, size: Number(attr(t, 'size')) || 0, sha1: attr(t, 'sha1sum'), url, sysVer: attr(t, 'ps3_system_ver') });
  }
  const title = (/<TITLE>([^<]*)<\/TITLE>/.exec(xml || '') || [])[1] || '';
  return { title, packages: out.sort((a, b) => cmp(a.version, b.version)) };
}
const cmp = (a, b) => { const [x1, y1] = String(a).split('.').map(Number), [x2, y2] = String(b).split('.').map(Number); return x1 - x2 || y1 - y2; };
// the packages newer than what's installed (in order); with nothing known, all of them
const newer = (packages, have) => packages.filter((p) => !have || cmp(p.version, have) > 0);

const SONY_HOST = /^https:\/\/a0\.ww\.np\.dl\.playstation\.net\//;
async function getText(url, timeout = 15000) {
  const secure = url.replace(/^http:/, 'https:');
  try { return await getOnce(secure, timeout); } catch (e) { if (e.status !== 403 && !/certificate|ECONN|socket|timed|took too long/i.test(e.message)) throw e; }
  return getOnce(url.replace(/^https:/, 'http:'), timeout);
}
function getOnce(url, timeout) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const opts = { timeout, headers: { 'User-Agent': 'Mozilla/5.0 (PLAYSTATION 3; 4.91)' }, ...(SONY_HOST.test(url) ? { rejectUnauthorized: false } : {}) };
    const req = mod.get(url, opts, (res) => {
      if (res.statusCode === 404) { res.resume(); return resolve(''); } // no updates for this game
      if (res.statusCode !== 200) { res.resume(); return reject(Object.assign(new Error(`Sony's update list answered ${res.statusCode}`), { status: res.statusCode })); }
      let s = ''; res.setEncoding('utf8'); res.on('data', (d) => { s += d; if (s.length > 2e6) req.destroy(); }); res.on('end', () => resolve(s));
    });
    req.on('timeout', () => req.destroy(new Error('Sony\'s update list took too long')));
    req.on('error', reject);
  });
}
async function updatesFor(serial, { get = getText } = {}) {
  if (!/^[A-Z]{4}\d{5}$/.test(serial || '')) return { title: '', packages: [] };
  return parseList(await get(listUrl(serial)));
}

module.exports = { parseList, newer, updatesFor, cmp, listUrl };
