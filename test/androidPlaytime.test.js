// Android play time (electron/androidPlaytime.js): Cartridge's launches and Fuse's sessions
const test = require('node:test');
const assert = require('node:assert');
const AP = require('../electron/androidPlaytime');

const H = 3600e3, T0 = new Date(2026, 9, 1, 10, 0).getTime();
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

test('overlapping sessions of one game count once; open ones only as last played', () => {
  const f = { sessions: {} };
  AP.upsert(f, 'c1', { romId: 7, start: T0, end: T0 + H, src: 'cartridge' });
  AP.upsert(f, 'f9', { romId: 7, start: T0 + 0.5 * H, end: T0 + 1.5 * H, src: 'fuse' }); // overlaps the first
  AP.upsert(f, 'c2', { romId: 8, start: T0 + 5 * H, end: null });
  const t = AP.totals(f);
  assert.strictEqual(t[7].min, 90);
  assert.strictEqual(t[7].last, T0 + 1.5 * H);
  assert.strictEqual(t[7].src, 'Fuse');
  assert.strictEqual(t[8].min, 0);
  assert.strictEqual(t[8].last, T0 + 5 * H);
});

test('a session longer than 12 hours keeps only its start; repeats change nothing', () => {
  const f = { sessions: {} };
  assert.ok(AP.upsert(f, 'c1', { romId: 1, start: T0, end: T0 + 13 * H }));
  assert.strictEqual(f.sessions.c1.end, null);
  assert.strictEqual(AP.upsert(f, 'c1', { romId: 1, start: T0, end: T0 + 13 * H }), false);
  assert.strictEqual(AP.upsert(f, 'x', { romId: NaN, start: T0 }), false);
});

test('days are split at midnight', () => {
  const f = { sessions: {} };
  const late = new Date(2026, 9, 1, 23, 30).getTime();
  AP.upsert(f, 'c1', { romId: 1, start: late, end: late + H });
  const d = AP.days(f, dayKey);
  assert.strictEqual(Math.round(d['2026-10-1']), 30);
  assert.strictEqual(Math.round(d['2026-10-2']), 30);
});

test("Fuse's rows find the game: RomM id, then path, then title on its console", () => {
  const roms = new Map([
    [1, { id: 1, name: 'Metroid Fusion', fs_name: 'Metroid Fusion (USA).gba', platform_slug: 'gba' }],
    [2, { id: 2, name: 'Ico', fs_name: 'Ico (USA).iso', platform_slug: 'ps2' }],
    [3, { id: 3, name: 'Ico', fs_name: 'Ico.iso', platform_slug: 'psp' }],
    [4, { id: 4, name: 'Gravity Rush', fs_name: 'PCSA00011', platform_slug: 'psvita' }],
  ]);
  const installed = { 4: '/storage/emulated/0/ROMs/psvita/PCSA00011' };
  const ctx = { roms, installed };
  assert.strictEqual(AP.matchRow({ rom_id: 1, title: 'x' }, ctx), 1);
  assert.strictEqual(AP.matchRow({ rom_id: 999, path: '/storage/emulated/0/ROMs/psvita/PCSA00011/eboot.bin' }, ctx), 4);
  assert.strictEqual(AP.matchRow({ title: 'Ico', platform: 'ps2' }, ctx), 2);
  assert.strictEqual(AP.matchRow({ title: 'Ico' }, ctx), null); // two games, no console: too unsure
  assert.strictEqual(AP.matchRow({ title: 'Something else', title_original: 'Metroid Fusion (USA)' }, ctx), 1);
  assert.strictEqual(AP.matchRow({ title: 'Nope' }, ctx), null);
});
