// cartridge:// links from other apps, like the Fuse launcher (docs/FUSE_BRIDGE.md). Pure, so node --test
// can load it; both builds use it (src/links.js). Parsed by hand: WebViews before Chrome 130 read the host
// of a non-special URL (cartridge://home) as part of the path.
const TABS = new Set(['home', 'library', 'downloads', 'consoles', 'settings']);
const MAX_URL = 2048;
const MAX_QUERY = 200;

// a RomM slug or fs_slug (fs_slug is a folder name, so more than [a-z0-9-] is allowed), lower case
function slugOf(s) {
  const v = String(s ?? '').trim().toLowerCase();
  return v && v.length <= 64 && !/[\u0000-\u001f\u007f/\\]/.test(v) ? v : null;
}

// Returns { route, params, from } or null for anything Cartridge doesn't know. Routes and slugs are
// case-insensitive; from is 'fuse' for Fuse (it gets Back to return to it), another name, or null.
export function parseDeepLink(url) {
  if (typeof url !== 'string' || url.length > MAX_URL) return null;
  const m = /^cartridge:\/\/([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i.exec(url.trim());
  if (!m) return null;
  let parts, query;
  try {
    parts = m[1].split('/').map(decodeURIComponent);
    query = {};
    for (const pair of (m[2] || '').split('&')) {
      if (!pair) continue;
      const i = pair.indexOf('=');
      const key = decodeURIComponent(i < 0 ? pair : pair.slice(0, i)).toLowerCase();
      if (!(key in query)) query[key] = decodeURIComponent((i < 0 ? '' : pair.slice(i + 1)).replace(/\+/g, ' '));
    }
  } catch { return null; } // broken %-encoding
  while (parts.length > 1 && parts[parts.length - 1] === '') parts.pop(); // cartridge://home/
  if (parts.some((p) => !p)) return null;
  const route = parts[0].toLowerCase();
  const rest = parts.slice(1);
  const f = String(query.from || '').trim().toLowerCase();
  const from = /^[a-z0-9._-]{1,32}$/.test(f) ? f : null;
  const out = (r, params = {}) => ({ route: r, params, from });

  if (TABS.has(route) || route === 'sync') return rest.length ? null : out(route);
  if (route === 'game') {
    if (rest.length !== 1 || !/^\d{1,12}$/.test(rest[0])) return null;
    const romId = Number(rest[0]);
    return romId > 0 ? out('game', { romId }) : null;
  }
  if (route === 'platform' || route === 'bios') {
    const slug = rest.length === 1 ? slugOf(rest[0]) : null;
    return slug ? out(route, { slug }) : null;
  }
  // Fuse hands over a game to upload to RomM. The desktop names the request file Fuse wrote; on Android the
  // request comes with the intent (CartridgeNativePlugin.takeFuseUpload). Nothing uploads before the user confirms.
  if (route === 'upload') {
    if (rest.length) return null;
    const r = query.request;
    if (r == null || r === '') return out('upload');
    return typeof r === 'string' && r.length <= 1024 && r.startsWith('/') && /\.json$/i.test(r) && !/[\u0000-\u001f\u007f]/.test(r) && !r.split('/').includes('..')
      ? out('upload', { request: r }) : null;
  }
  if (route === 'search') {
    if (rest.length) return null;
    const params = { q: String(query.q || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX_QUERY) };
    const platform = query.platform ? slugOf(query.platform) : null;
    if (platform) params.platform = platform;
    return out('search', params);
  }
  return null;
}

// The RomM platform a slug means: its slug or fs_slug, else the same console under another name
// (keyOf: consoleKey from src/android/emulators.js, so 'megadrive' finds 'genesis-slash-megadrive').
export function findPlatform(platforms, slug, keyOf) {
  const s = slugOf(slug);
  const list = Array.isArray(platforms) ? platforms : [];
  if (!s) return null;
  const same = list.find((p) => [p.slug, p.fs_slug].some((x) => String(x || '').toLowerCase() === s));
  if (same || !keyOf) return same || null;
  const key = keyOf(s) || s; // a console key itself ('md') works too
  // several RomM platforms can be one console: the one with games wins
  const hits = list.filter((p) => keyOf(p.slug, p.fs_slug) === key);
  return hits.sort((a, b) => (b.rom_count || 0) - (a.rom_count || 0))[0] || null;
}
