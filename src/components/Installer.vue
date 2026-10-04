<template>
  <div class="scrim" ref="el">
    <div class="dialog inst">
      <div class="inst-head">
        <Logo :size="34" />
        <div><div class="eyebrow">Settings → Emulators</div><h2>Cartridge Installer</h2></div>
        <button class="btn" data-focus style="margin-left: auto" @click="closeModal(null)"><Icon name="mdiClose" />Close</button>
      </div>
      <div class="inst-body" data-scroll><EmuGet flow /></div>
    </div>
  </div>
</template>
<script setup>
// Cartridge Installer (0.9.24, owner: "download other emulators" renamed, and it should feel like an
// installer): an Emulation folder laid out like ES-DE on the drive you pick, the emulators you tick,
// their own AppImages in ~/Applications as EmuDeck does, saves and textures linked in. EmuGet's flow.
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal } from '../store.js';
import Icon from './Icon.vue';
import Logo from './Logo.vue';
import EmuGet from './EmuGet.vue';
const el = ref(null);
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  setTimeout(() => focusFirst(el.value?.querySelector('.inst-body') || el.value), 300);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.inst { width: min(1180px, 96vw); height: min(92vh, 980px); display: flex; flex-direction: column; gap: var(--s-3); }
.inst-head { display: flex; align-items: center; gap: var(--s-3); }
.inst-head h2 { margin: 2px 0 0; font-size: var(--t-xl); }
.inst-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px; }
</style>
