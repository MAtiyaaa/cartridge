<template>
  <div class="eg">
    <div v-if="!list" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Looking at what's installed…</div>
    <template v-else>
      <template v-for="c in list" :key="c.key">
        <div class="subh">{{ c.name }}</div>
        <div class="stack">
          <button v-for="e in c.emus" :key="c.key + e.id" class="lrow" data-focus @click="get(c, e)">
            <EmuIcon :id="e.id" :size="26" fallback="mdiGamepadVariantOutline" />
            <div class="l-mid"><b>{{ e.label }}</b><span class="l-sub">{{ e.from }}</span></div>
            <span v-if="busy === c.key + e.id" class="status"><Icon name="mdiSync" :size="14" class="spin" />{{ pct != null ? pct + '%' : 'Starting…' }}</span>
            <span v-else-if="e.installed" class="status ok"><Icon name="mdiCheck" :size="14" />Installed</span>
            <span v-else class="l-end"><Icon name="mdiDownload" :size="18" />Download</span>
          </button>
        </div>
      </template>
      <p class="muted small">AppImages go in {{ appsDir }}, Flatpaks are installed for you only. Each one comes from the emulator's own releases. Emulators need their BIOS or firmware for some consoles: Emulator setup takes care of that.</p>
    </template>
  </div>
</template>

<script setup>
// Pick your own emulators (0.9.17): every console's emulators, a green check for the ones here, and
// Download (the emulator's own AppImage from GitHub, or its Flatpak) for the rest
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { store, call, toast } from '../store.js';
import Icon from './Icon.vue';
import EmuIcon from './EmuIcon.vue';

const list = ref(null), busy = ref(''), pct = ref(null);
const appsDir = '~/Applications';
async function load() { list.value = await call('emuget:list').catch(() => []); }
async function get(c, e) {
  if (busy.value) return;
  if (e.installed) return toast(`${e.label} is already on this device.`, 'info', 2500);
  busy.value = c.key + e.id; pct.value = null;
  try { await call('emuget:install', { key: c.key, id: e.id }); toast(`${e.label} is installed`, 'ok', 3000, 'mdiCheck'); }
  catch (err) { if (!/abort/i.test(err.message)) toast(err.message, 'error', 6000); }
  busy.value = ''; load();
}
let off = null;
onMounted(() => { off = window.cart.on('emuget-progress', (m) => { if (m.pct != null) pct.value = m.pct; }); load(); });
onBeforeUnmount(() => off?.());
defineExpose({ load, store });
</script>

<style scoped>
.eg { display: flex; flex-direction: column; gap: var(--s-2); text-align: left; }
.stack { display: flex; flex-direction: column; gap: var(--s-2); }
.small { font-size: var(--t-sm); }
.l-end { display: inline-flex; align-items: center; gap: 6px; }
</style>
