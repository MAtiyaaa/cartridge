// Start's board (0.9.21): tiles on an 8-column grid, never overlapping. No imports, so test/ can load it.
export const COLS = 8, MAX_H = 4;
const int = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
export const collide = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// tiles saved before 0.9.21 have no place: put each at the first free spot, in their old order
export function pack(list) {
  const placed = [];
  for (const t0 of list) {
    const t = { ...t0, w: int(t0.w, 1, COLS), h: int(t0.h, 1, MAX_H) };
    if (Number.isFinite(t0.x) && Number.isFinite(t0.y)) { t.x = int(t0.x, 0, COLS - t.w); t.y = int(t0.y, 0, 999); placed.push(t); continue; }
    spot: for (let y = 0; ; y++) for (let x = 0; x + t.w <= COLS; x++) { t.x = x; t.y = y; if (!placed.some((p) => collide(p, t))) break spot; }
    placed.push(t);
  }
  return settle(placed);
}

// No overlaps: the tile being moved or resized (fixed) keeps its place, the others are pushed below
// whatever they hit, then everything falls up as far as it can (fixed stays put while it's held).
export function settle(list, fixedId = null) {
  const fixed = list.find((t) => t.id === fixedId) || null;
  if (fixed) { fixed.w = int(fixed.w, 1, COLS); fixed.h = int(fixed.h, 1, MAX_H); fixed.x = int(fixed.x, 0, COLS - fixed.w); fixed.y = Math.max(0, fixed.y); }
  const rest = list.filter((t) => t !== fixed).sort((a, b) => a.y - b.y || a.x - b.x);
  const placed = fixed ? [fixed] : [];
  for (const t of rest) {
    t.w = int(t.w, 1, COLS); t.h = int(t.h, 1, MAX_H); t.x = int(t.x, 0, COLS - t.w); t.y = Math.max(0, Math.round(t.y) || 0);
    while (placed.some((p) => collide(p, t))) t.y++;
    placed.push(t);
  }
  for (const t of [...placed].sort((a, b) => a.y - b.y || a.x - b.x)) {
    if (t === fixed) continue;
    while (t.y > 0) { t.y--; if (placed.some((p) => p !== t && collide(p, t))) { t.y++; break; } }
  }
  return list;
}
export const bottom = (list) => list.reduce((m, t) => Math.max(m, t.y + t.h), 0);
