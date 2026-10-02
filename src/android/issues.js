// Android's side of Settings → Emulators (abdu2304's 0.9.3 Issues list, made for Android): for each
// console with games on this device, is an emulator installed, is its BIOS there, and are there game
// packages (.pkg, .vpk) still to install inside the emulator. Android emulators install packages from
// their own menus, so Cartridge opens the emulator and says where the file is.
import { store, call, romsOf, saveConfig, toast } from '../store.js';
import { Native } from './native.js';
import { EMUS, CONSOLES, BIOS, consoleKey, candidatesFor, emuName } from './emulators.js';
import { scanEmulators, emus } from './play.js';

const MARKED = '(marked as installed)';
const PKG = /\.(pkg|vpk)$/i;
const confirmed = (k) => !!store.config.android?.confirmed?.[k];

// Consoles you have games for: on this device first, then the rest of your server
export async function androidConsoles() {
  const found = await scanEmulators();
  const cfg = store.config.android || {};
  const out = [];
  for (const p of store.lib?.platforms || []) {
    if (!p.rom_count) continue;
    const key = consoleKey(p.slug, p.fs_slug);
    const roms = romsOf(p.id);
    const onDevice = roms.filter((r) => store.installed[r.id] && store.installed[r.id] !== MARKED);
    const cands = key ? candidatesFor(key, found, cfg) : [];
    out.push({ p, key, roms, onDevice, cands, pick: cfg.emus?.[key] && cands.includes(cfg.emus[key]) ? cfg.emus[key] : null, con: key && CONSOLES[key] });
  }
  return out.sort((a, b) => (b.onDevice.length > 0) - (a.onDevice.length > 0) || (a.p.display_name || a.p.name).localeCompare(b.p.display_name || b.p.name));
}

export async function androidIssues() {
  const list = [];
  const cons = await androidConsoles();
  for (const c of cons) {
    if (!c.onDevice.length || !c.con) continue;
    const name = c.p.display_name || c.p.name, n = c.onDevice.length;
    // no emulator for games that are already here
    if (!c.cands.length) {
      const first = c.con.emus.map((id) => EMUS[id]).find((e) => e?.get);
      list.push({ kind: 'emu', key: c.key, text: `No emulator for ${name}`, sub: `${n} ${n === 1 ? 'game' : 'games'} on this device · ${c.con.emus.slice(0, 3).map((id) => EMUS[id]?.name).filter(Boolean).join(', ')}`,
        fix: first ? { label: 'Get ' + first.name, run: () => Native.openUrl({ url: first.get }) } : null });
      continue;
    }
    // BIOS the emulator can't start without (Android hides other apps' folders, so "can't tell" asks you)
    const b = c.con.bios && BIOS[c.con.bios];
    if (b && !b.optional && !confirmed('bios:' + c.con.bios)) {
      const st = await call('android:bios', { dirs: b.dirs, names: b.names.source, minSize: b.minSize }).catch(() => ({ state: 'unknown' }));
      if (st.state !== 'ok') list.push({ kind: 'bios', key: c.key, text: st.state === 'missing' ? `${b.label} missing` : `Is the ${b.label} in place?`, sub: b.hint, fix: { label: 'I have it', run: () => saveConfig({ android: { confirmed: { ['bios:' + c.con.bios]: true } } }) } });
    }
    // packages downloaded but not installed in the emulator (PS3 .pkg, Vita .pkg/.vpk)
    const pkgs = c.onDevice.filter((r) => PKG.test(store.installed[r.id]) && !confirmed('pkg:' + r.id));
    if (pkgs.length) {
      const id = c.pick || c.cands[0], app = emus.found?.[id];
      list.push({ kind: 'pkg', key: c.key, text: `${pkgs.length} ${name} ${pkgs.length === 1 ? 'package' : 'packages'} to install in ${emuName(id, emus.found)}`, sub: `${pkgs[0].name}${pkgs.length > 1 ? ` and ${pkgs.length - 1} more` : ''}. Install from the emulator's menu, then mark it done.`,
        fix: { label: 'Open ' + emuName(id, emus.found), run: async () => {
          toast(`In ${emuName(id, emus.found)}, install: ${store.installed[pkgs[0].id]}`, 'info', 9000, 'mdiPackageDown');
          if (app) await Native.openApp({ pkg: app.pkg }).catch((e) => toast(e.message, 'error'));
        }, done: () => saveConfig({ android: { confirmed: Object.fromEntries(pkgs.map((r) => ['pkg:' + r.id, true])) } }) } });
    }
  }
  store.issues = list.length;
  return list;
}
