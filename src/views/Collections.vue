<template>
  <div class="view" data-scroll ref="el">
    <header class="lib-head">
      <div>
        <div class="eyebrow">Collections</div>
        <h1 class="big">{{ total }} collections</h1>
        <div class="muted" style="font-size: 13.5px">Yours are saved in RomM, so every device and RomM's web page have them too.</div>
      </div>
      <button class="btn" data-focus @click="create"><Icon name="mdiPlus" />New collection</button>
    </header>

    <section v-for="s in sections" :key="s.id" class="sec">
      <div class="shelf-title"><Icon :name="s.icon" :size="20" />{{ s.title }}<span class="count">{{ s.items.length }}</span></div>
      <div class="tile-grid">
        <CollTile v-for="c in s.items" :key="c.id" :c="c" @open="open" @focused="focus" />
      </div>
    </section>
    <div v-if="!total" class="empty">No collections yet. Press New collection, or add games from their More menu.</div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick, ref, watch } from 'vue';
import { store, go, call, toast, askText, collections, autoLists, seriesLists, romById, setBg, backdropOf } from '../store.js';
import { useView } from '../useView.js';
import { ensureFocus } from '../nav.js';
import Icon from '../components/Icon.vue';
import CollTile from '../components/CollTile.vue';

const el = ref(null);
const sections = computed(() => {
  store.libVersion;
  const all = collections();
  return [
    { id: 'mine', title: 'Your collections', icon: 'mdiBookmarkOutline', items: all.filter((c) => c.mine && !c.smart) },
    { id: 'auto', title: 'Made by Cartridge', icon: 'mdiAutoFix', items: autoLists() },
    { id: 'series', title: 'Series', icon: 'mdiBookshelf', items: seriesLists() },
    { id: 'romm', title: 'From RomM', icon: 'mdiServerNetwork', items: all.filter((c) => !c.mine || c.smart) },
  ].filter((s) => s.items.length);
});
const total = computed(() => sections.value.reduce((n, s) => n + s.items.length, 0));
function open(c) { go('collection', { collectionId: c.id }); }
function focus(c) { const r = c.rom_ids.map((id) => romById(id)).find((x) => x && (x.shot || x.path_cover_large)); setBg(backdropOf(r)); }
async function create() {
  const name = await askText({ title: 'Name the new collection', placeholder: 'Weekend games' });
  if (!name || !name.trim()) return;
  try { const c = await call('col:create', { name: name.trim() }); toast(`${c.name} created. Add games from their More menu.`, 'ok', 3500, 'mdiBookmarkOutline'); }
  catch (e) { toast(e.message, 'error', 6000); }
}
useView({ y: () => { create(); } }, [{ b: 'A', label: 'Open' }, { b: 'Y', label: 'New collection' }, { b: 'LT+RT', label: 'Tabs' }]);
onMounted(async () => { await nextTick(); ensureFocus(el.value); });
watch(() => store.libVersion, async () => { await nextTick(); ensureFocus(el.value); });
</script>

<style scoped>
.lib-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin: 18px 0 20px; }
.big { font-size: 36px; font-weight: 700; margin: 6px 0 8px; }
.sec { margin-bottom: 26px; }
.tile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 22px 18px; }
.tile-grid :deep(.coll) { width: auto; }
</style>
