'use strict';
// ROM hack patches (0.9.52): IPS, UPS and BPS applied in plain JavaScript, so a hack can be made into a patched copy of
// a game for emulators that don't patch on their own. RetroArch does ("soft patching": a .ips/.ups/.bps beside the game
// with the same name is applied when it loads), so for RetroArch Cartridge only places the patch and never writes a
// game file. The original game is never changed either way: apply() returns a new buffer.
// Formats: IPS (records, RLE, the 3-byte truncate extension), UPS (byup's format: XOR runs, CRC32 of source, target
// and patch), BPS (beat's format: SourceRead/TargetRead/SourceCopy/TargetCopy, CRC32s checked). A patch whose source
// checksum doesn't match says so in words: the hack needs another copy (region, revision or a headered ROM).
const zlib = require('zlib');
const crc32 = (b) => zlib.crc32(b) >>> 0;

const KIND = { ips: 'IPS', ups: 'UPS', bps: 'BPS', xdelta: 'xdelta', vcdiff: 'xdelta', ppf: 'PPF', aps: 'APS' };
const kindOf = (name, buf) => {
  if (buf?.length >= 5 && buf.toString('latin1', 0, 5) === 'PATCH') return 'ips';
  if (buf?.length >= 4 && buf.toString('latin1', 0, 4) === 'UPS1') return 'ups';
  if (buf?.length >= 4 && buf.toString('latin1', 0, 4) === 'BPS1') return 'bps';
  const e = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return e && KIND[e] ? (e === 'vcdiff' ? 'xdelta' : e) : null;
};
// what RetroArch soft-patches (libretro: content/patch.c tries .ups, .bps, .ips)
const SOFT = new Set(['ips', 'ups', 'bps']);

class PatchError extends Error { constructor(code, msg) { super(msg); this.code = code; } }

function ips(rom, patch) {
  let out = Buffer.from(rom), i = 5, size = out.length;
  const grow = (n) => { if (n > out.length) { const b = Buffer.alloc(n); out.copy(b); out = b; } };
  while (i + 3 <= patch.length) {
    const off = patch.readUIntBE(i, 3); i += 3;
    if (off === 0x454f46) { // "EOF", then an optional truncate size
      if (i + 3 <= patch.length) size = patch.readUIntBE(i, 3);
      else size = Math.max(size, out.length);
      return out.subarray(0, size);
    }
    if (i + 2 > patch.length) break;
    const n = patch.readUInt16BE(i); i += 2;
    if (n) { grow(off + n); patch.copy(out, off, i, i + n); i += n; size = Math.max(size, off + n); }
    else { const run = patch.readUInt16BE(i), v = patch[i + 2]; i += 3; grow(off + run); out.fill(v, off, off + run); size = Math.max(size, off + run); }
  }
  throw new PatchError('bad', 'This IPS patch is cut short.');
}

// the variable-length numbers UPS and BPS use
function num(b, st) { let d = 0, s = 1; for (;;) { const x = b[st.i++]; if (x === undefined) throw new PatchError('bad', 'This patch is cut short.'); d += (x & 0x7f) * s; if (x & 0x80) return d; s *= 128; d += s; } }

function ups(rom, patch) {
  if (patch.length < 16) throw new PatchError('bad', 'This UPS patch is cut short.');
  const body = patch.subarray(0, patch.length - 4);
  if (crc32(body) !== patch.readUInt32LE(patch.length - 4)) throw new PatchError('bad', 'This UPS patch is damaged.');
  const st = { i: 4 }, inSize = num(patch, st), outSize = num(patch, st);
  const inCrc = patch.readUInt32LE(patch.length - 12), outCrc = patch.readUInt32LE(patch.length - 8);
  let src = rom, want = outSize, wantCrc = outCrc;
  if (rom.length === outSize && crc32(rom) === outCrc) { want = inSize; wantCrc = inCrc; } // UPS works both ways
  else if (rom.length !== inSize || crc32(rom) !== inCrc) throw new PatchError('source', 'This hack was made for a different copy of the game (another region or revision). Its notes say which.');
  const out = Buffer.alloc(want); src.copy(out, 0, 0, Math.min(src.length, want));
  let at = 0;
  while (st.i < patch.length - 12) {
    at += num(patch, st);
    for (;;) { const x = patch[st.i++]; if (x === 0) { at++; break; } if (at < want) out[at] ^= x; at++; }
  }
  if (crc32(out) !== wantCrc) throw new PatchError('result', 'The patched game didn’t come out right. The hack may need another copy of the game.');
  return out;
}

function bps(rom, patch) {
  if (patch.length < 16) throw new PatchError('bad', 'This BPS patch is cut short.');
  if (crc32(patch.subarray(0, patch.length - 4)) !== patch.readUInt32LE(patch.length - 4)) throw new PatchError('bad', 'This BPS patch is damaged.');
  const st = { i: 4 }, inSize = num(patch, st), outSize = num(patch, st), metaLen = num(patch, st);
  st.i += metaLen;
  const inCrc = patch.readUInt32LE(patch.length - 12), outCrc = patch.readUInt32LE(patch.length - 8);
  if (rom.length !== inSize || crc32(rom) !== inCrc) throw new PatchError('source', 'This hack was made for a different copy of the game (another region or revision, or one with or without a header). Its notes say which.');
  const out = Buffer.alloc(outSize);
  let o = 0, srcRel = 0, tgtRel = 0;
  while (st.i < patch.length - 12) {
    const d = num(patch, st), cmd = d & 3, len = (d >>> 2) + 1;
    if (cmd === 0) { rom.copy(out, o, o, o + len); o += len; }
    else if (cmd === 1) { patch.copy(out, o, st.i, st.i + len); st.i += len; o += len; }
    else { const x = num(patch, st); const off = (x & 1 ? -1 : 1) * Math.floor(x / 2);
      if (cmd === 2) { srcRel += off; rom.copy(out, o, srcRel, srcRel + len); srcRel += len; o += len; }
      else { tgtRel += off; for (let k = 0; k < len; k++) out[o++] = out[tgtRel++]; } }
  }
  if (crc32(out) !== outCrc) throw new PatchError('result', 'The patched game didn’t come out right. The hack may need another copy of the game.');
  return out;
}

// apply(rom, patch, name) -> Buffer; throws PatchError with a plain message
function apply(rom, patch, name = '') {
  const k = kindOf(name, patch);
  if (k === 'ips') return ips(rom, patch);
  if (k === 'ups') return ups(rom, patch);
  if (k === 'bps') return bps(rom, patch);
  throw new PatchError('format', k ? `${KIND[k]} patches need a separate tool; Cartridge applies IPS, UPS and BPS.` : 'This file isn’t a patch Cartridge knows (IPS, UPS or BPS).');
}

// RetroArch's soft-patch name for a game file: the patch beside it with the game's name
const softName = (gameFile, kind) => gameFile.replace(/\.[^./]+$/, '') + '.' + kind;

module.exports = { apply, kindOf, SOFT, KIND, softName, PatchError, crc32, _ips: ips, _ups: ups, _bps: bps };
