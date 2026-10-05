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

      <!-- latest unlocks as the RA and Trophies tabs show them (owner, 0.9.16: the badges were too small) -->
      <template v-if="unlocks.length">
        <div class="shelf-title">Latest unlocks</div>
        <div class="shelf aa-latest" data-hscroll>
          <button v-for="u in unlocks.slice(0, 15)" :key="u.key" class="aa-unlock glass" data-focus @click="u.open()" @focus="u.bg && setBg({ src: u.bg, blur: true })">
            <span class="aa-uicon"><img v-if="u.badge" :src="u.badge" loading="lazy" alt="" /><Grade v-else :g="u.grade" :size="36" /></span>
            <span class="aa-ubody">
              <span class="aa-utitle"><Grade v-if="u.grade" :g="u.grade" :size="16" />{{ u.title }}</span>
              <span class="aa-udesc">{{ u.desc }}</span>
              <span class="aa-umeta"><span v-if="u.pts" class="pts">{{ u.pts }}</span><span>{{ when(u.t) }}</span></span>
              <span class="aa-ugame">{{ u.game }} · <ConsoleMark :slug="u.slug" :label="u.console" /></span>
            </span>
          </button>
        </div>
      </template>

      <div class="aa-gh">
        <div class="shelf-title" style="margin: 0">Games<span class="count">{{ shown.length }}</span></div>
        <div class="spacer" />
        <button class="btn small" :class="{ primary: show !== 'all' }" data-focus @click="pickShow"><Icon name="mdiEyeOutline" :size="18" />{{ show === 'all' ? 'All consoles' : show }}</button>
        <button class="btn small" data-focus @click="pickSort"><Icon name="mdiSortVariant" :size="18" />{{ SORTS.find((x) => x.v === sort).l }}</button>
      </div>
      <div class="aa-list">
        <button v-for="g in shown" :key="g.key" class="aa-row" data-focus :data-key="'aa-' + g.key" @click="g.open()" @focus="g.bg && setBg({ src: g.bg, blur: true })">
          <GameIcon :title="g.code ? '' : g.title" :rom-id="g.romId" :fallback="g.icon" :size="44" />
          <span class="aa-r-title">{{ g.title }}</span>
          <span class="aa-r-con"><ConsoleMark :slug="g.slug" :label="g.console" /></span>
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
import { store, call, img, go, setBg, when, GRADE, choose, consoleName, consoleSlug } from '../store.js';
import ConsoleMark from '../components/ConsoleMark.vue';
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
const CONSOLE = { rpcs3: 'PlayStation 3', shadps4: 'PlayStation 4', xenia: 'Xbox 360', vita3k: 'PlayStation Vita', kytyps5: 'PlayStation 5' };
const romOfTro = (key) => tro.value?.games?.find((g) => g.key === key)?.romId || null;
const pctOf = (e, t) => (t ? Math.round((e / t) * 100) : 0);

const unlocks = computed(() => {
  const out = [];
  for (const a of ra.value?.recent || []) out.push({ key: 'ra' + a.id + a.date, t: raDate(a.date), badge: img(a.badge), bg: a.gameIcon ? img(a.gameIcon) : '', title: a.title, desc: a.desc, pts: `${a.points} pts${a.hardcore ? ' · HC' : ''}`, game: a.game, console: consoleName({ romId: a.romId, fallback: a.console }), slug: consoleSlug({ romId: a.romId, name: a.console }), open: () => go('ra-game', { gameId: a.gameId }) });
  for (const t of tro.value?.recent || []) out.push({ key: 'tr' + t.key + t.id, t: t.time || 0, badge: t.icon, grade: t.grade, title: t.name, desc: t.desc, pts: t.points ? `${t.points} G` : '', game: t.game, console: consoleName({ romId: romOfTro(t.key), src: t.src, fallback: CONSOLE[t.src] || t.short }), slug: consoleSlug({ romId: romOfTro(t.key), src: t.src }), open: () => go('trophy-game', { tkey: t.key }) });
  return out.sort((a, b) => b.t - a.t).slice(0, 30);
});
const items = computed(() => {
  const out = [];
  for (const g of ra.value?.played || []) out.push({ key: 'ra' + g.gameId, src: 'RetroAchievements', kind: 'ra', title: g.title, console: consoleName({ romId: g.romId, fallback: g.console || 'Other' }), slug: consoleSlug({ romId: g.romId, name: g.console }), icon: img(g.icon), bg: img(g.boxart || g.icon), romId: g.romId, t: raDate(g.lastPlayed), earned: g.earned, total: g.total, pct: pctOf(g.earned, g.total), extra: g.possible ? `${g.score} / ${g.possible} pts` : '', mastered: g.total && g.earned >= g.total, open: () => go('ra-game', { gameId: g.gameId }) });
  for (const g of tro.value?.games || []) {
    if (g.hidden) continue;
    out.push({ key: 'tr' + g.key, src: g.kind === 'gamerscore' ? 'Gamerscore' : 'Trophies', kind: 'tro', title: g.title, code: g.code, console: consoleName({ romId: g.romId, src: g.src, fallback: CONSOLE[g.src] || g.short }), slug: consoleSlug({ romId: g.romId, src: g.src }), icon: g.icon || (g.cover ? img(g.cover) : ''), bg: g.cover ? img(g.cover) : '', romId: g.romId, t: g.last || 0, earned: g.earned, total: g.total, pct: pctOf(g.earned, g.total), extra: g.kind === 'gamerscore' ? `${g.score} / ${g.possible} G` : '', plat: !!g.grades?.P, open: () => go('trophy-game', { tkey: g.key }) });
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
.aa-latest { margin-bottom: var(--s-4); }
.aa-unlock { flex: none; width: 360px; display: flex; gap: 14px; padding: 14px; border-radius: var(--r-md); text-align: left; transition: transform 0.14s ease-out; }
.aa-unlock:focus { transform: scale(1.03); }
.aa-uicon { width: 64px; height: 64px; border-radius: var(--r-md); flex: none; display: grid; place-items: center; background: rgba(0, 0, 0, 0.25); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); overflow: hidden; }
.aa-uicon img { width: 100%; height: 100%; object-fit: cover; }
.aa-ubody { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.aa-utitle { font-family: var(--display); font-weight: 600; font-size: var(--t-md); display: flex; gap: 6px; align-items: center;  overflow-wrap: anywhere; }
.aa-udesc { font-size: var(--t-xs); color: #c3c9d4; overflow-wrap: anywhere; }
.aa-umeta { display: flex; gap: 10px; align-items: center; font-size: var(--t-xs); color: var(--muted); }
.aa-umeta .pts { color: #9be38a; font-weight: 600; }
.aa-ugame { font-size: var(--t-xs); color: var(--muted);  overflow-wrap: anywhere; }
.aa-gh { display: flex; align-items: center; gap: var(--s-2); margin: 0 0 var(--s-3); flex-wrap: wrap; }
.aa-list { display: flex; flex-direction: column; gap: 4px; padding-bottom: 30px; max-width: 1200px; }
.aa-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 120px 64px minmax(80px, 180px) 48px 24px; align-items: center; gap: var(--s-3); padding: 8px 12px; border-radius: var(--r-md); text-align: left; }
.aa-row:focus { background: var(--focus); color: var(--on-focus); }
.aa-row:focus .aa-r-con, .aa-row:focus .aa-r-n { color: var(--on-focus-dim); }
.aa-r-title { font-family: var(--display); font-weight: 600; font-size: var(--t-md);  overflow-wrap: anywhere; }
.aa-r-con, .aa-r-n { font-size: var(--t-sm); color: var(--muted);  overflow-wrap: anywhere; }
.aa-r-pct { font-size: var(--t-sm); font-weight: 700; text-align: right; }
.aa-bar { height: 6px; display: block; }
.aa-bar.ra i { background: linear-gradient(90deg, #f5c542, #ffdf80); }
.aa-bar.tro i { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); }
.mastered { color: var(--gold); }
@media (max-width: 1100px) { .aa-row { grid-template-columns: 44px minmax(0, 1fr) 90px 56px 80px 44px 24px; } }
</style>
