<template>
  <section class="rtp">
    <div class="shelf-title">{{ title }}<span class="count">{{ sub }}</span></div>
    <div class="rtp-chips">
      <span v-for="it in ap.items" :key="it.key" class="status" :class="TONE[it.status]" :title="it.text"><Icon :name="GLYPH[it.status]" :size="14" />{{ it.label }}</span>
    </div>
    <div v-for="it in issues" :key="it.key" class="rtp-check" :class="it.status">
      <Icon :name="it.status === 'bad' ? 'mdiAlertCircle' : it.status === 'wait' ? 'mdiTimerSand' : 'mdiAlert'" :size="18" />
      <span>{{ it.text }}</span>
      <button v-if="it.fix" class="btn small" data-focus @click="it.fix.run()">{{ it.fix.label }}</button>
    </div>
    <div v-if="ap.state === 'needs' || ap.cands.length > 1" class="rtp-acts">
      <button v-if="ap.state === 'needs' && ap.fixable" class="btn primary" data-focus @click="ap.fixAll()"><Icon name="mdiAutoFix" />Fix everything</button>
      <button v-if="ap.cands.length > 1" class="btn small" data-focus @click="ap.pickEmulator()"><Icon name="mdiSwapHorizontal" :size="18" />Change emulator</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { emus } from './play.js';
import Icon from '../components/Icon.vue';

const props = defineProps({ ap: { type: Object, required: true } });
// the app's own status chips (styles.css .status): green on this device, red missing, gold to check
const TONE = { ok: 'ok', bad: 'bad', warn: 'warn', na: 'none', wait: 'none' };
const GLYPH = { ok: 'mdiCheck', bad: 'mdiClose', warn: 'mdiHelp', na: 'mdiMinus', wait: 'mdiTimerSand' };

const issues = computed(() => props.ap.items.filter((x) => x.status === 'bad' || x.status === 'warn' || x.status === 'wait'));
const title = computed(() => {
  const n = props.ap.needed.length;
  return props.ap.state === 'ready' ? 'Ready to play' : props.ap.state === 'wait' ? 'Getting ready' : `${n} ${n === 1 ? 'thing' : 'things'} needed`;
});
const sub = computed(() => {
  const ap = props.ap, emu = ap.items.find((x) => x.key === 'emu');
  const on = emus.device ? ` on ${emus.device}` : '';
  return emu?.status === 'ok' ? emu.text + on : ap.con?.name + on;
});
</script>

<style scoped>
.rtp { display: flex; flex-direction: column; gap: var(--s-3); margin-bottom: var(--s-6); }
.rtp .shelf-title { margin: 0; }
.rtp-chips { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.rtp-chips .status.none { color: var(--dim); }
.rtp-check { display: flex; align-items: center; gap: var(--s-3); min-height: 38px; font-size: var(--t-sm); flex-wrap: wrap; }
.rtp-check > span { flex: 0 1 auto; min-width: 0; }
.rtp-check.bad { color: #ffa39c; }
.rtp-check.warn { color: #ffd978; }
.rtp-check.wait { color: var(--muted); }
.rtp-check .btn { color: var(--text); }
.rtp-check .btn:focus-visible, .pad-mode .rtp-check .btn:focus { color: var(--on-focus); }
.rtp-acts { display: flex; align-items: center; gap: var(--s-2); flex-wrap: wrap; margin-top: var(--s-1); }
</style>
