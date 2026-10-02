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
      <header class="aa-head">
        <div class="aa-stats">
          <div v-if="ra" class="aa-stat"><img class="ra-mark" :src="raLogo" alt="" /><b>{{ fmt(ra.points) }}</b><span>points</span></div>
          <template v-if="tro?.anySource">
            <div v-for="g in ['P', 'G', 'S', 'B']" :key="g" class="aa-stat"><Grade :g="g" :size="26" /><b>{{ tro.summary[g] }}</b><span>{{ GRADE[g] }}</span></div>
            <div v-if="tro.summary.gamerscoreMax" class="aa-stat"><Grade :size="26" /><b>{{ fmt(tro.summary.gamerscore) }}</b><span>Gamerscore</span></div>
          </template>
        </div>
        <div class="spacer" />
        <button class="btn small" data-focus @click="refresh"><Icon name="mdiRefresh" :size="18" />Refresh</button>
      </header>

      <div class="shelf-title">Latest Unlocks</div>
      <div v-if="!unlocks.length" class="muted" style="margin: 0 0 24px">Nothing unlocked lately.</div>
      <div v-else class="shelf" data-hscroll>
        <button v-for="u in unlocks" :key="u.key" class="aa-unlock glass" data-focus @click="u.open()" @focus="u.bg && setBg({ src: u.bg, blur: true })">
          <div class="aa-badge"><img v-if="u.badge" :src="u.badge" loading="lazy" /><Grade v-else :g="u.grade" :size="36" /></div>
          <div class="aa-u-body">
            <div class="aa-u-title"><Grade v-if="u.grade" :g="u.grade" :size="16" />{{ u.title }}</div>
            <div class="aa-u-desc">{{ u.desc }}</div>
            <div class="aa-u-meta"><span v-if="u.pts" class="pts">{{ u.pts }}</span><span>{{ when(u.t) }}</span></div>
            <div class="aa-u-game">{{ u.game }} · {{ u.console }}</div>
          </div>
        </button>
      </div>

      <div class="aa-gh">
        <div class="shelf-title" style="margin: 0">Games<span class="count">{{ shown.length }}</span></div>
        <div class="spacer" />
        <button class="btn small" :class="{ primary: show !== 'all' }" data-focus @click="pickShow"><Icon name="mdiEyeOutline" :size="18" />{{ show === 'all' ? 'All consoles' : show }}</button>
        <button class="btn small" data-focus @click="pickSort"><Icon name="mdiSortVariant" :size="18" />{{ SORTS.find((x) => x.v === sort).l }}</button>
      </div>
      <!-- grouped by console, each card the same whatever its source -->
      <template v-for="grp in groups" :key="grp.console">
        <div class="sec-title aa-con">{{ grp.console }}<span class="count">{{ grp.items.length }}</span></div>
        <div class="aa-games">
          <button v-for="g in grp.items" :key="g.key" class="aa-game glass" data-focus :data-key="'aa-' + g.key" @click="g.open()" @focus="g.bg && setBg({ src: g.bg, blur: true })">
            <GameIcon :title="g.title" :rom-id="g.romId" :fallback="g.icon" :size="72" />
            <div class="aa-g-body">
              <div class="aa-g-title">{{ g.title }}</div>
              <div class="aa-g-sub"><span class="aa-src">{{ g.src }}</span><template v-if="g.t"> · {{ when(g.t) }}</template><template v-if="g.romId"> · <span class="inlib">In your library</span></template></div>
              <div class="bar aa-bar" :class="g.kind"><i :style="{ width: g.pct + '%' }" /></div>
              <div class="aa-g-prog"><b>{{ g.earned }}</b> / {{ g.total }} · {{ g.pct }}%<template v-if="g.extra"> · {{ g.extra }}</template></div>
            </div>
            <Icon v-if="g.mastered" name="mdiCrown" :size="26" class="mastered" />
            <Grade v-else-if="g.plat" g="P" :size="26" />
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
// One trophy home (0.9.3 K, owner's pick E2 A): RetroAchievements and emulator trophies together,
// latest unlocks from both in one row, games grouped by console with one card look. The two
// single-source views stay one LB/RB press away for sign-in, hidden games and folders.
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, img, go, setBg, when, GRADE, choose } from '../store.js';
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
const pctOf = (e, t) => (t ? Math.round((e / t) * 100) : 0);

const unlocks = computed(() => {
  const out = [];
  for (const a of ra.value?.recent || []) out.push({ key: 'ra' + a.id + a.date, t: raDate(a.date), badge: img(a.badge), bg: a.gameIcon ? img(a.gameIcon) : '', title: a.title, desc: a.desc, pts: `${a.points} pts${a.hardcore ? ' · HC' : ''}`, game: a.game, console: a.console, open: () => go('ra-game', { gameId: a.gameId }) });
  for (const t of tro.value?.recent || []) out.push({ key: 'tr' + t.key + t.id, t: t.time || 0, badge: t.icon, grade: t.grade, title: t.name, desc: t.desc, pts: t.points ? `${t.points} G` : '', game: t.game, console: CONSOLE[t.src] || t.short, open: () => go('trophy-game', { tkey: t.key }) });
  return out.sort((a, b) => b.t - a.t).slice(0, 30);
});
const items = computed(() => {
  const out = [];
  for (const g of ra.value?.played || []) out.push({ key: 'ra' + g.gameId, src: 'RetroAchievements', kind: 'ra', title: g.title, console: g.console || 'Other', icon: img(g.icon), bg: img(g.boxart || g.icon), romId: g.romId, t: raDate(g.lastPlayed), earned: g.earned, total: g.total, pct: pctOf(g.earned, g.total), extra: g.possible ? `${g.score} / ${g.possible} pts` : '', mastered: g.total && g.earned >= g.total, open: () => go('ra-game', { gameId: g.gameId }) });
  for (const g of tro.value?.games || []) {
    if (g.hidden) continue;
    out.push({ key: 'tr' + g.key, src: g.kind === 'gamerscore' ? 'Gamerscore' : 'Trophies', kind: 'tro', title: g.title, console: CONSOLE[g.src] || g.short, icon: g.icon || (g.cover ? img(g.cover) : ''), bg: g.cover ? img(g.cover) : '', romId: g.romId, t: g.last || 0, earned: g.earned, total: g.total, pct: pctOf(g.earned, g.total), extra: g.kind === 'gamerscore' ? `${g.score} / ${g.possible} G` : '', plat: !!g.grades?.P, open: () => go('trophy-game', { tkey: g.key }) });
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
// consoles in the order you last played them
const groups = computed(() => {
  const m = new Map();
  for (const g of shown.value) { if (!m.has(g.console)) m.set(g.console, { console: g.console, items: [], t: 0 }); const x = m.get(g.console); x.items.push(g); x.t = Math.max(x.t, g.t); }
  return [...m.values()].sort((a, b) => (sort.value === 'name' ? a.console.localeCompare(b.console) : b.t - a.t));
});
async function pickShow() {
  const cons = [...new Set(items.value.map((g) => g.console))].sort((a, b) => a.localeCompare(b));
  const v = await choose({ title: 'Show', options: [{ label: 'All consoles', value: 'all', icon: 'mdiViewGridOutline', selected: show.value === 'all' }, ...cons.map((c) => ({ label: c, value: c, icon: 'mdiGamepadVariantOutline', selected: show.value === c }))] });
  if (v) show.value = v;
}
async function pickSort() {
  const v = await choose({ title: 'Sort by', options: SORTS.map((x) => ({ label: x.l, value: x.v, icon: x.icon, selected: sort.value === x.v })) });
  if (v) sort.value = v;
}
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
.ra-mark { height: 20px; width: auto; }
.aa-head { display: flex; align-items: center; gap: 20px; margin: 4px 0 24px; flex-wrap: wrap; }
.aa-stats { display: flex; gap: 12px; flex-wrap: wrap; }
.aa-stat { display: flex; align-items: center; gap: 10px; padding: 10px 16px 10px 12px; border-radius: var(--r-md); background: var(--s2); }
.aa-stat b { font-family: var(--display); font-size: var(--t-xl); }
.aa-stat span { font-size: var(--t-xs); color: var(--muted); }
.aa-unlock { flex: none; width: 360px; display: flex; gap: 14px; padding: 14px; border-radius: var(--r-md); text-align: left; transition: transform 0.14s ease-out; }
.aa-unlock:focus { transform: scale(1.03); }
.aa-badge { width: 64px; height: 64px; border-radius: var(--r-md); flex: none; display: grid; place-items: center; background: rgba(0, 0, 0, 0.25); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
.aa-badge img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--r-md); }
.aa-u-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.aa-u-title { font-family: var(--display); font-weight: 600; font-size: var(--t-md); display: flex; gap: 6px; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aa-u-desc { font-size: var(--t-xs); color: #c3c9d4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.aa-u-meta { display: flex; gap: 10px; align-items: center; font-size: var(--t-xs); color: var(--muted); }
.aa-u-meta .pts { color: var(--gold); font-weight: 600; }
.aa-u-game { font-size: var(--t-xs); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aa-gh { display: flex; align-items: center; gap: var(--s-2); margin: 18px 0 var(--s-2); flex-wrap: wrap; }
.aa-gh .spacer { flex: 1; }
.aa-con { margin: var(--s-4) 0 var(--s-3); }
.aa-con .count { margin-left: var(--s-2); color: var(--muted); font-weight: 500; }
.aa-games { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 14px; }
.aa-game { display: flex; gap: 14px; align-items: center; padding: 12px 14px; border-radius: var(--r-md); text-align: left; transition: transform 0.14s ease-out; position: relative; }
.aa-game:focus { transform: scale(1.02); }
.aa-g-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.aa-g-title { font-family: var(--display); font-weight: 600; font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aa-g-sub { font-size: var(--t-xs); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aa-src { color: #cfd6e4; font-weight: 600; }
.inlib { color: var(--green-l); }
.aa-bar { height: 6px; }
.aa-bar.ra i { background: linear-gradient(90deg, #f5c542, #ffdf80); }
.aa-bar.tro i { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); }
.aa-g-prog { font-size: var(--t-xs); color: #c3c9d4; }
.mastered { color: var(--gold); flex: none; }
.aa-games:last-child { padding-bottom: 30px; }
</style>
