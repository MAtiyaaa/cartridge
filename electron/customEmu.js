'use strict';
// An emulator or fork from a GitHub link (0.9.24, owner: the last card on Settings → Emulators → Emulators:
// paste a GitHub link, say which console it's for or what it's a fork of, and Cartridge installs it where
// its other emulators live). Only the project's own newest release, only a Linux x86_64 AppImage.
// No imports beyond Node, so the picking can be tested (test/customEmu.test.js).

// "https://github.com/owner/repo/releases/tag/v1" or "owner/repo" -> "owner/repo"
function repoOf(link) {
  const s = String(link || '').trim().replace(/\.git$/i, '');
  const m = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/i.exec(s) || /^([\w.-]+)\/([\w.-]+)$/.exec(s);
  return m && !/^(releases|orgs|topics)$/i.test(m[1]) ? `${m[1]}/${m[2]}` : null;
}
// the release's Linux AppImage for this machine: x86_64 (or no arch named), never ARM; the plainest name first
function pickAsset(assets) {
  const ok = (assets || []).filter((a) => /\.appimage$/i.test(a.name) && !/(aarch64|arm64|armhf|armv7|\.zsync$)/i.test(a.name));
  const score = (n) => (/(x86_64|amd64|x64)/i.test(n) ? 0 : 1) + (/(debug|symbols|test)/i.test(n) ? 5 : 0) + n.length / 1000;
  return ok.sort((a, b) => score(a.name) - score(b.name))[0] || null;
}
// file name it's saved under: the repo's name, so updates and other tools find it the same way each time
function fileName(repo, asset) {
  const base = repo.split('/')[1].replace(/[^\w.-]+/g, '');
  return /\.appimage$/i.test(base) ? base : `${base}.AppImage`;
}
module.exports = { repoOf, pickAsset, fileName };
