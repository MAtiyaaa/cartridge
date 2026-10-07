// The web engine (0.9.52): pacing per host, retries, Retry-After, the disk cache and its stale copy offline,
// and plain errors naming the service. A fake fetch and a fake clock, nothing goes out.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createWeb } = require('../electron/web');

function rig(answers) {
  let t = 1000; const slept = [], asked = [];
  const fetchImpl = async (url, o) => {
    asked.push({ url, at: t, headers: o.headers });
    const a = typeof answers === 'function' ? answers(url, asked.length) : answers.shift();
    if (a instanceof Error) throw a;
    return { status: a.status || 200, ok: (a.status || 200) < 300, headers: new Map(Object.entries(a.headers || {})), json: async () => a.json, text: async () => a.text ?? JSON.stringify(a.json), arrayBuffer: async () => Buffer.from(a.text || '') };
  };
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-web-'));
  const web = createWeb({ cacheDir, fetchImpl, now: () => t, sleep: async (ms) => { slept.push(ms); t += ms; } });
  return { web, asked, slept, cacheDir, tick: (ms) => { t += ms; } };
}

test('one host is paced: back-to-back requests wait for its gap', async () => {
  const { web, asked } = rig(() => ({ json: { ok: 1 } }));
  await web.json('https://gamebanana.com/apiv11/a'); await web.json('https://gamebanana.com/apiv11/b'); await web.json('https://example.org/x');
  assert.strictEqual(asked[1].at - asked[0].at, 200);
  assert.strictEqual(asked[2].at, asked[1].at); // another host isn't held up
});

test('server errors and dropped connections are tried again; a 404 is not', async () => {
  const r1 = rig([{ status: 502 }, Object.assign(new Error('fetch failed'), { code: 'ECONNRESET' }), { json: { n: 3 } }]);
  assert.deepStrictEqual(await r1.web.json('https://api.github.com/x'), { n: 3 });
  assert.strictEqual(r1.asked.length, 3);
  const r2 = rig([{ status: 404 }, { json: {} }]);
  await assert.rejects(r2.web.json('https://api.github.com/x'), (e) => e.code === 'notfound' && /GitHub/.test(e.message));
  assert.strictEqual(r2.asked.length, 1);
});

test('a 429 waits for Retry-After once, then goes on', async () => {
  const { web, slept } = rig([{ status: 429, headers: { 'retry-after': '3' } }, { json: { ok: true } }]);
  assert.deepStrictEqual(await web.json('https://api.nexusmods.com/v1/x'), { ok: true });
  assert.ok(slept.includes(3000));
});

test('no connection: a plain "offline" error naming the service, or the saved copy when there is one', async () => {
  const off = () => Object.assign(new Error('getaddrinfo ENOTFOUND gamebanana.com'), { code: 'ENOTFOUND' });
  const r = rig((u, n) => (n === 1 ? { json: { mods: [1, 2] } } : off()));
  assert.deepStrictEqual(await r.web.json('https://gamebanana.com/m', { cache: 'gb-m', maxAge: 1000 }), { mods: [1, 2] });
  r.tick(5000); // old now
  const again = await r.web.json('https://gamebanana.com/m', { cache: 'gb-m', maxAge: 1000, retry: 0 });
  assert.deepStrictEqual(again, { mods: [1, 2] });
  assert.strictEqual(again.stale, true);
  await assert.rejects(r.web.json('https://gamebanana.com/other', { retry: 0 }), (e) => e.code === 'offline' && /can’t reach GameBanana/.test(e.message));
});

test('a fresh cached answer is used without asking', async () => {
  const r = rig([{ json: { v: 1 } }, { json: { v: 2 } }]);
  await r.web.json('https://emucorex.com/t.json', { cache: 'emx', maxAge: 60000 });
  assert.deepStrictEqual(await r.web.json('https://emucorex.com/t.json', { cache: 'emx', maxAge: 60000 }), { v: 1 });
  assert.strictEqual(r.asked.length, 1);
});

test('a refused key and a block are told apart, in words', async () => {
  const r = rig([{ status: 401 }, { status: 403 }]);
  await assert.rejects(r.web.json('https://api.nexusmods.com/v1/users/validate.json', { retry: 0 }), (e) => e.code === 'auth' && /Nexus Mods didn’t accept the key/.test(e.message));
  await assert.rejects(r.web.json('https://api.nexusmods.com/v1/x', { retry: 0 }), (e) => e.code === 'blocked');
});
