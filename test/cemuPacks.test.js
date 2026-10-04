// Cemu graphic packs (0.9.24): found by title ID, switched in settings.xml only for that pack
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const C = require('../electron/cemuPacks');

test('packs for a game by title ID, sections from their path, presets, and turning one on and off', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-cemu-'));
  const w = (rel, t) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), t); };
  w('graphicPacks/downloadedGraphicPacks/BreathOfTheWild/Graphics/rules.txt', '[Definition]\ntitleIds = 00050000101C9300,00050000101C9400\nname = Graphics\npath = "The Legend of Zelda: Breath of the Wild/Graphics"\ndescription = Resolution and shadows\nversion = 7\n[Preset]\nname = 1920x1080\ncategory = Resolution\n[Preset]\nname = 2560x1440\ncategory = Resolution\n');
  w('graphicPacks/downloadedGraphicPacks/BreathOfTheWild/Mods/NoHUD/rules.txt', '[Definition]\ntitleIds = 00050000101C9400\nname = No HUD\npath = "The Legend of Zelda: Breath of the Wild/Mods/No HUD"\n');
  w('graphicPacks/downloadedGraphicPacks/Other/rules.txt', '[Definition]\ntitleIds = 0005000010101C00\nname = Other\npath = "Other Game/Graphics"\n');
  const settings = path.join(root, 'settings.xml');
  fs.writeFileSync(settings, '<?xml version="1.0" encoding="UTF-8"?>\n<content>\n    <logflag>0</logflag>\n</content>\n');
  const c = { root, settings, titleIds: ['00050000101C9400'], name: 'Zelda' };
  let l = C.list(c);
  assert.deepStrictEqual(l.map((x) => [x.name, x.section]), [['Graphics', 'Graphics'], ['No HUD', 'Mods']]);
  assert.deepStrictEqual(l[0].presets.Resolution, ['1920x1080', '2560x1440']);
  const mine = {};
  C.set(c, [{ key: l[0].key, on: true, presets: { Resolution: '2560x1440' } }], mine);
  l = C.list(c, mine);
  assert.ok(l[0].on && l[0].by === 'cartridge' && l[0].chosen.Resolution === '2560x1440');
  assert.match(fs.readFileSync(settings, 'utf8'), /<logflag>0<\/logflag>/);
  C.set(c, [{ key: l[0].key, on: false }], mine);
  assert.ok(!C.list(c, mine)[0].on);
});

test('a folder game gives its title ID from meta.xml, updates map to the game', () => {
  const g = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-wiiu-'));
  fs.mkdirSync(path.join(g, 'meta')); fs.writeFileSync(path.join(g, 'meta/meta.xml'), '<menu><title_id type="hexBinary" length="8">0005000E101C9400</title_id></menu>');
  assert.deepStrictEqual(C.titleIds(g, '/nope'), ['0005000E101C9400', '00050000101C9400']);
});
