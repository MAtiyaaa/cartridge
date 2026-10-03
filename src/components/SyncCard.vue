<template>
  <div class="subh">Sync <span class="pv">Preview</span></div>
  <p class="muted small" style="margin-top: -6px">Syncthing keeps folders the same on all your devices. A first look: Cartridge reads what your Syncthing shares and changes nothing. Syncing saves from Cartridge comes later.</p>
  <div v-if="!s" class="muted small"><Icon name="mdiSync" :size="14" class="spin" /> Looking for Syncthing…</div>
  <div v-else class="stack">
    <div class="lrow" data-focus>
      <Icon name="mdiSyncCircle" :size="24" />
      <div class="l-mid"><b>{{ s.running ? 'Syncthing is running' : s.installed ? 'Syncthing is installed' : 'No Syncthing on this device' }}</b><span class="l-sub">{{ s.running ? `This device ${s.me} · ${s.devices.filter((d) => d.online).length} of ${s.devices.length} other devices online` : s.why }}</span></div>
      <span v-if="s.running" class="status ok"><Icon name="mdiCheck" :size="14" />Running</span>
    </div>
    <div v-for="f in s.folders || []" :key="f.id" class="lrow" data-focus>
      <Icon :name="f.saves ? 'mdiContentSaveOutline' : 'mdiFolderOutline'" :size="22" />
      <div class="l-mid"><b>{{ f.label || f.id }}</b><span class="l-sub mono">{{ f.path.replace(store.info?.home || '\0', '~') }}{{ f.saves ? ` · looks like ${f.saves} saves` : '' }}</span></div>
      <span v-if="f.done != null" class="status" :class="f.done >= 100 ? 'ok' : 'warn'">{{ f.done >= 100 ? 'Up to date' : f.done + '%' }}</span>
    </div>
  </div>
</template>
<script setup>
// Settings → Storage → Sync (0.9.19, owner: preliminary Syncthing work; read only, see electron/syncthing.js)
import { ref, onMounted } from 'vue';
import { store, call } from '../store.js';
import Icon from './Icon.vue';
const s = ref(null);
onMounted(async () => { s.value = (await call('sync:status').catch(() => null)) || { installed: false, running: false, why: 'Couldn’t check.' }; });
</script>
<style scoped>
.pv { margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: var(--s2); color: var(--muted); font-size: var(--t-xs); font-weight: 600; font-family: var(--body); }
.small { font-size: var(--t-sm); }
.mono { font-family: ui-monospace, monospace; }
</style>
