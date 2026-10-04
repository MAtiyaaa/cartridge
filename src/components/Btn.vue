<template>
  <span v-if="b.includes('+')" class="padpair"><Btn :b="b.split('+')[0]" /><Btn :b="b.split('+')[1]" /></span>
  <span v-else class="pb" :class="[cls, 'k-' + kind]" :title="label">
    <svg v-if="face && kind === 'playstation'" viewBox="0 0 20 20" class="pb-shape"><path :d="PS[b]" /></svg>
    <!-- sticks (0.9.24, owner: RS should look like a thumbstick, not a square key): a round cap seen from above -->
    <svg v-else-if="stick" viewBox="0 0 22 22" class="pb-stick"><circle cx="11" cy="11" r="10" class="st-base" /><circle cx="11" cy="11" r="6.6" class="st-cap" /><text x="11" y="11" class="st-l">{{ stick }}</text></svg>
    <svg v-else-if="icon === 'menu'" viewBox="0 0 20 20" class="pb-ico"><path d="M5 6.5h10M5 10h10M5 13.5h10" /></svg>
    <svg v-else-if="icon === 'view'" viewBox="0 0 20 20" class="pb-ico"><rect x="4" y="4.5" width="8" height="7" rx="1.5" /><rect x="8" y="8.5" width="8" height="7" rx="1.5" /></svg>
    <svg v-else-if="icon === 'plus'" viewBox="0 0 20 20" class="pb-ico"><path d="M10 5v10M5 10h10" /></svg>
    <svg v-else-if="icon === 'minus'" viewBox="0 0 20 20" class="pb-ico"><path d="M5 10h10" /></svg>
    <svg v-else-if="icon === 'share'" viewBox="0 0 20 20" class="pb-ico"><path d="M10 13V4.5M6.8 7.5 10 4.3l3.2 3.2M5 11v4h10v-4" /></svg>
    <template v-else>{{ text }}</template>
  </span>
</template>
<script setup>
import { computed } from 'vue';
import { padKind } from '../pad.js';
// A controller button drawn for the controller you actually hold: Xbox, PlayStation, Nintendo
// or Steam (Deck / Steam Controller). Every glyph is the same height, sized to sit in a line of text.
const props = defineProps({ b: String });
const kind = computed(() => padKind.value);
const face = computed(() => ['A', 'B', 'X', 'Y'].includes(props.b));
const PS = {
  A: 'M5.5 5.5l9 9M14.5 5.5l-9 9', // cross (bottom)
  B: 'M10 4.6a5.4 5.4 0 1 0 0 10.8a5.4 5.4 0 1 0 0-10.8', // circle (right)
  X: 'M5 5h10v10H5z', // square (left)
  Y: 'M10 4.5l5.8 10H4.2z', // triangle (top)
};
const LABELS = {
  xbox: { A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'LB', RB: 'RB', LT: 'LT', RT: 'RT', START: 'menu', SELECT: 'view' },
  steam: { A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', START: 'menu', SELECT: 'view' },
  playstation: { A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', START: 'menu', SELECT: 'share' },
  // Nintendo labels sit in other places: bottom is B, right is A, left is Y, top is X
  nintendo: { A: 'B', B: 'A', X: 'Y', Y: 'X', LB: 'L', RB: 'R', LT: 'ZL', RT: 'ZR', START: 'plus', SELECT: 'minus' },
};
const NAMES = { menu: 'Menu', view: 'View', share: 'Create', plus: 'Plus', minus: 'Minus' };
const map = computed(() => LABELS[kind.value] || LABELS.xbox);
const val = computed(() => map.value[props.b] ?? props.b);
const icon = computed(() => (['menu', 'view', 'share', 'plus', 'minus'].includes(val.value) ? val.value : ''));
const text = computed(() => val.value);
const label = computed(() => NAMES[val.value] || val.value);
const stick = computed(() => ({ LS: 'L', RS: 'R', L3: 'L', R3: 'R' })[props.b] || '');
const cls = computed(() => {
  if (stick.value) return 'stick';
  if (face.value) return 'face f-' + props.b.toLowerCase();
  if (['LB', 'RB', 'LT', 'RT'].includes(props.b)) return 'shoulder';
  if (['START', 'SELECT'].includes(props.b)) return 'sys';
  return 'other';
});
</script>
<style>
.pb { display: inline-grid; place-items: center; height: 22px; min-width: 22px; padding: 0 6px; border-radius: var(--r-md); font: 700 11px/1 var(--body), sans-serif; color: #0b0d12; background: #d9dee8; box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35); flex: none; vertical-align: middle; }
.pb.face { width: 22px; padding: 0; }
/* the letter sits in the middle of its button (0.9.23): the text box is cut to the capital letters, so
   the font's room for accents and descenders no longer pushes it off centre */
.pb { text-box: trim-both cap alphabetic; }
.pb.shoulder, .pb.sys, .pb.other { border-radius: var(--r-sm); background: #c7cdd8; font-size: var(--t-xs); }
.pb.shoulder { min-width: 28px; }
.pb.stick { width: 22px; padding: 0; border-radius: 50%; background: none; box-shadow: none; }
.pb-stick { width: 22px; height: 22px; display: block; }
.pb-stick .st-base { fill: #c7cdd8; }
.pb-stick .st-cap { fill: #e4e8ef; stroke: #8d95a3; stroke-width: 1.2; }
.pb-stick .st-l { font: 800 8px/1 var(--body), sans-serif; fill: #0b0d12; text-anchor: middle; dominant-baseline: central; }
.pb.sys { width: 28px; padding: 0; }
.pb-ico { width: 14px; height: 14px; fill: none; stroke: #0b0d12; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.pb-shape { width: 13px; height: 13px; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
/* Xbox: coloured letters */
.k-xbox.f-a { background: #57d364; } .k-xbox.f-b { background: #ff6b61; } .k-xbox.f-x { background: #5aa2ff; } .k-xbox.f-y { background: #ffd35c; }
/* PlayStation: dark buttons with coloured shapes */
.k-playstation.face { background: #1c1f2a; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25); }
.k-playstation.f-a .pb-shape { stroke: #7ab8ff; } .k-playstation.f-b .pb-shape { stroke: #ff6b7a; }
.k-playstation.f-x .pb-shape { stroke: #f39bd3; } .k-playstation.f-y .pb-shape { stroke: #4fe0b6; }
/* Nintendo and Steam: plain light buttons with dark letters */
.k-nintendo.face, .k-steam.face { background: #e6e9ef; }
.padpair { display: inline-flex; gap: 4px; vertical-align: middle; }
</style>
