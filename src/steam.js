// Adding games to Steam: pick collections, queue, preview, apply
import { reactive } from 'vue';
import { store, call, choose, confirm, toast, openModal, pickFolder } from './store.js';

export const steam = reactive({ queue: { add: 0, remove: 0, total: 0 }, busy: false, progress: null });
window.cart.on('steam-queue', (q) => { steam.queue = q; });
// Apply progress for the top bar: artwork per game, then waiting for Steam to close and write
window.cart.on('steam-progress', (p) => { if (steam.busy) steam.progress = p; });
export function steamProgressLabel(p) {
  if (!p) return '';
  return p.step === 'art' ? `Steam artwork ${p.done + 1}/${p.total}` : 'Waiting for Steam…';
}
window.cart.on('steam-auto', (e) => {
  toast(e.action === 'add' ? `${e.name || 'Game'} is waiting to be added to Steam. Apply from Settings → Steam.` : 'Removed game is waiting to come off Steam. Apply from Settings → Steam.', 'info', 4500, 'mdiSteam');
});
export const scfg = () => store.config?.steam || {};

// Which Steam collections? Remembers the last choice per console.
export async function pickCollections(consoleKey, preset, many = false) {
  const list = await call('steam:collections').catch(() => []);
  return openModal('steam-collections', { collections: list.map((c) => c.name), selected: preset || (scfg().lastCollections || {})[consoleKey] || [], many });
}

export async function addGame(rom) {
  let info = await call('steam:forRom', { romId: rom.id });
  if (!info.steam) { toast('Steam was not found, or no account has signed in yet.', 'error', 5000); return; }
  if (info.needsFolder) {
    const dir = await pickFolder({ title: `Where is ${rom.name}?`, subtitle: 'Pick the extracted game folder (the one with eboot.bin)', start: store.config.romsRoot || store.info.home });
    if (!dir) return;
    try { await call('steam:setPath', { romId: rom.id, path: dir }); } catch (e) { toast(e.message, 'error'); return; }
    info = await call('steam:forRom', { romId: rom.id });
  }
  const cols = await pickCollections(info.console, info.lastCollections);
  if (cols === null || cols === undefined) return;
  await call('steam:queueAdd', [{ romId: rom.id, collections: cols }]);
  await afterQueue(`${rom.name} is ready to add`);
}
// Select many (Library): installed games only, one collections pick for all of them
export async function addGames(roms) {
  const env = await call('steam:forRom', { romId: roms[0]?.id }).catch(() => null);
  if (!env?.steam) { toast('Steam was not found, or no account has signed in yet.', 'error', 5000); return false; }
  const ready = [];
  let skipped = 0;
  for (const r of roms) {
    const info = await call('steam:forRom', { romId: r.id }).catch(() => null);
    if (info?.installed && !info.needsFolder && !info.inSteam && !info.queued) ready.push(r); else skipped++;
  }
  if (!ready.length) { toast('None of these can be added: download them first (PS3 and PS4 games need their folder set on the game page).', 'info', 5000, 'mdiSteam'); return false; }
  const cols = await pickCollections(null, [], true);
  if (cols === null || cols === undefined) return false;
  await call('steam:queueAdd', ready.map((r) => ({ romId: r.id, collections: cols })));
  if (skipped) toast(`${skipped} skipped: not downloaded, already in Steam, or needs its folder set`, 'info', 4000, 'mdiSteam');
  await afterQueue(`${ready.length} game${ready.length === 1 ? '' : 's'} ready to add`);
  return true;
}
export async function removeGame(rom, appid) {
  await call('steam:queueRemove', [appid]);
  await afterQueue(`${rom.name} will be removed from Steam`);
}
async function afterQueue(what) {
  steam.queue = await call('steam:overview').then((o) => o.queue).catch(() => steam.queue);
  const n = steam.queue.total;
  const liveOn = (await call('steam:liveInfo').catch(() => null))?.on;
  // Steam takes it while it runs: nothing to wait for, so no "Apply now or later?" question (A7)
  if (liveOn) { await applyChanges(); return; }
  const v = await choose({
    title: what, message: `Steam has to close for a moment to take ${n > 1 ? `these ${n} changes` : 'the change'}. Cartridge closes too if Steam started it${store.info.gamescope ? ' and Game Mode brings Steam back' : ''}.`,
    options: [
      { label: 'Apply now', sub: 'Steam restarts', value: 'now', icon: 'mdiSteam' },
      { label: 'Later', sub: 'Keep it waiting, apply from Settings → Steam', value: 'later', icon: 'mdiClockOutline' },
    ],
  });
  if (v === 'now') await applyChanges();
  else toast(`${n} Steam change${n === 1 ? '' : 's'} waiting. Apply from Settings → Steam.`, 'info', 3500, 'mdiSteam');
}
export async function applyChanges() {
  if (steam.busy) return false;
  try {
    if (scfg().preview !== false) {
      const pv = await call('steam:preview');
      if (!pv.entries.length && !pv.removing.length) { toast(pv.skipped.length ? pv.skipped[0].why : 'Nothing to change', 'info', 5000); return false; }
      const ok = await openModal('steam-preview', pv);
      if (!ok) return false;
    }
    steam.busy = true;
    steam.progress = { step: 'art', done: 0, total: 1 };
    const t0 = Date.now();
    const r = await call('steam:apply', { restart: true });
    // wait for the helper to finish writing (Steam may take a while to close)
    if (r.steamWillRestart) toast('Steam is closing to take the changes and will open again.', 'info', 6000, 'mdiSteam');
    let done = false;
    for (let i = 0; i < 90 && !done; i++) {
      const st = await call('steam:last').catch(() => null);
      if (st && st.at >= t0 && ['done', 'error'].includes(st.state)) { if (st.state === 'error') throw new Error(st.error); done = true; break; }
      await new Promise((ok) => setTimeout(ok, 1000));
    }
    if (done) call('steam:report').catch(() => {}); // seen here, so it isn't reported again next start
    if (done) toast(`Done. ${r.added ? `${r.added} game${r.added === 1 ? '' : 's'} added` : ''}${r.added && r.removed ? ', ' : ''}${r.removed ? `${r.removed} removed` : ''}.`, 'ok', 5000, 'mdiSteam');
    else toast('Still waiting for Steam to close. The change finishes by itself once it does.', 'info', 6000, 'mdiSteam');
    return true;
  } catch (e) { toast(e.message, 'error', 6000); return false; }
  finally { steam.busy = false; steam.progress = null; }
}
export async function restartSteam() {
  if (!(await confirm('Restart Steam?', 'Anything open in Steam closes, including Cartridge if Steam started it.', 'Restart Steam'))) return;
  await call('steam:restart'); toast('Restarting Steam…', 'info', 3000, 'mdiSteam');
}
// once after start: how the last change went
export async function steamReport() {
  try {
    const r = await call('steam:report');
    if (r.last?.state === 'done' && (r.last.added || r.last.removed)) toast(`Steam updated: ${r.last.added ? `${r.last.added} added` : ''}${r.last.added && r.last.removed ? ', ' : ''}${r.last.removed ? `${r.last.removed} removed` : ''}.`, 'ok', 4500, 'mdiSteam');
    else if (r.last?.state === 'done' && r.last.restored) toast('Steam shortcuts are back to how they were.', 'ok', 4000, 'mdiSteam');
    else if (r.last?.state === 'error') toast('Steam changes failed: ' + r.last.error, 'error', 7000);
    // games missing from their collections: Settings → Emulators → Issues (0.9.3), no pop-up
  } catch {}
}
