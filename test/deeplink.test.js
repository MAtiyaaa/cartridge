// Fuse bridge links (docs/FUSE_BRIDGE.md): cartridge://<route> parses to { route, params, from } or null
const test = require('node:test');
const assert = require('node:assert');

const load = () => import('../src/android/deeplink.js');

test('top tabs and sync', async () => {
  const { parseDeepLink } = await load();
  for (const r of ['home', 'library', 'downloads', 'consoles', 'settings', 'sync']) {
    assert.deepStrictEqual(parseDeepLink(`cartridge://${r}`), { route: r, params: {}, from: null });
  }
  assert.deepStrictEqual(parseDeepLink('cartridge://home/'), { route: 'home', params: {}, from: null });
  assert.strictEqual(parseDeepLink('cartridge://home/extra'), null);
});

test('game, platform and bios', async () => {
  const { parseDeepLink } = await load();
  assert.deepStrictEqual(parseDeepLink('cartridge://game/1234'), { route: 'game', params: { romId: 1234 }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://platform/snes'), { route: 'platform', params: { slug: 'snes' }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://platform/genesis-slash-megadrive'), { route: 'platform', params: { slug: 'genesis-slash-megadrive' }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://bios/PS2'), { route: 'bios', params: { slug: 'ps2' }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://platform/Nintendo%2064'), { route: 'platform', params: { slug: 'nintendo 64' }, from: null });
});

test('routes, slugs and parameter names are case-insensitive', async () => {
  const { parseDeepLink } = await load();
  assert.deepStrictEqual(parseDeepLink('CARTRIDGE://Downloads?FROM=Fuse'), { route: 'downloads', params: {}, from: 'fuse' });
  assert.deepStrictEqual(parseDeepLink('Cartridge://PLATFORM/SNES?v=1'), { route: 'platform', params: { slug: 'snes' }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://Game/7'), { route: 'game', params: { romId: 7 }, from: null });
});

test('search takes url-encoded text and an optional console', async () => {
  const { parseDeepLink } = await load();
  assert.deepStrictEqual(parseDeepLink('cartridge://search?q=Zelda%3A%20Link%27s%20Awakening'), { route: 'search', params: { q: "Zelda: Link's Awakening" }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://search?q=mario+kart&platform=N64&from=fuse&v=1'), { route: 'search', params: { q: 'mario kart', platform: 'n64' }, from: 'fuse' });
  assert.deepStrictEqual(parseDeepLink('cartridge://search?q=a%2Bb'), { route: 'search', params: { q: 'a+b' }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://search?q=%C3%89t%C3%A9'), { route: 'search', params: { q: 'Été' }, from: null });
  assert.deepStrictEqual(parseDeepLink('cartridge://search'), { route: 'search', params: { q: '' }, from: null });
  assert.strictEqual(parseDeepLink(`cartridge://search?q=${'x'.repeat(500)}`).params.q.length, 200);
  assert.strictEqual(parseDeepLink('cartridge://search/more'), null);
});

test('from=fuse is detected, other callers are named, junk is dropped', async () => {
  const { parseDeepLink } = await load();
  assert.strictEqual(parseDeepLink('cartridge://library?from=fuse&v=1').from, 'fuse');
  assert.strictEqual(parseDeepLink('cartridge://library?v=1&from=FUSE').from, 'fuse');
  assert.strictEqual(parseDeepLink('cartridge://library').from, null);
  assert.strictEqual(parseDeepLink('cartridge://library?from=other-app').from, 'other-app');
  assert.strictEqual(parseDeepLink('cartridge://library?from=%3Cscript%3E').from, null);
  assert.strictEqual(parseDeepLink('cartridge://library#top').route, 'library');
});

test('upload: from Fuse, with the request file on the desktop or nothing on Android', async () => {
  const { parseDeepLink } = await load();
  assert.deepStrictEqual(parseDeepLink('cartridge://upload?from=fuse&v=3'), { route: 'upload', params: {}, from: 'fuse' });
  assert.deepStrictEqual(parseDeepLink('cartridge://upload?request=%2Fhome%2Fa%2F.cache%2Ffuse%2Fup-1.json&from=fuse&v=3'),
    { route: 'upload', params: { request: '/home/a/.cache/fuse/up-1.json' }, from: 'fuse' });
  for (const bad of ['cartridge://upload/x', 'cartridge://upload?request=relative.json', 'cartridge://upload?request=%2Ftmp%2Fa.txt',
    'cartridge://upload?request=%2Ftmp%2F..%2Fetc%2Fa.json', 'cartridge://upload?request=%2Ftmp%2Fa%0A.json']) assert.strictEqual(parseDeepLink(bad), null, bad);
});

test('anything else is null', async () => {
  const { parseDeepLink } = await load();
  const bad = [
    undefined, null, 42, '', 'home', 'cartridge:home', 'cartridge:/home', 'cartridge://', 'cartridge:///home',
    'https://home', 'http://cartridge/home', 'intent://home#Intent;scheme=cartridge;end', 'cartridges://home',
    'cartridge://unknown', 'cartridge://game', 'cartridge://game/', 'cartridge://game/0', 'cartridge://game/-1',
    'cartridge://game/12.5', 'cartridge://game/abc', 'cartridge://game/1/2', 'cartridge://game/1234567890123',
    'cartridge://platform', 'cartridge://platform/a/b', 'cartridge://platform//snes', 'cartridge://bios/',
    'cartridge://platform/%2F', 'cartridge://platform/' + 'x'.repeat(65), 'cartridge://search?q=%E0%A4%A',
    'cartridge://platform/%00', 'cartridge://' + 'a'.repeat(2100),
  ];
  for (const u of bad) assert.strictEqual(parseDeepLink(u), null, String(u));
});

test('platform slugs find RomM platforms by slug, fs_slug or the same console', async () => {
  const { findPlatform } = await load();
  const { consoleKey } = await import('../src/android/emulators.js');
  const list = [
    { id: 1, slug: 'snes', fs_slug: 'snes', rom_count: 10 },
    { id: 2, slug: 'genesis-slash-megadrive', fs_slug: 'megadrive', rom_count: 5 },
    { id: 3, slug: 'ngc', fs_slug: 'GC', rom_count: 0 },
    { id: 4, slug: 'ngc', fs_slug: 'gamecube', rom_count: 3 },
  ];
  assert.strictEqual(findPlatform(list, 'SNES')?.id, 1);
  assert.strictEqual(findPlatform(list, 'megadrive')?.id, 2);
  assert.strictEqual(findPlatform(list, 'gc')?.id, 3); // fs_slug, any case
  assert.strictEqual(findPlatform(list, 'md'), null); // no aliases without keyOf
  assert.strictEqual(findPlatform(list, 'genesis', consoleKey)?.id, 2);
  assert.strictEqual(findPlatform(list, 'SegaMegaDrive', consoleKey)?.id, 2);
  assert.strictEqual(findPlatform(list, 'md', consoleKey)?.id, 2); // Cartridge's own console key
  assert.strictEqual(findPlatform(list.filter((p) => p.id !== 3), 'gc', consoleKey)?.id, 4);
  assert.strictEqual(findPlatform(list, 'psp', consoleKey), null);
  assert.strictEqual(findPlatform(null, 'snes'), null);
  assert.strictEqual(findPlatform(list, ''), null);
});
