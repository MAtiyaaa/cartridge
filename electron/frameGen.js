// Frame generation for Steam shortcuts (0.9.17, owner asked): lsfg-vk or MAKO, whichever is installed,
// for every game, a console or one game. Both are started as a wrapper in Launch options:
// - Decky LSFG-VK writes ~/lsfg (older) or ~/.lsfg (its constants.py SCRIPT_NAME / WRAPPER_FILENAME);
//   its README: "~/lsfg %command%"
// - MAKO Decky installs ~/.local/bin/mako-run (its README: "/home/deck/.local/bin/mako-run %command%")
// The wrapper goes first, after environment variables like vblank_mode=0, before the one %command%.
const fs = require('fs');
const path = require('path');
const os = require('os');

const isExec = (p) => { try { fs.accessSync(p, fs.constants.X_OK); return fs.statSync(p).isFile(); } catch { return false; } };
const TOOLS = { lsfg: 'lsfg-vk', mako: 'MAKO' };
function detect(home = os.homedir()) {
  const lsfg = [path.join(home, 'lsfg'), path.join(home, '.lsfg')].find(isExec) || null;
  const mako = [path.join(home, '.local/bin/mako-run')].find(isExec) || null;
  return { lsfg, mako };
}
// what one game uses: its own pick, else its console's, else the default ('off' stops it at any level)
function choiceFor(fg, romId, key) {
  const c = fg || {};
  const v = (c.games || {})[romId] ?? (c.consoles || {})[key] ?? c.default ?? 'off';
  return v === 'lsfg' || v === 'mako' ? v : 'off';
}
// the wrapper path for a game, or null (the picked tool must be installed)
function wrapperFor(fg, romId, key, found) {
  const v = choiceFor(fg, romId, key);
  return v === 'off' ? null : found[v] || null;
}
module.exports = { TOOLS, detect, choiceFor, wrapperFor };
