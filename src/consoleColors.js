// Each console's own colours: [main, accent]. Used as a tinted glass gradient on console tiles,
// so tiles feel like the hardware while staying dark enough to match the rest of Cartridge.
const C = {
  nes: ['#c4282d', '#7d7d80'], famicom: ['#b3202b', '#d9b36a'],
  snes: ['#5b4dbf', '#a8a3c9'], sfam: ['#5b4dbf', '#e0463c'],
  n64: ['#1f4fb5', '#e4000f'],
  gb: ['#7d8b2a', '#3c4a15'], gbc: ['#6a2cbd', '#e6b800'], gba: ['#4b3f9e', '#8f86d6'],
  nds: ['#2f6fb5', '#9aa3ad'], '3ds': ['#c8102e', '#1aa3a3'], n3ds: ['#c8102e', '#1aa3a3'],
  ngc: ['#5b4ca8', '#2d2566'], gc: ['#5b4ca8', '#2d2566'],
  wii: ['#00a6d6', '#8fd6ec'], wiiu: ['#009ac7', '#1d2a33'],
  switch: ['#e60012', '#00b2d6'],
  psx: ['#6f7480', '#d0342c'], ps2: ['#1b2a8a', '#0b1245'], ps3: ['#3a3f47', '#0d0f12'],
  ps4: ['#003791', '#0b1a3d'], ps5: ['#0070d1', '#dfe6ee'],
  psp: ['#2b2f38', '#5a6270'], psvita: ['#0b5fa5', '#1a1d24'],
  dc: ['#f36f21', '#1f5aa6'], dreamcast: ['#f36f21', '#1f5aa6'],
  saturn: ['#2e3192', '#111'], 'genesis-slash-megadrive': ['#1a1a1a', '#e60012'], genesis: ['#1a1a1a', '#e60012'], megadrive: ['#1a1a1a', '#e60012'],
  sms: ['#e60012', '#222'], gamegear: ['#2a2a2a', '#1f5aa6'], segacd: ['#1a1a1a', '#e60012'],
  xbox: ['#107c10', '#1a1a1a'], xbox360: ['#5dc21e', '#9aa3ad'], xboxone: ['#107c10', '#222'],
  atari2600: ['#8a5a2b', '#1a1a1a'], neogeo: ['#b8860b', '#1a1a1a'], arcade: ['#d4145a', '#fbb03b'],
  'pc-engine': ['#e0e0e0', '#e60012'], pcengine: ['#d0d0d0', '#e60012'], tg16: ['#f39800', '#222'],
};
export function consoleColors(p) {
  return C[p?.slug] || C[p?.fs_slug] || null;
}
