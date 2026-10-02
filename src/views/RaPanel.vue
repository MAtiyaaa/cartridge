<template>
  <div class="ra" ref="el">
    <!-- Not signed in -->
    <section v-if="!signedIn" class="ra-signin glass">
      <div class="ra-signin-head">
        <div class="ra-trophy"><Icon name="mdiTrophy" :size="40" /></div>
        <div>
          <div class="eyebrow">RetroAchievements</div>
          <h1 class="big">Sign in to see your achievements</h1>
          <p class="muted">Your latest unlocks, recently played games and progress for every game in your library.</p>
        </div>
      </div>
      <div class="ra-fields">
        <TextField v-model="user" label="Username" placeholder="Your RetroAchievements username" icon="mdiAccount" fkey="ra-user" />
        <TextField v-model="key" label="Web API key" placeholder="Paste your web API key" password icon="mdiKeyVariant" />
      </div>
      <p class="muted small">Find your web API key on retroachievements.org → Settings → Authentication. It only lets Cartridge read your profile. Your password is never needed.</p>
      <div class="row" style="gap: 12px">
        <button class="btn primary" data-focus :disabled="busy || !user || !key" @click="signIn"><Icon name="mdiLogin" />{{ busy ? 'Checking…' : 'Sign in' }}</button>
      </div>
    </section>

    <!-- Signed in -->
    <template v-else>
      <header class="ra-head">
        <img v-if="data?.avatar" class="ra-avatar" :src="img(data.avatar)" />
        <div class="ra-avatar ph" v-else><Icon name="mdiAccount" :size="40" /></div>
        <div class="ra-who">
          <div class="eyebrow">RetroAchievements<template v-if="data?.offline"> · offline</template></div>
          <h1 class="big">{{ data?.user || store.config.ra.user }}</h1>
          <div class="ra-stats">
            <span class="stat"><Icon name="mdiTrophy" :size="18" style="color: var(--gold)" /><b>{{ fmt(data?.points) }}</b> points</span>
            <span v-if="data?.softPoints" class="stat"><b>{{ fmt(data.softPoints) }}</b> softcore</span>
            <span v-if="data?.truePoints" class="stat"><b>{{ fmt(data.truePoints) }}</b> true points</span>
          </div>
          <div v-if="data?.presence" class="ra-presence"><Icon name="mdiGamepadVariantOutline" :size="16" />{{ data.presence }}</div>
        </div>
        <div class="spacer" />
        <button class="btn small" data-focus @click="load(true)"><Icon name="mdiRefresh" :size="18" />Refresh</button>
        <button class="btn small" data-focus @click="signOut"><Icon name="mdiLogout" :size="18" />Sign out</button>
      </header>

      <div v-if="!data && busy" class="center" style="height: 300px"><div class="spinner" /></div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <template v-else-if="data">
        <div class="shelf-title"><Icon name="mdiStarShootingOutline" :size="20" />Latest unlocks<span class="count">{{ data.recent.length ? 'last 30 days' : '' }}</span></div>
        <div v-if="!data.recent.length" class="muted" style="margin: 0 0 24px">No achievements unlocked in the last 30 days.</div>
        <div v-else class="shelf" data-hscroll>
          <button v-for="a in data.recent" :key="a.id + a.date" class="ra-unlock glass" data-focus @click="openGame(a.gameId)" @focus="focusUnlock(a)">
            <img class="ra-badge" :src="img(a.badge)" loading="lazy" />
            <div class="ra-u-body">
              <div class="ra-u-title">{{ a.title }}</div>
              <div class="ra-u-desc">{{ a.desc }}</div>
              <div class="ra-u-meta"><span class="pts">{{ a.points }} pts</span><span v-if="a.hardcore" class="chip hc">HARDCORE</span><span>{{ ago(a.date) }}</span></div>
              <div class="ra-u-game">{{ a.game }} · {{ a.console }}</div>
            </div>
          </button>
        </div>

        <div class="ra-gh">
          <div class="shelf-title" style="margin: 0"><Icon name="mdiHistory" :size="20" />Recently played<span class="count">{{ played.length }}</span></div>
          <div class="spacer" />
          <!-- which console and the order, as on Trophies & Gamerscore (0.9.3 E5) -->
          <button class="btn small" :class="{ primary: show !== 'all' }" data-focus @click="pickShow"><Icon name="mdiEyeOutline" :size="18" />{{ show === 'all' ? 'All consoles' : show }}</button>
          <button class="btn small" data-focus @click="pickSort"><Icon name="mdiSortVariant" :size="18" />{{ SORTS.find((x) => x.v === sort).l }}</button>
        </div>
        <div class="ra-games">
          <button v-for="g in played" :key="g.gameId" class="ra-game glass" data-focus :data-key="'ra-' + g.gameId" @click="openGame(g.gameId)" @focus="focusGame(g)">
            <img class="ra-gicon" :src="img(g.icon)" loading="lazy" />
            <div class="ra-g-body">
              <div class="ra-g-title">{{ g.title }}</div>
              <div class="ra-g-sub">{{ g.console }} · {{ ago(g.lastPlayed) }}<template v-if="g.romId"> · <span class="inlib">In your library</span></template></div>
              <div class="bar ra-bar"><i :style="{ width: pctOf(g) + '%' }" /></div>
              <div class="ra-g-prog"><b>{{ g.earned }}</b> / {{ g.total }} achievements · {{ pctOf(g) }}%<template v-if="g.possible"> · {{ g.score }} / {{ g.possible }} pts</template></div>
            </div>
            <Icon v-if="g.total && g.earned >= g.total" name="mdiCrown" :size="26" class="mastered" />
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { store, call, img, go, toast, saveConfig, setBg, choose } from '../store.js';
import { useView } from '../useView.js';
import { focusFirst } from '../nav.js';
import Icon from '../components/Icon.vue';
import TextField from '../components/TextField.vue';

const el = ref(null);
const signedIn = computed(() => !!store.config.ra?.user && !!store.config.ra?.key);
const user = ref(store.config.ra?.user || '');
const key = ref('');
const busy = ref(false);
const error = ref('');
const data = ref(null);

const fmt = (n) => (n || 0).toLocaleString();
const show = ref('all'), sort = ref('latest');
const SORTS = [{ v: 'latest', l: 'Latest', icon: 'mdiClockOutline' }, { v: 'most', l: 'Most complete', icon: 'mdiProgressCheck' }, { v: 'least', l: 'Least complete', icon: 'mdiProgressClock' }, { v: 'name', l: 'A to Z', icon: 'mdiSortAlphabeticalAscending' }];
const played = computed(() => {
  const l = (data.value?.played || []).filter((g) => show.value === 'all' || g.console === show.value);
  if (sort.value === 'most') return [...l].sort((a, b) => pctOf(b) - pctOf(a));
  if (sort.value === 'least') return [...l].sort((a, b) => pctOf(a) - pctOf(b));
  if (sort.value === 'name') return [...l].sort((a, b) => a.title.localeCompare(b.title));
  return l; // RetroAchievements sends them latest first
});
async function pickShow() {
  const cons = [...new Set((data.value?.played || []).map((g) => g.console).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const v = await choose({ title: 'Show', options: [{ label: 'All consoles', value: 'all', icon: 'mdiViewGridOutline', selected: show.value === 'all' }, ...cons.map((c) => ({ label: c, value: c, icon: 'mdiGamepadVariantOutline', selected: show.value === c }))] });
  if (v) show.value = v;
}
async function pickSort() {
  const v = await choose({ title: 'Sort by', options: SORTS.map((x) => ({ label: x.l, value: x.v, icon: x.icon, selected: sort.value === x.v })) });
  if (v) sort.value = v;
}
const pctOf = (g) => (g.total ? Math.round((g.earned / g.total) * 100) : 0);
function ago(d) {
  if (!d) return '';
  const t = new Date(d.replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? '' : 'Z')).getTime();
  const s = (Date.now() - t) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} d ago`;
  return new Date(t).toLocaleDateString();
}

async function load(force = false) {
  if (!signedIn.value) return;
  busy.value = true; error.value = '';
  try { data.value = await call('ra:overview', { force }); }
  catch (e) { error.value = e.message; }
  busy.value = false;
}
async function signIn() {
  busy.value = true;
  try {
    const r = await call('ra:signin', { user: user.value, key: key.value });
    store.config = await call('config:get');
    toast(`Signed in as ${r.user}`, 'ok', 2600, 'mdiTrophy');
    key.value = '';
    await load(true);
    focusFirst(el.value);
  } catch (e) { toast(e.message, 'error', 5000); }
  busy.value = false;
}
async function signOut() {
  await call('ra:signout');
  store.config = await call('config:get');
  data.value = null;
  toast('Signed out of RetroAchievements', 'info', 2200);
}
function openGame(gameId) { go('ra-game', { gameId }); }
function focusGame(g) { if (g.boxart || g.icon) setBg({ src: img(g.boxart || g.icon), blur: true }); }
function focusUnlock(a) { if (a.gameIcon) setBg({ src: img(a.gameIcon), blur: true }); }

useView({ x: () => load(true), lb: () => (store.achTab = 'all'), rb: () => (store.achTab = 'others') }, [{ b: 'A', label: 'Open' }, { b: 'X', label: 'Refresh' }, { b: 'LB', label: 'All' }, { b: 'RB', label: 'Trophies & Gamerscore' }]);
onMounted(async () => { await load(); focusFirst(el.value); });
</script>

<style scoped>
.ra { padding-top: 4px; }
.ra-signin { max-width: 760px; margin: 30px auto; padding: 28px 30px; display: flex; flex-direction: column; gap: 18px; border-radius: var(--r-lg); }
.ra-signin-head { display: flex; gap: 20px; align-items: center; }
.ra-trophy { width: 76px; height: 76px; border-radius: var(--r-lg); display: grid; place-items: center; flex: none; background: linear-gradient(145deg, #f5c542, #b8801a); color: #2a1a00; box-shadow: 0 10px 30px rgba(245, 197, 66, 0.3); }
.ra-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.big { font-size: var(--t-xl); }
.small { font-size: var(--t-sm); }
.ra-head { display: flex; align-items: center; gap: 20px; margin: 4px 0 26px; }
.ra-avatar { width: 88px; height: 88px; border-radius: var(--r-lg); object-fit: cover; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.1); flex: none; }
.ra-avatar.ph { display: grid; place-items: center; background: rgba(255, 255, 255, 0.08); }
.ra-who { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ra-stats { display: flex; gap: 18px; flex-wrap: wrap; color: #d4d8e2; font-size: var(--t-sm); }
.ra-stats .stat { display: inline-flex; align-items: center; gap: 6px; }
.ra-presence { display: inline-flex; align-items: center; gap: 8px; font-size: var(--t-sm); color: var(--muted); max-width: 720px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ra-unlock { flex: none; width: 340px; display: flex; gap: 14px; padding: 14px; border-radius: var(--r-md); text-align: left; transition: transform 0.14s ease-out; }
.ra-unlock:focus { transform: scale(1.03); }
.ra-badge { width: 64px; height: 64px; border-radius: var(--r-md); flex: none; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
.ra-u-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.ra-u-title { font-family: var(--display); font-weight: 600; font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ra-u-desc { font-size: var(--t-xs); color: #c3c9d4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ra-u-meta { display: flex; gap: 10px; align-items: center; font-size: var(--t-xs); color: var(--muted); }
.ra-u-meta .pts { color: var(--gold); font-weight: 600; }
.chip.hc { font-size: var(--t-xs); padding: 2px 6px; background: rgba(255, 90, 90, 0.18); color: #ff9b9b; }
.ra-u-game { font-size: var(--t-xs); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ra-gh { display: flex; align-items: center; gap: var(--s-2); margin: 18px 0 var(--s-3); }
.ra-gh .spacer { flex: 1; }
.ra-games { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; padding-bottom: 30px; }
.ra-game { display: flex; gap: 14px; align-items: center; padding: 12px 14px; border-radius: var(--r-md); text-align: left; transition: transform 0.14s ease-out; position: relative; }
.ra-game:focus { transform: scale(1.02); }
.ra-gicon { width: 72px; height: 72px; border-radius: var(--r-md); flex: none; object-fit: cover; }
.ra-g-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.ra-g-title { font-family: var(--display); font-weight: 600; font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ra-g-sub { font-size: var(--t-xs); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.inlib { color: var(--green-l); }
.ra-bar { height: 6px; }
.ra-bar i { background: linear-gradient(90deg, #f5c542, #ffdf80); }
.ra-g-prog { font-size: var(--t-xs); color: #c3c9d4; }
.mastered { color: var(--gold); flex: none; }
@media (max-width: 1100px) { .ra-fields { grid-template-columns: 1fr; } }
</style>
