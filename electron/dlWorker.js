// File downloads in their own thread (0.9.16). Downloads used to stream on Electron's main thread,
// so anything busy there (image serving, IPC, start-up scans) slowed them down; here nothing else
// runs. The main thread gets progress about four times a second and can abort at any time.
// 0.9.21: one thread per game takes its files one after another (jobs), so a game of thousands of
// files (PS3, PS4, Vita folders) reuses one connection to RomM instead of a new thread and TLS
// handshake per file.
const { parentPort } = require('worker_threads');
const fs = require('fs');

let ac = null;
parentPort.on('message', (m) => {
  if (m === 'abort') { ac?.abort(); return; }
  if (m?.type === 'job') run(m).catch((e) => parentPort.postMessage({ type: 'error', job: m.job, message: ac?.signal.aborted ? 'aborted' : e.message, status: e.status || 0 }));
});

async function run({ job, url, headers, part, start, limit }) { // limit: bytes per second, 0 = none
  ac = new AbortController();
  const h = { ...headers };
  if (start > 0) h.Range = `bytes=${start}-`;
  const r = await fetch(url, { headers: h, signal: ac.signal });
  if (r.status === 416) { await r.body?.cancel().catch(() => {}); return parentPort.postMessage({ type: 'restart', job }); }
  if (!r.ok) { await r.body?.cancel().catch(() => {}); throw Object.assign(new Error(r.status === 404 ? 'File not found on server' : `HTTP ${r.status}`), { status: r.status }); }
  const resumed = r.status === 206 && start > 0;
  parentPort.postMessage({ type: 'start', job, resumed });
  // big writes, few of them: a 1 MB buffer before each disk write
  const fd = fs.openSync(part, resumed ? 'a' : 'w');
  let buf = Buffer.allocUnsafe(1 << 20), used = 0, sent = 0, last = Date.now();
  const t0 = Date.now();
  let got = 0;
  const flush = () => { if (used) { fs.writeSync(fd, buf, 0, used); used = 0; } };
  try {
    const reader = r.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (used + value.length > buf.length) { flush(); if (value.length > buf.length) fs.writeSync(fd, value); else { buf.set(value, 0); used = value.length; } }
      else { buf.set(value, used); used += value.length; }
      got += value.length;
      // the speed limit (Settings → Downloads), shared out by the main thread
      if (limit) { const ahead = (got / limit) * 1000 - (Date.now() - t0); if (ahead > 20) await new Promise((res) => setTimeout(res, ahead)); }
      const now = Date.now();
      if (now - last >= 250) { parentPort.postMessage({ type: 'bytes', job, n: got - sent }); sent = got; last = now; }
    }
    flush();
  } finally { fs.closeSync(fd); }
  parentPort.postMessage({ type: 'bytes', job, n: got - sent });
  parentPort.postMessage({ type: 'done', job, ms: Date.now() - t0, bytes: got });
}
