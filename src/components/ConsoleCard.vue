<template>
  <!-- the same card as the Consoles page (SysTile), drawn inside another control, so not a button -->
  <div class="systile static" :style="tileStyle">
    <div class="sys-clip"><div class="glyph" :class="{ wide }"><PIcon :p="p" :size="150" :aspect="wide ? 1.5 : 1" @shape="(r) => (wide = r > 1.3)" /></div></div>
    <div class="sys-top">
      <img v-if="logo && !logoFail" class="sys-logo" :src="logo" :alt="p.display_name" :style="logoSize" @error="logoFail = true" />
      <div v-else class="nm">{{ p.display_name }}</div>
    </div>
    <!-- 0.9.23 (owner: the bottom left was empty on Start): the maker and the counts, as on the Consoles page -->
    <div class="cc-foot">
      <div v-if="!compact && (meta || maker)" class="fam"><svg v-if="maker" class="maker" :class="{ symbol: maker.symbol, tall: maker.tall }" :viewBox="maker.vb" :aria-label="maker.name" role="img"><path v-for="(q, i) in maker.paths || [maker]" :key="i" :d="q.d" :fill-rule="q.evenodd ? 'evenodd' : null" /></svg><span v-if="maker && meta">·</span><span v-if="meta">{{ meta }}</span></div>
      <div class="ct">{{ p.rom_count }}<span class="cc-games"> {{ p.rom_count === 1 ? 'game' : 'games' }}</span><template v-if="onDevice"> · <span class="ondev">{{ onDevice }}<span class="cc-games"> on device</span></span></template></div>
    </div>
  </div>
</template>
<script setup>
// A console card for Start's Consoles tile (0.9.21, owner: the same boxes as the Consoles page, not chips)
import { computed, ref, watch } from 'vue';
import { store, call, romsOf } from '../store.js';
import { MAKERS, makerOf } from '../makers.js';
import { consoleColors } from '../consoleColors.js';
import { opticalOf } from '../consoleOptical.js';
import PIcon from './PIcon.vue';
const wide = ref(false); // a wide drawing (Switch with its Joy-Cons) gets a wide box, so it isn't small (0.9.24)
const props = defineProps({ p: Object, compact: Boolean });
const maker = computed(() => MAKERS[makerOf(props.p)] || null);
const meta = computed(() => [maker.value ? '' : props.p.family_name, props.p.generation ? `Gen ${props.p.generation}` : ''].filter(Boolean).slice(0, 1).join(''));
const onDevice = computed(() => romsOf(props.p.id).filter((r) => store.installed[r.id]).length);
const cache = (globalThis.__sysLogos ||= new Map());
const logo = ref(cache.get(props.p.slug) || ''), logoFail = ref(false);
watch(() => props.p.slug, () => {
  const k = props.p.slug;
  if (cache.has(k)) { logo.value = cache.get(k); return; }
  call('syslogo:get', { slug: props.p.slug, fs_slug: props.p.fs_slug }).then((u) => { cache.set(k, u || ''); logo.value = u || ''; }).catch(() => cache.set(k, ''));
}, { immediate: true });
const logoSize = computed(() => { const f = opticalOf(logo.value, props.p.slug); return f === 1 ? null : { maxHeight: `min(${Math.round(30 * f)}px, ${Math.round(30 * f)}cqh)` }; });
const tileStyle = computed(() => {
  const c = consoleColors(props.p);
  if (c) return { '--sys-a': c[0], '--sys-b': c[1] };
  let h = 0; for (const ch of props.p.slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const hue = 200 + (h % 140);
  return { '--sys-a': `hsl(${hue} 45% 42%)`, '--sys-b': `hsl(${(hue + 30) % 360} 40% 22%)` };
});
</script>
<style>
/* fills whatever space it's given; the picture and wordmark scale with it */
.systile.static { width: 100%; height: 100%; min-width: 0; min-height: 0; padding: clamp(10px, 9cqh, 18px) clamp(10px, 7cqw, 20px); container-type: size; }
.systile.static .sys-top { height: auto; max-width: 70%; flex: 0 1 auto; min-height: 0; max-height: 46cqh; } /* 0.9.32 (owner: no clipping): the name never reaches the maker below */
.systile.static .sys-top .sys-logo { max-height: min(100%, 40cqh) !important; }
.systile.static .sys-logo { max-height: min(30px, 26cqh); max-width: 100%; }
.systile.static .nm { font-size: clamp(12px, 15cqh, 20px); max-width: 100%; }
.systile.static .glyph { right: calc(7% - var(--gp)); top: calc(10% - var(--gp)); height: 80%; }
.systile.static .cc-foot { flex: none; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
.systile.static .fam { font-size: clamp(10px, 9cqh, 12px); margin: 0; }
.systile.static .ct { font-size: clamp(10px, 9cqh, 12px); padding: 3px 7px; }
@container (max-width: 170px) { .systile.static .cc-games { display: none; } }
@container (max-height: 96px) { .systile.static .fam { display: none; } }
@container (max-height: 40px) { .systile.static .cc-foot { display: none; } }
</style>
