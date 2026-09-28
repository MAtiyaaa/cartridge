// Settings → Android → Steam & PC game apps: PC (Windows) games open in GameNative, GameHub or
// Winlator. Their game lists live inside each app where Cartridge can't write, so Cartridge downloads
// the game into its console folder, opens the app you pick and says where to find the game.
import { store, choose, toast, download, downloadFor } from '../store.js';
import { Native } from './native.js';

export const PC_SLUGS = /^(win|windows|win3x|pc|dos)$/i;
export const pcAppsOn = () => store.config?.android?.steamApps === true;

export async function pcApps() {
  try { return (await Native.launchers()).apps || []; } catch { return []; }
}

const HINTS = {
  gamenative: 'In GameNative, press Add Game and pick this folder',
  gamehub: 'In GameHub, import a local game and pick this folder',
  winlator: 'In Winlator, open a container and browse to this folder',
};

export async function openInPcApp(rom, path) {
  const apps = await pcApps();
  if (!apps.length) { toast('GameNative, GameHub or Winlator isn\'t installed', 'error', 4500); return; }
  if (!path) {
    const dl = downloadFor(rom.id);
    if (dl && ['queued', 'downloading'].includes(dl.status)) { toast('Still downloading. Open it again when it\'s done.', 'info', 3500); return; }
    if (await download(rom)) toast('Downloading first. Open it in your PC game app when it\'s done.', 'info', 4000, 'mdiDownload');
    return;
  }
  const pkg = apps.length === 1 ? apps[0].pkg : await choose({ title: 'Open in', options: apps.map((a) => ({ label: a.label, sub: a.pkg, value: a.pkg, icon: 'mdiMicrosoftWindows' })) });
  const app = apps.find((a) => a.pkg === pkg);
  if (!app) return;
  try { await navigator.clipboard?.writeText(path); } catch {}
  const key = Object.keys(HINTS).find((k) => (app.label + app.pkg).toLowerCase().includes(k));
  toast(`${HINTS[key] || `In ${app.label}, add a game from this folder`}: ${path}`, 'info', 9000, 'mdiMicrosoftWindows');
  try { await Native.openApp({ pkg: app.pkg }); } catch (e) { toast(e.message, 'error'); }
}
