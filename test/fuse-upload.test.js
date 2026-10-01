// Uploads Fuse hands over (electron/fuseUpload.js, docs/FUSE_BRIDGE.md protocol 3): the request is checked, the
// first file goes into the console's folder, RomM adds it, and the rest go into that game's folder.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const fu = require('../electron/fuseUpload');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-upload-'));
const file = (rel, bytes) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, bytes); return f; };
const main = file('Pepsiman/Pepsiman.cue', 'CUE!!');
const track = file('Pepsiman/Pepsiman (Track 1).bin', '0123456789');
const dlc = file('Pepsiman/dlc/Extra.bin', 'dlc');
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

const request = (files, extra = {}) => JSON.stringify({ v: 1, from: 'fuse', title: 'Pepsiman', platform: 'psx', files, ...extra });

test('a request names absolute files in folders inside the game, once each', () => {
  const r = fu.parseRequest(request([{ path: main, folder: '' }, { path: dlc, folder: 'dlc/' }]));
  assert.deepStrictEqual(r, { title: 'Pepsiman', platform: 'psx', files: [{ path: main, name: 'Pepsiman.cue', folder: '' }, { path: dlc, name: 'Extra.bin', folder: 'dlc' }] });
  const refused = [
    'not json',
    JSON.stringify({ v: 2, title: 'x', platform: 'psx', files: [{ path: main }] }),
    request([]),
    request([{ path: 'relative/file.bin' }]),
    request([{ path: main, folder: '../outside' }]),
    request([{ path: main, folder: '/abs' }]),
    request([{ path: main, folder: 'a\\b' }]),
    request([{ path: main }, { path: main }]),
    request([{ path: main }], { platform: 'bad slug!' }),
    request([{ path: main }], { title: '  ' }),
  ];
  for (const t of refused) assert.throws(() => fu.parseRequest(t), fu.RequestError, t);
  assert.throws(() => fu.parseRequest(' '.repeat(10) + 'x'.repeat(fu.MAX_REQUEST)), /too large/);
});

test('a desktop link names a request file; anything else is refused', async () => {
  const req = file('req.json', request([{ path: main }]));
  assert.strictEqual((await fu.readRequest({ request: req }, fsp)).files[0].name, 'Pepsiman.cue');
  await assert.rejects(fu.readRequest({ request: main }, fsp), fu.RequestError); // not .json
  await assert.rejects(fu.readRequest({ request: 'req.json' }, fsp), fu.RequestError); // not absolute
  await assert.rejects(fu.readRequest({ request: path.join(dir, 'gone.json') }, fsp), /gone/);
  assert.strictEqual((await fu.readRequest({ json: request([{ path: dlc, folder: 'dlc' }]) }, fsp)).files[0].folder, 'dlc');
});

test('helpers: kinds, versions, Latin-1 header names', () => {
  assert.deepStrictEqual(['', 'dlc', 'DLCs/x', 'update', 'updates', 'manual'].map(fu.kindOf), ['game', 'dlc', 'dlc', 'update', 'update', 'other']);
  assert.ok(fu.atLeast('5.3.1', '5.3.0') && fu.atLeast('v5.3.0-beta.1', '5.3.0') && fu.atLeast('6.0.0', '5.3.0') && fu.atLeast('', '5.3.0'));
  assert.ok(!fu.atLeast('5.2.9', '5.3.0') && !fu.atLeast('4.8', '5.3.0'));
  assert.strictEqual(fu.latin1('Pokémon ポケモン.nds'), 'Pokémon ____.nds');
});

// A RomM that keeps what it receives. roms: what /api/roms answers once scanned.
function server({ version = '5.3.1', exists = [], romId = 77, scan = true } = {}) {
  const log = [];
  const sessions = {};
  let next = 0;
  let scanned = false;
  const got = {}; // upload id -> bytes
  const res = (status, body) => ({ ok: status < 300, status, json: async () => body });
  const deps = {
    fsp,
    chunk: 4,
    base: async () => 'http://romm',
    headers: () => ({ Authorization: 'Bearer t' }),
    heartbeat: async () => ({ SYSTEM: { VERSION: version } }),
    scan: async (ids) => { log.push(['scan', ids]); if (!scan) throw new Error('no scans'); scanned = true; },
    api: async (p, { query }) => { log.push(['find', query.search_term]); return { items: scanned || !scan ? [{ id: romId, fs_name: 'Pepsiman.cue' }] : [] }; },
    sleep: async () => {},
    fetch: async (url, o) => {
      const u = url.replace('http://romm', '');
      if (u === '/api/roms/upload/start') {
        const body = JSON.parse(o.body);
        log.push(['start', body.filename, body.rom_id || null, body.folder ?? null, o.headers['x-upload-total-chunks']]);
        if (exists.includes(body.filename)) return res(400, { detail: `File ${body.filename} already exists` });
        const id = `s${++next}`;
        sessions[id] = body;
        got[id] = '';
        return res(201, { upload_id: id });
      }
      const m = /^\/api\/roms\/upload\/(\w+)(\/complete|\/cancel)?$/.exec(u);
      if (m && !m[2]) { got[m[1]] += Buffer.from(o.body).toString(); return res(200, {}); }
      if (m && m[2] === '/complete') { log.push(['complete', sessions[m[1]].filename, got[m[1]]]); return res(201, {}); }
      if (m) { log.push(['cancel', m[1]]); return res(204, {}); }
      return res(404, {});
    },
  };
  return { deps, log };
}

const settle = (u) => u.idle();

test('a game with discs and DLC: the first file, a scan, then the rest into the game on RomM', async () => {
  const { deps, log } = server();
  const changes = [];
  const u = fu.createUploads({ ...deps, onChange: (l) => changes.push(l[0]?.state) });
  const req = fu.parseRequest(request([{ path: main }, { path: track }, { path: dlc, folder: 'dlc' }]));
  const plan = await u.prepare(req);
  assert.deepStrictEqual([plan.problems, plan.size, plan.files.map((f) => f.kind)], [[], 18, ['game', 'game', 'dlc']]);
  const job = u.start({ token: plan.token, platform: { id: 9, name: 'PlayStation' } });
  assert.strictEqual(job.state, 'waiting');
  assert.throws(() => u.start({ token: plan.token, platform: { id: 9 } }), /again from Fuse/); // a plan is used once
  await settle(u);
  const [done] = u.list();
  assert.deepStrictEqual([done.state, done.romId, done.sent, done.total, done.files, done.error], ['done', 77, 18, 18, 3, null]);
  assert.deepStrictEqual(log.filter((l) => l[0] !== 'find'), [
    ['start', 'Pepsiman.cue', null, null, '2'],
    ['complete', 'Pepsiman.cue', 'CUE!!'],
    ['scan', [9]],
    ['start', 'Pepsiman (Track 1).bin', 77, '', '3'],
    ['complete', 'Pepsiman (Track 1).bin', '0123456789'],
    ['start', 'Extra.bin', 77, 'dlc', '1'],
    ['complete', 'Extra.bin', 'dlc'],
  ]);
  assert.ok(changes.includes('uploading') && changes.includes('scanning') && changes.at(-1) === 'done');
});

test('RomM already has the first file: it is found and the rest still go in', async () => {
  const { deps, log } = server({ exists: ['Pepsiman.cue'] });
  const u = fu.createUploads(deps);
  const plan = await u.prepare(fu.parseRequest(request([{ path: main }, { path: dlc, folder: 'dlc' }])));
  u.start({ token: plan.token, platform: { id: 9 } });
  await settle(u);
  assert.strictEqual(u.list()[0].state, 'done');
  assert.ok(log.some((l) => l[0] === 'complete' && l[1] === 'Extra.bin'));
});

test('an older RomM can take one file, not a game’s other files', async () => {
  const { deps, log } = server({ version: '5.2.4' });
  const u = fu.createUploads(deps);
  const plan = await u.prepare(fu.parseRequest(request([{ path: main }, { path: dlc, folder: 'dlc' }])));
  u.start({ token: plan.token, platform: { id: 9 } });
  await settle(u);
  const [j] = u.list();
  assert.strictEqual(j.state, 'failed');
  assert.match(j.error, /RomM 5\.2\.4 can’t take/);
  assert.ok(!log.some((l) => l[0] === 'start'));
});

test('a sign-in that can’t scan waits for RomM to find the game itself; a single file is done either way', async () => {
  const one = server({ scan: false });
  const u = fu.createUploads(one.deps);
  const plan = await u.prepare(fu.parseRequest(request([{ path: main }])));
  u.start({ token: plan.token, platform: { id: 9 } });
  await settle(u);
  assert.deepStrictEqual([u.list()[0].state, u.list()[0].romId], ['done', 77]);

  // never found: the other files aren't sent, and the message says what to do
  let t = 0;
  const lost = server({ scan: false, romId: 1 });
  const u2 = fu.createUploads({ ...lost.deps, api: async () => ({ items: [] }), now: () => (t += 1000), waits: { unscanned: 5000, every: 1 } });
  const p2 = await u2.prepare(fu.parseRequest(request([{ path: main }, { path: dlc, folder: 'dlc' }])));
  u2.start({ token: p2.token, platform: { id: 9 } });
  await settle(u2);
  assert.strictEqual(u2.list()[0].state, 'failed');
  assert.match(u2.list()[0].error, /Scan in RomM, then upload again/);
});

test('missing files are shown before anything starts, and a plan with them can’t start', async () => {
  const { deps } = server();
  const u = fu.createUploads(deps);
  const plan = await u.prepare(fu.parseRequest(request([{ path: main }, { path: path.join(dir, 'nope.bin') }])));
  assert.deepStrictEqual(plan.problems, [{ name: 'nope.bin', reason: 'not found' }]);
  assert.throws(() => u.start({ token: plan.token, platform: { id: 9 } }), /can’t be read/);
  const ok = await u.prepare(fu.parseRequest(request([{ path: main }])));
  assert.throws(() => u.start({ token: ok.token, platform: null }), /no console/);
});

test('cancel stops an upload and closes the server’s session; restored uploads that were going have failed', async () => {
  const { deps, log } = server();
  let u;
  let calls = 0;
  const slow = { ...deps, fetch: async (url, o) => { if (url.endsWith('/s1') && ++calls === 2) u.cancel(u.list()[0].id); if (o.signal?.aborted) throw new Error('aborted'); return deps.fetch(url, o); } };
  u = fu.createUploads(slow);
  const plan = await u.prepare(fu.parseRequest(request([{ path: track }])));
  u.start({ token: plan.token, platform: { id: 9 } });
  await settle(u);
  assert.strictEqual(u.list()[0].state, 'cancelled');
  assert.ok(log.some((l) => l[0] === 'cancel' && l[1] === 's1'));

  const again = fu.createUploads(deps);
  again.restore([{ id: 'a', title: 'A', state: 'uploading', addedAt: 2, fileList: [] }, { id: 'b', title: 'B', state: 'done', addedAt: 1, fileList: [] }]);
  assert.deepStrictEqual(again.list().map((j) => j.state), ['failed', 'done']);
  assert.ok(!again.busy());
});
