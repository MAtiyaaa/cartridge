<template>
  <div class="aa" ref="el">
    <div v-if="loading" class="center" style="height: 300px"><div class="spinner" /></div>

    <!-- nothing yet from either source -->
    <section v-else-if="!items.length && !unlocks.length" class="aa-empty glass">
      <div class="eyebrow">Achievements</div>
      <h1 class="big">Nothing here yet</h1>
      <p class="muted">RetroAchievements and the trophies your emulators keep (RPCS3, shadPS4, Xenia, Vita3K) all show up here together.</p>
      <div class="row" style="gap: 12px; flex-wrap: wrap">
        <button v-if="!raOn" class="btn primary" data-focus @click="store.achTab = 'ra'"><img class="ra-mark" :src="raLogo" alt="" />Sign in to RetroAchievements</button>
        <button class="btn" data-focus @click="store.achTab = 'others'"><Grade g="P" :size="18" />Find emulator trophies</button>
      </div>
    </section>

    <template v-else>
      <!-- calm layout (owner's pick, 0.9.3 L): one summary line, a short row of recent badges, one list -->
      <header class="aa-head">
        <div class="aa-sum">
          <span v-if="ra" class="aa-s"><img class="ra-mark" :src="raLogo" alt="" />{{ fmt(ra.points) }} pts</span>
          <template v-if="tro?.anySource">
            <span v-for="g in ['P', 'G', 'S', 'B']" :key="g" class="aa-s"><Grade :g="g" :size="18" />{{ tro.summary[g] }}</span>
            <span v-if="tro.summary.gamerscoreMax" class="aa-s"><Grade :size="18" />{{ fmt(tro.summary.gamerscore) }} G</span>
          </template>
        </div>
        <div class="spacer" />
        <button class="btn small" data-focus @click="refresh"><Icon name="mdiRefresh" :size="18" />Refresh</button>
      </header>

      <div v-if="unlocks.length" class="aa-latest">
        <span class="aa-lab">Latest</span>
        <button v-for="u in unlocks.slice(0, 6)" :key="u.key" class="aa-badge" data-focus :title="`${u.title} · ${u.game}`" @click="u.open()" @focus="focusedKey = u.key; u.bg && setBg({ src: u.bg, blur: true })">
          <img v-if="u.badge" :src="u.badge" loading="lazy" alt="" /><Grade v-else :g="u.grade" :size="30" />
        </button>
        <span v-if="focusedUnlock" class="aa-ltxt">{{ focusedUnlock.title }} · {{ focusedUnlock.game }} · {{ when(focusedUnlock.t) }}</span>
      </div>

      <div class="aa-gh">
        <div class="shelf-title" style="margin: 0">Games<span class="count">{{ shown.length }}</span></div>
        <div class="spacer" />
        <button class="btn small" :class="{ primary: show !== 'all' }" data-focus @click="pickShow"><Icon name="mdiEyeOutline" :size="18" />{{ show === 'all' ? 'All consoles' : show }}</button>
        <button class="btn small" data-focus @click="pickSort"><Icon name="mdiSortVariant" :size="18" />{{ SORTS.find((x) => x.v === sort).l }}</button>
      </div>
      <div class="aa-list">
        <button v-for="g in shown" :key="g.key" class="aa-row" data-focus :data-key="'aa-' + g.key" @click="g.open()" @focus="g.bg && setBg({ src: g.bg, blur: true })">
          <GameIcon :title="g.title" :rom-id="g.romId" :fallback="g.icon" :size="44" />
          <span class="aa-r-title">{{ g.title }}</span>
          <span class="aa-r-con">{{ g.console }}</span>
          <span class="aa-r-n">{{ g.earned }}/{{ g.total }}</span>
          <span class="bar aa-bar" :class="g.kind"><i :style="{ width: g.pct + '%' }" /></span>
          <span class="aa-r-pct">{{ g.pct }}%</span>
          <Icon v-if="g.mastered" name="mdiCrown" :size="20" class="mastered" /><Grade v-else-if="g.plat" g="P" :size="20" /><span v-else class="aa-r-gap" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
// One trophy home (0.9.3 K, owner's pick E2 A): RetroAchievements and emulator trophies together,
// latest unlocks from both in one row, games grouped by console with one card look. The two
// single-source views stay one LB/RB press away for sign-in, hidden games and folders.
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, img, go, setBg, when, GRADE, choose, consoleName } from '../store.js';
import { useView } from '../useView.js';
import { focusFirst } from '../nav.js';
import Icon from '../components/Icon.vue';
import Grade from '../components/Grade.vue';
import GameIcon from '../components/GameIcon.vue';
import raLogo from '../assets/ra-logo.png';

const el = ref(null);
const ra = ref(null), tro = ref(null), loading = ref(true);
const raOn = computed(() => !!store.config.ra?.user && !!store.config.ra?.key);
const fmt = (n) => (n || 0).toLocaleString();
const raDate = (d) => { const t = new Date(String(d || '').replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(d || '') ? '' : 'Z')).getTime(); return isNaN(t) ? 0 : t; };
const CONSOLE = { rpcs3: 'PlayStation 3', shadps4: 'PlayStation 4', xenia: 'Xbox 360', vita3k: 'PlayStation Vita' };
const focusedKey = ref('');
const focusedUnlock = computed(() => unlocks.value.find((u) => u.key === focusedKey.value) || unlocks.value[0] || null);
const romOfTro = (key) => tro.value?.games?.find((g) => g.key === key)?.romId || null;
const pctOf = (e, t) => (t ? Math.round((e / t) * 100) : 0);

const unlocks = computed(() => {
  const out = [];
  for (const a of ra.value?.recent || []) out.push({ key: 'ra' + a.id + a.date, t: raDate(a.date), badge: img(a.badge), bg: a.gameIcon ? img(a.gameIcon) : '', title: a.title, desc: a.desc, pts: `${a.points} pts${a.hardcore ? ' · HC' : ''}`, game: a.game, console: consoleName({ romId: a.romId, fallback: a.console }), open: () => go('ra-game', { gameId: a.gameId }) });
  for (const t of tro.value?.recent || []) out.push({ key: 'tr' + t.key + t.id, t: t.time || 0, badge: t.icon, grade: t.grade, title: t.name, desc: t.desc, pts: t.points ? `${t.points} G` : '', game: t.game, console: consoleName({ romId: romOfTro(t.key), src: t.src, fallback: CONSOLE[t.src] || t.short }), open: () => go('trophy-game', { tkey: t.key }) });
  return out.sort((a, b) => b.t - a.t).slice(0, 30);
});
const items = computed(() => {
  const out = [];
  for (const g of ra.value?.played || []) out.push({ key: 'ra' + g.gameId, src: 'RetroAchievements', kind: 'ra', title: g.title, console: consoleName({ romId: g.romId, fallback: g.console || 'Other' }), icon: img(g.icon), bg: img(g.boxart || g.icon), romId: g.romId, t: raDate(g.lastPlayed), earned: g.earned, total: g.total, pct: pctOf(g.earned, g.total), extra: g.possible ? `${g.score} / ${g.possible} pts` : '', mastered: g.total && g.earned >= g.total, open: () => go('ra-game', { gameId: g.gameId }) });
  for (const g of tro.value?.games || []) {
    if (g.hidden) continue;
    out.push({ key: 'tr' + g.key, src: g.kind === 'gamerscore' ? 'Gamerscore' : 'Trophies', kind: 'tro', title: g.title, console: consoleName({ romId: g.romId, src: g.src, fallback: CONSOLE[g.src] || g.short }), icon: g.icon || (g.cover ? img(g.cover) : ''), bg: g.cover ? img(g.cover) : '', romId: g.romId, t: g.last || 0, earned: g.earned, total: g.total, pct: pctOf(g.earned, g.total), extra: g.kind === 'gamerscore' ? `${g.score} / ${g.possible} G` : '', plat: !!g.grades?.P, open: () => go('trophy-game', { tkey: g.key }) });
  }
  return out;
});
const show = ref('all'), sort = ref('latest');
const SORTS = [{ v: 'latest', l: 'Latest', icon: 'mdiClockOutline' }, { v: 'most', l: 'Most complete', icon: 'mdiProgressCheck' }, { v: 'least', l: 'Least complete', icon: 'mdiProgressClock' }, { v: 'name', l: 'A to Z', icon: 'mdiSortAlphabeticalAscending' }];
const shown = computed(() => {
  const l = items.value.filter((g) => show.value === 'all' || g.console === show.value);
  if (sort.value === 'most') return [...l].sort((a, b) => b.pct - a.pct || b.t - a.t);
  if (sort.value === 'least') return [...l].sort((a, b) => a.pct - b.pct || b.t - a.t);
  if (sort.value === 'name') return [...l].sort((a, b) => a.title.localeCompare(b.title));
  return [...l].sort((a, b) => b.t - a.t);
});
// Show and Sort as one sheet with two tabs (0.9.3 K, G4 B)
async function showSort(tab) {
  const cons = [...new Set(items.value.map((g) => g.console))].sort((a, b) => a.localeCompare(b));
  const v = await choose({ title: 'Show and sort', tab, tabs: [
    { label: 'Show', options: [{ label: 'All consoles', value: 'all', icon: 'mdiViewGridOutline', selected: show.value === 'all' }, ...cons.map((c) => ({ label: c, value: c, icon: 'mdiGamepadVariantOutline', selected: show.value === c }))].map((o) => ({ ...o, value: 'f:' + o.value })) },
    { label: 'Sort by', options: SORTS.map((x) => ({ label: x.l, value: 's:' + x.v, icon: x.icon, selected: sort.value === x.v })) },
  ] });
  if (v?.startsWith('f:')) show.value = v.slice(2);
  else if (v?.startsWith('s:')) sort.value = v.slice(2);
}
const pickShow = () => showSort(0), pickSort = () => showSort(1);
async function load(force = false) {
  await Promise.all([
    raOn.value ? call('ra:overview', { force }).then((d) => (ra.value = d)).catch(() => {}) : (ra.value = null),
    call('trophies:overview').then((d) => { tro.value = d; if (d.sync) store.trophySync = d.sync; }).catch(() => {}),
  ]);
  loading.value = false;
}
async function refresh() { await call('trophies:sync').catch(() => {}); await load(true); }
watch(() => store.trophyVer, () => load());
useView({ x: refresh, rb: () => (store.achTab = 'ra') }, [{ b: 'A', label: 'Open' }, { b: 'X', label: 'Refresh' }, { b: 'RB', label: 'RetroAchievements' }]);
onMounted(async () => { await load(); focusFirst(el.value); });
</script>

<style scoped>
.big { font-size: var(--t-xl); }
.aa-empty { max-width: 820px; margin: 20px auto; padding: 28px 30px; display: flex; flex-direction: column; gap: var(--s-3); border-radius: var(--r-lg); }
.ra-mark { height: 18px; width: auto; }
.aa-head { display: flex; align-items: center; gap: var(--s-4); margin: 4px 0 var(--s-4); flex-wrap: wrap; }
.aa-sum { display: flex; align-items: center; gap: var(--s-4); flex-wrap: wrap; font-size: var(--t-md); font-weight: 600; }
.aa-s { display: inline-flex; align-items: center; gap: 6px; }
.aa-head .spacer, .aa-gh .spacer { flex: 1; }
.aa-latest { display: flex; align-items: center; gap: var(--s-2); margin: 0 0 var(--s-5); flex-wrap: wrap; }
.aa-lab { font-size: var(--t-sm); color: var(--muted); font-weight: 700; margin-right: var(--s-2); }
.aa-badge { width: 52px; height: 52px; border-radius: var(--r-md); display: grid; place-items: center; background: var(--s2); flex: none; padding: 0; }
.aa-badge img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--r-md); }
.aa-badge:focus { box-shadow: var(--ring); }
.aa-ltxt { font-size: var(--t-sm); color: var(--muted); margin-left: var(--s-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1; }
.aa-gh { display: flex; align-items: center; gap: var(--s-2); margin: 0 0 var(--s-3); flex-wrap: wrap; }
.aa-list { display: flex; flex-direction: column; gap: 4px; padding-bottom: 30px; max-width: 1200px; }
.aa-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 120px 64px minmax(80px, 180px) 48px 24px; align-items: center; gap: var(--s-3); padding: 8px 12px; border-radius: var(--r-md); text-align: left; }
.aa-row:focus { background: var(--focus); color: var(--on-focus); }
.aa-row:focus .aa-r-con, .aa-row:focus .aa-r-n { color: var(--on-focus-dim); }
.aa-r-title { font-family: var(--display); font-weight: 600; font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aa-r-con, .aa-r-n { font-size: var(--t-sm); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aa-r-pct { font-size: var(--t-sm); font-weight: 700; text-align: right; }
.aa-bar { height: 6px; display: block; }
.aa-bar.ra i { background: linear-gradient(90deg, #f5c542, #ffdf80); }
.aa-bar.tro i { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); }
.mastered { color: var(--gold); }
@media (max-width: 1100px) { .aa-row { grid-template-columns: 44px minmax(0, 1fr) 90px 56px 80px 44px 24px; } }
</style>
