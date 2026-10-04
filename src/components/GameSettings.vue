<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog gs">
      <div class="gs-head">
        <img v-if="art" class="gs-cover" :src="art" />
        <div style="min-width: 0">
          <div class="eyebrow">{{ d?.name ? d.name + ' · ' : '' }}Game Settings</div>
          <h2>{{ name }}</h2>
          <p class="muted small">Only for this game, saved in {{ d?.name || 'the emulator' }}’s own per-game settings. Anything left on “{{ d?.name || 'Emulator' }}’s own” follows your normal settings.</p>
        </div>
      </div>
      <div v-if="!d" class="muted"><Icon name="mdiSync" :size="16" class="spin" /> Reading its settings…</div>
      <div v-else-if="d.why" class="muted">{{ d.why }}</div>
      <div v-else class="gs-list" data-scroll>
        <button v-for="it in d.items" :key="it.id" class="lrow" data-focus :disabled="busy" @click="pick(it)">
          <span class="l-mid"><b>{{ it.label }}</b><span class="l-sub">{{ it.sub || (it.game != null ? 'This game’s own' : `${d.name}’s own${it.base != null ? ': ' + labelOf(it, it.base) : ''}`) }}</span></span>
          <span class="l-end"><span class="status" :class="{ ok: it.game != null }">{{ it.game != null ? labelOf(it, it.game) : 'Default' }}</span></span>
        </button>
      </div>
      <div class="row" style="justify-content: flex-end">
        <button v-if="d?.items?.some((x) => x.game != null)" class="btn" data-focus :disabled="busy" @click="resetAll"><Icon name="mdiRestore" />Back to {{ d.name }}’s Own</button>
        <button class="btn" data-focus @click="closeModal(null)">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// A game's emulator settings (0.9.23, owner: edit a game's settings in Cartridge, from the emulator's own
// per-game settings). The settings that matter most per emulator, written to its per-game file
// (electron/gameSettings.js); each pick is saved straight away.
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { store, call, closeModal, toast, choose, romById, cover } from '../store.js';
import Icon from './Icon.vue';

const props = defineProps({ romId: Number, name: String });
const el = ref(null), d = ref(null), busy = ref(false);
const rom = computed(() => romById(props.romId));
const art = computed(() => (rom.value ? cover(rom.value) : ''));
const labelOf = (it, v) => it.options.find((o) => String(o.value) === String(v))?.label || String(v);
let saved = null, layer;
// the picker takes the one modal slot: this sheet comes back after it
function reopen() { if (store.modal?.type !== 'gamesettings') store.modal = { type: 'gamesettings', props: { romId: props.romId, name: props.name }, resolve: saved || (() => {}) }; }
async function pick(it) {
  const cur = it.game;
  const v = await choose({ title: it.label, message: it.sub || '', sheet: true, options: [
    { label: `${d.value.name}’s own`, sub: it.base != null ? `Now ${labelOf(it, it.base)}` : 'Follows your normal settings', value: '__base', icon: 'mdiArrowULeftTop', selected: cur == null, raw: true },
    ...it.options.map((o) => ({ label: o.label, value: o.value, selected: cur != null && String(cur) === String(o.value), raw: true })),
  ] });
  reopen();
  if (v == null) return;
  await save([{ id: it.id, value: v === '__base' ? null : v }]);
}
async function save(changes) {
  busy.value = true;
  try { d.value = await call('gamesettings:set', { romId: props.romId, changes }); toast('Saved. It applies the next time the game starts.', 'ok', 2500, 'mdiTune'); }
  catch (e) { toast(e.message, 'error', 6000); }
  busy.value = false;
}
async function resetAll() { await save(d.value.items.filter((x) => x.game != null).map((x) => ({ id: x.id, value: null }))); }
onMounted(async () => {
  saved = store.modal?.resolve;
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  d.value = await call('gamesettings:get', { romId: props.romId }).catch((e) => ({ why: e.message }));
  await nextTick(); focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>

<style scoped>
.gs { width: min(760px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-3); }
.gs-head { display: flex; gap: var(--s-4); align-items: flex-start; }
.gs-head h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; }
.gs-head p { margin: 0; line-height: 1.45; }
.gs-cover { width: 64px; aspect-ratio: 2 / 3; object-fit: cover; border-radius: var(--r-md); flex: none; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45); }
.gs-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 4px; }
.gs-list > * { flex: none; }
</style>
