<template>
  <div class="view ra-g" data-scroll ref="el">
    <div v-if="!g && !error" class="center" style="height: 60vh"><div class="spinner" /></div>
    <div v-else-if="error" class="empty">{{ error }}</div>
    <template v-else>
      <header class="rg-head">
        <img class="rg-icon" :src="img(g.icon)" />
        <div class="rg-info">
          <div class="eyebrow">{{ g.console }}<template v-if="g.offline"> · offline</template></div>
          <h1 class="rg-title">{{ g.title }}</h1>
          <div class="bar rg-bar"><i :style="{ width: pct + '%' }" /></div>
          <div class="rg-prog">
            <span><b>{{ g.earned }}</b> of {{ g.total }} achievements · {{ pct }}%</span>
            <span v-if="g.earnedHc">{{ g.earnedHc }} in hardcore</span>
            <span v-if="award" class="chip gold"><Icon name="mdiCrown" :size="14" />{{ award }}</span>
          </div>
          <div class="row" style="gap: 10px; margin-top: 6px">
            <button v-if="g.romId" class="btn primary" data-focus @click="go('game', { romId: g.romId })"><Icon name="mdiGamepadVariantOutline" />Open in library</button>
            <div class="seg">
              <button v-for="f in filters" :key="f.v" data-focus :class="{ on: filter === f.v }" @click="filter = f.v">{{ f.l }}</button>
            </div>
          </div>
        </div>
      </header>
      <div v-if="!shown.length" class="muted" style="padding: 20px 0">{{ g.total ? 'Nothing here with this filter.' : 'This game has no achievements yet.' }}</div>
      <div class="rg-list">
        <div v-for="a in shown" :key="a.id" class="rg-ach glass" :class="{ locked: !a.earned && !a.earnedHc }" data-focus tabindex="0">
          <img class="rg-badge" :src="img(a.badge)" loading="lazy" />
          <div class="rg-a-body">
            <div class="rg-a-title">{{ a.title }}<span v-if="a.type" class="rg-type">{{ typeLabel(a.type) }}</span></div>
            <div class="rg-a-desc">{{ a.desc }}</div>
            <div class="rg-a-meta">
              <span class="pts">{{ a.points }} pts</span>
              <span v-if="a.earnedHc" class="chip hc">HARDCORE</span>
              <span v-if="a.earned || a.earnedHc">Unlocked {{ day(a.earnedHc || a.earned) }}</span>
              <span v-else>Locked</span>
              <span v-if="a.rarity != null">{{ a.rarity }}% of players</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { call, img, go, setBg } from '../store.js';
import { useView } from '../useView.js';
import { focusFirst } from '../nav.js';
import Icon from '../components/Icon.vue';

// One game's RetroAchievements: progress plus every achievement, unlocked or locked.
const props = defineProps({ gameId: [Number, String] });
const el = ref(null);
const g = ref(null);
const error = ref('');
const filter = ref('all');
const filters = [{ v: 'all', l: 'All' }, { v: 'unlocked', l: 'Unlocked' }, { v: 'locked', l: 'Locked' }];
const pct = computed(() => (g.value?.total ? Math.round((g.value.earned / g.value.total) * 100) : 0));
const award = computed(() => ({ mastered: 'Mastered', completed: 'Completed', 'beaten-hardcore': 'Beaten (hardcore)', 'beaten-softcore': 'Beaten' }[g.value?.award] || ''));
const shown = computed(() => {
  const list = g.value?.achievements || [];
  if (filter.value === 'unlocked') return list.filter((a) => a.earned || a.earnedHc);
  if (filter.value === 'locked') return list.filter((a) => !a.earned && !a.earnedHc);
  return list;
});
const typeLabel = (t) => ({ progression: 'Progression', win_condition: 'Win condition', missable: 'Missable' }[t] || t);
const day = (d) => { const t = new Date(String(d).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? '' : 'Z')); return isNaN(t) ? d : t.toLocaleDateString(); };

async function load(force = false) {
  error.value = '';
  try { g.value = await call('ra:game', { gameId: props.gameId, force }); if (g.value.ingame || g.value.boxart) setBg({ src: img(g.value.ingame || g.value.boxart), blur: !g.value.ingame }); }
  catch (e) { error.value = e.message; }
}
useView({ x: () => load(true), y: () => { const i = filters.findIndex((f) => f.v === filter.value); filter.value = filters[(i + 1) % filters.length].v; } },
  [{ b: 'X', label: 'Refresh' }, { b: 'Y', label: 'Filter' }, { b: 'B', label: 'Back' }]);
onMounted(async () => { await load(); focusFirst(el.value); });
</script>

<style scoped>
.ra-g { padding-top: 18px; }
.rg-head { display: flex; gap: 24px; align-items: flex-start; margin: 6px 0 26px; }
.rg-icon { width: 120px; height: 120px; border-radius: 14px; object-fit: cover; flex: none; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5); }
.rg-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.rg-title { font-size: 34px; }
.rg-bar { height: 8px; max-width: 560px; }
.rg-bar i { background: linear-gradient(90deg, #f5c542, #ffdf80); }
.rg-prog { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; font-size: 14px; color: #d4d8e2; }
.chip.gold { background: rgba(245, 197, 66, 0.18); color: #ffd978; display: inline-flex; gap: 5px; align-items: center; }
.chip.hc { font-size: 9.5px; padding: 2px 6px; background: rgba(255, 90, 90, 0.18); color: #ff9b9b; }
.rg-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 12px; padding-bottom: 40px; }
.rg-ach { display: flex; gap: 14px; padding: 12px 14px; border-radius: 12px; outline: none; transition: transform 0.14s ease-out; }
.rg-ach:focus { transform: scale(1.02); }
.rg-ach.locked { opacity: 0.72; }
.rg-badge { width: 64px; height: 64px; border-radius: 8px; flex: none; }
.rg-a-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.rg-a-title { font-family: var(--display); font-weight: 600; font-size: 15px; display: flex; gap: 8px; align-items: center; }
.rg-type { font-family: var(--body); font-weight: 500; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--line-2); border-radius: 4px; padding: 1px 5px; }
.rg-a-desc { font-size: 12.5px; color: #c3c9d4; }
.rg-a-meta { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; font-size: 11.5px; color: var(--muted); }
.rg-a-meta .pts { color: var(--gold); font-weight: 600; }
</style>
