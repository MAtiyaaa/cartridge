// Games the Fuse launcher hands over to upload to RomM (docs/FUSE_BRIDGE.md, protocol 3). Fuse names a game's
// files (the one that names the game first, then other discs, DLC and updates, each with the folder it belongs
// in); Cartridge checks them, shows what will be sent, and uploads only after the user confirms here. The first
// file goes into the console's folder on the server; RomM then adds it as a game (Cartridge asks it to scan when
// it can), and the other files go into that game's folder, so RomM files DLC and updates under it.
// Everything is injected, so node --test can drive it without a server.
const path = require('path');

const MAX_REQUEST = 256 * 1024; // bytes of request JSON
const MAX_FILES = 500;
const KEEP = 20; // finished uploads kept for the Fuse status
const CHUNK = 16 * 1024 * 1024;
const PLAN_TTL = 15 * 60e3; // a shown plan can be confirmed for this long
const MIN_FOLDERS = '5.3.0'; // RomM that takes files into a game's folder

// ---------------------------------------------------------------- requests
class RequestError extends Error {}
const bad = (m) => new RequestError(m);

// A folder inside the game, relative and forward-slashed ('', 'dlc', 'update/1.0.2'), or null when it isn't one
function folderOf(v) {
  if (v == null || v === '') return '';
  if (typeof v !== 'string' || v.length > 200 || v.startsWith('/') || v.includes('\\')) return null;
  const parts = v.replace(/\/+$/, '').split('/');
  if (parts.some((p) => !p || p === '.' || p === '..' || /[\u0000-\u001f\u007f]/.test(p))) return null;
  return parts.join('/');
}

// The request Fuse wrote, checked: { title, platform, files: [{ path, name, folder }] }. Throws a RequestError
// with a message for the user.
function parseRequest(text) {
  if (typeof text !== 'string' || !text.trim()) throw bad('Fuse sent an empty upload request.');
  if (Buffer.byteLength(text) > MAX_REQUEST) throw bad('Fuse sent an upload request that is too large.');
  let r;
  try { r = JSON.parse(text); } catch { throw bad('Fuse sent an upload request Cartridge can’t read.'); }
  if (!r || typeof r !== 'object' || r.v !== 1) throw bad('This upload request is from a newer Fuse. Update Cartridge, then try again.');
  const title = typeof r.title === 'string' ? r.title.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 300) : '';
  const platform = typeof r.platform === 'string' ? r.platform.trim().toLowerCase() : '';
  if (!title) throw bad('The upload request has no game name.');
  if (!/^[a-z0-9._-]{1,64}$/.test(platform)) throw bad('The upload request has no console.');
  if (!Array.isArray(r.files) || !r.files.length) throw bad('The upload request has no files.');
  if (r.files.length > MAX_FILES) throw bad(`A game can have at most ${MAX_FILES} files here.`);
  const seen = new Set();
  const files = r.files.map((f) => {
    const p = typeof f?.path === 'string' ? f.path : '';
    if (!p || !path.isAbsolute(p) || p.includes('\u0000')) throw bad('The upload request names a file Cartridge can’t use.');
    const folder = folderOf(f.folder);
    if (folder == null) throw bad(`The upload request puts ${path.basename(p)} in a folder RomM can’t use.`);
    const name = path.basename(p);
    const key = `${folder}/${name}`;
    if (seen.has(key)) throw bad(`The upload request names ${name} twice.`);
    seen.add(key);
    return { path: path.normalize(p), name, folder };
  });
  return { title, platform, files };
}

// Reads the request: from the file a desktop link names ({ request }), or as text (Android: { json })
async function readRequest(src, fsp) {
  if (src && typeof src.json === 'string') return parseRequest(src.json);
  const f = src?.request;
  if (typeof f !== 'string' || !path.isAbsolute(f) || !f.toLowerCase().endsWith('.json')) throw bad('The link doesn’t name an upload request.');
  let st;
  try { st = await fsp.stat(f); } catch { throw bad('Fuse’s upload request is gone. Start the upload again from Fuse.'); }
  if (!st.isFile() || st.size > MAX_REQUEST) throw bad('The link doesn’t name an upload request.');
  return parseRequest(await fsp.readFile(f, 'utf8'));
}

// What each file is, the way the confirmation groups them
function kindOf(folder) {
  const top = folder.split('/')[0].toLowerCase();
  if (!top) return 'game';
  if (/^dlcs?$/.test(top)) return 'dlc';
  if (/^updates?$/.test(top)) return 'update';
  return 'other';
}

// "5.3.1", "v5.3.0-beta.1" >= "5.3.0"? Unknown versions pass (the server says no itself if it can't).
function atLeast(v, min) {
  const m = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(String(v || ''));
  if (!m) return true;
  const a = [+m[1], +m[2], +(m[3] || 0)], b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

// Header values must be Latin-1; the real name goes in the body, which newer RomM prefers
const latin1 = (s) => String(s).replace(/[^ -~ -ÿ]/g, '_');

// ---------------------------------------------------------------- uploads
// deps: { fetch, fsp, base: () => url, headers: () => auth headers, api(path, { query }), scan(platformIds) (may
//   reject: not every sign-in can scan), heartbeat() => { SYSTEM: { VERSION } }, denied (sign-in message),
//   onChange(), save(list), sleep(ms), now(), chunk, waits: { scanned, unscanned } }
function createUploads(deps) {
  const now = deps.now || Date.now;
  const sleep = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const chunk = deps.chunk || CHUNK;
  const waits = { scanned: 30e3, unscanned: 3 * 60e3, every: 4e3, ...deps.waits };
  const plans = new Map(); // token -> { plan, at }
  let jobs = []; // newest first
  let chain = Promise.resolve();
  let seq = 0;

  const publicJob = (j) => ({
    id: j.id, title: j.title, platformSlug: j.platformSlug, platformName: j.platformName, state: j.state,
    sent: j.sent, total: j.total, files: j.files.length, fileIndex: j.fileIndex, current: j.current || null,
    romId: j.romId || null, error: j.error || null, note: j.note || null, addedAt: j.addedAt, updatedAt: j.updatedAt,
  });
  const list = () => jobs.map(publicJob);
  const busy = () => jobs.some((j) => ['waiting', 'uploading', 'scanning'].includes(j.state));
  const keep = () => { jobs = [...jobs.filter((j) => ['waiting', 'uploading', 'scanning'].includes(j.state)), ...jobs.filter((j) => !['waiting', 'uploading', 'scanning'].includes(j.state)).slice(0, KEEP)].sort((a, b) => b.addedAt - a.addedAt); };
  const persist = () => { try { deps.save?.(jobs.map((j) => ({ ...publicJob(j), fileList: j.files.map(({ name, folder, size }) => ({ name, folder, size })) }))); } catch {} };
  const emit = (save) => { if (save) persist(); try { deps.onChange?.(list()); } catch {} };
  const set = (j, o, save = true) => { Object.assign(j, o, { updatedAt: now() }); emit(save); };

  // Uploads from an earlier run: what was still going can't carry on (the server's session is gone)
  function restore(saved) {
    jobs = (Array.isArray(saved) ? saved : []).filter((j) => j && typeof j.id === 'string').map((j) => ({
      ...j, files: Array.isArray(j.fileList) ? j.fileList : [], fileList: undefined,
      ...(['waiting', 'uploading', 'scanning'].includes(j.state) ? { state: 'failed', error: 'Cartridge was closed before the upload finished. Upload it again from Fuse.' } : {}),
    }));
    keep();
  }

  // Checks a request's files and keeps it for the confirmation: { token, title, platform, files, size, problems }
  async function prepare(req) {
    for (const [k, v] of plans) if (now() - v.at > PLAN_TTL) plans.delete(k);
    const files = [];
    const problems = [];
    for (const f of req.files) {
      try {
        const st = await deps.fsp.stat(f.path);
        if (!st.isFile()) { problems.push({ name: f.name, reason: 'not a file' }); continue; }
        await deps.fsp.access(f.path, 4 /* R_OK */);
        files.push({ ...f, size: st.size, kind: kindOf(f.folder) });
      } catch (e) {
        problems.push({ name: f.name, reason: e.code === 'ENOENT' ? 'not found' : e.code === 'EACCES' || e.code === 'EPERM' ? 'Cartridge may not read it' : 'can’t be read' });
      }
    }
    const token = `p${now().toString(36)}${(++seq).toString(36)}`;
    const plan = { token, title: req.title, platform: req.platform, files, size: files.reduce((s, f) => s + f.size, 0), problems };
    plans.set(token, { plan, at: now() });
    return plan;
  }

  // The user confirmed: queue the upload. platform: the RomM platform ({ id, name }) the console maps to.
  function start({ token, platform }) {
    const held = plans.get(token);
    if (!held) throw new Error('This upload waited too long. Start it again from Fuse.');
    if (!(Number(platform?.id) > 0)) throw new Error('RomM has no console for this game yet.');
    const { plan } = held;
    if (plan.problems.length) throw new Error('Some of the game’s files can’t be read.');
    plans.delete(token);
    const j = {
      id: `u${now().toString(36)}${(++seq).toString(36)}`, title: plan.title, platformSlug: plan.platform,
      platformId: Number(platform.id), platformName: platform.name || plan.platform, files: plan.files,
      state: 'waiting', sent: 0, total: plan.size, fileIndex: 0, addedAt: now(), updatedAt: now(), abort: new AbortController(),
    };
    jobs.unshift(j);
    keep();
    emit(true);
    chain = chain.then(() => run(j)).catch(() => {});
    return publicJob(j);
  }

  function cancel(id) {
    const j = jobs.find((x) => x.id === id);
    if (!j || !['waiting', 'uploading', 'scanning'].includes(j.state)) return false;
    j.abort?.abort();
    if (j.state === 'waiting') set(j, { state: 'cancelled' });
    return true;
  }

  async function run(j) {
    if (j.state !== 'waiting') return;
    set(j, { state: 'uploading' });
    try {
      const [first, ...rest] = j.files;
      if (rest.length) {
        const v = await deps.heartbeat?.().then((h) => h?.SYSTEM?.VERSION).catch(() => null);
        if (v && !atLeast(v, MIN_FOLDERS)) throw new Error(`RomM ${v} can’t take a game’s other files (discs, DLC, updates). RomM ${MIN_FOLDERS.replace(/\.0$/, '')} or newer can.`);
      }
      set(j, { fileIndex: 0, current: first.name }, false);
      const existed = (await send(j, first, {})) === 'exists';
      set(j, { state: 'scanning', current: null });
      const romId = await locate(j, first.name, rest.length > 0);
      if (!romId && rest.length) throw new Error(`RomM hasn’t added ${first.name} yet, so the other files weren’t sent. Scan in RomM, then upload again from Fuse.`);
      if (rest.length) {
        set(j, { state: 'uploading', romId });
        for (let i = 0; i < rest.length; i++) {
          set(j, { fileIndex: i + 1, current: rest[i].name }, false);
          await send(j, rest[i], { romId, folder: rest[i].folder });
        }
      }
      set(j, {
        state: 'done', romId: romId || null, current: null, sent: j.total,
        note: !romId ? 'Uploaded. RomM adds it at its next scan.' : existed && !rest.length ? 'RomM already had it.' : null,
      });
    } catch (e) {
      if (j.abort.signal.aborted) set(j, { state: 'cancelled', current: null });
      else set(j, { state: 'failed', current: null, error: e.message || 'The upload failed.' });
    } finally {
      delete j.upload;
    }
  }

  // Asks RomM to scan the console, then waits for the game to show up. A sign-in that can't scan still finds
  // it when RomM watches its folders; the wait is longer then.
  async function locate(j, name, needed) {
    let scanned = false;
    try { await deps.scan([j.platformId]); scanned = true; } catch {}
    const until = now() + (scanned ? waits.scanned : needed ? waits.unscanned : Math.min(waits.unscanned, 60e3));
    for (;;) {
      if (j.abort.signal.aborted) throw new Error('cancelled');
      const id = await findRom(j.platformId, name).catch(() => null);
      if (id) return id;
      if (now() >= until) return null;
      await sleep(waits.every);
    }
  }

  async function findRom(platformId, name) {
    const stem = name.replace(/\.[^.]+$/, '');
    const page = await deps.api('/api/roms', { query: { platform_ids: platformId, platform_id: platformId, search_term: stem, limit: 100 } });
    const items = Array.isArray(page) ? page : page?.items || [];
    const hit = items.find((r) => r.fs_name === name || (r.files || []).some((f) => f.file_name === name));
    return hit ? Number(hit.id) : null;
  }

  // One file through RomM's chunked upload. 'exists' when RomM already has a file of that name there.
  async function send(j, f, { romId, folder }) {
    const b = await deps.base();
    const sig = j.abort.signal;
    const size = f.size;
    const total = size ? Math.ceil(size / chunk) : 0;
    const body = { filename: f.name, ...(romId ? { rom_id: romId, folder: folder || '' } : {}) };
    const start = await deps.fetch(`${b}/api/roms/upload/start`, {
      method: 'POST', signal: sig, body: JSON.stringify(body),
      headers: { ...deps.headers(), 'Content-Type': 'application/json', 'x-upload-platform': String(j.platformId), 'x-upload-filename': latin1(f.name), 'x-upload-total-size': String(size), 'x-upload-total-chunks': String(total) },
    });
    if (start.status === 401 || start.status === 403) throw new Error(deps.denied || 'Your RomM sign-in can’t upload games.');
    if (start.status === 404 || start.status === 405) throw new Error('This RomM can’t take uploads from Cartridge. RomM 4 or newer can.');
    if (!start.ok) {
      const d = await start.json().catch(() => ({}));
      const detail = typeof d.detail === 'string' ? d.detail : '';
      if (start.status === 409 || (!romId && start.status === 400 && /already exists/i.test(detail))) { j.sent += size; return 'exists'; }
      throw new Error(detail ? `RomM refused ${f.name}: ${detail}` : `RomM refused ${f.name} (error ${start.status}).`);
    }
    const { upload_id: id } = await start.json();
    j.upload = { id, base: b };
    const fh = await deps.fsp.open(f.path, 'r');
    try {
      let last = 0;
      for (let i = 0; i < total; i++) {
        const len = Math.min(chunk, size - i * chunk), buf = Buffer.alloc(len);
        const { bytesRead } = await fh.read(buf, 0, len, i * chunk);
        if (bytesRead !== len) throw new Error(`${f.name} changed while it was being uploaded.`);
        const r = await deps.fetch(`${b}/api/roms/upload/${id}`, { method: 'PUT', signal: sig, body: buf, headers: { ...deps.headers(), 'x-chunk-index': String(i), 'Content-Type': 'application/octet-stream' } });
        if (!r.ok) throw new Error(`The upload of ${f.name} stopped at part ${i + 1} of ${total} (error ${r.status}).`);
        j.sent += len;
        if (now() - last > 400 || i === total - 1) { last = now(); set(j, {}, false); }
      }
    } catch (e) {
      // the server keeps an unfinished session: close it (best effort)
      deps.fetch(`${b}/api/roms/upload/${id}/cancel`, { method: 'POST', headers: deps.headers() }).catch(() => {});
      throw e;
    } finally { await fh.close(); }
    const done = await deps.fetch(`${b}/api/roms/upload/${id}/complete`, { method: 'POST', signal: sig, headers: deps.headers() });
    if (!done.ok) {
      const d = await done.json().catch(() => ({}));
      throw new Error(typeof d.detail === 'string' && d.detail ? `RomM couldn’t finish ${f.name}: ${d.detail}` : `RomM couldn’t finish ${f.name} (error ${done.status}).`);
    }
    return 'sent';
  }

  return { prepare, start, cancel, list, busy, restore, idle: () => chain };
}

module.exports = { MAX_REQUEST, parseRequest, readRequest, folderOf, kindOf, atLeast, latin1, createUploads, RequestError };
