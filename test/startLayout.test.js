// Start's board (0.9.21): any size, no overlaps, old layouts get a place, tiles fall up into gaps.
const test = require('node:test');
const assert = require('node:assert');

let L;
test.before(async () => { L = await import('../src/startLayout.js'); });
const overlaps = (list) => list.some((a, i) => list.some((b, j) => i < j && L.collide(a, b)));

test('old layouts (no x, y) are packed in order without overlaps', () => {
  const list = L.pack([{ id: 'a', w: 4, h: 2 }, { id: 'b', w: 2, h: 1 }, { id: 'c', w: 2, h: 1 }, { id: 'd', w: 4, h: 1 }, { id: 'e', w: 4, h: 1 }]);
  assert.deepStrictEqual(list.map((t) => [t.id, t.x, t.y]), [['a', 0, 0], ['b', 4, 0], ['c', 6, 0], ['d', 4, 1], ['e', 0, 2]]);
  assert.ok(!overlaps(list));
});

test('sizes are kept inside the board', () => {
  const [t] = L.pack([{ id: 'a', w: 12, h: 9, x: 5, y: -2 }]);
  assert.deepStrictEqual([t.x, t.y, t.w, t.h], [0, 0, L.COLS, L.MAX_H]);
});

test('a held tile keeps its place, the one it lands on moves out of the way', () => {
  const list = L.pack([{ id: 'a', w: 4, h: 1, x: 0, y: 0 }, { id: 'b', w: 4, h: 1, x: 4, y: 0 }, { id: 'c', w: 8, h: 1, x: 0, y: 1 }]);
  const a = list.find((t) => t.id === 'a'); a.x = 3;
  L.settle(list, 'a');
  assert.ok(!overlaps(list));
  assert.strictEqual(a.x, 3); assert.strictEqual(a.y, 0);
});

test('growing a tile pushes the tiles below it down, shrinking lets them back up', () => {
  const list = L.pack([{ id: 'a', w: 4, h: 1, x: 0, y: 0 }, { id: 'b', w: 4, h: 1, x: 0, y: 1 }]);
  const a = list[0], b = list[1];
  a.h = 3; L.settle(list, 'a');
  assert.strictEqual(b.y, 3);
  a.h = 1; L.settle(list, 'a');
  assert.strictEqual(b.y, 1);
});

test('a 1 by 1 square is allowed and gaps are filled from below', () => {
  const list = L.pack([{ id: 'a', w: 1, h: 1, x: 0, y: 0 }, { id: 'b', w: 1, h: 1, x: 1, y: 3 }]);
  assert.deepStrictEqual(list.map((t) => [t.w, t.h, t.y]), [[1, 1, 0], [1, 1, 0]]);
});
