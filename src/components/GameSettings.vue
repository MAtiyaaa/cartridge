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
      <div v-else-if="d.why && !fg" class="muted">{{ d.why }}</div>
      <!-- sections as tabs on L1/R1 (0.9.24, owner: the menu style across the board) -->
      <div v-if="d && (!d.why || fg) && tabs.length > 1" class="gs-tabs"><Btn b="LB" /><div class="seg"><button v-for="t in tabs" :key="t" tabindex="-1" :class="{ on: t === tab }" @click="tab = t">{{ t }}</button></div><Btn b="RB" /></div>
      <div v-else-if="!d" />
      <div v-if="d && (!d.why || fg)" class="gs-list" data-scroll :key="tab">
        <button v-if="tab === 'Steam' && fg" class="lrow" data-focus :disabled="busy" @click="pickFg">
          <span class="l-mid"><b>Frame Generation</b><span class="l-sub">{{ fg.own ? 'This game’s own' : `Follows ${fg.consoleOwn ? 'its console' : 'your default'}: ${FGL[fg.uses]}` }}. Its Steam shortcut changes at once.</span></span>
          <span class="l-end"><span class="status" :class="{ ok: fg.own }">{{ fg.own ? FGL[fg.own] : 'Default' }}</span></span>
        </button>
        <div v-if="tab === 'Steam' && !fg" class="muted small">Frame generation needs lsfg-vk or mako-run on this device, and the game in Steam.</div>
        <button v-for="it in shown" :key="it.id" class="lrow" data-focus :disabled="busy" @click="pick(it)">
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
import { computed, onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { store, call, closeModal, toast, choose, romById, cover } from '../store.js';
import Icon from './Icon.vue';
import Btn from './Btn.vue';

const props = defineProps({ romId: Number, name: String });
const el = ref(null), d = ref(null), busy = ref(false);
const rom = computed(() => romById(props.romId));
const art = computed(() => (rom.value ? cover(rom.value) : ''));
const tab = ref('');
const tabs = computed(() => { const t = [...new Set((d.value?.items || []).map((x) => x.tab || 'General'))]; if (fg.value) t.push('Steam'); return t; });
const shown = computed(() => (d.value?.items || []).filter((x) => (x.tab || 'General') === tab.value));
watch(tabs, (t) => { if (!t.includes(tab.value)) tab.value = t[0] || ''; }, { immediate: true });
function stepTab(n) { const t = tabs.value; if (t.length < 2) return; tab.value = t[(t.indexOf(tab.value) + n + t.length) % t.length]; nextTick(() => focusFirst(el.value.querySelector('.gs-list') || el.value)); }
// frame generation for this game (0.9.24): the same pick as Settings → Steam → Frame generation
const FGL = { lsfg: 'Lossless Scaling (lsfg-vk)', mako: 'mako-run', off: 'Off' };
const fg = ref(null);
async function loadFg() {
  const r = await call('steam:frameGen').catch(() => null);
  const g = r?.games.find((x) => x.romId === props.romId);
  if (!r || !g || !(r.found.lsfg || r.found.mako)) { fg.value = null; return; }
  fg.value = { found: r.found, own: g.own, uses: g.uses, consoleOwn: !!(r.conf.consoles || {})[g.console] };
}
async function pickFg() {
  const f = fg.value;
  const v = await choose({ title: 'Frame Generation', message: 'For this game only. Its Steam shortcut is updated at once.', sheet: true, options: [
    { label: 'Follow the Default', value: '__base', icon: 'mdiArrowULeftTop', selected: !f.own },
    ...(f.found.lsfg ? [{ label: FGL.lsfg, value: 'lsfg', selected: f.own === 'lsfg' }] : []),
    ...(f.found.mako ? [{ label: FGL.mako, value: 'mako', selected: f.own === 'mako' }] : []),
    { label: 'Off', value: 'off', icon: 'mdiClose', selected: f.own === 'off' },
  ] });
  reopen();
  if (!v) return;
  busy.value = true;
  try { await call('steam:setFrameGen', { scope: 'game', id: props.romId, value: v === '__base' ? null : v }); await loadFg(); toast('Saved. Its Steam shortcut is being updated.', 'ok', 2800, 'mdiCheck'); }
  catch (e) { toast(e.message, 'error', 5000); }
  busy.value = false;
}
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
async function resetAll() { await save((d.value.items || []).filter((x) => x.game != null).map((x) => ({ id: x.id, value: null }))); }
onMounted(async () => {
  saved = store.modal?.resolve;
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb: () => stepTab(-1), rb: () => stepTab(1), x() {}, y() {}, select() {}, lt() {}, rt() {} });
  loadFg();
  d.value = await call('gamesettings:get', { romId: props.romId }).catch((e) => ({ why: e.message, items: [] }));
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
.gs-tabs { display: flex; align-items: center; gap: 10px; align-self: flex-start; }
</style>
