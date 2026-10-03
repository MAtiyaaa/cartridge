// Syncthing, first look (0.9.19, owner: preliminary work; the full feature is planned for 1.0). Read only:
// Cartridge finds the user's own Syncthing (program, Flatpak or its config alone), reads its config.xml
// for the GUI address and API key, and asks its REST API (rest/system/status, rest/config/folders,
// rest/db/completion, rest/system/connections) which folders it syncs, with whom, and how far along.
// It changes nothing in Syncthing and touches no saves. Which synced folders hold emulator saves is
// a guess from their paths, shown as such.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HOME = os.homedir();
const XDG_STATE = process.env.XDG_STATE_HOME || path.join(HOME, '.local/state');
const XDG_CONFIG = process.env.XDG_CONFIG_HOME || path.join(HOME, '.config');
// where each kind of install keeps config.xml (Syncthing 1.27+ moved it to the state folder)
const FLATPAKS = ['com.github.zocker_160.SyncThingy', 'me.kozec.syncthingtk', 'io.github.martchus.syncthingtray'];
function configFiles(home = HOME) {
  const out = [path.join(XDG_STATE, 'syncthing/config.xml'), path.join(XDG_CONFIG, 'syncthing/config.xml'), path.join(home, '.local/state/syncthing/config.xml'), path.join(home, '.config/syncthing/config.xml')];
  for (const id of FLATPAKS) out.push(path.join(home, '.var/app', id, 'config/syncthing/config.xml'), path.join(home, '.var/app', id, 'data/syncthing/config.xml'), path.join(home, '.var/app', id, '.local/state/syncthing/config.xml'));
  return [...new Set(out)];
}
const attr = (tag, name) => { const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag); return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : ''; };
const inner = (xml, tag) => { const m = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml); return m ? m[1] : ''; };
// config.xml -> { gui: { address, apikey, tls }, folders: [{ id, label, path }], devices: [{ id, name }] }
function parseConfig(xml) {
  const gui = (/<gui\b[^>]*>[\s\S]*?<\/gui>/.exec(xml) || [''])[0];
  const out = { gui: { address: inner(gui, 'address') || '127.0.0.1:8384', apikey: inner(gui, 'apikey'), tls: /tls="true"/.test(gui.split('>')[0]) }, folders: [], devices: [] };
  for (const m of xml.matchAll(/<folder\b[^>]*>/g)) out.folders.push({ id: attr(m[0], 'id'), label: attr(m[0], 'label'), path: attr(m[0], 'path').replace(/^~(?=\/)/, HOME) });
  for (const m of xml.matchAll(/<device\b[^>]*>/g)) { const id = attr(m[0], 'id'); if (id && !out.devices.some((d) => d.id === id)) out.devices.push({ id, name: attr(m[0], 'name') }); }
  return out;
}
const onPath = (bin) => { try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; } catch { return false; } };
const flatpakApps = () => { try { return execFileSync('flatpak', ['list', '--app', '--columns=application'], { encoding: 'utf8', timeout: 8000 }).split('\n').map((s) => s.trim()); } catch { return []; } };
// which emulator a synced folder's path points at, by the folder names emulators keep saves in
const SAVE_HINTS = [[/retroarch/i, 'RetroArch'], [/pcsx2/i, 'PCSX2'], [/duckstation/i, 'DuckStation'], [/rpcs3/i, 'RPCS3'], [/dolphin/i, 'Dolphin'], [/ppsspp|\/PSP\b/i, 'PPSSPP'], [/vita3k/i, 'Vita3K'], [/shadps4/i, 'shadPS4'], [/cemu/i, 'Cemu'], [/(eden|yuzu|citron|sudachi|ryujinx)/i, 'Switch'], [/(azahar|citra|lime3ds)/i, 'Azahar'], [/melonds/i, 'melonDS'], [/xemu/i, 'xemu'], [/xenia/i, 'Xenia'], [/emulation\/saves|\/saves?\b/i, 'Saves']];
const saveHint = (p) => (SAVE_HINTS.find(([re]) => re.test(p)) || [])[1] || null;

function find(home = HOME) {
  const file = configFiles(home).find((f) => fs.existsSync(f));
  const fps = flatpakApps().filter((id) => FLATPAKS.includes(id));
  return { installed: !!(file || fps.length || onPath('syncthing')), flatpak: fps[0] || null, program: onPath('syncthing'), config: file || null };
}
// what Cartridge can say about it now; never throws (the page shows what's missing instead)
async function status({ fetchImpl = fetch, home = HOME } = {}) {
  const f = find(home);
  if (!f.config) return { ...f, running: false, why: f.installed ? 'Syncthing is installed but hasn’t been started yet (its settings file isn’t there).' : 'Syncthing isn’t installed.' };
  let cfg; try { cfg = parseConfig(fs.readFileSync(f.config, 'utf8')); } catch (e) { return { ...f, running: false, why: `Syncthing’s settings couldn’t be read: ${e.message}` }; }
  const base = `${cfg.gui.tls ? 'https' : 'http'}://${cfg.gui.address.replace(/^0\.0\.0\.0/, '127.0.0.1')}`;
  const H = { 'X-API-Key': cfg.gui.apikey };
  const get = async (p) => { const r = await fetchImpl(base + p, { headers: H, signal: AbortSignal.timeout(4000) }); if (!r.ok) throw new Error(`Syncthing answered ${r.status}`); return r.json(); };
  const folders = cfg.folders.map((x) => ({ ...x, saves: saveHint(x.path) }));
  try {
    const sys = await get('/rest/system/status');
    const conns = await get('/rest/system/connections').catch(() => ({ connections: {} }));
    for (const x of folders) { try { const c = await get(`/rest/db/completion?folder=${encodeURIComponent(x.id)}`); x.done = Math.round(c.completion ?? 100); } catch {} }
    const me = sys.myID || '';
    const devices = cfg.devices.filter((d) => d.id !== me).map((d) => ({ name: d.name || d.id.slice(0, 7), online: !!conns.connections?.[d.id]?.connected }));
    return { ...f, running: true, address: base, me: me.slice(0, 7), uptime: sys.uptime || 0, folders, devices };
  } catch (e) {
    return { ...f, running: false, folders, devices: cfg.devices.map((d) => ({ name: d.name || d.id.slice(0, 7), online: false })), why: /401|403/.test(e.message) ? 'Syncthing refused the key in its settings file.' : 'Syncthing isn’t running right now.' };
  }
}
module.exports = { find, status, parseConfig, configFiles, saveHint };
