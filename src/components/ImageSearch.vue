<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog isr">
      <div class="isr-head">
        <div><div class="eyebrow">{{ kind === 'gif' ? 'GIFs from Openverse and Wikimedia Commons' : '4K wallpapers from Wallhaven' }}</div><h2>{{ q }}</h2></div>
        <button class="btn" data-focus @click="closeModal(null)"><Icon name="mdiClose" />Close</button>
      </div>
      <div v-if="err" class="muted">{{ err }}</div>
      <div v-else-if="!list" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Searching…</div>
      <div v-else-if="!list.length" class="muted">Nothing found. Try other words.</div>
      <div v-else class="isr-grid" data-scroll data-grid>
        <button v-for="r in list" :key="r.url" class="isr-item" data-focus @click="closeModal(r.url)">
          <img v-if="!bad[r.url]" :src="r.thumb" loading="lazy" alt="" @error="bad[r.url] = true" />
          <Icon v-else name="mdiImageOffOutline" :size="28" class="isr-none" />
          <span v-if="r.w" class="isr-size">{{ r.w }} × {{ r.h }}</span>
        </button>
        <button v-if="more" class="isr-item isr-more" data-focus @click="loadMore"><Icon name="mdiChevronDown" :size="28" />More</button>
      </div>
      <p class="muted small" style="margin: 0">{{ kind === 'gif' ? 'Openly licensed GIFs from Openverse and Wikimedia Commons, the biggest first.' : 'Safe-for-work wallpapers from Wallhaven, 3840 by 2160 or bigger.' }} The one you pick is saved on this device.</p>
    </div>
  </div>
</template>
<script setup>
// Start's picture widget: search results to pick from (0.9.28, owner: find a 4K picture or a GIF without
// downloading it first). Returns the full-size URL, which start:imageUrl keeps on this device.
import { onBeforeUnmount, onMounted, ref, nextTick, reactive } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { call, closeModal } from '../store.js';
import Icon from './Icon.vue';
const props = defineProps({ q: String, kind: String });
const el = ref(null), list = ref(null), err = ref(''), more = ref(false), bad = reactive({});
let page = 1, layer;
async function load() {
  try {
    const got = await call('start:search', { q: props.q, kind: props.kind, page });
    list.value = [...(list.value || []), ...got.filter((r) => !(list.value || []).some((x) => x.url === r.url))];
    more.value = got.length >= (props.kind === 'gif' ? 8 : 20); // GIFs too small to use are left out of each page of 20
  } catch (e) { err.value = /allowlist|ENOTFOUND|fetch failed/i.test(e.message) ? 'Couldn’t reach the search. Check the connection and try again.' : e.message; }
}
async function loadMore() { page++; await load(); }
onMounted(async () => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  await load(); await nextTick(); focusFirst(el.value, '.isr-item');
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.isr { width: min(1200px, 96vw); height: min(88vh, 960px); display: flex; flex-direction: column; gap: var(--s-3); }
.isr-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--s-3); }
.isr-head h2 { margin: 2px 0 0; font-size: var(--t-xl); }
/* 0.9.29 (owner: results stacked on top of each other): every cell has a set height and the picture is laid
   inside it, so a wide or tall picture never pushes into the next row */
.isr-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); grid-auto-rows: clamp(120px, 12vw, 200px); gap: 12px; padding: 6px; align-content: start; }
.isr-item { position: relative; height: 100%; min-height: 0; border-radius: var(--r-md); overflow: hidden; border: 0; padding: 0; background: var(--s2); color: inherit; contain: paint; }
.isr-item img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
/* 0.9.39 (owner: the outline was cut off): the ring is drawn inside the picture's edge and the picture zooms inside
   its frame, so nothing reaches past the box for contain/overflow to clip */
.isr-item::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 3px var(--focus-solid, var(--focus)), inset 0 0 0 5px rgba(0, 0, 0, 0.45); opacity: 0; transition: opacity var(--d-fast); pointer-events: none; }
.isr-item:focus { outline: none; box-shadow: none; }
.isr-item:focus::after { opacity: 1; }
.isr-item img { transition: transform var(--spring-d, 300ms) var(--spring, ease-out); }
.isr-item:focus img { transform: scale(1.06); }
.isr-none { position: absolute; inset: 0; margin: auto; color: var(--dim); }
.isr-size { position: absolute; right: 6px; bottom: 6px; padding: 2px 7px; border-radius: 999px; background: rgba(0, 0, 0, 0.6); font-size: var(--t-xs); }
.isr-more { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-weight: 600; }
</style>
