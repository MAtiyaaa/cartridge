<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog pt">
      <div>
        <div class="eyebrow">{{ emuName === 'PPSSPP' ? 'Cheats' : emuName === 'Dolphin' ? 'Patches and cheats' : 'Patches' }} · {{ emuName }}</div>
        <h2>{{ name }}</h2>
        <div class="muted small">{{ [serial, version ? (emuName === 'PCSX2' ? 'CRC ' : 'version ') + version : ''].filter(Boolean).join(' · ') }}</div>
        <div class="muted small">{{ emuName === 'PPSSPP' ? 'Cheats' : 'Patches' }} you turn on here stay on in {{ emuName }}, as if you ticked them there.<template v-if="emuName === 'PPSSPP' || emuName === 'Dolphin'"> Cheats also turn on {{ emuName }}’s Enable cheats setting.</template></div>
      </div>
      <!-- Dolphin (0.9.21, owner): one page per kind, LB/RB between them; each says how many are on -->
      <div v-if="tabs.length > 1" class="pt-tabs"><Btn b="LB" /><div class="seg"><button v-for="t in tabs" :key="t.k" data-focus :class="{ on: tab === t.k }" @click="tab = t.k">{{ t.l }}<span v-if="t.on" class="pt-count">{{ t.on }}</span></button></div><Btn b="RB" /></div>
      <div v-if="!list.length" class="muted" style="padding: 12px 2px">{{ why || `${emuName} has no patches for this game.` }}</div>
      <div v-else-if="!shown.length" class="muted" style="padding: 12px 2px">{{ EMPTY[tab] || 'Nothing here for this game.' }}</div>
      <div v-else class="pt-list" data-scroll>
        <button v-for="p in shown" :key="p.key" class="pt-row" :class="{ on: want[p.key], locked: p.by === 'emulator' }" data-focus @click="flip(p)">
          <span class="box"><Icon v-if="want[p.key]" name="mdiCheck" :size="18" /></span>
          <span class="pt-mid">
            <b>{{ p.description }}</b>
            <span class="pt-sub">{{ [p.by === 'emulator' ? `On in ${emuName}` : '', p.version === 'All' ? 'Any version' : '', p.author ? 'by ' + p.author : '', p.notes].filter(Boolean).join(' · ') }}</span>
          </span>
        </button>
      </div>
      <div class="row" style="justify-content: flex-end">
        <button class="btn" data-focus @click="closeModal(null)">{{ list.length ? 'Cancel' : 'Close' }}</button>
        <button v-if="list.length" class="btn primary" data-focus :disabled="!changed" @click="closeModal(changes())"><Icon name="mdiCheck" />Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// The emulator's own patches for one game (0.9.3 D7). Ticks change nothing until Apply; a patch
// turned on in the emulator itself can't be turned off here. Opened from the game page.
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal, toast } from '../store.js';
import Icon from './Icon.vue';
import Btn from './Btn.vue';

const props = defineProps({ name: String, emuName: { type: String, default: 'RPCS3' }, serial: String, version: String, why: String, list: { type: Array, default: () => [] } });
const want = reactive(Object.fromEntries(props.list.map((p) => [p.key, p.on])));
// Dolphin's kinds of code, as its game properties shows them (patches, Action Replay, Gecko, graphics mods)
const KINDS = [{ k: 'OnFrame', l: 'Patches' }, { k: 'ActionReplay', l: 'AR Codes' }, { k: 'Gecko', l: 'Gecko Codes' }, { k: 'GraphicMods', l: 'Graphics Mods' }];
const EMPTY = { OnFrame: 'Dolphin has no patches for this game.', ActionReplay: 'No Action Replay codes for this game.', Gecko: 'No Gecko codes for this game.', GraphicMods: 'No graphics mods for this game. Mods go in Dolphin’s Load/GraphicMods folder.' };
const tabs = computed(() => (props.list.some((p) => p.section) ? KINDS.map((t) => ({ ...t, on: props.list.filter((p) => p.section === t.k && want[p.key]).length })) : []));
const tab = ref((props.list.find((p) => p.section) || {}).section || 'OnFrame');
const shown = computed(() => (tabs.value.length ? props.list.filter((p) => p.section === tab.value) : props.list));
const step = (d) => { const i = KINDS.findIndex((t) => t.k === tab.value); tab.value = KINDS[(i + d + KINDS.length) % KINDS.length].k; requestAnimationFrame(() => focusFirst(el.value.querySelector('.pt-list') || el.value)); };
const changed = computed(() => props.list.some((p) => want[p.key] !== p.on));
const changes = () => props.list.filter((p) => want[p.key] !== p.on).map((p) => ({ key: p.key, on: want[p.key] }));
function flip(p) {
  if (p.by === 'emulator') return toast(`Turned on in ${props.emuName}. Turn it off there.`, 'info', 3500);
  want[p.key] = !want[p.key];
}
const el = ref(null);
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => changed.value && closeModal(changes()), lb() { if (tabs.value.length) step(-1); }, rb() { if (tabs.value.length) step(1); }, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>

<style scoped>
.pt { width: min(760px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-4); }
.pt-tabs { display: flex; align-items: center; gap: var(--s-2); }
.pt-tabs .seg { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
.pt-tabs .seg button { flex: none; white-space: nowrap; }
.pt-count { margin-left: 6px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; display: inline-grid; place-items: center; font-size: 11px; font-weight: 800; background: var(--sel, rgba(255,255,255,.18)); }
.pt h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; }
.small { font-size: var(--t-sm); }
.pt-list { overflow-y: auto; min-height: 0; flex: 1; display: flex; flex-direction: column; gap: var(--s-2); padding: 2px; }
.pt-row { flex: none; display: flex; align-items: center; gap: var(--s-3); text-align: left; padding: var(--s-3) var(--s-4); border-radius: var(--r-md); background: var(--s1); color: inherit; border: 0; font: inherit; }
.pt-row:focus { background: var(--focus); color: var(--on-focus); outline: none; box-shadow: none; } /* the plain white box, no ring for the list edge to cut (0.9.16) */
.pt-row.locked { opacity: 0.75; }
.box { flex: none; width: 26px; height: 26px; border-radius: var(--r-sm); border: 2px solid currentColor; display: grid; place-items: center; opacity: 0.85; }
.pt-row.on .box { background: currentColor; }
.pt-row.on .box .icon { color: var(--s0); }
.pt-row.on:focus .box .icon { color: var(--focus); }
.pt-mid { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pt-sub { font-size: var(--t-sm); opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
