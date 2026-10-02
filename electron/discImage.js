// Disc images read as plain 2048-byte sectors (0.9.17, owner: "anything that can't be read, make it
// readable"), so the ISO code (patches.isoFile, ps2IsoInfo, psxSerial) and the game ID readers work on
// compressed images too. open(file) -> { read(pos, len), close() } or null. Each format from its source:
// - plain ISO/GCM; raw CD .bin (2352-byte sectors, user data after 16 or 24 bytes); .cue reads its .bin
// - CHD v5 (MAME chd.cpp / libchdr): compressed map (Huffman + RLE), hunks in zlib, LZMA, zstd and the
//   CD variants cdzl, cdlz, cdzs (sector data then subcode, 2448-byte frames). FLAC and Huffman hunks
//   (audio, rare for data) aren't read.
// - CSO/ZSO (PSP, PS2): block index, raw deflate (CSO) or LZ4 (ZSO) blocks
// - GCZ (Dolphin): zlib blocks, a pointer's top bit marks a stored block
// - PBP (PS1 on PSP): not a disc; its PARAM.SFO DISC_ID is read instead (pbpDiscId)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------------------------------------------------------- LZMA (raw LZMA1, as CHD stores it)
// The decoder from the LZMA specification (lzma-specification.txt); the output buffer is the window.
function lzmaDecode(src, outSize, lc = 3, lp = 0, pb = 2) {
  const out = Buffer.alloc(outSize);
  let range = 0xffffffff, code = 0, ip = 1, op = 0;
  for (let i = 0; i < 4; i++) code = ((code << 8) | src[ip++]) >>> 0;
  const norm = () => { if (range < 0x1000000) { range = (range << 8) >>> 0; code = ((code << 8) | (src[ip++] || 0)) >>> 0; } };
  const bit = (p, i) => {
    const v = p[i], bound = (range >>> 11) * v;
    let b;
    if (code < bound) { range = bound >>> 0; p[i] = v + ((2048 - v) >>> 5); b = 0; } else { range = (range - bound) >>> 0; code = (code - bound) >>> 0; p[i] = v - (v >>> 5); b = 1; }
    norm(); return b;
  };
  const direct = (n) => { let r = 0; for (; n > 0; n--) { range >>>= 1; let b = 0; if (code >= range) { code = (code - range) >>> 0; b = 1; } r = r * 2 + b; norm(); } return r; };
  const tree = (p, base, n) => { let m = 1; for (let i = 0; i < n; i++) m = (m << 1) + bit(p, base + m); return m - (1 << n); };
  const rtree = (p, base, n) => { let m = 1, s = 0; for (let i = 0; i < n; i++) { const b = bit(p, base + m); m = (m << 1) + b; s |= b << i; } return s; };
  const P = (n) => new Uint16Array(n).fill(1024);
  const lit = P(0x300 << (lc + lp)), isMatch = P(192), isRep = P(12), g0 = P(12), g1 = P(12), g2 = P(12), rep0Long = P(192);
  const posSlot = P(256), posDec = P(115), align = P(16);
  const lenCoder = () => ({ c: P(2), low: P(16 << 3), mid: P(16 << 3), high: P(256) });
  const lenD = lenCoder(), repD = lenCoder();
  const len = (L, ps) => (!bit(L.c, 0) ? tree(L.low, ps << 3, 3) : !bit(L.c, 1) ? 8 + tree(L.mid, ps << 3, 3) : 16 + tree(L.high, 0, 8));
  let state = 0, r0 = 0, r1 = 0, r2 = 0, r3 = 0;
  const pm = (1 << pb) - 1, lpm = (1 << lp) - 1;
  while (op < outSize) {
    const ps = op & pm;
    if (!bit(isMatch, (state << 4) + ps)) {
      const prev = op ? out[op - 1] : 0, base = 0x300 * (((op & lpm) << lc) + (prev >> (8 - lc)));
      let s = 1;
      if (state >= 7) {
        let mb = out[op - r0 - 1];
        do { const m = (mb >> 7) & 1; mb <<= 1; const b = bit(lit, base + ((1 + m) << 8) + s); s = (s << 1) | b; if (m !== b) break; } while (s < 0x100);
      }
      while (s < 0x100) s = (s << 1) | bit(lit, base + s);
      out[op++] = s - 0x100;
      state = state < 4 ? 0 : state < 10 ? state - 3 : state - 6;
      continue;
    }
    let n;
    if (bit(isRep, state)) {
      if (!bit(g0, state)) {
        if (!bit(rep0Long, (state << 4) + ps)) { state = state < 7 ? 9 : 11; out[op] = out[op - r0 - 1]; op++; continue; }
      } else {
        let d;
        if (!bit(g1, state)) d = r1; else { if (!bit(g2, state)) d = r2; else { d = r3; r3 = r2; } r2 = r1; }
        r1 = r0; r0 = d;
      }
      n = len(repD, ps); state = state < 7 ? 8 : 11;
    } else {
      r3 = r2; r2 = r1; r1 = r0;
      n = len(lenD, ps); state = state < 7 ? 7 : 10;
      const slot = tree(posSlot, Math.min(n, 3) << 6, 6);
      if (slot < 4) r0 = slot;
      else {
        const nd = (slot >> 1) - 1;
        let d = (2 | (slot & 1)) * 2 ** nd;
        if (slot < 14) d += rtree(posDec, d - slot, nd);
        else d += direct(nd - 4) * 16 + rtree(align, 0, 4);
        r0 = d;
      }
      if (r0 === 0xffffffff) break; // end marker
    }
    n += 2;
    if (r0 >= op) throw new Error('lzma: bad distance');
    for (; n > 0 && op < outSize; n--, op++) out[op] = out[op - r0 - 1];
  }
  return out;
}

// ---------------------------------------------------------------- LZ4 block (ZSO)
function lz4Block(src, outSize) {
  const out = Buffer.alloc(outSize);
  let i = 0, o = 0;
  while (i < src.length && o < outSize) {
    const tok = src[i++];
    let l = tok >> 4;
    if (l === 15) { let b; do { b = src[i++]; l += b; } while (b === 255); }
    src.copy(out, o, i, i + l); i += l; o += l;
    if (i >= src.length || o >= outSize) break;
    const off = src[i] | (src[i + 1] << 8); i += 2;
    let m = tok & 15;
    if (m === 15) { let b; do { b = src[i++]; m += b; } while (b === 255); }
    m += 4;
    for (; m > 0 && o < outSize; m--, o++) out[o] = out[o - off];
  }
  return out;
}

// ---------------------------------------------------------------- CHD v5
const tag = (n) => Buffer.from(n, 'latin1').readUInt32BE(0);
const CODEC = { zlib: tag('zlib'), lzma: tag('lzma'), zstd: tag('zstd'), cdzl: tag('cdzl'), cdlz: tag('cdlz'), cdzs: tag('cdzs') };
const FRAME = 2448, SECTOR = 2352;
// MSB-first bit reader over a buffer (zeros past the end, as libchdr's bitstream)
function bits(buf) {
  let pos = 0;
  return {
    read(n) { let v = 0; for (let i = 0; i < n; i++, pos++) v = v * 2 + ((buf[pos >> 3] >> (7 - (pos & 7))) & 1 || 0); return v; },
    peek(n) { const p = pos; const v = this.read(n); pos = p; return v; },
    skip(n) { pos += n; },
  };
}
// Huffman decoder for the map: 16 codes, up to 8 bits, tree stored RLE (libchdr huffman.c)
function huffman(bs, numCodes = 16, maxBits = 8) {
  const nb = maxBits >= 16 ? 5 : maxBits >= 8 ? 4 : 3;
  const len = new Array(numCodes).fill(0);
  for (let c = 0; c < numCodes;) {
    let b = bs.read(nb);
    if (b !== 1) len[c++] = b;
    else {
      b = bs.read(nb);
      if (b === 1) len[c++] = b;
      else { let rep = bs.read(nb) + 3; if (rep + c > numCodes) throw new Error('chd: bad map tree'); while (rep--) len[c++] = b; }
    }
  }
  const histo = new Array(33).fill(0);
  for (const l of len) histo[l]++;
  let start = 0;
  for (let l = 32; l > 0; l--) { const next = (start + histo[l]) >> 1; histo[l] = start; start = next; }
  const table = new Array(1 << maxBits);
  len.forEach((l, sym) => { if (!l) return; const code = histo[l]++, shift = maxBits - l; for (let k = 0; k < 1 << shift; k++) table[(code << shift) | k] = [sym, l]; });
  return () => { const e = table[bs.peek(maxBits)]; if (!e) throw new Error('chd: bad map code'); bs.skip(e[1]); return e[0]; };
}
function chdOpen(fd, size) {
  const h = Buffer.alloc(124); fs.readSync(fd, h, 0, 124, 0);
  if (h.toString('latin1', 0, 8) !== 'MComprHD' || h.readUInt32BE(12) !== 5) return null;
  const comp = [0, 1, 2, 3].map((i) => h.readUInt32BE(16 + i * 4));
  const logical = Number(h.readBigUInt64BE(32)), mapOff = Number(h.readBigUInt64BE(40)), metaOff = Number(h.readBigUInt64BE(48));
  const hunk = h.readUInt32BE(56), unit = h.readUInt32BE(60);
  const hunks = Math.ceil(logical / hunk);
  const map = []; // [type, length, offset]
  if (!comp[0]) {
    const raw = Buffer.alloc(hunks * 4); fs.readSync(fd, raw, 0, raw.length, mapOff);
    for (let i = 0; i < hunks; i++) map.push([4, hunk, raw.readUInt32BE(i * 4) * hunk]);
  } else {
    const mh = Buffer.alloc(16); fs.readSync(fd, mh, 0, 16, mapOff);
    const mapBytes = mh.readUInt32BE(0), first = mh.readUIntBE(4, 6), lenBits = mh[12], selfBits = mh[13], parentBits = mh[14];
    if (mapBytes > size) return null;
    const cm = Buffer.alloc(mapBytes); fs.readSync(fd, cm, 0, mapBytes, mapOff + 16);
    const bs = bits(cm), dec = huffman(bs);
    const types = [];
    let last = 0, rep = 0;
    for (let i = 0; i < hunks; i++) {
      if (rep > 0) { types.push(last); rep--; continue; }
      const v = dec();
      if (v === 7) { types.push(last); rep = 2 + dec(); } else if (v === 8) { types.push(last); rep = 2 + 16 + (dec() << 4); rep += dec(); } else { types.push(v); last = v; }
    }
    let cur = first, lastSelf = 0;
    for (let i = 0; i < hunks; i++) {
      let t = types[i], length = 0, off = cur;
      if (t <= 3) { length = bs.read(lenBits); cur += length; bs.read(16); }
      else if (t === 4) { length = hunk; cur += length; bs.read(16); }
      else if (t === 5) { off = lastSelf = bs.read(selfBits); }
      else if (t === 6) { off = bs.read(parentBits); }
      else if (t === 9 || t === 10) { if (t === 10) lastSelf++; t = 5; off = lastSelf; }
      else { t = 6; } // parent references: a parent CHD isn't read
      map.push([t, length, off]);
    }
  }
  // a CD image: track metadata ("CHT2"/"CHTR") exists, and hunks hold 2448-byte frames
  const meta = Buffer.alloc(4); try { fs.readSync(fd, meta, 0, 4, metaOff); } catch {}
  const cd = /^CHT[R2]|^CHCD/.test(meta.toString('latin1')) || unit === FRAME;
  const cache = new Map();
  const decode = (codec, src, outLen) => {
    if (codec === CODEC.zlib) return zlib.inflateRawSync(src);
    if (codec === CODEC.lzma) return lzmaDecode(src, outLen);
    if (codec === CODEC.zstd) return zlib.zstdDecompressSync(src);
    return null;
  };
  // CD codecs: [ecc bitmap][compressed length of the sector part][sectors][subcode]
  const cdDecode = (codec, src) => {
    const frames = hunk / FRAME, cl = hunk < 65536 ? 2 : 3, ecc = (frames + 7) >> 3, hb = ecc + cl;
    const base = src.readUIntBE(ecc, cl);
    const inner = codec === CODEC.cdlz ? CODEC.lzma : codec === CODEC.cdzl ? CODEC.zlib : CODEC.zstd;
    const sectors = decode(inner, src.subarray(hb, hb + base), frames * SECTOR);
    const out = Buffer.alloc(hunk);
    for (let f = 0; f < frames; f++) sectors.copy(out, f * FRAME, f * SECTOR, (f + 1) * SECTOR);
    return out; // subcode isn't needed for reading files
  };
  const hunkData = (i, depth = 0) => {
    if (cache.has(i)) return cache.get(i);
    const [t, length, off] = map[i] || [];
    let data;
    if (t === 4) { data = Buffer.alloc(hunk); fs.readSync(fd, data, 0, hunk, off); }
    else if (t === 5 && depth < 4) data = hunkData(off, depth + 1);
    else if (t <= 3) {
      const src = Buffer.alloc(length); fs.readSync(fd, src, 0, length, off);
      const codec = comp[t];
      data = [CODEC.cdzl, CODEC.cdlz, CODEC.cdzs].includes(codec) ? cdDecode(codec, src) : decode(codec, src, hunk);
    }
    if (!data) throw new Error('chd: hunk can’t be read (FLAC, Huffman or a parent CHD)');
    if (cache.size > 8) cache.delete(cache.keys().next().value);
    cache.set(i, data);
    return data;
  };
  const bytes = (pos, len) => { // logical bytes
    const out = Buffer.alloc(len);
    for (let o = 0; o < len;) { const i = Math.floor((pos + o) / hunk), at = (pos + o) % hunk, n = Math.min(hunk - at, len - o); hunkData(i).copy(out, o, at, at + n); o += n; }
    return out;
  };
  if (!cd) return { read: bytes };
  // CD: frame n is 2448 bytes; its user data starts after the header (mode 1: 16, mode 2: 24)
  return { cd: true, read: sectorsAsIso((lba) => { const f = bytes(lba * FRAME, SECTOR); return f.subarray(f[15] === 1 ? 16 : 24, (f[15] === 1 ? 16 : 24) + 2048); }) };
}
// a 2048-byte ISO view over a sector reader
function sectorsAsIso(sector) {
  return (pos, len) => {
    const out = Buffer.alloc(len);
    for (let o = 0; o < len;) { const lba = Math.floor((pos + o) / 2048), at = (pos + o) % 2048, n = Math.min(2048 - at, len - o); sector(lba).copy(out, o, at, at + n); o += n; }
    return out;
  };
}

// ---------------------------------------------------------------- open
function open(file) {
  if (/\.cue$/i.test(file)) {
    let t = ''; try { t = fs.readFileSync(file, 'utf8'); } catch { return null; }
    const m = /FILE\s+"([^"]+)"/i.exec(t) || /FILE\s+(\S+)/i.exec(t);
    return m ? open(path.join(path.dirname(file), m[1])) : null;
  }
  let fd; try { fd = fs.openSync(file, 'r'); } catch { return null; }
  const close = () => { try { fs.closeSync(fd); } catch {} };
  try {
    const size = fs.fstatSync(fd).size;
    const raw = (pos, len) => { const b = Buffer.alloc(len); fs.readSync(fd, b, 0, len, pos); return b; };
    const head = raw(0, 32), magic = head.toString('latin1', 0, 4);
    let read = null;
    if (head.toString('latin1', 0, 8) === 'MComprHD') read = chdOpen(fd, size)?.read;
    else if ((magic === 'CISO' || magic === 'ZISO') && /\.(cso|zso)$/i.test(file)) {
      const total = Number(head.readBigUInt64LE(8)), bsz = head.readUInt32LE(16), align = head[21], n = Math.ceil(total / bsz);
      const idx = raw(head.readUInt32LE(4) || 0x18, (n + 1) * 4), lz4 = magic === 'ZISO';
      const block = (i) => {
        const a = idx.readUInt32LE(i * 4), b = idx.readUInt32LE((i + 1) * 4);
        const pos = (a & 0x7fffffff) * 2 ** align, end = (b & 0x7fffffff) * 2 ** align;
        const src = raw(pos, end - pos);
        if (a & 0x80000000) return src.subarray(0, bsz);
        return lz4 ? lz4Block(src, bsz) : zlib.inflateRawSync(src);
      };
      read = (pos, len) => { const out = Buffer.alloc(len); for (let o = 0; o < len;) { const i = Math.floor((pos + o) / bsz), at = (pos + o) % bsz, k = Math.min(bsz - at, len - o); block(i).copy(out, o, at, at + k); o += k; } return out; };
    } else if (head.readUInt32LE(0) === 0xb10bc001) { // GCZ
      const bsz = head.readUInt32LE(24), n = head.readUInt32LE(28), ptrs = raw(32, n * 8), dataAt = 32 + n * 8 + n * 4;
      const block = (i) => {
        const p = ptrs.readBigUInt64LE(i * 8), stored = !!(p >> 63n), off = Number(p & ~(1n << 63n));
        const next = i + 1 < n ? Number(ptrs.readBigUInt64LE((i + 1) * 8) & ~(1n << 63n)) : Number(head.readBigUInt64LE(8));
        const src = raw(dataAt + off, next - off);
        return stored ? src : zlib.inflateSync(src);
      };
      read = (pos, len) => { const out = Buffer.alloc(len); for (let o = 0; o < len;) { const i = Math.floor((pos + o) / bsz), at = (pos + o) % bsz, k = Math.min(bsz - at, len - o); block(i).copy(out, o, at, at + k); o += k; } return out; };
    } else if (head[0] === 0 && head.subarray(1, 11).every((x) => x === 0xff) && head[11] === 0) { // raw CD
      read = sectorsAsIso((lba) => { const f = raw(lba * SECTOR, SECTOR); const o = f[15] === 1 ? 16 : 24; return f.subarray(o, o + 2048); });
    } else read = (pos, len) => raw(pos, len);
    if (!read) { close(); return null; }
    return { read, close };
  } catch { close(); return null; }
}
// PBP: the PARAM.SFO inside it (first offset in the header) holds DISC_ID ("SLUS00594")
function pbpDiscId(file) {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const h = Buffer.alloc(0x28); fs.readSync(fd, h, 0, 0x28, 0);
      if (h.readUInt32BE(0) !== 0x00504250) return null;
      const a = h.readUInt32LE(8), b = h.readUInt32LE(12);
      if (b <= a || b - a > 1 << 16) return null;
      const sfo = Buffer.alloc(b - a); fs.readSync(fd, sfo, 0, sfo.length, a);
      return require('./patches').parseSfo(sfo).DISC_ID || null;
    } finally { fs.closeSync(fd); }
  } catch { return null; }
}

module.exports = { open, lzmaDecode, lz4Block, pbpDiscId };
