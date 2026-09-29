<template>
  <section class="rtp" :class="ap.state" aria-live="polite">
    <header class="rtp-head">
      <div class="rtp-badge" :class="ap.state">
        <Icon v-if="ap.state === 'ready'" name="mdiCheckBold" :size="30" />
        <span v-else-if="ap.state === 'needs'" class="rtp-count">{{ ap.needed.length }}</span>
        <span v-else class="rtp-spin" />
      </div>
      <div class="rtp-title">
        <h3>{{ title }}</h3>
        <p>{{ sub }}</p>
      </div>
    </header>

    <ul class="rtp-grid">
      <li v-for="it in ap.items" :key="it.key" class="rtp-tile" :class="it.status">
        <span class="rtp-ic"><Icon :name="ICON[it.key]" :size="18" /></span>
        <div class="rtp-tx">
          <b>{{ it.label }}</b>
          <span :title="it.text">{{ it.text }}</span>
        </div>
        <span class="rtp-st"><Icon :name="GLYPH[it.status]" :size="16" /></span>
        <button v-if="it.fix" class="rtp-fix" data-focus @click="it.fix.run()">{{ it.fix.label }}</button>
        <button v-else-if="it.change" class="rtp-fix quiet" data-focus @click="ap.pickEmulator()"><Icon name="mdiSwapHorizontalBold" :size="15" />Change</button>
      </li>
    </ul>

    <button v-if="ap.state === 'needs'" class="rtp-all" data-focus :disabled="!ap.fixable" @click="ap.fixAll()">
      <Icon name="mdiAutoFix" :size="22" />Fix everything
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { emus } from './play.js';
import Icon from '../components/Icon.vue';

const props = defineProps({ ap: { type: Object, required: true } });
const ICON = { rom: 'mdiDisc', emu: 'mdiGamepadVariantOutline', bios: 'mdiChip', core: 'mdiPuzzleOutline', update: 'mdiUpdate', storage: 'mdiSd' };
const GLYPH = { ok: 'mdiCheck', bad: 'mdiClose', warn: 'mdiHelpCircleOutline', na: 'mdiMinus', wait: 'mdiTimerSand' };

const title = computed(() => {
  const n = props.ap.needed.length;
  return props.ap.state === 'ready' ? 'Ready to play' : props.ap.state === 'wait' ? 'Getting ready' : `${n} ${n === 1 ? 'thing' : 'things'} needed`;
});
const sub = computed(() => {
  const ap = props.ap;
  if (ap.state === 'needs') return ap.needed.map((x) => x.text).slice(0, 3).join(' · ');
  if (ap.state === 'wait') return ap.items.find((x) => x.status === 'wait')?.text || 'Checking';
  const d = ap.doubts.length;
  const where = `${ap.app?.label || ap.con.name}${emus.device ? ' on ' + emus.device : ''}`;
  return d ? `${where}. ${d} to double check` : where;
});
</script>

<style scoped>
.rtp { --tone: var(--green-l); --tone-bg: rgba(63, 185, 80, 0.16); display: flex; flex-direction: column; gap: var(--s-4); max-width: 720px; padding: var(--s-4); border-radius: var(--r-lg); background: var(--s1); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); animation: rtp-in var(--d-slow) var(--ease) both; }
.rtp.needs { --tone: #ff9b93; --tone-bg: rgba(255, 107, 97, 0.16); box-shadow: inset 0 0 0 1px rgba(255, 107, 97, 0.28); }
.rtp.wait { --tone: var(--primary-t); --tone-bg: rgba(var(--primary-rgb), 0.18); }
@keyframes rtp-in { from { opacity: 0; transform: translateY(6px); } }

.rtp-head { display: flex; align-items: center; gap: var(--s-4); min-width: 0; }
.rtp-badge { flex: none; width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--tone-bg); color: var(--tone); box-shadow: inset 0 0 0 2px var(--tone); }
.rtp-badge.ready { background: var(--green); color: #07140a; box-shadow: none; }
.rtp-count { font: 800 26px var(--display); font-stretch: var(--display-stretch); font-variant-numeric: tabular-nums; }
.rtp-spin { width: 24px; height: 24px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.18); border-top-color: var(--tone); animation: rtp-rot 0.9s linear infinite; }
@keyframes rtp-rot { to { transform: rotate(360deg); } }
.rtp-title { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rtp-title h3 { margin: 0; font: 800 var(--t-xl) var(--display); font-stretch: var(--display-stretch); letter-spacing: 0.05em; text-transform: uppercase; color: var(--tone); line-height: 1.1; }
.rtp-title p { margin: 0; color: var(--muted); font-size: var(--t-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.rtp-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-2); }
.rtp-tile { position: relative; display: flex; align-items: center; gap: var(--s-3); min-height: 60px; padding: var(--s-2) var(--s-3); border-radius: var(--r-md); background: var(--s2); min-width: 0; }
.rtp-ic { flex: none; width: 34px; height: 34px; border-radius: var(--r-sm); display: grid; place-items: center; background: var(--s3); color: var(--muted); }
.rtp-tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.rtp-tx b { font-size: var(--t-xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.rtp-tx span { font-size: var(--t-sm); line-height: 1.25; color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.rtp-st { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; }
.rtp-tile.ok .rtp-st { background: var(--green); color: #07140a; }
.rtp-tile.ok .rtp-ic { color: var(--green-l); }
.rtp-tile.bad { background: rgba(255, 107, 97, 0.12); box-shadow: inset 0 0 0 1px rgba(255, 107, 97, 0.4); }
.rtp-tile.bad .rtp-st { background: var(--red); color: #2a0a07; }
.rtp-tile.bad .rtp-ic { color: #ff9b93; }
.rtp-tile.warn .rtp-st { background: var(--gold); color: #2b2100; }
.rtp-tile.warn .rtp-ic { color: var(--gold); }
.rtp-tile.wait .rtp-st { background: rgba(var(--primary-rgb), 0.3); color: var(--primary-t); }
.rtp-tile.na { opacity: 0.55; }
.rtp-tile.na .rtp-st { background: var(--s3); color: var(--dim); }

.rtp-fix { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: var(--r-sm); background: var(--s3); color: var(--text); font-size: var(--t-xs); font-weight: 700; white-space: nowrap; transition: background var(--d-fast), color var(--d-fast); }
.rtp-fix.quiet { background: none; color: var(--muted); }
.rtp-fix:hover { background: var(--s3); }
.rtp-fix:focus-visible, .pad-mode .rtp-fix:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; }

.rtp-all { display: flex; align-items: center; justify-content: center; gap: 10px; height: 56px; border-radius: var(--r-md); background: var(--btn, var(--primary)); color: var(--on-btn, var(--on-primary)); font: 800 var(--t-lg) var(--display); font-stretch: var(--display-stretch); letter-spacing: 0.06em; text-transform: uppercase; transition: background var(--d-fast), color var(--d-fast), transform var(--d-fast); }
.rtp-all:active { transform: scale(0.99); }
.rtp-all:disabled { opacity: 0.4; }
.rtp-all:focus-visible, .pad-mode .rtp-all:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; }

@media (max-width: 760px) { .rtp-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
