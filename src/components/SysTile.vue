<template>
  <button class="systile" data-focus :data-key="'sys-' + p.id" @click="$emit('open', p)" @focus="$emit('focused', p)" :style="tileStyle">
    <!-- the controller picture sits in its own clipped layer: while the tile is zoomed on focus it
         otherwise slips past the rounded corners (software rendering) -->
    <div class="sys-clip"><div class="glyph" :class="{ wide }"><PIcon :p="p" :size="150" :aspect="wide ? 1.5 : 1" @shape="(r) => (wide = r > 1.3)" /></div></div>
    <div class="sys-top">
      <img v-if="logo && !logoFail" class="sys-logo" :src="logo" :alt="p.display_name" :style="logoSize" @error="logoFail = true" />
      <template v-else>
        <div class="ico"><PIcon :p="p" :size="40" /></div>
      </template>
    </div>
    <div>
      <div v-if="!logo || logoFail" class="nm">{{ p.display_name }}</div>
      <div v-if="meta || maker" class="fam"><svg v-if="maker" class="maker" :class="[{ symbol: maker.symbol, tall: maker.tall }, 'm-' + makerKey]" :viewBox="maker.vb" :aria-label="maker.name" role="img"><path v-for="(q, i) in maker.paths || [maker]" :key="i" :d="q.d" :fill-rule="q.evenodd ? 'evenodd' : null" /></svg><span v-if="maker && meta">·</span><span v-if="meta">{{ meta }}</span></div>
      <div class="ct">{{ p.rom_count }} {{ p.rom_count === 1 ? 'game' : 'games' }}<template v-if="onDevice"> · <span class="ondev">{{ onDevice }} on device</span></template></div>
    </div>
  </button>
</template>
<script setup>
import { computed, ref, watch } from 'vue';
import { store, romsOf, call } from '../store.js';
import { consoleColors } from '../consoleColors.js';
import PIcon from './PIcon.vue';
import { MAKERS, makerOf } from '../makers.js';
import { opticalOf } from '../consoleOptical.js';
const wide = ref(false); // a wide drawing (Switch with its Joy-Cons) gets a wide box, so it isn't small (0.9.24)
const props = defineProps({ p: Object });
defineEmits(['open', 'focused']);
// the maker as its logo, at the height of the text (0.9.16); the family name stays text when there's none
const makerKey = computed(() => makerOf(props.p));
const maker = computed(() => MAKERS[makerKey.value] || null);
const meta = computed(() => [maker.value ? '' : props.p.family_name, props.p.generation ? `Gen ${props.p.generation}` : '', props.p.category].filter(Boolean).slice(0, maker.value ? 1 : 2).join(' · '));
const onDevice = computed(() => romsOf(props.p.id).filter((r) => store.installed[r.id]).length);

// Console logo (white wordmark), cached by the main process; falls back to the name
const cache = (globalThis.__sysLogos ||= new Map());
const logo = ref(cache.get(props.p.slug) || '');
const logoFail = ref(false);
// wordmarks with a symbol or a second line get taller so their letters match (0.9.21, consoleOptical.js)
const logoSize = computed(() => { const f = opticalOf(logo.value, props.p.slug); return f === 1 ? null : { maxHeight: Math.min(44, Math.round(30 * f)) + 'px' }; });
watch(() => props.p.slug, load, { immediate: true });
function load() {
  const k = props.p.slug;
  if (cache.has(k)) { logo.value = cache.get(k); return; }
  call('syslogo:get', { slug: props.p.slug, fs_slug: props.p.fs_slug }).then((u) => { cache.set(k, u || ''); logo.value = u || ''; }).catch(() => cache.set(k, ''));
}

// The console's own colours as --sys-a / --sys-b (styles.css builds the tile from them). Consoles
// without a known pair get a colour from their name, so each keeps the same one.
const tileStyle = computed(() => {
  const c = consoleColors(props.p);
  if (c) return { '--sys-a': c[0], '--sys-b': c[1] };
  let h = 0; for (const ch of props.p.slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const hue = 200 + (h % 140);
  return { '--sys-a': `hsl(${hue} 45% 42%)`, '--sys-b': `hsl(${(hue + 30) % 360} 40% 22%)` };
});
</script>
<style>
.systile .sys-top { height: 44px; display: flex; align-items: center; position: relative; z-index: 1; }
.systile .sys-top + div { position: relative; z-index: 1; }
.systile .sys-logo { max-height: 30px; max-width: 170px; object-fit: contain; object-position: left center; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45)); transition: transform var(--spring-d) var(--spring); transform-origin: left center; }
.systile:focus .sys-logo { transform: scale(1.06); }
.systile .ondev { color: #b9f6ca; }
.systile .sys-clip { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; clip-path: inset(0 round 16px); pointer-events: none; }
</style>
