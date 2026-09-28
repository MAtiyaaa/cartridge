<template>
  <div class="view" data-scroll ref="el">
    <header class="lib-head">
      <div>
        <div class="eyebrow">Genres</div>
        <h1 class="big">{{ list.length }} genres</h1>
        <div class="muted" style="font-size: 13.5px">From RomM's game details. A game can be in more than one.</div>
      </div>
    </header>
    <div v-if="!list.length" class="empty">No genres yet. RomM adds them when it matches your games with IGDB or ScreenScraper.</div>
    <div v-else class="tile-grid">
      <GenreTile v-for="g in list" :key="g.id" :g="g" @open="(g) => go('genre', { genre: g.name })" @focused="focus" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick, ref, watch } from 'vue';
import { store, go, genres, romById, setBg, backdropOf } from '../store.js';
import { useView } from '../useView.js';
import { ensureFocus } from '../nav.js';
import GenreTile from '../components/GenreTile.vue';

const el = ref(null);
const list = computed(() => (store.libVersion, genres()));
function focus(g) { const r = g.rom_ids.map((id) => romById(id)).find((x) => x && (x.shot || x.path_cover_large)); setBg(backdropOf(r)); }
useView({}, [{ b: 'A', label: 'Open' }, { b: 'Y', label: 'Search' }, { b: 'LT+RT', label: 'Tabs' }]);
onMounted(async () => { await nextTick(); ensureFocus(el.value); });
watch(() => store.libVersion, async () => { await nextTick(); ensureFocus(el.value); });
</script>

<style scoped>
.lib-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin: 18px 0 26px; }
.big { font-size: 36px; font-weight: 700; margin: 6px 0 8px; }
.tile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px 18px; padding-bottom: 40px; }
.tile-grid :deep(.genre) { width: auto; }
</style>
