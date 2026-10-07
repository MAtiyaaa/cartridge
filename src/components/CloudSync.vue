<template>
  <!-- Cartridge Cloud Sync (0.9.51, owner: like Steam Cloud's sync before a game): shown while the game's saves are
       checked against RomM and the newest is brought here, then the game starts -->
  <div class="cs-scrim">
    <div class="dialog cs" role="status" aria-live="polite">
      <div class="cs-mark" :class="st.state">
        <svg viewBox="0 0 64 64" aria-hidden="true"><circle class="cs-track" cx="32" cy="32" r="29" /><circle class="cs-arc" cx="32" cy="32" r="29" pathLength="100" /></svg>
        <Icon :name="ICON[st.state] || 'mdiCloudSyncOutline'" :size="30" class="cs-ico" />
      </div>
      <div class="cs-text">
        <div class="cs-title">Cartridge Cloud Sync</div>
        <div class="cs-label">{{ st.label }}</div>
        <div v-if="st.game" class="cs-game muted">{{ st.game }}</div>
      </div>
      <div class="cs-bar" :class="{ live: !st.of }"><i :style="{ width: st.of ? Math.round((st.done / st.of) * 100) + '%' : '35%' }" /></div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { store } from '../store.js';
import { pushLayer } from '../nav.js';
import Icon from './Icon.vue';
const st = computed(() => store.cloudSync || {});
const ICON = { done: 'mdiCloudCheckOutline', offline: 'mdiCloudOffOutline', error: 'mdiCloudAlertOutline', conflict: 'mdiCallSplit' };
// while it checks, presses wait (a conflict's question opens over it with its own layer)
let layer;
const none = () => {};
onMounted(() => { layer = pushLayer(document.querySelector('.cs-scrim'), { back: none, accept: none, start: none, select: none, x: none, y: none, lb: none, rb: none, lt: none, rt: none, up: none, down: none, left: none, right: none }); });
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.cs-scrim { position: fixed; inset: 0; z-index: 46; display: grid; place-items: center; background: rgba(3, 4, 7, 0.55); animation: fade 0.18s ease-out; }
.cs { min-width: 0; width: min(440px, calc(100vw - 32px)); display: grid; grid-template-columns: auto 1fr; gap: var(--s-4); align-items: center; padding: var(--s-5); }
.cs-mark { position: relative; width: 64px; height: 64px; color: var(--text); }
.cs-mark svg { width: 64px; height: 64px; display: block; }
.cs-track { fill: none; stroke: currentColor; stroke-width: 2.4; opacity: 0.12; }
.cs-arc { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 22 100; transform-origin: 32px 32px; animation: cs-turn 1.1s linear infinite; opacity: 0.85; }
.cs-mark.done .cs-arc { stroke-dasharray: 100 100; animation: none; stroke: var(--green, #2fb36a); transition: stroke-dasharray 0.4s var(--ease-out, ease-out); }
.cs-mark.offline .cs-arc, .cs-mark.error .cs-arc, .cs-mark.conflict .cs-arc { animation: none; stroke-dasharray: 0 100; }
.cs-ico { position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
.cs-mark.done .cs-ico { color: var(--green, #2fb36a); }
@keyframes cs-turn { to { transform: rotate(360deg); } }
.cs-text { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.cs-title { font-family: var(--display); font-weight: 700; font-size: var(--t-lg); }
.cs-label { font-size: var(--t-sm); overflow-wrap: anywhere; }
.cs-game { font-size: var(--t-xs); overflow-wrap: anywhere; }
.cs-bar { grid-column: 1 / -1; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--text) 12%, transparent); overflow: hidden; }
.cs-bar i { display: block; height: 100%; background: var(--text); border-radius: 2px; transition: width 0.3s var(--ease-out, ease-out); }
.cs-bar.live i { animation: cs-slide 1.2s ease-in-out infinite; }
@keyframes cs-slide { from { transform: translateX(-100%); } to { transform: translateX(290%); } }
@media (prefers-reduced-motion: reduce) { .cs-arc, .cs-bar.live i { animation: none; } }
:global(body.motion-reduce .cs-arc), :global(body.motion-reduce .cs-bar.live i) { animation: none; }
</style>
