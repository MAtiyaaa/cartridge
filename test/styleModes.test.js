// Plain and Glass stay apart (0.9.48, owner's rule): no glass tokens or see-through outside Glass, no Plain tokens
// outside Plain (tools/ui-audit/styleModes.js).
const test = require('node:test');
const assert = require('node:assert');
const S = require('../tools/ui-audit/styleModes');

test('every style rule keeps Plain and Glass apart', () => { assert.deepStrictEqual(S.run(), []); });
test('selector lists split only at top-level commas', () => {
  assert.deepStrictEqual(S.parts('body.elements-glass :is(.a, .b), .c:not(.d, .e)'), ['body.elements-glass :is(.a, .b)', '.c:not(.d, .e)']);
  assert.deepStrictEqual(S.check('x.css', '.p { backdrop-filter: blur(4px) } body.elements-glass .q { background: var(--lg-fill) } .r { color: var(--lg-hi) }'), ['x.css: see-through in Plain too: .p', 'x.css: Glass token outside Glass: .r']);
});
