// The background job scheduler (0.9.48). Periodic work Cartridge does by itself (library sync, Steam console
// collections, the BIOS check) is declared here once, with its rules, instead of a setInterval and its own checks in
// each feature:
// - every: how often it's looked at; due(): whether it has anything to do now (the library sync is due once its
//   interval has passed since the last sync, wherever that sync came from).
// - deferWhilePlaying: while a game is running it waits, then runs once the game has ended (owner, 0.9.47: the
//   library sync and the collections check shouldn't run during a game; downloads keep going and aren't jobs here).
// - retry: a job that throws is tried again later (after, then twice as long, up to times), so a server that was
//   briefly away doesn't wait a whole interval.
// - one run at a time per job; a job still running when it comes due again is skipped, not stacked.
// The last run of each job is kept in scheduler.json, so a restart doesn't run everything again at once.
// status() lists the jobs for diagnostics. Plain Node, tested in test/scheduler.test.js with a fake clock.
const fs = require('fs');

function createScheduler({ playing = () => false, file = '', log = () => {}, now = () => Date.now(), timers = { setTimeout, clearTimeout } } = {}) {
  const jobs = new Map();
  let last = {}; try { last = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch {}
  const save = () => { if (file) try { fs.writeFileSync(file, JSON.stringify(last)); } catch {} };
  let tickT = null;
  function arm(ms) { timers.clearTimeout(tickT); tickT = timers.setTimeout(tick, Math.max(250, ms)); tickT?.unref?.(); }
  async function runJob(j, why) {
    if (j.running) return;
    j.running = true; j.deferred = false;
    try { await j.run(); j.fails = 0; j.lastOk = now(); if (j.once) jobs.delete(j.name); else { last[j.name] = now(); save(); } }
    catch (e) {
      j.fails = (j.fails || 0) + 1; log('job failed', j.name, why, e?.message || e);
      if (j.retry && j.fails <= j.retry.times) j.retryAt = now() + j.retry.after * 2 ** (j.fails - 1);
      else { j.fails = 0; if (j.once) jobs.delete(j.name); else { last[j.name] = now(); save(); } }
    } finally { j.running = false; }
  }
  function tick() {
    const t = now();
    let next = 60000;
    for (const j of jobs.values()) {
      const at = j.retryAt || (j.once ? j.startAt : (last[j.name] || 0) + j.every);
      const firstOk = t >= j.startAt;
      let dueNow = firstOk && (t >= at || j.deferred || j.soon);
      if (dueNow && j.due) { try { dueNow = !!j.due(); } catch { dueNow = false; } if (!dueNow) { j.deferred = false; last[j.name] = t; } } // nothing to do (any more): look again after a full interval
      if (dueNow && j.deferWhilePlaying && playing()) { if (!j.deferred) log('job waits for the game to end', j.name); j.deferred = true; next = Math.min(next, 5000); continue; }
      if (dueNow) { j.retryAt = 0; j.soon = false; runJob(j, j.deferred ? 'after the game' : 'due'); }
      next = Math.min(next, Math.max(1000, (j.retryAt || (j.once ? j.startAt : (last[j.name] || 0) + j.every)) - t), j.deferred ? 5000 : Infinity, firstOk ? Infinity : j.startAt - t);
    }
    arm(next);
  }
  return {
    // add(name, { every, firstAfter, due, run, deferWhilePlaying, retry: { times, after }, once }); once: runs one time,
    // firstAfter from now, whatever ran before the restart
    add(name, o) { jobs.set(name, { name, once: !!o.once, every: o.every || 0, startAt: now() + (o.firstAfter || 0), due: o.due, run: o.run, deferWhilePlaying: !!o.deferWhilePlaying, retry: o.retry || null }); if (!last[name] && o.firstAfter == null) last[name] = now(); arm(Math.min(o.firstAfter ?? 1000, 1000)); },
    soon(name) { const j = jobs.get(name); if (j) { j.soon = true; arm(0); } },
    tick,
    status: () => [...jobs.values()].map((j) => ({ name: j.name, every: j.every, last: last[j.name] || 0, running: !!j.running, deferred: !!j.deferred, fails: j.fails || 0 })),
  };
}
module.exports = { createScheduler };
