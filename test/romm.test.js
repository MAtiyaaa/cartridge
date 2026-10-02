// RomM contract (0.9.3 H2): the library mirror is built from RomM's game objects, which change
// between RomM versions. Older servers, newer ones and broken entries must all give a usable game,
// never an error that stops a sync.
const test = require('node:test');
const assert = require('node:assert');
const { slimRom, userOf, rommTooOld } = require('../electron/romm.js');

// a RomM 4 game, the shape Cartridge was written against
const ROMM4 = {
  id: 7, name: 'Tokyo Jungle', fs_name: 'Tokyo Jungle.pkg', fs_name_no_ext: 'Tokyo Jungle', platform_id: 3, platform_slug: 'ps3', platform_fs_slug: 'ps3', platform_display_name: 'PlayStation 3',
  fs_size_bytes: 123456, merged_screenshots: ['/a.png'], summary: 'x'.repeat(500), regions: ['USA'], files: [{ file_name: 'a.pkg' }], created_at: '2026-01-01',
  metadatum: { first_release_date: 1338508800000, genres: ['Action', 'Survival', 'Indie', 'More'], developers: ['Crispy\'s'], average_rating: 78, franchises: ['Tokyo Jungle', 'Tokyo Jungle'], game_modes: ['Single player'], player_count: '1-2' },
  igdb_metadata: { total_rating_count: 40, similar_games: [{ id: 1 }, { id: 2 }] }, hltb_metadata: { main_story: 36000 },
  rom_user: { status: 'playing', backlogged: false, now_playing: true, hidden: false, last_played: '2026-09-01T10:00:00Z' },
  ss_metadata: { logo_path: 'roms/3/7/logo.png' },
};

test('a RomM 4 game keeps what Cartridge uses', () => {
  const g = slimRom(ROMM4);
  assert.strictEqual(g.name, 'Tokyo Jungle');
  assert.strictEqual(g.shot, '/a.png');
  assert.strictEqual(g.summary.length, 400);
  assert.deepStrictEqual(g.genres, ['Action', 'Survival', 'Indie']);
  assert.deepStrictEqual(g.series, ['Tokyo Jungle']);
  assert.strictEqual(g.hours, 10);
  assert.deepStrictEqual(g.similar, [1, 2]);
  assert.strictEqual(g.logo, '/assets/romm/resources/roms/3/7/logo.png');
  assert.strictEqual(g.user.playing, true);
});

test('an older RomM without metadata blocks still gives a usable game', () => {
  const g = slimRom({ id: 1, fs_name: 'Game.iso', fs_name_no_ext: 'Game', platform_slug: 'ps2' });
  assert.strictEqual(g.name, 'Game');
  assert.deepStrictEqual([g.genres, g.series, g.modes, g.similar, g.regions, g.files], [[], [], [], [], [], []]);
  assert.strictEqual(g.user, null);
  assert.strictEqual(g.logo, null);
  assert.strictEqual(g.hours, null);
});

test('null and odd values never throw (a newer or broken server)', () => {
  const odd = { id: 2, name: null, fs_name: 'b.zip', merged_screenshots: null, regions: null, files: [null, { file_name: 'b' }], summary: 42,
    metadatum: { genres: 'Action', developers: null, franchises: null, game_modes: null }, igdb_metadata: null, hltb_metadata: { main_story: 'n/a' },
    rom_user: 'unexpected', ss_metadata: { logo_path: 5 }, a_field_from_the_future: { x: 1 } };
  const g = slimRom(odd);
  assert.strictEqual(g.name, 'b.zip');
  assert.strictEqual(g.summary, '42');
  assert.deepStrictEqual(g.genres, []);
  assert.deepStrictEqual(g.files, [{ file_name: 'b' }]);
  assert.strictEqual(g.user, null);
  assert.strictEqual(g.logo, null);
  assert.doesNotThrow(() => slimRom(null));
  assert.strictEqual(userOf({}), null);
});

test('RomM version check: only a real old version counts as too old', () => {
  assert.strictEqual(rommTooOld('2.3.1'), true);
  assert.strictEqual(rommTooOld('v2.0.0'), true);
  for (const v of ['3.0.0', '3.10.2', '4.3.0', 'development', 'unknown', '', null, 4]) assert.strictEqual(rommTooOld(v), false, String(v));
});
