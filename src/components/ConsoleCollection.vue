<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog cc">
      <div class="cc-head">
        <div style="min-width: 0">
          <div class="eyebrow">Steam Collection</div>
          <h2>{{ d?.name || title }}</h2>
          <div class="muted small">{{ !d ? 'Reading Steam…' : d.error ? d.error : summary }}</div>
        </div>
        <button v-if="missing.length" class="btn primary" data-focus data-autofocus :disabled="busy" @click="add(missing)"><Icon :name="busy ? 'mdiSync' : 'mdiPlus'" :class="{ spin: busy }" />Add {{ missing.length }} Missing</button>
      </div>
      <div v-if="d && !d.error" class="cc-list" data-scroll>
        <div v-if="!d.games.length" class="muted" style="padding: 12px 4px">None of this console’s downloaded games are in Steam yet.</div>
        <button v-for="g in d.games" :key="g.appid" class="cc-row" :class="{ in: g.in }" data-focus @click="g.in ? null : add([g])">
          <img class="cc-cover" :src="coverOf(g.romId)" alt="" loading="lazy" @error="(e) => (e.target.style.visibility = 'hidden')" />
          <span class="cc-mid"><b>{{ g.name }}</b><span class="cc-sub">{{ g.ours ? 'Added to Steam by Cartridge' : 'Already in Steam (your shortcut)' }}</span></span>
          <span class="status" :class="g.in ? 'ok' : 'warn'"><Icon v-if="g.in" name="mdiCheck" :size="14" />{{ g.in ? 'In It' : 'Not In It · A to Add' }}</span>
        </button>
      </div>
      <div class="row" style="justify-content: space-between; align-items: center">
        <span class="muted small">{{ d && !d.live ? 'Steam restarts once to take the change (its interface isn’t reachable).' : '' }}</span>
        <button class="btn" data-focus @click="closeModal(null)">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// A console's Steam collection (0.9.34, owner: "open the collection, see every game that can go in it and add them"):
// every downloaded game of the console that's in Steam, Cartridge's shortcut or one you made, in it or not.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { call, closeModal, toast, romById, cover } from '../store.js';
import Icon from './Icon.vue';

const props = defineProps({ ckey: String, title: String });
const d = ref(null), busy = ref(false), el = ref(null);
const missing = computed(() => (d.value?.games || []).filter((g) => !g.in));
const summary = computed(() => { const n = d.value.games.length, i = n - missing.value.length; return `${i} of ${n} of its games in Steam are in it${d.value.exists ? '' : ' · made in Steam when the first goes in'}`; });
const coverOf = (id) => { const r = romById(id); return (r && cover(r)) || ''; };
async function load() { try { d.value = await call('steam:consoleCollection', { key: props.ckey }); } catch (e) { d.value = { error: e.message, games: [] }; } }
async function add(list) {
  busy.value = true;
  try {
    const r = await call('steam:fillCollections', { keys: [props.ckey], appids: list.map((g) => g.appid) });
    toast(!r.count ? 'They’re in it already' : r.live ? `${r.count} added to ${d.value.name}` : `${r.count} go into ${d.value.name} when Steam restarts`, 'ok', 3500, 'mdiSteam');
    if (r.live) { await load(); await nextTick(); focusFirst(el.value); } else for (const g of list) g.in = true;
  } catch (e) { toast(e.message, 'error', 6000); }
  busy.value = false;
}
let layer;
onMounted(async () => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  await load(); await nextTick();
  focusFirst(el.value, '[data-autofocus]') || focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>

<style scoped>
.cc { width: min(760px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-3); }
.cc-head { display: flex; gap: var(--s-4); align-items: flex-start; justify-content: space-between; }
.cc-head h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; overflow-wrap: anywhere; }
.cc-list { overflow-y: auto; min-height: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 2px; }
.cc-row { flex: none; display: flex; align-items: center; gap: var(--s-3); padding: 8px 10px; border-radius: var(--r-md); text-align: left; width: 100%; }
.cc-row:focus { background: var(--focus); color: var(--on-focus); }
.cc-row:focus .cc-sub { color: var(--on-focus-dim); }
.cc-cover { width: 34px; aspect-ratio: 3 / 4; object-fit: cover; border-radius: var(--r-sm); flex: none; background: var(--s2); }
.cc-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cc-mid b { font-weight: 600; overflow-wrap: anywhere; }
.cc-sub { font-size: var(--t-xs); color: var(--muted); }
.status.warn { background: rgba(245, 197, 66, 0.18); color: #ffd978; }
</style>
