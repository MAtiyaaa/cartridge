<template>
  <div class="scrim" ref="el" @click.self="closeModal(false)">
    <div class="dialog sp">
      <div class="sp-head">
        <h2>Check before Steam changes</h2>
        <span class="chip">{{ account }}</span>
      </div>
      <p class="muted" style="margin: 0; font-size: 13px">This is exactly what goes into Steam. Your existing shortcuts are not touched{{ removing.length ? ' except the ones listed to remove' : '' }}, and a backup is kept so you can undo it.</p>
      <div class="sp-list" data-scroll>
        <div v-for="e in entries" :key="e.romId" class="sp-e" data-focus tabindex="0">
          <div class="sp-top">
            <b>{{ e.name }}</b>
            <span class="chip how">{{ HOW[e.how] || e.how }}</span>
            <span v-for="c in e.collections" :key="c" class="chip"><Icon name="mdiFolderOutline" :size="13" />{{ c }}</span>
            <span v-if="e.proton" class="chip">Proton</span>
          </div>
          <div class="sp-kv"><span>Target</span><code>{{ e.target }}</code></div>
          <div class="sp-kv"><span>Start in</span><code>{{ e.start }}</code></div>
          <div class="sp-kv"><span>Launch options</span><code>{{ e.lo || '(none)' }}</code></div>
          <div v-if="e.fallback" class="sp-note"><Icon name="mdiInformationOutline" :size="15" />{{ e.how === 'learned' && /RPCS3/i.test(e.target) ? 'RPCS3 has not seen this game yet, so it starts from the file instead of the game ID.' : 'No game ID found, so it starts from the file.' }}</div>
        </div>
        <div v-for="r in removing" :key="r.appid" class="sp-e rm" data-focus tabindex="0"><Icon name="mdiMinusCircleOutline" :size="18" /><b>{{ r.name }}</b><span class="muted small">will be removed from Steam</span></div>
        <div v-for="s in skipped" :key="s.romId" class="sp-e skip" data-focus tabindex="0"><Icon name="mdiAlertOutline" :size="18" /><div><b>{{ s.name || 'A game' }}</b> <span class="muted small">skipped: {{ s.why }}</span></div></div>
      </div>
      <div class="row" style="justify-content: flex-end; gap: 10px">
        <button class="btn" data-focus @click="closeModal(false)">Cancel</button>
        <button class="btn primary" data-focus data-autofocus :disabled="!entries.length && !removing.length" @click="closeModal(true)"><Icon name="mdiSteam" />{{ label }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal } from '../store.js';
import Icon from './Icon.vue';

const props = defineProps({ account: String, entries: { type: Array, default: () => [] }, skipped: { type: Array, default: () => [] }, removing: { type: Array, default: () => [] } });
const HOW = { learned: 'Like your other shortcuts', yours: 'Your setup', emudeck: 'EmuDeck', appimage: 'AppImage', flatpak: 'Flatpak', native: 'Installed program', retrodeck: 'RetroDECK' };
const label = computed(() => {
  const a = props.entries.length, r = props.removing.length;
  return [a && `Add ${a}`, r && `Remove ${r}`].filter(Boolean).join(', ') + ' and restart Steam';
});
const el = ref(null);
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(false), start: () => closeModal(true), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value, '[data-autofocus]') || focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.sp { width: min(980px, 95vw); max-height: 90vh; display: flex; flex-direction: column; }
.sp-head { display: flex; align-items: center; gap: 12px; }
.sp-head h2 { margin: 0; }
.sp-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; min-height: 0; flex: 1; padding: 2px; }
.sp-e { display: flex; flex-direction: column; gap: 5px; padding: 12px 14px; border-radius: var(--r-md); background: var(--s2); outline: none; }
.sp-e:focus { border-color: var(--primary-l); box-shadow: var(--ring); }
.sp-e.rm, .sp-e.skip { flex-direction: row; align-items: center; gap: 10px; }
.sp-e.rm { color: #ffb4b4; }
.sp-e.skip { color: #ffd978; }
.sp-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sp-top b { font-size: var(--t-md); margin-right: 4px; }
.chip.how { background: rgba(var(--primary-rgb), 0.22); }
.sp-kv { display: grid; grid-template-columns: 120px 1fr; gap: 10px; font-size: var(--t-xs); min-width: 0; }
.sp-kv span { color: var(--muted); }
.sp-kv code { font-family: var(--mono, monospace); font-size: var(--t-xs); word-break: break-all; color: var(--text); }
.sp-note { display: flex; align-items: center; gap: 6px; font-size: var(--t-xs); color: var(--muted); }
</style>
