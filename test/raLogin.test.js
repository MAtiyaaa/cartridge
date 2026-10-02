// RetroAchievements sign-in for emulators (0.9.15 F14): each emulator's own keys and files.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require('../electron/raLogin.js');

function fakeHome() {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'ra-home-'));
  const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(h, p)), { recursive: true }); fs.writeFileSync(path.join(h, p), t); };
  put('.config/PCSX2/inis/PCSX2.ini', '[UI]\nTheme = dark\n\n[Achievements]\nEnabled = false\nToken = old\n\n[Folders]\nCache = cache\n');
  put('.var/app/org.duckstation.DuckStation/data/duckstation/settings.ini', '[Main]\nSettingsVersion = 3\n');
  put('.config/dolphin-emu/Dolphin.ini', '[General]\n');
  put('.config/ppsspp/PSP/SYSTEM/ppsspp.ini', '[Graphics]\nRenderer = 3\n[Achievements]\nAchievementsEnable = False\n');
  put('.config/retroarch/retroarch.cfg', 'video_driver = "vulkan"\ncheevos_enable = "false"\ncheevos_password = "secret"\n');
  return h;
}
const env = {};

test('finds only emulators that have settings', () => {
  const h = fakeHome();
  const t = R.targets(h, { env });
  assert.deepStrictEqual(t.map((x) => x.id), ['pcsx2', 'duckstation', 'dolphin', 'ppsspp', 'retroarch']);
  assert.ok(t.find((x) => x.id === 'duckstation').flatpak);
  assert.deepStrictEqual(R.targets(fs.mkdtempSync(path.join(os.tmpdir(), 'ra-empty-')), { env }), []);
});

test('writes each emulator in its own format', () => {
  const h = fakeHome();
  const list = R.targets(h, { env });
  const res = R.apply(list, { user: 'Player1', token: 'abcdefghij0123456789', now: 1700000000 }, { running: new Set(), machineId: 'm-id\n' });
  assert.ok(res.every((r) => r.ok), JSON.stringify(res));
  const rd = (p) => fs.readFileSync(path.join(h, p), 'utf8');
  const pc = rd('.config/PCSX2/inis/PCSX2.ini');
  assert.match(pc, /\[Achievements\]\nEnabled = true\nUsername = Player1\nLoginTimestamp = 1700000000\n\n\[Folders\]/);
  assert.doesNotMatch(pc, /Token/);
  assert.match(pc, /\[UI\]\nTheme = dark/);
  assert.strictEqual(rd('.config/PCSX2/inis/secrets.ini'), '[Achievements]\nToken = abcdefghij0123456789\n');
  const ds = rd('.var/app/org.duckstation.DuckStation/data/duckstation/settings.ini');
  const enc = ds.match(/Token = (.+)/)[1];
  assert.strictEqual(R.duckDecrypt(enc, 'Player1', 'm-id\n'), 'abcdefghij0123456789');
  assert.match(ds, /\[Cheevos\]\nEnabled = true\nUsername = Player1\n/);
  assert.strictEqual(rd('.config/dolphin-emu/RetroAchievements.ini'), '[Achievements]\nEnabled = True\nUsername = Player1\nApiToken = abcdefghij0123456789\n');
  assert.match(rd('.config/ppsspp/PSP/SYSTEM/ppsspp.ini'), /\[Achievements\]\nAchievementsEnable = True\nAchievementsUserName = Player1\n/);
  assert.strictEqual(rd('.config/ppsspp/PSP/SYSTEM/ppsspp_retroachievements.dat'), 'abcdefghij0123456789');
  const ra = rd('.config/retroarch/retroarch.cfg');
  assert.match(ra, /cheevos_enable = "true"/);
  assert.match(ra, /cheevos_password = ""/);
  assert.match(ra, /cheevos_token = "abcdefghij0123456789"/);
  assert.match(ra, /video_driver = "vulkan"/);
  assert.deepStrictEqual(R.targets(h, { env }).map((x) => x.user), Array(5).fill('Player1'));
});

test('skips a running emulator', () => {
  const h = fakeHome();
  const res = R.apply(R.targets(h, { env }), { user: 'P', token: 't' }, { running: new Set(['retroarch']), machineId: '' });
  assert.strictEqual(res.find((r) => r.id === 'retroarch').ok, false);
  assert.match(fs.readFileSync(path.join(h, '.config/retroarch/retroarch.cfg'), 'utf8'), /cheevos_enable = "false"/);
});

test('DuckStation token matches a known vector', () => {
  // key = SHA256("mid\nuser") + 100 rounds, AES-128-CBC zero padded, checked against openssl
  assert.strictEqual(R.duckToken('0123456789abcdef0123', 'user', 'mid\n'), 'UQ4MqK0ovZbz3a3xebQbyT2BY1RO5TPy9f5Z8ozfllc=');
});

test('login sends login2 and returns the token', async () => {
  let sent;
  const fetchImpl = async (url, o) => { sent = { url, body: String(o.body) }; return { status: 200, json: async () => ({ Success: true, User: 'Player1', Token: 'tok' }) }; };
  assert.deepStrictEqual(await R.login('player1', 'pw', { fetchImpl }), { user: 'Player1', token: 'tok' });
  assert.strictEqual(sent.url, 'https://retroachievements.org/dorequest.php');
  assert.strictEqual(sent.body, 'r=login2&u=player1&p=pw');
  const bad = async () => ({ status: 401, json: async () => ({ Success: false, Error: 'Invalid user/password combination. Please try again.' }) });
  await assert.rejects(R.login('a', 'b', { fetchImpl: bad }), /Invalid user/);
});
