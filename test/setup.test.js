// 0.9.15 welcome: EmuDeck's app the way its install.sh picks it; RomM on this device from RomM's compose.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const W = require('../electron/welcome.js');
const RL = require('../electron/rommLocal.js');

test('EmuDeck: the x86 AppImage, arm64 only on ARM', () => {
  const rel = { assets: [{ name: 'EmuDeck-2.5.0-arm64.AppImage' }, { name: 'EmuDeck-2.5.0.AppImage' }, { name: 'latest-linux.yml' }] };
  assert.strictEqual(W.pickAsset(rel, 'x64').name, 'EmuDeck-2.5.0.AppImage');
  assert.strictEqual(W.pickAsset(rel, 'arm64').name, 'EmuDeck-2.5.0-arm64.AppImage');
  assert.strictEqual(W.pickAsset({ assets: [{ name: 'x.zip' }] }, 'x64'), null);
});

test('RomM: same database settings in both containers, folders where RomM expects them', () => {
  const s = { DB_ROOT: 'r', DB_PASSWD: 'p', AUTH_KEY: 'k' };
  const db = RL.dbArgs(s).join(' ');
  assert.match(db, /MARIADB_DATABASE=romm/);
  assert.match(db, /MARIADB_USER=romm-user/);
  assert.match(db, /MARIADB_PASSWORD=p/);
  assert.match(db, /--pod cartridge-romm/);
  const app = RL.rommArgs(s, { library: '/l', assets: '/a', config: '/c' }, { igdbId: 'i' }).join(' ');
  for (const x of ['DB_HOST=127.0.0.1', 'DB_NAME=romm', 'DB_USER=romm-user', 'DB_PASSWD=p', 'ROMM_AUTH_SECRET_KEY=k', '/l:/romm/library', '/a:/romm/assets', '/c:/romm/config', '/redis-data', 'label=disable']) assert.ok(app.includes(x), x);
  assert.doesNotMatch(app, /IGDB_CLIENT_ID/); // half a key pair is left out
});

test('RomM: secrets file round trip', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rl-')), 'romm-local.env');
  fs.writeFileSync(f, RL.envText({ DB_ROOT: 'a', AUTH_KEY: 'b' }));
  assert.deepStrictEqual(RL.readEnv(f), { DB_ROOT: 'a', AUTH_KEY: 'b' });
});
