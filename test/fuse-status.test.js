// Fuse bridge status (docs/FUSE_BRIDGE.md): the snapshot other apps read (status, queue, games), the desktop status
// file, and the Android side (manifest entries, the provider's columns)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const fuseStatus = require('../electron/fuseStatus');

const KEYS = ['protocol', 'version', 'connected', 'activeDownloads', 'queuedDownloads', 'progress', 'currentTitle', 'currentPlatform', 'libraryChangedAt', 'updatedAt', 'recent', 'queue', 'uploads'].sort();
const queue = [
  { romId: 1, name: 'Chrono Trigger', platformSlug: 'snes', status: 'downloading', received: 50, total: 100 },
  { romId: 2, name: 'Super Metroid', platformSlug: 'snes', status: 'queued', received: 0, total: 300 },
  { romId: 3, name: 'Old', platformSlug: 'gba', status: 'done', received: 10, total: 10, path: '/roms/gba/old.gba' },
  { romId: 4, name: 'Paused', platformSlug: 'gba', status: 'paused', received: 5, total: 10 },
];
const manifest = {};
for (let i = 1; i <= 25; i++) manifest[i] = { path: `/roms/snes/${i}.sfc`, platformSlug: 'snes', name: `Game ${i}`, at: 1000 + i };

test('the snapshot has exactly the documented fields and nothing about the server', () => {
  const s = fuseStatus.snapshot({ version: '0.9.10', queue, connected: true, syncedAt: 5000, manifest, server: 'http://secret', token: 'x' }, 9000);
  assert.deepStrictEqual(Object.keys(s).sort(), KEYS);
  assert.strictEqual(s.protocol, 3);
  assert.strictEqual(s.version, '0.9.10');
  assert.strictEqual(s.connected, true);
  assert.strictEqual(s.activeDownloads, 1);
  assert.strictEqual(s.queuedDownloads, 1);
  assert.strictEqual(s.progress, 0.125); // 50 of 400 over the active queue
  assert.strictEqual(s.currentTitle, 'Chrono Trigger');
  assert.strictEqual(s.currentPlatform, 'snes');
  assert.strictEqual(s.libraryChangedAt, 5000);
  assert.strictEqual(s.updatedAt, 9000);
  assert.strictEqual(s.recent.length, 20);
  assert.deepStrictEqual(s.recent[0], { romId: 25, title: 'Game 25', platformSlug: 'snes', path: '/roms/snes/25.sfc', finishedAt: 1025 });
  assert.ok(!JSON.stringify(s).includes('secret'));
});

test('uploads from Fuse: newest first, known states only, bytes kept in range, nothing else', () => {
  const uploads = [
    { id: 'u2', title: 'Pepsiman', platformSlug: 'psx', state: 'uploading', sent: 900, total: 600, files: 2, romId: null, error: null, updatedAt: 7, path: '/secret/p.chd', current: 'p.chd' },
    { id: 'u1', title: 'Metroid', platformSlug: 'gba', state: 'done', sent: 10, total: 10, files: 1, romId: 42, updatedAt: 5 },
    { id: 'u0', title: 'Odd', platformSlug: 'gba', state: 'thinking', sent: 0, total: 0 },
    { title: 'No id', state: 'done' },
  ];
  const s = fuseStatus.snapshot({ version: '0.9.11', queue: [], manifest: {}, uploads }, 1);
  assert.deepStrictEqual(s.uploads, [
    { id: 'u2', title: 'Pepsiman', platformSlug: 'psx', state: 'uploading', sent: 600, total: 600, files: 2, romId: null, error: null, updatedAt: 7 },
    { id: 'u1', title: 'Metroid', platformSlug: 'gba', state: 'done', sent: 10, total: 10, files: 1, romId: 42, error: null, updatedAt: 5 },
  ]);
  assert.ok(!JSON.stringify(s).includes('secret'));
  // closing Cartridge fails what was still going
  assert.deepStrictEqual(fuseStatus.closed(s, 2).uploads.map((u) => u.state), ['failed', 'done']);
});

test('an idle snapshot', () => {
  const s = fuseStatus.snapshot({ version: '0.9.10', queue: [], connected: null, syncedAt: 0, manifest: { 7: { path: '/a', name: 'A', platformSlug: 'nes', at: 42 } } }, 1);
  assert.strictEqual(s.connected, null);
  assert.strictEqual(s.progress, null);
  assert.strictEqual(s.currentTitle, null);
  assert.strictEqual(s.libraryChangedAt, 42); // the last finished download
  const c = fuseStatus.closed(fuseStatus.snapshot({ queue, connected: true, manifest: {} }), 2);
  assert.deepStrictEqual([c.connected, c.activeDownloads, c.queuedDownloads, c.progress, c.currentTitle, c.updatedAt], [null, 0, 2, null, null, 2]);
});

test('the status file lives in XDG_STATE_HOME', () => {
  assert.strictEqual(fuseStatus.statusFile({ XDG_STATE_HOME: '/x/state' }, '/home/u'), '/x/state/cartridge/status.json');
  assert.strictEqual(fuseStatus.statusFile({ XDG_STATE_HOME: 'relative' }, '/home/u'), '/home/u/.local/state/cartridge/status.json');
  assert.strictEqual(fuseStatus.statusFile({}, '/home/u'), '/home/u/.local/state/cartridge/status.json');
});

test('the file is written when something changed, at most every 500 ms, and says idle on quit', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-status-'));
  const file = path.join(dir, 'cartridge', 'status.json');
  const state = { version: '0.9.10', queue: queue.slice(0, 2), connected: true, syncedAt: 100, manifest: {} };
  const sent = [];
  fuseStatus.setup({ build: () => state, file, send: (s) => sent.push(s) });
  await new Promise((r) => setTimeout(r, 650));
  const a = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.strictEqual(a.activeDownloads, 1);
  assert.strictEqual(sent.length, 1);
  fuseStatus.changed('downloads');
  fuseStatus.changed('trophies'); // not watched
  await new Promise((r) => setTimeout(r, 650));
  assert.strictEqual(sent.length, 1); // nothing changed, nothing written
  state.queue = [];
  fuseStatus.changed('downloads');
  fuseStatus.changed('downloads');
  await new Promise((r) => setTimeout(r, 650));
  assert.strictEqual(sent.length, 2);
  assert.strictEqual(JSON.parse(fs.readFileSync(file, 'utf8')).activeDownloads, 0);
  state.queue = queue.slice(0, 1);
  fuseStatus.close();
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual([c.activeDownloads, c.queuedDownloads, c.connected], [0, 1, null]);
  assert.deepStrictEqual(fs.readdirSync(path.dirname(file)), ['status.json']); // no temp files left
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the Android manifest: links without BROWSABLE, a read-only provider behind a permission', () => {
  const xml = fs.readFileSync(path.join(__dirname, '../android/app/src/main/AndroidManifest.xml'), 'utf8');
  const filter = xml.split('<intent-filter>').find((f) => f.includes('android:scheme="cartridge"'));
  assert.ok(filter && filter.includes('android.intent.action.VIEW') && filter.includes('android.intent.category.DEFAULT'));
  assert.ok(!filter.split('</intent-filter>')[0].includes('BROWSABLE'), 'web pages must not open cartridge:// links');
  const provider = xml.split('<provider').find((p) => p.includes('.CartridgeStatusProvider'));
  assert.ok(provider.includes('android:authorities="${applicationId}.status"'));
  assert.ok(provider.includes('android:exported="true"'));
  assert.ok(provider.includes('android:readPermission="${applicationId}.permission.READ_STATUS"'));
  assert.ok(!/writePermission|android:permission=/.test(provider.split('/>')[0]));
  assert.ok(/<permission\s+android:name="\$\{applicationId\}\.permission\.READ_STATUS"\s+android:protectionLevel="normal"/.test(xml));
});

test('the queue game by game: the Downloads page order, its states, bytes and positions', () => {
  const q = [
    { romId: 5, name: 'Done', platformSlug: 'nes', status: 'done', received: 10, total: 10, addedAt: 1 },
    { romId: 6, name: 'Second', platformSlug: 'snes', status: 'queued', received: 0, total: 0, addedAt: 2 },
    { romId: 7, name: 'Now', platformSlug: 'gba', status: 'downloading', received: 70, total: 50, addedAt: 3 },
    { romId: 8, name: 'Stopped', platformSlug: 'gba', status: 'cancelled', received: 5, total: 10, addedAt: 4 },
    { romId: 9, name: 'Broken', platformSlug: 'gba', status: 'error', received: 1, total: 10, addedAt: 5 },
    { romId: 10, name: 'Third', platformSlug: 'snes', status: 'queued', received: 0, total: 30, addedAt: 6 },
    { romId: 0, name: 'No id', status: 'queued' },
  ];
  const rows = fuseStatus.queueRows(q);
  assert.deepStrictEqual(rows.map((r) => [r.romId, r.state, r.position]), [[7, 'downloading', 0], [6, 'queued', 1], [10, 'queued', 2], [9, 'failed', 3], [8, 'paused', 4], [5, 'done', 5]]);
  assert.deepStrictEqual(rows[0], { romId: 7, title: 'Now', platformSlug: 'gba', state: 'downloading', received: 50, total: 50, position: 0 });
  assert.strictEqual(rows[1].total, null); // size not known yet
  assert.strictEqual(fuseStatus.queueRows(Array.from({ length: 150 }, (_, i) => ({ romId: i + 1, status: 'queued' }))).length, 100);
  assert.deepStrictEqual(fuseStatus.snapshot({ queue: q }).queue, rows);
  // Cartridge closed: what was downloading carries on at the next start
  const c = fuseStatus.closed(fuseStatus.snapshot({ queue: q, manifest: {} }), 2);
  assert.deepStrictEqual(c.queue.map((r) => r.state), ['queued', 'queued', 'queued', 'failed', 'paused', 'done']);
});

const summary = 'A long story. '.repeat(60).trim(); // more than the library's 400 characters
const fullRom = {
  id: 42, name: 'Chrono Trigger', platform_slug: 'snes', summary,
  metadatum: { first_release_date: 794880000000, genres: ['RPG', 'RPG', 'Adventure', ' '], franchises: ['Chrono'], developers: ['Square'], publishers: ['Square', 'Nintendo'], average_rating: 9.34, player_count: '1' },
};

test('the metadata kept for a downloaded game: full text, a year, 0-100 rating, all names', () => {
  const m = fuseStatus.metaOf(fullRom);
  assert.deepStrictEqual(m, { title: 'Chrono Trigger', platformSlug: 'snes', summary, year: 1995, genres: ['RPG', 'Adventure'], developer: 'Square', publisher: 'Square', rating: 93, players: '1', series: ['Chrono'] });
  // seconds, ISO text, 0-100 ratings and companies as the developer, like the game page
  const o = fuseStatus.metaOf({ id: 1, fs_name_no_ext: 'x', metadatum: { first_release_date: 794880000, average_rating: 87.6, companies: ['Maker'], player_count: 4 } });
  assert.deepStrictEqual([o.title, o.year, o.rating, o.developer, o.publisher, o.players, o.summary], ['x', 1995, 88, 'Maker', null, '4', null]);
  assert.strictEqual(fuseStatus.metaOf({ metadatum: { first_release_date: '1995-03-11' } }).year, 1995);
  assert.strictEqual(fuseStatus.metaOf({ metadatum: { first_release_date: 0, average_rating: 0 } }).year, null);
  const store = {};
  assert.strictEqual(fuseStatus.keepMeta(store, fullRom, 100), true);
  assert.strictEqual(fuseStatus.keepMeta(store, fullRom, 200), false); // the same again: at stays
  assert.strictEqual(store[42].at, 100);
  assert.strictEqual(fuseStatus.keepMeta(store, { ...fullRom, name: 'Chrono Trigger DS' }, 300), true);
  assert.strictEqual(store[42].at, 300);
  assert.strictEqual(fuseStatus.keepMeta(store, { name: 'no id' }), false);
});

test('the games: downloaded and still on disk, fuller metadata first, pictures only when their file is there', () => {
  const manifest = {
    42: { path: '/roms/snes/Chrono Trigger.sfc', platformSlug: 'snes', name: 'Chrono', at: 1000 },
    43: { path: '/roms/gba/Old.gba', platformSlug: 'gba', name: 'Old', at: 2000 },
    44: { path: '/roms/gba/Gone.gba', platformSlug: 'gba', name: 'Gone', at: 3000 },
  };
  const slim = { id: 43, name: 'Metroid Fusion', platform_slug: 'gba', summary: 'Short.', year: 1037836800000, genres: ['Action'], developer: 'Nintendo R&D1', rating: 9.1, players: '1', series: ['Metroid'], path_cover_large: '/assets/romm/resources/roms/1/cover/big.png' };
  const meta = {};
  fuseStatus.keepMeta(meta, fullRom, 1500);
  const files = { '/cache/c42': 5000, '/cache/l42': 800 };
  const g = fuseStatus.gameRows({
    manifest, meta,
    roms: new Map([[43, slim]]),
    images: (id) => (id === 42 ? { cover: '/cache/c42', logo: '/cache/l42', screenshot: '/cache/missing' } : { cover: 'relative/file' }),
    exists: (p) => !p.includes('Gone'),
    mtime: (p) => files[p] ?? null,
  });
  assert.deepStrictEqual(g.map((x) => x.romId), [43, 42]); // newest download first, Gone left out
  assert.deepStrictEqual(g[1], {
    romId: 42, path: '/roms/snes/Chrono Trigger.sfc', title: 'Chrono Trigger', platformSlug: 'snes', summary, year: 1995,
    genres: ['RPG', 'Adventure'], developer: 'Square', publisher: 'Square', rating: 93, players: '1', series: ['Chrono'],
    cover: '/cache/c42', logo: '/cache/l42', screenshot: null, updatedAt: 5000,
  });
  // no fuller metadata yet (downloaded before, not synced since): the library's copy
  assert.deepStrictEqual(g[0], {
    romId: 43, path: '/roms/gba/Old.gba', title: 'Metroid Fusion', platformSlug: 'gba', summary: 'Short.', year: 2002,
    genres: ['Action'], developer: 'Nintendo R&D1', publisher: null, rating: 91, players: '1', series: ['Metroid'],
    cover: null, logo: null, screenshot: null, updatedAt: 2000,
  });
  assert.ok(!JSON.stringify(g).includes('/assets/'), 'no RomM paths, only local files');
  // not in the library and no metadata: what installed.json knows
  const bare = fuseStatus.gameRows({ manifest: { 7: { path: '/a', name: 'A', platformSlug: 'nes', at: 1 } }, exists: () => true });
  assert.deepStrictEqual(bare, [{ romId: 7, path: '/a', title: 'A', platformSlug: 'nes', summary: null, year: null, genres: [], developer: null, publisher: null, rating: null, players: null, series: [], cover: null, logo: null, screenshot: null, updatedAt: 1 }]);
});

test('the games go out on their own, only when they change; the file carries queue and games', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-status-'));
  const file = path.join(dir, 'status.json');
  const cover = path.join(dir, 'cover');
  fs.writeFileSync(cover, 'x');
  const state = { version: '0.9.10', queue: queue.slice(0, 2), connected: true, syncedAt: 100, manifest: { 42: { path: dir, name: 'Chrono', platformSlug: 'snes', at: 1 } } };
  const meta = {};
  fuseStatus.keepMeta(meta, fullRom, 10);
  const sent = [], games = [];
  let builds = 0;
  fuseStatus.setup({
    build: () => state,
    games: () => { builds++; return { manifest: state.manifest, meta, roms: new Map(), images: () => ({ cover }) }; },
    file, send: (s) => sent.push(s), sendGames: (g) => games.push(g),
  });
  await new Promise((r) => setTimeout(r, 650));
  assert.deepStrictEqual([sent.length, games.length, builds], [1, 1, 1]);
  assert.ok(!('games' in sent[0]), 'the status has no games list (Android keeps them apart)');
  assert.strictEqual(games[0][0].cover, cover);
  const a = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.strictEqual(a.protocol, 3);
  assert.deepStrictEqual(a.queue.map((q) => q.state), ['downloading', 'queued']);
  assert.deepStrictEqual(a.games.map((g) => [g.romId, g.title, g.summary.length]), [[42, 'Chrono Trigger', summary.length]]);
  // progress: the status goes out, the games aren't even rebuilt
  state.queue = [{ ...queue[0], received: 60 }, queue[1]];
  fuseStatus.changed('downloads');
  await new Promise((r) => setTimeout(r, 650));
  assert.deepStrictEqual([sent.length, games.length, builds], [2, 1, 1]);
  assert.strictEqual(sent[1].queue[0].received, 60);
  // a synced library that changed nothing: rebuilt, not sent
  fuseStatus.changed('library');
  await new Promise((r) => setTimeout(r, 650));
  assert.deepStrictEqual([sent.length, games.length, builds], [2, 1, 2]);
  // a picture went away: the games go out again, the status doesn't
  fs.rmSync(cover);
  fuseStatus.changed('images');
  await new Promise((r) => setTimeout(r, 650));
  assert.deepStrictEqual([sent.length, games.length], [2, 2]);
  assert.strictEqual(games[1][0].cover, null);
  assert.strictEqual(JSON.parse(fs.readFileSync(file, 'utf8')).games[0].cover, null);
  assert.strictEqual(fuseStatus.currentGames(), games[1]);
  fuseStatus.close();
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual([c.activeDownloads, c.queue[0].state, c.games.length], [0, 'queued', 1]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the Android provider serves the documented tables and read-only pictures', () => {
  const java = fs.readFileSync(path.join(__dirname, '../android/app/src/main/java/io/github/abdu2304/cartridge/CartridgeStatusProvider.java'), 'utf8');
  const cols = (name) => JSON.parse('[' + java.match(new RegExp(`${name} = \\{([^}]*)\\}`))[1] + ']');
  assert.strictEqual(Number(java.match(/static final int PROTOCOL = (\d+);/)[1]), fuseStatus.PROTOCOL);
  assert.deepStrictEqual(cols('RECENT_COLUMNS'), ['rom_id', 'title', 'platform_slug', 'path', 'finished_at']); // protocol 1, unchanged
  assert.deepStrictEqual(cols('QUEUE_COLUMNS'), ['rom_id', 'title', 'platform_slug', 'state', 'received', 'total', 'position']);
  assert.deepStrictEqual(cols('GAMES_COLUMNS'), ['rom_id', 'path', 'title', 'platform_slug', 'summary', 'year', 'genres', 'developer', 'publisher', 'rating', 'players', 'series', 'cover', 'logo', 'screenshot', 'updated_at']);
  assert.deepStrictEqual(cols('UPLOADS_COLUMNS'), ['id', 'title', 'platform_slug', 'state', 'sent', 'total', 'files', 'rom_id', 'error', 'updated_at']);
  for (const p of ['"status"', '"recent"', '"queue"', '"games"', '"uploads"', '"image/#/*"']) assert.ok(java.includes(`addURI(authority(getContext()), ${p}`), p);
  assert.ok(/if \(!"r"\.equals\(mode\)\) throw new SecurityException/.test(java), 'pictures open read-only');
  const doc = fs.readFileSync(path.join(__dirname, '../docs/FUSE_BRIDGE.md'), 'utf8');
  for (const c of [...cols('QUEUE_COLUMNS'), ...cols('GAMES_COLUMNS'), ...cols('UPLOADS_COLUMNS')]) assert.ok(doc.includes('`' + c + '`'), `${c} is documented`);
  assert.ok(doc.includes(`protocol version ${fuseStatus.PROTOCOL}`));
});
