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
