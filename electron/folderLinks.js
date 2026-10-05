'use strict';
// Linked Folders (0.9.33, owner: "a fork of shadPS4 should play my games with the same saves"): a fork's save
// folder becomes a link to the original emulator's, so both use one set of saves. Nothing is deleted: a folder
// the fork already had is renamed to <name>.cartridge-kept and put back when the link is removed. Only links
// Cartridge made (recorded by the caller) are ever removed.
const fs = require('fs');
const path = require('path');
const os = require('os');

const KEPT = '.cartridge-kept';
const lst = (p) => { try { return fs.lstatSync(p); } catch { return null; } };
const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
const entries = (p) => { try { return fs.readdirSync(p).filter((n) => !n.startsWith('.')); } catch { return []; } };

// A fork's own data folder, found the way forks keep theirs: portable (beside the program: shadPS4's user/,
// yuzu's user/, Dolphin's User/ or portable/), else a folder named after it under ~/.local/share or ~/.config
function forkBases(exe, home = os.homedir()) {
  const dir = path.dirname(exe), out = [];
  for (const d of [dir, path.join(dir, 'user'), path.join(dir, 'User'), path.join(dir, 'portable')]) out.push({ base: d, how: 'portable' });
  const stem = path.basename(exe).replace(/\.(appimage|exe|sh)$/i, '');
  const names = new Set([stem, stem.replace(/[-_. ]?(v?\d+(\.\d+)+.*|x86_64.*|linux.*|qt.*)$/i, ''), stem.replace(/[-_. ]+/g, '')].filter((n) => n && n.length > 2));
  for (const n of names) for (const r of ['.local/share', '.config']) out.push({ base: path.join(home, r, n), how: 'own' });
  return out;
}
// The fork's base whose layout matches: the save folder's parent (e.g. user/ for user/savedata) exists there
function findForkBase(exe, rel, home) {
  const top = String(rel).split('/')[0];
  return forkBases(exe, home).find((b) => top && lst(path.join(b.base, top))?.isDirectory()) || null;
}

// what's at a link's place now
function status(from, to) {
  const s = lst(from);
  if (!s) return { state: 'missing' };
  if (s.isSymbolicLink()) {
    let t = ''; try { t = fs.readlinkSync(from); } catch {}
    return real(from) === real(to) ? { state: 'linked' } : { state: 'other-link', target: path.resolve(path.dirname(from), t) };
  }
  if (!s.isDirectory()) return { state: 'file' };
  if (real(from) === real(to)) return { state: 'same' }; // already one folder (the fork uses the original's)
  const n = entries(from).length;
  return { state: n ? 'folder' : 'empty', count: n };
}

// places a link may be made: inside home or on another drive, never home or a drive itself, never inside each other
function check(from, to, home = os.homedir()) {
  const ok = (p) => { const r = real(p); return [home, real(home), '/run/media', '/media', '/mnt'].some((b) => r.startsWith(b + '/')) && r !== home && r !== real(home); };
  if (!path.isAbsolute(from) || !path.isAbsolute(to)) return 'Pick both folders.';
  if (!ok(from) || !ok(path.dirname(to)) || !ok(to)) return 'Only folders inside your home folder or on another drive can be linked.';
  const a = real(from), b = real(to);
  if (a === b) return 'Those are the same folder.';
  if (b.startsWith(a + '/') || a.startsWith(b + '/')) return 'One folder is inside the other.';
  if (!lst(to)?.isDirectory()) return 'The folder to share doesn’t exist.';
  return '';
}

// from becomes a link to to. -> { kept } (the fork's own folder, set aside) or throws
function link(from, to, home) {
  const st = status(from, to);
  if (st.state === 'linked') return { kept: null, already: true };
  const why = check(from, to, home);
  if (why) throw new Error(why);
  if (st.state === 'same') throw new Error('It already uses that folder: nothing to link.');
  if (st.state === 'other-link') throw new Error(`It’s already a link to ${st.target}. Remove that link first.`);
  if (st.state === 'file') throw new Error('There’s a file where the folder should be.');
  let kept = null;
  if (st.state === 'folder' || st.state === 'empty') {
    kept = from + KEPT;
    if (lst(kept)) throw new Error(`${path.basename(kept)} is already there from an earlier link. Move it first.`);
    fs.renameSync(from, kept);
  } else fs.mkdirSync(path.dirname(from), { recursive: true });
  try { fs.symlinkSync(real(to), from, 'dir'); }
  catch (e) { if (kept) fs.renameSync(kept, from); throw e; }
  return { kept };
}
// removes a link Cartridge made and puts the fork's own folder back (an empty one when it had none)
function unlink(rec) {
  const s = lst(rec.from);
  if (s && !s.isSymbolicLink()) throw new Error('That’s a folder now, not Cartridge’s link: it’s left as it is.');
  if (s) fs.unlinkSync(rec.from);
  if (rec.kept && lst(rec.kept)) fs.renameSync(rec.kept, rec.from);
  else fs.mkdirSync(rec.from, { recursive: true });
  return true;
}

module.exports = { KEPT, forkBases, findForkBase, status, check, link, unlink };
