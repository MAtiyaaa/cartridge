<template>
  <Transition name="pair">
    <div v-if="req" class="pair-scrim">
      <div class="pair glass">
        <div class="pair-ic"><Icon name="mdiCellphoneLink" :size="30" /></div>
        <div class="pair-t">A phone wants to connect</div>
        <div class="pair-sub">Enter this code on <b>{{ req.name }}</b></div>
        <div class="code">
          <span v-for="(c, i) in req.code.split('')" :key="i">{{ c }}</span>
        </div>
        <div class="pair-exp">Expires in {{ left }}s</div>
        <button class="btn" data-focus data-autofocus @click="deny"><Icon name="mdiClose" />Deny</button>
      </div>
    </div>
  </Transition>
</template>
<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { call } from '../store.js';
import Icon from './Icon.vue';

// Shown on this device when a phone asks to pair (Settings → Phone remote)
const req = ref(null);
const left = ref(0);
let t = null;
const tick = () => { left.value = Math.max(0, Math.round(((req.value?.expires || 0) - Date.now()) / 1000)); if (!left.value) req.value = null; };
const off1 = window.cart.on('remote:pair', (r) => { req.value = r; tick(); clearInterval(t); t = setInterval(tick, 1000); });
const off2 = window.cart.on('remote:pair:done', () => { req.value = null; clearInterval(t); });
function deny() { call('remote:pair:deny').catch(() => {}); req.value = null; }
onBeforeUnmount(() => { off1?.(); off2?.(); clearInterval(t); });
</script>
<style scoped>
.pair-scrim { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; background: rgba(3, 4, 8, 0.72); }
/* see-through only in Glass (Plain and Glass stay apart) */
:global(body.elements-glass .pair-scrim) { background: rgba(3, 4, 8, 0.6); backdrop-filter: blur(6px); }
.pair { width: min(460px, 90vw); padding: 30px 28px 24px; border-radius: 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6); }
.pair-ic { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; color: var(--primary-t); background: radial-gradient(circle, rgba(var(--primary-rgb), 0.35), rgba(var(--primary-rgb), 0.08)); }
.pair-t { font-family: var(--display); font-size: 22px; font-weight: 700; }
.pair-sub { color: var(--muted); font-size: 14px; }
.code { display: flex; gap: 8px; margin: 10px 0 4px; }
.code span { width: 48px; height: 62px; display: grid; place-items: center; border-radius: 12px; background: rgba(255, 255, 255, 0.07); border: 1px solid var(--line-2); font: 700 32px var(--display); font-variant-numeric: tabular-nums; }
.pair-exp { font-size: 12.5px; color: var(--dim); margin-bottom: 8px; }
.pair-enter-active, .pair-leave-active { transition: opacity var(--fade-in); }
.pair-enter-from, .pair-leave-to { opacity: 0; }
</style>
