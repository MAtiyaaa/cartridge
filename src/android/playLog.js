// Last played and play time on Android (no Steam or RetroArch logs there), for Start, Home and RomM's play
// sessions. Two sources, both "launch to return", what an app can honestly see:
// - games Cartridge starts: noteLaunch() when it hands the game to an emulator, back() when Cartridge is in
//   front again. The start is kept in localStorage, so a session survives Android stopping Cartridge meanwhile.
// - games Fuse starts (optional: without Fuse only the first source counts): Fuse's play provider (Native.fusePlay), read at start and every time Cartridge comes back.
// main.js (play:session, play:import, electron/androidPlaytime.js) keeps them and feeds play:stats and play:week.
import { call, loadPlay } from '../store.js';
import { Native } from './native.js';

const KEY = 'cart.playing';
const FUSE_SEEN = 'cart.fusePlaySeen';

export function noteLaunch(romId) {
  const s = { romId: Number(romId), start: Date.now() };
  if (!s.romId) return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  call('play:session', { key: 'c' + s.start, romId: s.romId, start: s.start, end: null }).catch(() => {});
}

async function closeSession() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); localStorage.removeItem(KEY); } catch {}
  if (!s?.romId) return false;
  // a session longer than main.js allows (12 h) keeps only its start: its end was missed
  await call('play:session', { key: 'c' + s.start, romId: s.romId, start: s.start, end: Date.now() }).catch(() => {});
  return true;
}

let fuseBusy = false;
async function importFuse() {
  if (fuseBusy) return false;
  fuseBusy = true;
  try {
    // ask again for the last day too: a session that was open then may have an end now
    let seen = 0;
    try { seen = Number(localStorage.getItem(FUSE_SEEN)) || 0; } catch {}
    const since = seen ? seen - 864e5 : Date.now() - 400 * 864e5;
    const r = await Native.fusePlay({ since });
    if (!r?.available) return false;
    const n = r.rows?.length ? await call('play:import', { rows: r.rows }) : 0;
    try { localStorage.setItem(FUSE_SEEN, String(Date.now())); } catch {}
    return n > 0;
  } catch { return false; } finally { fuseBusy = false; }
}

// Cartridge is in front: end the game it started, pick up what was played from Fuse meanwhile
export async function back() {
  const a = await closeSession();
  const b = await importFuse();
  if (a || b) loadPlay();
}
