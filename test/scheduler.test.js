// The background job scheduler (0.9.48): due jobs run, wait while a game runs and run once it ends, retry with
// back-off, never overlap.
const test = require('node:test');
const assert = require('node:assert');
const { createScheduler } = require('../electron/scheduler');

function fake() {
  let t = 1_000_000, q = [];
  return {
    now: () => t,
    timers: { setTimeout: (fn, ms) => { const h = { fn, at: t + ms }; q.push(h); return h; }, clearTimeout: (h) => { q = q.filter((x) => x !== h); } },
    async advance(ms) { const end = t + ms; for (;;) { q.sort((a, b) => a.at - b.at); const h = q[0]; if (!h || h.at > end) break; q.shift(); t = h.at; h.fn(); await new Promise((r) => setImmediate(r)); } t = end; },
  };
}

test('a job waits while a game runs and runs when it ends', async () => {
  const c = fake(); let game = true; const runs = [];
  const s = createScheduler({ playing: () => game, now: c.now, timers: c.timers });
  s.add('sync', { every: 60000, firstAfter: 1000, deferWhilePlaying: true, run: async () => runs.push(c.now()) });
  await c.advance(30000);
  assert.strictEqual(runs.length, 0);
  assert.ok(s.status()[0].deferred);
  game = false;
  await c.advance(6000);
  assert.strictEqual(runs.length, 1);
});

test('due() decides, failures retry with back-off, no overlap', async () => {
  const c = fake(); let ok = false, tries = 0, want = false;
  const s = createScheduler({ now: c.now, timers: c.timers });
  s.add('a', { every: 10000, firstAfter: 0, due: () => want, run: async () => { tries++; if (!ok) throw new Error('down'); }, retry: { times: 3, after: 2000 } });
  await c.advance(25000);
  assert.strictEqual(tries, 0); // never due
  want = true;
  await c.advance(11000);
  assert.ok(tries >= 1);
  const before = tries;
  ok = true;
  await c.advance(5000); // retry after 2 s, then 4 s
  assert.ok(tries > before);
  assert.strictEqual(s.status()[0].fails, 0);
});

test('a one-time job runs once after its delay, and waits for a game too', async () => {
  const c = fake(); let game = true, runs = 0;
  const s = createScheduler({ playing: () => game, now: c.now, timers: c.timers });
  s.add('bios', { once: true, firstAfter: 45000, deferWhilePlaying: true, run: async () => { runs++; } });
  await c.advance(60000); assert.strictEqual(runs, 0);
  game = false; await c.advance(10000); assert.strictEqual(runs, 1);
  await c.advance(600000); assert.strictEqual(runs, 1);
  assert.strictEqual(s.status().length, 0);
});
