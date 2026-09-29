<template>
  <div class="scrim" ref="el">
    <div class="dialog tour">
      <div class="t-step">{{ i + 1 }} of {{ STEPS.length }}</div>
      <div class="t-keys"><Btn v-for="k in s.keys" :key="k" :b="k" /></div>
      <h2>{{ s.title }}</h2>
      <p class="muted">{{ s.text }}</p>
      <div class="row" style="justify-content: space-between">
        <button class="btn" data-focus @click="done">Skip</button>
        <button class="btn primary" data-focus data-autofocus @click="next">{{ i === STEPS.length - 1 ? 'Start playing' : 'Next' }}<Icon name="mdiArrowRight" /></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal } from '../store.js';
import Icon from './Icon.vue';
import Btn from './Btn.vue';

// Shown once after Setup: the few controls worth knowing. Touch and mouse work everywhere too.
const STEPS = [
  { keys: ['LT', 'RT'], title: 'Tabs', text: 'The triggers move between Home, Library, Consoles and the rest of the top bar. The bumpers switch sections inside a page.' },
  { keys: ['A', 'X', 'Y'], title: 'Games', text: 'A opens a game. X downloads it, or does the page’s main thing. Y searches, or opens More on a game.' },
  { keys: ['START', 'SELECT'], title: 'Anywhere', text: 'Start opens the Quick Menu. Select jumps to your downloads.' },
  { keys: [], title: 'Into Steam', text: 'Downloaded games go into Steam from their page (More, Add to Steam) or all at once from Settings → Steam. They start with the emulator Setup picked for their console.' },
];
const i = ref(0);
const s = computed(() => STEPS[i.value]);
const el = ref(null);
const done = () => closeModal(true);
async function next() { if (i.value < STEPS.length - 1) { i.value++; await nextTick(); focusFirst(el.value, '[data-autofocus]'); } else done(); }
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: done, start: done, lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value, '[data-autofocus]');
});
onBeforeUnmount(() => layer?.pop());
</script>

<style scoped>
.tour { width: min(560px, 92vw); gap: var(--s-4); }
.t-step { font-size: var(--t-sm); font-weight: 600; color: var(--dim); }
.t-keys { display: flex; gap: var(--s-2); min-height: 22px; }
.t-keys :deep(.pb) { transform: scale(1.5); transform-origin: left center; margin-right: 14px; }
.tour h2 { font-size: var(--t-xl); }
.tour p { margin: 0; line-height: 1.55; font-size: var(--t-md); }
</style>
