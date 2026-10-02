<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog pt">
      <div>
        <div class="eyebrow">Patches · {{ emuName }}</div>
        <h2>{{ name }}</h2>
        <div class="muted small">{{ [serial, version ? (emuName === 'PCSX2' ? 'CRC ' : 'version ') + version : ''].filter(Boolean).join(' · ') }}</div>
        <div class="muted small">Patches you turn on here stay on in {{ emuName }}, as if you ticked them there.</div>
      </div>
      <div v-if="!list.length" class="muted" style="padding: 12px 2px">{{ why || `${emuName} has no patches for this game.` }}</div>
      <div v-else class="pt-list" data-scroll>
        <button v-for="p in list" :key="p.key" class="pt-row" :class="{ on: want[p.key], locked: p.by === 'emulator' }" data-focus @click="flip(p)">
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

const props = defineProps({ name: String, emuName: { type: String, default: 'RPCS3' }, serial: String, version: String, why: String, list: { type: Array, default: () => [] } });
const want = reactive(Object.fromEntries(props.list.map((p) => [p.key, p.on])));
const changed = computed(() => props.list.some((p) => want[p.key] !== p.on));
const changes = () => props.list.filter((p) => want[p.key] !== p.on).map((p) => ({ key: p.key, on: want[p.key] }));
function flip(p) {
  if (p.by === 'emulator') return toast(`Turned on in ${props.emuName}. Turn it off there.`, 'info', 3500);
  want[p.key] = !want[p.key];
}
const el = ref(null);
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => changed.value && closeModal(changes()), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>

<style scoped>
.pt { width: min(760px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-4); }
.pt h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; }
.small { font-size: var(--t-sm); }
.pt-list { overflow-y: auto; min-height: 0; flex: 1; display: flex; flex-direction: column; gap: var(--s-2); padding: 2px; }
.pt-row { flex: none; display: flex; align-items: center; gap: var(--s-3); text-align: left; padding: var(--s-3) var(--s-4); border-radius: var(--r-md); background: var(--s1); color: inherit; border: 0; font: inherit; }
.pt-row:focus { background: var(--focus); color: var(--on-focus); outline: none; }
.pt-row.locked { opacity: 0.75; }
.box { flex: none; width: 26px; height: 26px; border-radius: var(--r-sm); border: 2px solid currentColor; display: grid; place-items: center; opacity: 0.85; }
.pt-row.on .box { background: currentColor; }
.pt-row.on .box .icon { color: var(--s0); }
.pt-row.on:focus .box .icon { color: var(--focus); }
.pt-mid { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pt-sub { font-size: var(--t-sm); opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
