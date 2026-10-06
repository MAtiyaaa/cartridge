// shadPS4 trophy lists decrypted by Cartridge itself (0.9.3 K, E6): a trophy00.trp built here the way
// PS4 games ship it (encrypted XML entries, plain PNG entries) must come back as the same files.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const T = require('../electron/trophies.js');

const KEY = crypto.randomBytes(16), NP = 'NPWR12345_00';
const XML = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<trophyconf version="1.1"><title-name>Test Game</title-name><trophy id="000" ttype="P"><name>All of them</name></trophy></trophyconf>');
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

function enc(data, np, key) {
  const npb = Buffer.alloc(16); npb.write(np, 'latin1');
  const c = crypto.createCipheriv('aes-128-cbc', key, Buffer.alloc(16)); c.setAutoPadding(false);
  const trpKey = Buffer.concat([c.update(npb), c.final()]);
  const iv = crypto.randomBytes(16);
  const pad = Buffer.alloc((16 - (data.length % 16)) % 16);
  const e = crypto.createCipheriv('aes-128-cbc', trpKey, iv); e.setAutoPadding(false);
  return Buffer.concat([iv, e.update(Buffer.concat([data, pad])), e.final()]);
}
function trp(entries) {
  const head = Buffer.alloc(0x60 + entries.length * 0x40);
  head.writeUInt32BE(0xdca24d00, 0); head.writeUInt32BE(3, 4); head.writeUInt32BE(entries.length, 16); head.writeUInt32BE(0x40, 20);
  let pos = head.length;
  entries.forEach(([name, data, flag], i) => {
    const e = 0x60 + i * 0x40;
    head.write(name, e, 'latin1'); head.writeBigUInt64BE(BigInt(pos), e + 32); head.writeBigUInt64BE(BigInt(data.length), e + 40); head.writeUInt32BE(flag, e + 48);
    pos += data.length;
  });
  head.writeBigUInt64BE(BigInt(pos), 8);
  return Buffer.concat([head, ...entries.map((x) => x[1])]);
}

test('decrypts the trophy list with the key and NP comm ID; icons come out as they are', () => {
  const files = T.readTrp(trp([['TROP.ESFM', enc(XML, NP, KEY), 3], ['TROP000.PNG', PNG, 0]]), NP, KEY);
  assert.deepStrictEqual(Object.keys(files).sort(), ['TROP.XML', 'TROP000.PNG']);
  assert.strictEqual(files['TROP.XML'].toString(), XML.toString());
  assert.ok(files['TROP000.PNG'].equals(PNG));
  assert.strictEqual(T.parseTrophyXml(files['TROP.XML'].toString()).title, 'Test Game');
});

test('a wrong key or no key gives no list, never garbage; not a TRP gives nothing', () => {
  const file = trp([['TROP.ESFM', enc(XML, NP, KEY), 3]]);
  assert.deepStrictEqual(T.readTrp(file, NP, crypto.randomBytes(16)), {});
  assert.deepStrictEqual(T.readTrp(file, NP, null), {});
  assert.strictEqual(T.readTrp(Buffer.alloc(200), NP, KEY), null);
});

test('Xbox 360 title IDs are named from x360db, alternative IDs too, cached (0.9.29)', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const TN = require('../electron/titleNames');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-'));
  let asked = 0;
  TN.setup({ dir, fetchImpl: async () => { asked++; return { ok: true, json: async () => [{ id: '4D5307E6', alternative_id: ['4D53082A'], title: 'Halo 3' }, { id: 'bad', title: 'x' }] }; } });
  assert.strictEqual(TN.nameFor('xenia', '4D5307E6'), ''); // first ask starts the load
  await TN.loadX360();
  assert.strictEqual(TN.nameFor('xenia', '4d53082a'), 'Halo 3');
  assert.strictEqual(TN.nameFor('shadps4', 'NPWR00001_00'), '');
  assert.ok(fs.existsSync(path.join(dir, 'x360db.json')));
  assert.strictEqual(asked, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('PS5 (KytyPS5): trophy package read, unlocks from _SaveData, names from the game folder (0.9.37)', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'kyty-'));
  // a .ucp as KytyPS5 reads it: magic, version 1, size, count, table offset, 0x40-byte entries from table + 0x20
  const files = [
    ['tropconf.json', Buffer.from(JSON.stringify({ defaultLanguage: 'en-US', trophies: [{ id: 0, grade: 'P' }, { id: 1, grade: 'B', hidden: true }, { id: 2, grade: 'G' }] }))],
    ['tropmeta_en-US.json', Buffer.from(JSON.stringify({ metadata: { titleMetadata: { name: 'Space Bot' }, trophyMetadata: [{ id: 0, name: 'All Done', detail: 'Everything' }, { id: 1, name: 'First Jump', detail: 'Jump' }, { id: 2, name: 'Gold Run' }] } }))],
    ['trop0001.png', PNG],
  ];
  const toc = 0x40, head = Buffer.alloc(toc + 0x20 + files.length * 0x40);
  head.writeUInt32BE(0xb228c60a, 0); head.writeUInt32BE(1, 4); head.writeUInt32BE(files.length, 0x10); head.writeUInt32BE(toc, 0x14);
  let pos = head.length;
  files.forEach(([n, d], i) => { const e = toc + 0x20 + i * 0x40; head.write(n, e, 'latin1'); head.writeBigUInt64BE(BigInt(pos), e + 0x20); head.writeBigUInt64BE(BigInt(d.length), e + 0x28); pos += d.length; });
  head.writeBigUInt64BE(BigInt(pos), 8);
  const ucp = Buffer.concat([head, ...files.map((f) => f[1])]);
  const u = T.readUcp(ucp);
  assert.strictEqual(u.title, 'Space Bot');
  assert.deepStrictEqual(u.trophies.map((t) => [t.id, t.grade, t.name]), [[0, 'P', 'All Done'], [1, 'B', 'First Jump'], [2, 'G', 'Gold Run']]);
  assert.strictEqual(T.readUcp(Buffer.alloc(100)), null);
  // KytyPS5's folder and a downloaded game with that title ID
  const kyty = path.join(H, 'Applications/KytyPS5'), game = path.join(H, 'roms/ps5/Space Bot');
  fs.mkdirSync(path.join(kyty, '_SaveData/PPSA01234'), { recursive: true });
  fs.writeFileSync(path.join(kyty, '_SaveData/PPSA01234/trophies_1000_0.json'), JSON.stringify({ unlockedTrophies: [1, 2] }));
  fs.mkdirSync(path.join(game, 'sce_sys/trophy2'), { recursive: true });
  fs.writeFileSync(path.join(game, 'sce_sys/param.json'), JSON.stringify({ titleId: 'PPSA01234' }));
  fs.writeFileSync(path.join(game, 'sce_sys/trophy2/trophy00.ucp'), ucp);
  T.setTrpCacheDir(path.join(H, 'cache')); T.setIconCacheDir(path.join(H, 'icons')); T.setPs5Games(() => [game]);
  assert.strictEqual(T.validate('kytyps5', kyty), kyty);
  const [g] = T.readSource('kytyps5', [kyty]);
  assert.strictEqual(g.set, 'PPSA01234_00'); assert.strictEqual(g.title, 'Space Bot');
  assert.deepStrictEqual(g.trophies.map((t) => [t.name, t.unlocked]), [['All Done', false], ['First Jump', true], ['Gold Run', true]]);
  assert.ok(g.trophies[1].icon.startsWith('romimg://') && g.trophies[1].time > 0);
  // first-seen times stay put on the next read
  const t1 = g.trophies[1].time; T.setPs5Games(() => []);
  const [g2] = T.readSource('kytyps5', [kyty]);
  assert.strictEqual(g2.trophies.find((t) => t.id === 1).time, t1);
  assert.strictEqual(g2.title, 'Space Bot'); // remembered name without the game folder
});
