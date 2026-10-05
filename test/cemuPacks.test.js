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

test('community graphic packs are fetched like Cemu does: newest release into downloadedGraphicPacks, version.txt (0.9.29)', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const C = require('../electron/cemuPacks');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cemu-'));
  let asked = 0;
  const fetchImpl = async (url) => { asked++; return /api\.github/.test(url) ? { ok: true, json: async () => ({ name: 'Graphic Packs 1234', assets: [{ browser_download_url: 'https://x/packs.zip' }] }) } : { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; };
  const unzip = async (zip, dir) => { fs.mkdirSync(path.join(dir, 'BreathOfTheWild/Graphics'), { recursive: true }); fs.writeFileSync(path.join(dir, 'BreathOfTheWild/Graphics/rules.txt'), '[Definition]\ntitleIds = 00050000101C9400\nname = Resolution\npath = "The Legend of Zelda Breath of the Wild/Graphics/Resolution"\n'); };
  fs.mkdirSync(path.join(root, 'graphicPacks/downloadedGraphicPacks/old'), { recursive: true });
  const r = await C.downloadCommunity(root, { fetchImpl, unzip });
  assert.deepStrictEqual(r, { updated: true, version: 'Graphic Packs 1234' });
  assert.strictEqual(fs.readFileSync(path.join(root, 'graphicPacks/downloadedGraphicPacks/version.txt'), 'utf8'), 'Graphic Packs 1234');
  assert.ok(!fs.existsSync(path.join(root, 'graphicPacks/downloadedGraphicPacks/old'))); // replaced, as Cemu does
  assert.deepStrictEqual(await C.downloadCommunity(root, { fetchImpl, unzip }), { updated: false, version: 'Graphic Packs 1234' }); // checked weekly
  assert.strictEqual(asked, 2);
  // found for the game by title ID, or by name when the ID can't be read
  fs.writeFileSync(path.join(root, 'settings.xml'), '<content></content>');
  assert.strictEqual(C.list({ root, settings: path.join(root, 'settings.xml'), titleIds: ['00050000101C9400'] }).length, 1);
  assert.strictEqual(C.list({ root, settings: path.join(root, 'settings.xml'), titleIds: [], name: 'Mario Kart 8 (USA)' }).length, 0);
  assert.strictEqual(C.list({ root, settings: path.join(root, 'settings.xml'), titleIds: [], name: 'The Legend of Zelda: Breath of the Wild (USA)' }).length, 1);
  fs.rmSync(root, { recursive: true, force: true });
});

// 0.9.32 (owner: Wind Waker's Cheats, Workarounds and Mods missing; packs only half downloaded)
test('Cheats are their own group, and GitHub\'s release page is used when its API refuses', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const C = require('../electron/cemuPacks');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cemu-'));
  const put = (rel, t) => { const f = path.join(root, 'graphicPacks', rel, 'rules.txt'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };
  put('MegaCheats', '[Definition]\ntitleIds = 0005000010143500\nname = Cheats\npath = "The Legend of Zelda: The Wind Waker HD/Cheats/Mega Cheats"\n[Preset]\ncategory = Moon Jump (Hold L3)\nname = Off\n[Preset]\ncategory = Moon Jump (Hold L3)\nname = On\n[Preset]\ncategory = Sail Speed Boost (Hold A)\nname = Normal\n[Preset]\ncategory = Sail Speed Boost (Hold A)\nname = 2x\n');
  put('WindWakerHD_PictoBox', '[Definition]\ntitleIds = 0005000010143500\nname = Picto-Box Fix\npath = "The Legend of Zelda: The Wind Waker HD/Workarounds/Picto-Box Fix"\n');
  fs.writeFileSync(path.join(root, 'settings.xml'), '<content></content>');
  const l = C.list({ root, settings: path.join(root, 'settings.xml'), titleIds: ['0005000010143500'] });
  assert.deepStrictEqual(l.map((x) => [x.section, x.name]), [['Cheats', 'Cheats'], ['Workarounds', 'Picto-Box Fix']]);
  assert.deepStrictEqual(Object.keys(l[0].presets), ['Moon Jump (Hold L3)', 'Sail Speed Boost (Hold A)']);
  const fetchImpl = async (url) => (/api\.github/.test(url) ? { ok: false, status: 403 } : { ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
  const release = async () => ({ tag: 'Github999', assets: [{ name: 'graphicPacks999.zip', url: 'https://github.com/x/graphicPacks999.zip' }] });
  const r = await C.downloadCommunity(root, { fetchImpl, unzip: async () => {}, release, force: true });
  assert.deepStrictEqual(r, { updated: true, version: 'Github999' });
  fs.rmSync(root, { recursive: true, force: true });
});
