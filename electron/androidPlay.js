// Android: what is inside an installed game (for bundles and for picking the file to launch), and whether
// an emulator's BIOS is where it looks. Read only. Android hides other apps' own folders (Android/data)
// from Android 11, so a BIOS answer is often "can't tell" and the app asks you to confirm it.
const fs = require('fs');
const path = require('path');

const roots = () => {
  const out = ['/storage/emulated/0'];
  try { for (const n of fs.readdirSync('/storage')) if (/^[0-9A-F]{4}-[0-9A-F]{4}$/i.test(n)) out.push('/storage/' + n); } catch {}
  return out;
};

// Every file under a game's path: { rel, size }. One file gives just itself.
function scan(p, { depth = 4, limit = 600 } = {}) {
  const out = [];
  let st;
  try { st = fs.statSync(p); } catch { return { exists: false, folder: false, files: [] }; }
  if (!st.isDirectory()) return { exists: true, folder: false, files: [{ rel: path.basename(p), size: st.size }] };
  const walk = (dir, rel, d) => {
    let names;
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of names) {
      if (out.length >= limit) return;
      if (e.name.startsWith('.')) continue;
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) { if (d < depth) walk(path.join(dir, e.name), r, d + 1); continue; }
      try { out.push({ rel: r, size: fs.statSync(path.join(dir, e.name)).size }); } catch {}
    }
  };
  walk(p, '', 1);
  return { exists: true, folder: true, files: out };
}

// spec: { dirs: [relative folders], names: regex source, minSize }
function bios(spec) {
  const re = new RegExp(spec.names || '.', 'i');
  const ok = (dir, n) => re.test(n) && (!spec.minSize || (() => { try { return fs.statSync(path.join(dir, n)).size >= spec.minSize; } catch { return false; } })());
  let hidden = false;
  const rs = roots();
  // Are other apps' folders readable at all here? (they are not from Android 11)
  const dataReadable = rs.some((r) => { try { return fs.readdirSync(path.join(r, 'Android/data')).length > 0; } catch { return false; } });
  for (const rel of spec.dirs || []) {
    if (rel.includes('..') || path.isAbsolute(rel)) continue;
    for (const r of rs) {
      const dir = path.join(r, rel);
      let names;
      try { names = fs.readdirSync(dir); } catch { if (rel.startsWith('Android/')) hidden = true; continue; }
      const hit = names.find((n) => ok(dir, n));
      if (hit) return { state: 'ok', where: path.join(rel, hit) };
    }
  }
  // Nothing found: only certain if the emulators' own folders can be read
  return { state: dataReadable || !hidden && !(spec.dirs || []).some((d) => d.startsWith('Android/')) ? 'missing' : 'unknown' };
}

module.exports = { scan, bios, roots };
