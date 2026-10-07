// Trophy sync across devices (0.9.47, owner: on a fresh install only a few games showed): every trophy set this device
// has is written to RomM, even with nothing unlocked, and a game no ROM matches rides on a carrier ROM of its console
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const T = require('../electron/trophies');
const createTrophyService = require('../electron/trophyService');

const library = { platforms: [{ id: 1, slug: 'ps3', fs_slug: 'ps3' }], roms: { 1: [
  { id: 10, name: 'Sonic Rivals 2', fs_name: 'Sonic Rivals 2 (USA).iso' },
  { id: 11, name: 'Sonic Rivals 2', fs_name: 'Sonic Rivals 2 (Europe).iso' }, // same game twice: still links
  { id: 12, name: 'Deadpool', fs_name: 'Deadpool.iso' },
] } };
// a fake RomM: notes per ROM
const notes = {}; let nid = 1;
async function api(p, { method = 'GET', body } = {}) {
  if (p === '/api/users/me') return { id: 1 };
  const m = /^\/api\/roms\/(\d+)\/notes(?:\/(\d+))?$/.exec(p);
  if (!m) throw new Error('unexpected ' + p);
  const list = (notes[m[1]] ||= []);
  if (method === 'GET') return list;
  // RomM keeps one note per title for each game and user (unique_rom_user_note_title): a second one is a 500 (0.9.49)
  if (method === 'POST') { if (list.some((x) => x.title === body.title)) throw new Error(`Server error 500 on ${p}`); const n = { id: nid++, user_id: 1, ...body }; list.push(n); return n; }
  if (method === 'PUT') { const n = list.find((x) => x.id === +m[2]); if (list.some((x) => x !== n && x.title === body.title)) throw new Error(`Server error 500 on ${p}`); Object.assign(n, body); return n; }
}
function device(name, dir) {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'tro-'));
  const config = { configured: true, trophies: { device: name, syncIcons: false, sources: dir ? { rpcs3: { enabled: true, custom: [dir], dirs: [] } } : {} } };
  return createTrophyService({ USER_DATA: ud, api, broadcast() {}, log() {}, loadJson: (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }, getConfig: () => config, saveConfig() {}, getLibrary: () => library, codeName: () => null });
}

test('a fresh device sees every game the other device has, matched or not, unlocked or not', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpcs3-'));
  const trophy = (id, unlocked) => ({ id, name: 'T' + id, desc: '', grade: 'B', points: 0, unlocked, time: unlocked ? 1000 : null });
  const real = T.readSource;
  T.readSource = (src) => (src === 'rpcs3' ? [
    { src: 'rpcs3', set: 'NPWR00001_00', title: 'Sonic Rivals 2', files: [], trophies: [trophy(1, false), trophy(2, false)] }, // nothing unlocked
    { src: 'rpcs3', set: 'NPWR00002_00', title: 'A Game RomM Calls Something Else', files: [], trophies: [trophy(1, true)] }, // no ROM matches
  ] : []);
  try {
    const a = device('Deck', dir);
    await a.refresh({ quiet: true });
    const r = await a.handlers['trophies:sync']();
    assert.strictEqual(r.state, 'ok');
    assert.ok(notes[10]?.length, 'Sonic Rivals 2 written to its ROM even with nothing unlocked');
    assert.ok(Object.values(notes).flat().some((n) => JSON.parse(n.content).carrier), 'the unmatched game rides on a carrier ROM');
  } finally { T.readSource = real; }
  const b = device('TV');
  await b.handlers['trophies:sync']();
  const ov = b.handlers['trophies:overview']();
  const titles = ov.games.map((g) => g.title).sort();
  assert.deepStrictEqual(titles, ['A Game RomM Calls Something Else', 'Sonic Rivals 2']);
  const carried = ov.games.find((g) => g.title.startsWith('A Game'));
  assert.strictEqual(carried.romId, null); // never linked to the carrier ROM
  assert.strictEqual(carried.earned ?? carried.trophies?.filter((t) => t.unlocked).length, 1);
});

test('two unmatched games on one carrier both sync, and the names list carries every name (0.9.49)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpcs3-'));
  const trophy = (id) => ({ id, name: 'T' + id, desc: '', grade: 'B', points: 0, unlocked: true, time: 2000 });
  const real = T.readSource;
  T.readSource = (src) => (src === 'rpcs3' ? [
    { src: 'rpcs3', set: 'NPWR00010_00', title: 'Unmatched One', titleId: 'BLUS00010', files: [], trophies: [trophy(1)] },
    { src: 'rpcs3', set: 'NPWR00011_00', title: 'Unmatched Two', files: [], trophies: [trophy(1)] },
    { src: 'rpcs3', set: 'NPWR00012_00', title: 'Deadpool', files: [], trophies: [trophy(1)] },
  ] : []);
  try {
    const a = device('Ally', dir);
    await a.refresh({ quiet: true });
    const r = await a.handlers['trophies:sync']();
    assert.strictEqual(r.state, 'ok', r.error);
    const carried = (notes[10] || []).map((n) => JSON.parse(n.content)).filter((d) => d.cartridge === 'trophies' && d.carrier && /000(10|11)_/.test(d.set)).map((d) => d.set).sort();
    assert.deepStrictEqual(carried, ['NPWR00010_00', 'NPWR00011_00']);
    const list = (notes[10] || []).map((n) => JSON.parse(n.content)).find((d) => d.cartridge === 'trophy-names');
    assert.ok(list, 'the names list is on the carrier');
    assert.strictEqual(list.names.NPWR00010_00.title, 'Unmatched One');
    assert.strictEqual(list.names.BLUS00010.title, 'Unmatched One'); // the game's own ID too
    assert.strictEqual(list.names.NPWR00012_00.romId, 12);
  } finally { T.readSource = real; }
  // a device that has the set only as a code (shadPS4 keeps names with the installed game) gets the name
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'rpcs3-'));
  T.readSource = (src) => (src === 'rpcs3' ? [{ src: 'rpcs3', set: 'NPWR00011_00', title: 'NPWR00011_00', files: [], trophies: [trophy(1)] }] : []);
  try {
    const b = device('TV', dir2);
    await b.refresh({ quiet: true });
    await b.handlers['trophies:sync']();
    const g = b.handlers['trophies:overview']().games.find((x) => x.set === 'NPWR00011_00');
    assert.strictEqual(g.title, 'Unmatched Two');
  } finally { T.readSource = real; }
});
