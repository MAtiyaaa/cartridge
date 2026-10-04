// Cemu's graphic packs per game (0.9.24, owner: Cemu's own per-game Graphics, Enhancements and Mods weren't
// in Cartridge). Read the way Cemu does (src/Cafe/GraphicPack/GraphicPack2.cpp, src/config/CemuConfig.cpp):
// - every rules.txt under <Cemu data>/graphicPacks (Cemu's own download is graphicPacks/downloadedGraphicPacks);
//   [Definition] titleIds = 0005000010145D00,..., name, path = "Game/Graphics/Resolution", description;
//   [Preset] sections with name (and category) are its choices, the first in a category is its default
// - which are on: settings.xml <GraphicPack><Entry filename="graphicPacks/.../rules.txt"> with <Preset>
//   <category/><preset/> children; disabled="true" keeps the choice but turns it off. Cartridge adds or
//   removes only the Entry of the pack you switch, and records what it turned on (the only ones it turns off).
const fs = require('fs');
const path = require('path');

const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const unXml = (s) => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// rules.txt: its definition and presets (ini-like, values may be quoted)
function parseRules(text) {
  const out = { def: {}, presets: [] }; let cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const l = raw.replace(/#.*$/, '').trim(); if (!l) continue;
    const m = /^\[(.+)\]$/.exec(l);
    if (m) { cur = m[1].toLowerCase(); if (cur === 'preset') out.presets.push({}); continue; }
    const i = l.indexOf('='); if (i < 0) continue;
    const k = l.slice(0, i).trim().toLowerCase(), v = l.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
    if (cur === 'definition') out.def[k] = v;
    else if (cur === 'preset' && ['name', 'category', 'default', 'condition'].includes(k)) out.presets[out.presets.length - 1][k] = v;
  }
  return out;
}
function findRules(dir, depth = 0, out = []) {
  if (depth > 6) return out;
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  if (ents.some((e) => e.isFile() && e.name.toLowerCase() === 'rules.txt')) { out.push(path.join(dir, 'rules.txt')); return out; }
  for (const e of ents) if (e.isDirectory() && !e.name.startsWith('.')) findRules(path.join(dir, e.name), depth + 1, out);
  return out;
}
// the entries in settings.xml: filename -> { disabled, presets: { category: preset } }
function entries(settings) {
  const out = {};
  const gp = (/<GraphicPack>([\s\S]*?)<\/GraphicPack>/.exec(settings || '') || [])[1] || '';
  for (const m of gp.matchAll(/<Entry\b([^>]*?)(\/>|>([\s\S]*?)<\/Entry>)/g)) {
    const fn = unXml((/filename="([^"]*)"/.exec(m[1]) || [])[1] || ''); if (!fn) continue;
    const presets = {};
    for (const p of String(m[3] || '').matchAll(/<Preset>([\s\S]*?)<\/Preset>/g)) presets[unXml((/<category>([^<]*)<\/category>/.exec(p[1]) || [])[1] || '')] = unXml((/<preset>([^<]*)<\/preset>/.exec(p[1]) || [])[1] || '');
    out[fn.replace(/\\/g, '/')] = { disabled: /disabled="(true|1)"/.test(m[1]), presets };
  }
  return out;
}
const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
// a game's packs: { root: Cemu's data folder, settings: settings.xml, titleIds: [...], name }
function list(c, mine = {}) {
  const ids = new Set((c.titleIds || []).map((x) => String(x).toUpperCase()));
  const nameKey = norm(String(c.name || '').replace(/\s*[([].*$/, ''));
  const on = entries(read(c.settings));
  const items = [];
  for (const f of findRules(path.join(c.root, 'graphicPacks'))) {
    const r = parseRules(read(f)); const d = r.def;
    const tids = String(d.titleids || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
    const p = String(d.path || '').split('/').filter(Boolean);
    const match = tids.some((t) => ids.has(t)) || (!ids.size && nameKey.length >= 4 && p[0] && norm(p[0]) === nameKey);
    if (!match) continue;
    const rel = path.relative(c.root, f).split(path.sep).join('/');
    const e = on[rel];
    const cats = {};
    for (const pr of r.presets) { const k = pr.category || ''; (cats[k] ||= []).push(pr.name); }
    const sec = String(p[1] || '').toLowerCase(), section = { graphics: 'Graphics', enhancements: 'Enhancements', mods: 'Mods', workarounds: 'Workarounds' }[sec] || (/cheat|fps/.test(sec) ? 'Enhancements' : 'Graphics');
    const presetText = Object.entries(cats).map(([k, v]) => `${k ? k + ': ' : ''}${(e?.presets?.[k]) || v[0]}`).join(' · ');
    items.push({ key: rel, name: d.name || p[p.length - 1] || path.basename(path.dirname(f)), description: [String(d.description || '').replace(/\\n/g, ' '), presetText].filter(Boolean).join('\n'), section, group: section, on: !!e && !e.disabled, by: e && !e.disabled ? (mine[rel] ? 'cartridge' : 'emulator') : null, presets: cats, chosen: e?.presets || {} });
  }
  items.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
  return items;
}
// switch packs: todo [{ key, on, presets? }]; returns how many changed
function set(c, todo, mine = {}) {
  let text = read(c.settings);
  if (text == null) throw new Error('Cemu’s settings.xml wasn’t found. Open Cemu once, then come back.');
  if (!/<GraphicPack>/.test(text)) text = /<GraphicPack\s*\/>/.test(text) ? text.replace(/<GraphicPack\s*\/>/, '<GraphicPack>\n    </GraphicPack>') : text.replace(/<\/content>/, '    <GraphicPack>\n    </GraphicPack>\n</content>');
  let n = 0;
  for (const t of todo) {
    const fnRe = new RegExp(`\\s*<Entry\\b[^>]*filename="${xml(t.key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*?(\\/>|>[\\s\\S]*?<\\/Entry>)`);
    text = text.replace(fnRe, '');
    if (t.on) {
      const pr = Object.entries(t.presets || {}).map(([k, v]) => `\n            <Preset>${k ? `\n                <category>${xml(k)}</category>` : ''}\n                <preset>${xml(v)}</preset>\n            </Preset>`).join('');
      text = text.replace(/<GraphicPack>/, `<GraphicPack>\n        <Entry filename="${xml(t.key)}">${pr}${pr ? '\n        ' : ''}</Entry>`);
      mine[t.key] = Date.now();
    } else delete mine[t.key];
    n++;
  }
  const tmp = c.settings + '.cartridge-new';
  fs.writeFileSync(tmp, text); fs.renameSync(tmp, c.settings);
  return n;
}
// a Wii U game's title IDs: its own meta/meta.xml (folder games), else Cemu's title list cache by path
function titleIds(gamePath, cemuConfigDir) {
  const out = new Set();
  const tryMeta = (f) => { const m = /<title_id[^>]*>([0-9A-Fa-f]{16})<\/title_id>/.exec(read(f) || ''); if (m) out.add(m[1].toUpperCase()); };
  if (gamePath) { tryMeta(path.join(gamePath, 'meta', 'meta.xml')); try { for (const n of fs.readdirSync(gamePath)) tryMeta(path.join(gamePath, n, 'meta', 'meta.xml')); } catch {} }
  const cache = read(path.join(cemuConfigDir || '', 'title_list_cache.xml')) || '';
  for (const m of cache.matchAll(/<title\b[^>]*titleId="([0-9A-Fa-f]{16})"[^>]*>([\s\S]*?)<\/title>/g)) {
    const p = unXml((/<path>([^<]*)<\/path>/.exec(m[2]) || [])[1] || '');
    if (p && gamePath && (p === gamePath || p.startsWith(gamePath + '/'))) out.add(m[1].toUpperCase());
  }
  // updates and DLC carry the same game: 0005000E/0005000C share the low half with the game's 00050000
  for (const id of [...out]) out.add('00050000' + id.slice(8));
  return [...out];
}
module.exports = { parseRules, findRules, entries, list, set, titleIds };
