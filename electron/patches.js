'use strict';
// Emulator patches (0.9.3 D7, owner's option 1). The patches themselves are the emulator's own
// (RPCS3 downloads its patch.yml); Cartridge lists the ones for a game and turns them on or off in
// the emulator's own patch settings, so they stay on exactly as if ticked in the emulator. It only
// ever turns off what it turned on itself (recorded in Cartridge's patches.json); patches you turned
// on in the emulator are shown as on and left alone. Every other entry in the file is kept.
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
// Everything as text (FAILSAFE): RPCS3's app version keys like 01.00 must not turn into numbers
const load = (t) => yaml.load(t, { schema: yaml.FAILSAFE_SCHEMA }) || {};
const dump = (o) => yaml.dump(o, { schema: yaml.FAILSAFE_SCHEMA, lineWidth: -1, noRefs: true });
const readYaml = (f) => { try { const o = load(fs.readFileSync(f, 'utf8')); return o && typeof o === 'object' ? o : {}; } catch { return {}; } };

// PARAM.SFO (PS3, PS4, Vita): header "\0PSF", key table and data table offsets, then entries
// { key offset u16, format u16, length u32, max u32, data offset u32 }. Returns { KEY: value }.
function parseSfo(buf) {
  const out = {};
  try {
    if (buf.readUInt32BE(0) !== 0x00505346) return out;
    const keys = buf.readUInt32LE(8), data = buf.readUInt32LE(12), n = buf.readUInt32LE(16);
    for (let i = 0; i < n; i++) {
      const e = 20 + i * 16;
      const ko = buf.readUInt16LE(e), fmt = buf.readUInt16LE(e + 2), len = buf.readUInt32LE(e + 4), off = buf.readUInt32LE(e + 12);
      const k = buf.toString('latin1', keys + ko, buf.indexOf(0, keys + ko));
      out[k] = fmt === 0x0404 ? buf.readUInt32LE(data + off) : buf.toString('utf8', data + off, data + off + len).replace(/\0+$/, '');
    }
  } catch {}
  return out;
}
const sfoAt = (f) => { try { return parseSfo(fs.readFileSync(f)); } catch { return {}; } };

// ---------------------------------------------------------------- RPCS3
// fs::get_config_dir(): ~/.config/rpcs3 (or the Flatpak's). patches/ holds patch.yml (RPCS3's
// download), imported_patch.yml and <serial>_patch.yml; the switches are config/patch_config.yml
// (older RPCS3: patch_config.yml next to patches/). bin_patch.cpp, patch_engine.
function rpcs3Dirs(home = os.homedir()) {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return [path.join(xdg, 'rpcs3'), path.join(home, '.var/app/net.rpcs3.RPCS3/config/rpcs3')]
    .filter((d) => exists(path.join(d, 'patches')) || exists(path.join(d, 'config')))
    .map((root) => ({ root, patches: path.join(root, 'patches'), config: exists(path.join(root, 'patch_config.yml')) && !exists(path.join(root, 'config', 'patch_config.yml')) ? path.join(root, 'patch_config.yml') : path.join(root, 'config', 'patch_config.yml') }));
}
// The game's serial and app version (APP_VER): an installed update in dev_hdd0 wins over the disc
function ps3Version(gameDir, hdds, serial) {
  for (const h of hdds) { const s = sfoAt(path.join(h, 'game', serial, 'PARAM.SFO')); if (s.APP_VER) return s.APP_VER; }
  for (const f of [path.join(gameDir || '', 'PS3_GAME', 'PARAM.SFO'), path.join(gameDir || '', 'PARAM.SFO')]) { const s = sfoAt(f); if (s.APP_VER) return s.APP_VER; }
  return null;
}
// Patches for one game: [{ key, hash, description, title, serial, version, author, notes, group, on, by }]
// by: 'cartridge' when Cartridge turned it on, 'emulator' when turned on in RPCS3, null when off.
function rpcs3List(dir, serial, appVer, mine = {}) {
  const files = ['patch.yml', 'imported_patch.yml', `${serial}_patch.yml`].map((f) => path.join(dir.patches, f)).filter(exists);
  const cfg = readYaml(dir.config);
  const out = [], seen = new Set();
  for (const f of files) {
    const doc = readYaml(f);
    for (const [hash, descs] of Object.entries(doc)) {
      if (hash === 'Version' || hash === 'Anchors' || !descs || typeof descs !== 'object') continue;
      for (const [description, p] of Object.entries(descs)) {
        const games = p?.Games;
        if (!games || typeof games !== 'object') continue;
        for (const [title, serials] of Object.entries(games)) {
          const vers = serials?.[serial];
          if (!Array.isArray(vers)) continue;
          // this game's version, else All; with the version unknown, the one version it lists
          const version = vers.includes(appVer) ? appVer : vers.includes('All') ? 'All' : !appVer && vers.length === 1 ? vers[0] : null;
          if (!version) continue;
          const key = [hash, description, title, serial, version].join('\u0001');
          if (seen.has(key)) continue;
          seen.add(key);
          const node = cfg?.[hash]?.[description]?.[title]?.[serial]?.[version];
          const on = node === 'true' || !!(node && typeof node === 'object' && node.Enabled === 'true');
          out.push({ key, hash, description, title, serial, version, author: p.Author || '', notes: typeof p.Notes === 'string' ? p.Notes : '', group: p.Group || '', on, by: on ? (mine[key] ? 'cartridge' : 'emulator') : null });
        }
      }
    }
  }
  return out.sort((a, b) => a.description.localeCompare(b.description));
}
// Turn patches on (Enabled: true) or off in patch_config.yml. Off only for ones Cartridge turned on.
// Everything else in the file is written back as it was. Returns the new { key: true } record.
function rpcs3Set(dir, changes, mine = {}) {
  const cfg = readYaml(dir.config);
  const rec = { ...mine };
  for (const c of changes) {
    const k = c.key;
    const path5 = [c.hash, c.description, c.title, c.serial, c.version];
    if (c.on) {
      let o = cfg;
      for (const p of path5.slice(0, 4)) { if (!o[p] || typeof o[p] !== 'object') o[p] = {}; o = o[p]; }
      const cur = o[c.version];
      o[c.version] = cur && typeof cur === 'object' ? { ...cur, Enabled: 'true' } : { Enabled: 'true' };
      rec[k] = true;
    } else if (rec[k]) {
      const chain = [cfg]; let o = cfg;
      for (const p of path5.slice(0, 4)) { o = o?.[p]; chain.push(o); }
      const node = o?.[c.version];
      if (node && typeof node === 'object') { delete node.Enabled; if (!Object.keys(node).length) delete o[c.version]; } else if (o) delete o[c.version];
      for (let i = 4; i > 0; i--) if (chain[i] && !Object.keys(chain[i]).length) delete chain[i - 1][path5[i - 1]]; // drop what is now empty
      delete rec[k];
    }
  }
  fs.mkdirSync(path.dirname(dir.config), { recursive: true });
  if (exists(dir.config) && !exists(dir.config + '.cartridge-backup')) fs.copyFileSync(dir.config, dir.config + '.cartridge-backup'); // the file as it was before Cartridge first touched it
  const tmp = dir.config + '.tmp';
  fs.writeFileSync(tmp, dump(cfg));
  fs.renameSync(tmp, dir.config);
  return rec;
}

module.exports = { parseSfo, sfoAt, rpcs3Dirs, ps3Version, rpcs3List, rpcs3Set, load, dump };
