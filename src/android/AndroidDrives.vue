<template>
  <!-- Settings → Storage on Android: every drive games can go to (internal storage, SD cards, USB drives) -->
  <div class="drv">
    <div class="subh">Drives</div>
    <p class="muted small drv-note">{{ list.length > 1 ? 'Downloads can go to any of these. Each drive keeps its games in its own ROMs folder, with a folder for each console.' : 'Put in an SD card or a USB drive and it shows up here, so downloads can go to it.' }}</p>
    <div v-if="loading && !list.length" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Looking for drives…</div>
    <div class="stack">
      <button v-for="d in list" :key="d.mount" class="lrow" data-focus :data-key="'drv-' + d.mount" @click="edit(d)">
        <Icon :name="d.removable ? 'mdiMicroSd' : 'mdiCellphone'" :size="24" />
        <div class="l-mid">
          <b>{{ d.label }}</b>
          <span class="l-sub">{{ bytes(d.free) }} free of {{ bytes(d.total) }} · <span class="mono">{{ d.roms ? short(d.roms) : 'No ROMs folder yet' }}</span></span>
          <span class="drv-bar"><i :style="{ width: used(d) + '%' }" /></span>
        </div>
        <span v-if="d.main" class="status">Main</span>
        <span v-else-if="!d.roms" class="status warn">Not set</span>
        <span class="l-end">{{ d.main ? '' : d.roms ? 'Change' : 'Pick folder' }}</span>
      </button>
    </div>
    <Toggle v-if="list.length > 1" :model-value="store.config.android?.askDrive !== false" label="Ask where to install" desc="Choose the drive each time you download. Off: games go to the drive you used last." @update:model-value="(v) => saveConfig({ android: { askDrive: v } })" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { store, saveConfig, choose, toast, bytes } from '../store.js';
import Icon from '../components/Icon.vue';
import Toggle from '../components/Toggle.vue';
import { drives, pickRoms } from './drives.js';

const list = ref([]);
const loading = ref(true);
const short = (p) => String(p || '').replace(/^\/storage\/emulated\/0/, 'Internal').replace(/^\/storage\//, '');
const used = (d) => (d.total ? Math.min(100, Math.max(2, Math.round(((d.total - d.free) / d.total) * 100))) : 0);
async function load() { loading.value = true; list.value = await drives(); loading.value = false; }

async function edit(d) {
  if (d.main) { toast('This drive holds your main ROMs folder. Change it with ROMs folder above.', 'info', 3500, 'mdiFolderOutline'); return; }
  let v = 'pick';
  if (d.roms) {
    v = await choose({ title: d.label, message: short(d.roms), options: [
      { label: 'Change ROMs folder', sub: 'Games already there stay where they are', value: 'pick', icon: 'mdiFolderEditOutline' },
      { label: 'Stop using this drive', sub: 'No files are touched; its games no longer count as on this device', value: 'forget', icon: 'mdiFolderRemoveOutline' },
    ] });
  }
  if (v === 'pick' && (await pickRoms(d))) toast(`Games for ${d.label} go to ${short((await drives()).find((x) => x.mount === d.mount)?.roms)}`, 'ok', 3000, 'mdiMicroSd');
  if (v === 'forget') await saveConfig({ android: { driveRoots: { ...(store.config.android?.driveRoots || {}), [d.mount]: '' } } });
  load();
}

// a card put in or taken out while this page is open
let timer = 0;
onMounted(() => { load(); timer = setInterval(() => drives().then((l) => { if (l.length !== list.value.length) list.value = l; }), 5000); });
onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.drv { display: flex; flex-direction: column; gap: var(--s-3); }
.drv-note { margin: -6px 0 0; max-width: 620px; }
.drv-bar { display: block; height: 4px; margin-top: 6px; max-width: 280px; border-radius: 2px; background: rgba(255, 255, 255, 0.12); overflow: hidden; }
.drv-bar i { display: block; height: 100%; border-radius: inherit; background: var(--text); opacity: 0.7; transition: width var(--d-med) var(--ease); }
.lrow:focus .drv-bar { background: rgba(0, 0, 0, 0.18); background: color-mix(in srgb, var(--on-focus) 18%, transparent); }
.lrow:focus .drv-bar i { background: var(--on-focus); }
</style>
