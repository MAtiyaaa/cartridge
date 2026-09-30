// Fuse bridge status (docs/FUSE_BRIDGE.md): the snapshot other apps read, the desktop status file, and the
// Android manifest entries (link filter, provider, permission)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const fuseStatus = require('../electron/fuseStatus');

const KEYS = ['protocol', 'version', 'connected', 'activeDownloads', 'queuedDownloads', 'progress', 'currentTitle', 'currentPlatform', 'libraryChangedAt', 'updatedAt', 'recent'].sort();
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
  assert.strictEqual(s.protocol, 1);
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
