// CEE, the Cartridge Emulator Engine (0.9.49): the rules every emulator and console must meet.
const test = require('node:test');
const assert = require('node:assert');
const C = require('../electron/cee');
const E = require('../electron/emulators');

test('nothing is offered to download that Cartridge can’t launch', () => {
  for (const e of C.emulators()) if (e.get && e.id !== 'retroarch') assert.ok(e.launch, `${e.id} is in Get Emulators but has no launch line`);
});
test('every console RomM can send has a way to play, or a written reason', () => {
  for (const c of C.coverage()) assert.ok(c.playable || c.why, `${c.key}: no emulator, no RetroArch core and no reason`);
});
test('every emulator has its website and download page', () => {
  for (const e of C.emulators()) {
    assert.ok(e.links, `${e.id} has no links`);
    for (const u of [e.links.site, e.links.downloads]) assert.match(u, /^https?:\/\/[^\s]+$/, `${e.id}: ${u}`);
  }
});
test('every emulator that launches knows how for each way it can be installed', () => {
  for (const id of Object.keys(E.EMU)) {
    const e = C.emulator(id);
    assert.ok(e.kinds.length, `${id} can't be found any way`);
    for (const k of e.kinds) assert.ok(e.launch.by[k], `${id} has no launch line when installed as ${k}`);
    assert.ok(e.consoles.length, `${id} runs no console`);
  }
});
test('Supermodel, Citron and the small systems (0.9.49)', () => {
  assert.strictEqual(C.consoleSupport('model3').emulators[0], 'supermodel');
  assert.match(C.emulator('supermodel').launch.by.flatpak, /\{ROM\}.*-fullscreen/);
  assert.ok(C.emulator('citron').updateFrom.some((u) => /citron-emu\.org/.test(u)));
  for (const k of ['arduboy', 'gameandwatch', 'megaduck', 'odyssey2', 'pico', 'supervision', 'zx81']) assert.ok(C.consoleSupport(k).cores.length, k);
});
