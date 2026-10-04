// Optical sizes (0.9.21, owner: Nintendo, Sega and Dreamcast read smaller than PlayStation). The wordmarks
// all have the same height, but many carry a symbol or a second line (Switch, GameCube, Dreamcast's swirl),
// so their letters end up small. Each is scaled until its letters match the PlayStation ones, never bigger.
export const OPTICAL = { switch: 1.45, gc: 1.45, ngc: 1.45, wii: 1.3, wiiu: 1.3, n3ds: 1.15, nds: 1.2, snes: 1.2, sfc: 1.2, nes: 1.35, famicom: 1.3, n64: 1.15, gb: 1.1, gbc: 1.3, gba: 1.35, virtualboy: 1.3, dreamcast: 1.45, dc: 1.45, saturn: 1.2, genesis: 1.3, megadrive: 1.3, mastersystem: 1.25, gamegear: 1.25, segacd: 1.25, sega32x: 1.25, xbox: 1.05, xbox360: 1.1, xboxone: 1.1 };
// the factor for a logo URL from syslogo:get (its sys= key), else the console's slug
export function opticalOf(url, slug) {
  const k = decodeURIComponent((/[?&]sys=([^&]+)/.exec(url || '') || [])[1] || slug || '');
  return OPTICAL[k] || 1;
}
