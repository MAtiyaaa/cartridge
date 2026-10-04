// Install to (Android): with an SD card or USB drive in, a download asks which drive it goes to. Each drive's
// ROMs folder (the one with a folder per console) is picked once and kept in config.android.driveRoots; the
// console folders inside it are found or made by main.js (platformPathIn). Internal storage, or whichever drive
// holds the main ROMs folder, uses the console folders set in Settings as before.
import { store, call, choose, pickFolder, saveConfig, bytes, toast } from '../store.js';

export const drives = () => call('android:drives').catch(() => []);
const short = (p) => String(p || '').replace(/^\/storage\/emulated\/0/, 'Internal').replace(/^\/storage\//, '');

// The ROMs folder on a drive, picked by the user (Cartridge's guess is where the picker opens). '' when cancelled.
export async function pickRoms(d) {
  const dir = await pickFolder({ title: `ROMs folder on ${d.label}`, subtitle: 'The folder with a folder for each console. Cartridge makes the console folders it needs.', start: d.roms || d.guess || d.mount });
  if (!dir) return '';
  if (!(dir === d.mount || dir.startsWith(d.mount + '/'))) { toast(`Pick a folder on ${d.label}`, 'error', 3500); return ''; }
  await saveConfig({ android: { driveRoots: { ...(store.config?.android?.driveRoots || {}), [d.mount]: dir } } });
  return dir;
}

// Where a download goes: '' for the main ROMs folder, a drive's ROMs folder, or null when cancelled.
// ask: false (the second screen) takes the drive used last without asking. count: games in one go (asked once).
export async function pickDrive({ ask = true, count = 1 } = {}) {
  const list = await drives();
  if (list.length < 2) return '';
  const last = list.find((d) => d.mount === store.config?.android?.installTo);
  const rootOf = (d) => (d.main ? '' : d.roms || null);
  if (!ask || store.config?.android?.askDrive === false) return last && rootOf(last) !== null ? rootOf(last) : '';
  // the drive used last comes first, so A takes it straight away
  const order = last ? [last, ...list.filter((d) => d !== last)] : list;
  const v = await choose({
    title: count > 1 ? `Install ${count} games to` : 'Install to',
    options: order.map((d) => ({
      label: d.label,
      sub: `${bytes(d.free)} free${d.roms ? ` · ${short(d.roms)}` : ' · pick its ROMs folder first'}`,
      value: d.mount,
      icon: d.removable ? 'mdiMicroSd' : 'mdiCellphone',
    })),
  });
  if (!v) return null;
  const d = list.find((x) => x.mount === v);
  const root = rootOf(d) ?? (await pickRoms(d));
  if (root === '' && !d.main) return null; // no folder picked on that drive
  if (store.config?.android?.installTo !== d.mount) saveConfig({ android: { installTo: d.mount } }).catch(() => {});
  return root;
}
