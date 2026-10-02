// Report a problem on Android (abdu2304's 0.9.3 report is about Steam, EmuDeck and desktop paths): the
// device, the app and WebView versions, and which emulator each console uses. No paths, addresses or names.
import { store } from '../store.js';
import { Native } from './native.js';
import { emus } from './play.js';
import { emuName } from './emulators.js';
import { androidConsoles, androidIssues } from './issues.js';

export async function androidReport() {
  const d = await Native.device().catch(() => ({}));
  const cons = await androidConsoles().catch(() => []);
  const issues = await androidIssues().catch(() => []);
  const games = cons.reduce((n, c) => n + c.roms.length, 0), here = cons.reduce((n, c) => n + c.onDevice.length, 0);
  const net = store.connection.route === 'local' ? 'LAN' : store.connection.base ? 'Tunnel' : 'Offline';
  const out = [
    `Cartridge ${store.info.version} (Android) setup report`,
    `Device: ${[d.manufacturer, d.model].filter(Boolean).join(' ') || 'unknown'} · Android API ${d.sdk || '?'}`,
    `WebView: ${navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] || 'unknown'} · screen ${screen.width}x${screen.height} · second screen ${store.androidDisplays?.secondary ? (store.config.android?.dualScreen !== false ? 'on' : 'off') : 'none'}`,
    `Server: ${net} · ${games} games in ${cons.length} consoles · ${here} on this device`,
    '',
    'Emulators installed:',
    ...Object.entries(emus.found || {}).map(([id, e]) => `- ${emuName(id, emus.found)}${e.version ? ' ' + e.version : ''} (${e.pkg})${e.fork ? ' · found by name' : ''}`),
    ...(Object.keys(emus.found || {}).length ? [] : ['- none']),
    '',
    'Consoles with games on this device:',
    ...cons.filter((c) => c.onDevice.length).map((c) => `- ${c.p.display_name || c.p.slug}: ${c.onDevice.length} ${c.onDevice.length === 1 ? 'game' : 'games'} · ${!c.con ? 'not supported yet' : c.cands.length ? emuName(c.pick || c.cands[0], emus.found) + (c.pick ? ' (picked)' : ' (automatic)') : 'no emulator'}`),
    '',
    `Issues: ${issues.length ? '' : 'none'}`,
    ...issues.map((i) => `- ${i.text}`),
  ];
  return out.join('\n');
}
