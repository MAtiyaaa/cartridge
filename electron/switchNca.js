// Switch games' title ID, type and version, read the way Eden does (0.9.30, owner: "Eden reads the game ID and
// its version, figure out how"). From Eden's source: content_archive.cpp (key area / title key), fssystem_nca_header.h
// (header and fs header layout), fssystem_aes_ctr_storage.cpp (counter = upper IV big-endian + offset / 16),
// nca_metadata.h (CNMT: title ID, version, type), control_metadata.h (NACP: names, version string at 0x3060),
// patch_manager.cpp (FormatTitleVersion: vA.B.C from the version's top three bytes).
// Electron's crypto has no AES-XTS (BoringSSL), which is why the header reads always failed inside the app
// while the tests passed in plain Node: XTS is done here over AES-ECB, which Electron has.
// Read only: nothing is written anywhere. Keys come from the user's own prod.keys / title.keys.
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');

// ---- keys (prod.keys / title.keys as Eden's KeyManager reads them: "name = hex")
function parseKeys(text) {
  const out = {};
  for (const m of String(text || '').matchAll(/^\s*([0-9a-z_]+)\s*=\s*([0-9a-f]+)\s*$/gim)) out[m[1].toLowerCase()] = m[2].toLowerCase();
  return out;
}
const hex = (k, s) => (k[s] ? Buffer.from(k[s], 'hex') : null);
const ecb = (key, data, enc = false) => { const c = (enc ? crypto.createCipheriv : crypto.createDecipheriv)('aes-128-ecb', key, null); c.setAutoPadding(false); return Buffer.concat([c.update(data), c.final()]); };
const two = (n) => n.toString(16).padStart(2, '0');
// key_area_key_<kind>_XX and titlekek_XX straight from prod.keys, else made from master_key_XX and the sources
// (Eden's DeriveGeneralPurposeKeys: GenerateKeyEncryptionKey(source, master, kek_seed, key_seed))
function keyAreaKey(k, gen, index) {
  const kind = ['application', 'ocean', 'system'][index] || 'application';
  const direct = hex(k, `key_area_key_${kind}_${two(gen)}`);
  if (direct) return direct;
  const master = hex(k, `master_key_${two(gen)}`), src = hex(k, `key_area_key_${kind}_source`), kekSeed = hex(k, 'aes_kek_generation_source'), keySeed = hex(k, 'aes_key_generation_source');
  if (!master || !src || !kekSeed || !keySeed) return null;
  return ecb(ecb(ecb(master, kekSeed), src), keySeed);
}
function titlekek(k, gen) {
  const direct = hex(k, `titlekek_${two(gen)}`);
  if (direct) return direct;
  const master = hex(k, `master_key_${two(gen)}`), src = hex(k, 'titlekek_source');
  return master && src ? ecb(master, src) : null;
}

// ---- AES-128-XTS with Nintendo's tweak (sector number big-endian), over ECB
function xtsDecrypt(key, data, sector, sectorSize = 0x200) {
  const k1 = key.subarray(0, 16), k2 = key.subarray(16, 32), out = Buffer.alloc(data.length);
  for (let s = 0; s * sectorSize < data.length; s++) {
    const chunk = data.subarray(s * sectorSize, (s + 1) * sectorSize), tw = Buffer.alloc(16);
    tw.writeBigUInt64BE(BigInt(sector + s), 8);
    let t = ecb(k2, tw, true);
    const tweaks = Buffer.alloc(chunk.length), x = Buffer.alloc(chunk.length);
    for (let b = 0; b < chunk.length; b += 16) {
      t.copy(tweaks, b);
      for (let i = 0; i < 16; i++) x[b + i] = chunk[b + i] ^ t[i];
      // multiply the tweak by x in GF(2^128), little-endian, as XTS does
      const n = Buffer.alloc(16); let carry = 0;
      for (let i = 0; i < 16; i++) { n[i] = ((t[i] << 1) | carry) & 0xff; carry = t[i] >> 7; }
      if (carry) n[0] ^= 0x87;
      t = n;
    }
    const p = ecb(k1, x);
    for (let i = 0; i < p.length; i++) out[s * sectorSize + i] = p[i] ^ tweaks[i];
  }
  return out;
}
const ctrDecrypt = (key, upper, offset, data) => {
  const iv = Buffer.alloc(16); upper.copy(iv, 0); iv.writeBigUInt64BE(BigInt(Math.floor(offset / 16)), 8);
  const d = crypto.createDecipheriv('aes-128-ctr', key, iv); return Buffer.concat([d.update(data), d.final()]);
};

// ---- containers: PFS0 (nsp, nsz) and HFS0 (xci, xcz partitions)
function readAt(fd, pos, len) { const b = Buffer.alloc(len); const n = fs.readSync(fd, b, 0, len, pos); return n < len ? b.subarray(0, n) : b; }
function pfs(fd, base) {
  const h = readAt(fd, base, 16);
  if (h.length < 16) return [];
  const magic = h.toString('latin1', 0, 4), n = h.readUInt32LE(4), strLen = h.readUInt32LE(8);
  const es = magic === 'PFS0' ? 0x18 : magic === 'HFS0' ? 0x40 : 0;
  if (!es || n > 4096 || strLen > 1 << 20) return [];
  const t = readAt(fd, base + 16, n * es + strLen), data = base + 16 + n * es + strLen, out = [];
  for (let i = 0; i < n; i++) {
    const e = i * es, no = t.readUInt32LE(e + 16), s = n * es + no;
    out.push({ name: t.toString('latin1', s, t.indexOf(0, s)), offset: data + Number(t.readBigUInt64LE(e)), size: Number(t.readBigUInt64LE(e + 8)) });
  }
  return out;
}
// the entries of a game file: its NCAs (or NCZs) and tickets
function entries(fd) {
  const h = readAt(fd, 0, 0x200);
  if (h.toString('latin1', 0, 4) === 'PFS0') return pfs(fd, 0);
  for (const at of [0, 0x1000]) { // a full XCI dump has 0x1000 bytes of key area in front
    const x = at ? readAt(fd, at, 0x200) : h;
    if (x.length >= 0x140 && x.toString('latin1', 0x100, 0x104) === 'HEAD') {
      const root = at + Number(x.readBigUInt64LE(0x130)), secure = pfs(fd, root).find((e) => e.name === 'secure');
      return secure ? pfs(fd, secure.offset) : [];
    }
  }
  return [];
}

// ---- NCZ (nsz/xcz): the first 0x4000 bytes are the NCA's own, the rest is its decrypted data, zstd
// compressed as one stream or in blocks (nsz's NCZSECTN / NCZBLOCK headers)
function nczBody(fd, e) {
  const head = readAt(fd, e.offset + 0x4000, 16);
  if (head.toString('latin1', 0, 8) !== 'NCZSECTN') return null;
  const count = Number(head.readBigUInt64LE(8));
  let pos = e.offset + 0x4000 + 16 + count * 0x40;
  const rest = readAt(fd, pos, Math.min(e.size - (pos - e.offset), 64 << 20));
  const unz = (b) => zlib.zstdDecompressSync(b);
  if (rest.toString('latin1', 0, 8) === 'NCZBLOCK') {
    const exp = rest[11], n = rest.readUInt32LE(12), bs = 2 ** exp, total = Number(rest.readBigUInt64LE(16));
    let at = 24 + n * 4; const parts = [];
    for (let i = 0; i < n; i++) {
      const cs = rest.readUInt32LE(24 + i * 4), want = Math.min(bs, total - i * bs), b = rest.subarray(at, at + cs);
      parts.push(cs === want ? b : unz(b)); at += cs;
    }
    return Buffer.concat(parts);
  }
  return unz(rest);
}

// ---- one NCA: header, then a section's bytes (decrypted), then PFS0 files or a RomFS file
function openNca(fd, e, k, tickets) {
  const hk = hex(k, 'header_key');
  if (!hk) return null;
  let raw = readAt(fd, e.offset, 0xc00);
  if (raw.length < 0x400) return null;
  if (raw.length < 0xc00) raw = Buffer.concat([raw, Buffer.alloc(0xc00 - raw.length)]); // the header alone still names the title
  let h = xtsDecrypt(hk, raw.subarray(0, 0x400), 0);
  const magic = h.toString('latin1', 0x200, 0x204);
  if (!/^NCA[23]$/.test(magic)) return null;
  // NCA3: the four fs headers follow as sectors 2 to 5; NCA2: each is its own sector 0
  const fsh = [];
  for (let i = 0; i < 4; i++) fsh.push(magic === 'NCA3' ? xtsDecrypt(hk, raw.subarray(0x400 + i * 0x200, 0x600 + i * 0x200), 2 + i) : xtsDecrypt(hk, raw.subarray(0x400 + i * 0x200, 0x600 + i * 0x200), 0));
  h = Buffer.concat([h, ...fsh]);
  const gen = Math.max(h[0x206], h[0x220], 1) - 1, rights = h.subarray(0x230, 0x240);
  let key = null;
  if (rights.some((b) => b)) {
    const enc = tickets.get(rights.toString('hex')) || hex(k, rights.toString('hex'));
    const kek = enc && titlekek(k, gen);
    if (kek) key = ecb(kek, enc);
  } else {
    const kak = keyAreaKey(k, gen, h[0x207]);
    if (kak) key = ecb(kak, h.subarray(0x300 + 0x20, 0x300 + 0x30)); // key 2 of the key area: AES-CTR
  }
  const body = /\.ncz$/i.test(e.name) ? nczBody(fd, e) : null;
  const nca = { type: h[0x205], titleId: h.readBigUInt64LE(0x210).toString(16).padStart(16, '0').toUpperCase(), key, ok: !!key };
  // bytes [off, off+len) of the NCA, decrypted, in section i
  nca.read = (i, off, len) => {
    const fh = h.subarray(0x400 + i * 0x200, 0x600 + i * 0x200), crypt = fh[4], upper = Buffer.from(fh.subarray(0x140, 0x148)).reverse();
    if (body && off >= 0x4000) return body.subarray(off - 0x4000, off - 0x4000 + len); // NCZ keeps it decrypted
    const a = Math.floor(off / 16) * 16, b = Math.ceil((off + len) / 16) * 16, enc = readAt(fd, e.offset + a, b - a);
    if (crypt === 1) return enc.subarray(off - a, off - a + len);
    if (!key || ![3, 5].includes(crypt)) return null;
    return ctrDecrypt(key, upper, a, enc).subarray(off - a, off - a + len);
  };
  nca.section = (i) => {
    const s = h.readUInt32LE(0x240 + i * 0x10) * 0x200, end = h.readUInt32LE(0x244 + i * 0x10) * 0x200;
    if (!end) return null;
    const fh = h.subarray(0x400 + i * 0x200, 0x600 + i * 0x200);
    if (fh[2] === 1) { const n = fh.readInt32LE(0x2c); const r = 0x30 + (n - 1) * 0x10; return { kind: 'pfs', start: s + Number(fh.readBigUInt64LE(r)), size: Number(fh.readBigUInt64LE(r + 8)) }; }
    if (fh[2] === 0) { const n = fh.readUInt32LE(0x14); const r = 0x18 + (n - 2) * 0x18; return { kind: 'romfs', start: s + Number(fh.readBigUInt64LE(r)), size: Number(fh.readBigUInt64LE(r + 8)) }; }
    return null;
  };
  return nca;
}
// a file in a PFS0 section (the .cnmt in a meta NCA)
function pfsFile(nca, i, test) {
  const sec = nca.section(i); if (!sec || sec.kind !== 'pfs') return null;
  const h = nca.read(i, sec.start, 16); if (!h || h.toString('latin1', 0, 4) !== 'PFS0') return null;
  const n = h.readUInt32LE(4), strLen = h.readUInt32LE(8), t = nca.read(i, sec.start + 16, n * 0x18 + strLen), data = sec.start + 16 + n * 0x18 + strLen;
  for (let j = 0; j < n; j++) {
    const s = n * 0x18 + t.readUInt32LE(j * 0x18 + 16), name = t.toString('latin1', s, t.indexOf(0, s));
    if (test(name)) return nca.read(i, data + Number(t.readBigUInt64LE(j * 0x18)), Number(t.readBigUInt64LE(j * 0x18 + 8)));
  }
  return null;
}
// a file at the root of a RomFS section (control.nacp)
function romfsFile(nca, i, want) {
  const sec = nca.section(i); if (!sec || sec.kind !== 'romfs') return null;
  const h = nca.read(i, sec.start, 0x50); if (!h || h.readBigUInt64LE(0) !== 0x50n) return null;
  const metaOff = Number(h.readBigUInt64LE(0x38)), metaSize = Number(h.readBigUInt64LE(0x40)), dataOff = Number(h.readBigUInt64LE(0x48));
  const m = nca.read(i, sec.start + metaOff, Math.min(metaSize, 1 << 20));
  for (let p = 0; p + 0x20 <= m.length;) {
    const nl = m.readUInt32LE(p + 0x1c); // entry: parent, sibling, data offset, size, hash, name length, name
    const name = m.toString('utf8', p + 0x20, p + 0x20 + nl);
    if (name.toLowerCase() === want) return nca.read(i, sec.start + dataOff + Number(m.readBigUInt64LE(p + 8)), Number(m.readBigUInt64LE(p + 0x10)));
    p += 0x20 + Math.ceil(nl / 4) * 4;
  }
  return null;
}
// CNMT: what this content is (0x80 game, 0x81 update, 0x82 DLC), its title ID and version, and its contents
// (records of 0x38: hash, NCA ID, size, type 3 = Control) after the extended header
function cnmt(b) {
  if (!b || b.length < 0x20) return null;
  const records = [], at = 0x20 + b.readUInt16LE(0xe), n = b.readUInt16LE(0x10);
  for (let i = 0; i < n && at + (i + 1) * 0x38 <= b.length; i++) { const r = at + i * 0x38; records.push({ id: b.subarray(r + 0x20, r + 0x30).toString('hex'), type: b[r + 0x36] }); }
  return { titleId: b.readBigUInt64LE(0).toString(16).padStart(16, '0').toUpperCase(), version: b.readUInt32LE(8), type: b[0xc], records };
}
// NACP: the version string the game shows (0x3060) and its name (first language that has one)
function nacp(b) {
  if (!b || b.length < 0x3070) return null;
  let name = '';
  for (let l = 0; l < 16 && !name; l++) name = b.toString('utf8', l * 0x300, l * 0x300 + 0x200).replace(/\0.*$/s, '').trim();
  return { display: b.toString('utf8', 0x3060, 0x3070).replace(/\0.*$/s, '').trim(), name };
}
// Eden's FormatTitleVersion: v<byte3>.<byte2>.<byte1>
const formatVersion = (v) => `v${(v >>> 24) & 0xff}.${(v >>> 16) & 0xff}.${(v >>> 8) & 0xff}`;
const TYPES = { 0x80: 'game', 0x81: 'update', 0x82: 'dlc' };
// the game a title belongs to: updates are ID + 0x800, DLC ID + 0x1000 + n (Eden's GetBaseTitleID)
const baseOf = (id) => (BigInt('0x' + id) & ~0x1fffn).toString(16).toUpperCase().padStart(16, '0');

// Everything in one .nsp/.nsz/.xci/.xcz: [{ titleId, base, type, version, versionText, display, name }]
function read(file, keys) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const ents = entries(fd);
    const tickets = new Map();
    for (const t of ents.filter((x) => /\.tik$/i.test(x.name))) {
      const b = readAt(fd, t.offset, 0x2c0);
      // common ticket: title key block at 0x180, rights ID at 0x2a0 (signature type RSA-2048 SHA256)
      if (b.length >= 0x2b0 && b.readUInt32LE(0) === 0x10004) tickets.set(b.subarray(0x2a0, 0x2b0).toString('hex'), b.subarray(0x180, 0x190));
    }
    const ncas = ents.filter((x) => /\.nc[az]$/i.test(x.name)).map((x) => { try { return { e: x, n: openNca(fd, x, keys, tickets) }; } catch { return null; } }).filter((x) => x?.n);
    const out = [];
    for (const { n } of ncas.filter((x) => x.n.type === 1)) { // meta NCAs: one per title in the file
      let m = null; try { m = cnmt(pfsFile(n, 0, (s) => /\.cnmt$/i.test(s))); } catch {}
      out.push(m ? { titleId: m.titleId, type: TYPES[m.type] || 'other', version: m.version } : { titleId: n.titleId, type: 'unknown', version: null });
    }
    // with no readable meta (keys missing for its section), the program NCAs still name the title
    if (!out.length) for (const { n } of ncas.filter((x) => x.n.type === 0)) out.push({ titleId: n.titleId, type: /800$/.test(n.titleId) ? 'update' : 'game', version: null });
    for (const { n } of ncas.filter((x) => x.n.type === 2)) { // control NCAs: the version string and name
      let c = null; try { c = nacp(romfsFile(n, 0, 'control.nacp')); } catch {}
      const t = out.find((x) => x.titleId === n.titleId);
      if (c && t) Object.assign(t, c);
    }
    for (const t of out) { t.base = baseOf(t.titleId); if (t.version != null) t.versionText = formatVersion(t.version); }
    return out;
  } catch { return []; } finally { if (fd != null) try { fs.closeSync(fd); } catch {} }
}
// A game's files (base, update and DLC files in its folder): its ID, the highest update, its version as the game shows it
function summary(files, keys) {
  const all = files.flatMap((f) => read(f, keys));
  if (!all.length) return null;
  const game = all.find((x) => x.type === 'game') || all[0];
  const updates = all.filter((x) => x.type === 'update' && x.base === game.base).sort((a, b) => b.version - a.version);
  const top = updates[0] || game;
  return { titleId: game.base, name: game.name || top.name || '', version: top.version ?? null, versionText: top.versionText || null, display: top.display || game.display || null, update: updates[0] ? updates[0].version : null, dlc: all.filter((x) => x.type === 'dlc').length, titles: all };
}
// An update installed into Eden's (or a yuzu fork's) NAND, as Eden lists it: user/Contents/registered holds
// <NCA ID>.nca files (or folders of parts 00, 01...), meta ones named .cnmt.nca. The update's control NCA is
// read through the ticket Eden imported on install (title.keys_autogenerated).
function nandUpdate(registered, base, keys) {
  const want = (BigInt('0x' + base) | 0x800n).toString(16).toUpperCase().padStart(16, '0'), path = require('path');
  let best = null;
  for (const dir of registered) {
    const byId = new Map();
    let subs = []; try { subs = fs.readdirSync(dir); } catch { continue; }
    for (const s of subs) { let names = []; try { names = fs.readdirSync(path.join(dir, s)); } catch {} for (const n of names) if (/\.nca$/i.test(n)) byId.set(n.toLowerCase().replace(/(\.cnmt)?\.nca$/, ''), path.join(dir, s, n)); }
    const open = (f, fn) => {
      let fd; try { const p = fs.statSync(f).isDirectory() ? path.join(f, '00') : f; fd = fs.openSync(p, 'r'); return fn(fd, { offset: 0, size: fs.fstatSync(fd).size, name: path.basename(p) }); } catch { return null; } finally { if (fd != null) try { fs.closeSync(fd); } catch {} }
    };
    for (const [, f] of [...byId].filter(([, f]) => /\.cnmt\.nca$/i.test(f))) {
      const m = open(f, (fd, e) => { const n = openNca(fd, e, keys, new Map()); return n && n.type === 1 && n.titleId === want ? cnmt(pfsFile(n, 0, (x) => /\.cnmt$/i.test(x))) : null; });
      if (!m || (best && best.version >= m.version)) continue;
      const ctl = m.records.find((r) => r.type === 3), cf = ctl && byId.get(ctl.id);
      const c = cf ? open(cf, (fd, e) => { const n = openNca(fd, e, keys, new Map()); return n ? nacp(romfsFile(n, 0, 'control.nacp')) : null; }) : null;
      best = { version: m.version, versionText: formatVersion(m.version), display: c?.display || null, where: f };
    }
  }
  return best;
}
module.exports = { read, summary, nandUpdate, parseKeys, xtsDecrypt, ctrDecrypt, formatVersion, baseOf, keyAreaKey, titlekek, cnmt, nacp };
