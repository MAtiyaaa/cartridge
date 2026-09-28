<template>
  <div class="cmp">
    <section class="game" :class="{ empty: !rom }">
      <template v-if="rom">
        <div class="cover">
          <img v-if="rom.cover && !coverFailed" :src="rom.cover" alt="" @error="coverFailed = true" />
          <Icon v-else name="mdiGamepadVariantOutline" :size="40" />
        </div>
        <div class="meta">
          <div class="plat">{{ rom.platform }}</div>
          <h1>{{ rom.name }}</h1>
          <div class="facts">
            <span v-if="year">{{ year }}</span>
            <span v-if="rom.size">{{ size(rom.size) }}</span>
            <span v-if="rom.installed" class="ok"><Icon name="mdiCheckCircle" :size="14" />Installed</span>
          </div>
          <p v-if="rom.summary" class="sum">{{ rom.summary }}</p>
          <div class="acts">
            <button class="b primary" @click="cmd({ open: true, romId: rom.id })"><Icon name="mdiOpenInNew" :size="18" />Open</button>
            <button v-if="!rom.installed" class="b" :disabled="!!dlFor(rom.id)" @click="cmd({ download: true, romId: rom.id })">
              <Icon :name="dlFor(rom.id) ? 'mdiProgressDownload' : 'mdiDownload'" :size="18" />{{ dlFor(rom.id) ? 'Queued' : 'Download' }}
            </button>
          </div>
        </div>
      </template>
      <div v-else class="idle">
        <Icon name="mdiGamepadSquare" :size="36" />
        <div>Highlight a game on the top screen</div>
      </div>
    </section>

    <section v-if="current" class="dl">
      <div class="dl-top"><Icon name="mdiDownload" :size="16" /><span class="dl-name">{{ current.name }}</span><span class="dl-pct">{{ pct }}%</span></div>
      <div class="bar"><i :style="{ width: pct + '%' }" /></div>
      <div v-if="queued > 0" class="dl-more">{{ queued }} more in the queue</div>
    </section>

    <section class="pad">
      <div class="dpad">
        <button class="k up" aria-label="Up" @pointerdown.prevent="press('up')"><Icon name="mdiChevronUp" :size="26" /></button>
        <button class="k left" aria-label="Left" @pointerdown.prevent="press('left')"><Icon name="mdiChevronLeft" :size="26" /></button>
        <button class="k right" aria-label="Right" @pointerdown.prevent="press('right')"><Icon name="mdiChevronRight" :size="26" /></button>
        <button class="k down" aria-label="Down" @pointerdown.prevent="press('down')"><Icon name="mdiChevronDown" :size="26" /></button>
      </div>
      <nav class="ctabs">
        <button v-for="t in tabs" :key="t.id" class="ctab" :class="{ on: route === t.id }" @click="cmd({ tab: t.id })"><Icon :name="t.icon" :size="20" /><span>{{ t.label }}</span></button>
      </nav>
      <div class="face">
        <button class="k b-back" aria-label="Back" @pointerdown.prevent="press('back')"><Icon name="mdiArrowLeft" :size="24" /></button>
        <button class="k b-ok" aria-label="Select" @pointerdown.prevent="press('accept')"><Icon name="mdiCheck" :size="26" /></button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Icon from '../components/Icon.vue';
import { applyTheme } from '../themes.js';

const cart = window.cart;
const state = ref({ route: 'home', rom: null });
const downloads = ref([]);
const coverFailed = ref(false);
const rom = computed(() => state.value?.rom || null);
const route = computed(() => state.value?.route || 'home');
const tabs = [
  { id: 'home', label: 'Home', icon: 'mdiHomeVariantOutline' },
  { id: 'search', label: 'Search', icon: 'mdiMagnify' },
  { id: 'downloads', label: 'Downloads', icon: 'mdiDownloadOutline' },
  { id: 'settings', label: 'Settings', icon: 'mdiCogOutline' },
];

const year = computed(() => {
  const y = rom.value?.year;
  if (!y) return '';
  const d = new Date(typeof y === 'number' && y < 1e11 ? y * 1000 : y);
  return isNaN(d) ? '' : d.getFullYear();
});
const active = computed(() => downloads.value.filter((d) => ['queued', 'downloading'].includes(d.status)));
const current = computed(() => active.value.find((d) => d.status === 'downloading') || null);
const queued = computed(() => active.value.length - (current.value ? 1 : 0));
const pct = computed(() => (current.value?.total ? Math.min(100, Math.round((current.value.done / current.value.total) * 100)) : 0));
const dlFor = (id) => active.value.find((d) => d.romId === id);

function size(n) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i > 1 ? 1 : 0)} ${u[i]}`;
}
const cmd = (c) => cart.call('android:companion:cmd', c).catch(() => {});
function press(action) {
  navigator.vibrate?.(8);
  cmd({ pad: action });
}

onMounted(async () => {
  cart.on('android:companion:state', (s) => { if (s?.rom?.id !== state.value?.rom?.id) coverFailed.value = false; state.value = s || {}; });
  cart.on('downloads', (l) => { downloads.value = l || []; });
  cart.on('config', (c) => c?.ui && applyTheme(c.ui));
  try { applyTheme((await cart.call('config:get')).ui); } catch {}
  try { state.value = (await cart.call('android:companion:get')) || state.value; } catch {}
  try { downloads.value = await cart.call('dl:list'); } catch {}
});
</script>

<style scoped>
.cmp {
  height: 100%; display: flex; flex-direction: column; gap: 12px; padding: 16px;
  background: radial-gradient(120% 90% at 0% 0%, rgba(var(--primary-rgb), 0.18), transparent 60%), var(--bg);
  touch-action: manipulation;
}
.game { flex: 1; min-height: 0; display: flex; gap: 16px; padding: 14px; border-radius: 16px; background: var(--glass); border: 1px solid var(--line); }
.cover { flex: 0 0 auto; width: 34%; max-width: 180px; aspect-ratio: 3 / 4; border-radius: 10px; overflow: hidden; background: var(--glass-hi); display: grid; place-items: center; color: var(--dim); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.plat { font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary-t); }
h1 { margin: 0; font-family: var(--display); font-size: 22px; line-height: 1.15; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.facts { display: flex; flex-wrap: wrap; gap: 6px; }
.facts span { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 3px 8px; border-radius: 999px; background: var(--glass-hi); color: var(--muted); }
.facts .ok { color: var(--green-l); }
.sum { margin: 2px 0 0; font-size: 13px; line-height: 1.45; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.acts { margin-top: auto; display: flex; gap: 8px; }
.b { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--line-2); background: var(--glass-2); color: var(--text); font: 500 14px var(--body); transition: transform 0.12s var(--ease), background 0.12s; }
.b:active { transform: scale(0.96); }
.b.primary { background: var(--primary); border-color: transparent; color: var(--on-primary); }
.b:disabled { opacity: 0.6; }
.idle { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--dim); font-size: 14px; }
.dl { padding: 10px 14px; border-radius: 14px; background: var(--glass); border: 1px solid var(--line); }
.dl-top { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
.dl-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
.dl-pct { font-variant-numeric: tabular-nums; }
.bar { margin-top: 8px; height: 6px; border-radius: 3px; background: var(--glass-hi); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--grad); transition: width 0.4s var(--ease); }
.dl-more { margin-top: 6px; font-size: 12px; color: var(--dim); }
.pad { display: grid; grid-template-columns: 132px minmax(0, 1fr) 56px; align-items: center; gap: 14px; }
.k { display: grid; place-items: center; border: 1px solid var(--line-2); background: var(--glass-2); color: var(--text); transition: transform 0.1s var(--ease), background 0.1s; }
.k:active { transform: scale(0.92); background: rgba(var(--primary-rgb), 0.45); }
.dpad { display: grid; grid-template: repeat(3, 44px) / repeat(3, 44px); gap: 0; }
.dpad .k { border-radius: 10px; }
.up { grid-area: 1 / 2; } .left { grid-area: 2 / 1; } .right { grid-area: 2 / 3; } .down { grid-area: 3 / 2; }
.ctabs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.ctab { display: flex; align-items: center; justify-content: center; gap: 6px; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: var(--glass); color: var(--muted); font: 500 13px var(--body); }
.ctab.on { color: var(--text); border-color: rgba(var(--primary-rgb), 0.6); background: rgba(var(--primary-rgb), 0.18); }
.face { display: flex; flex-direction: column; gap: 10px; }
.face .k { width: 56px; height: 56px; border-radius: 50%; }
.b-ok { background: var(--primary); border-color: transparent; color: var(--on-primary); }
@media (max-width: 420px) { .ctabs span { display: none; } }
</style>
