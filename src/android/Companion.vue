<template>
  <div class="cmp" :class="{ ready: !!store.config, embedded }">
    <Background v-if="store.config && !embedded" still />

    <main class="body">
      <Transition name="cfade" mode="out-in">
        <!-- Game -->
        <section v-if="tab === 'game' && rom" :key="'g' + rom.id" class="view" data-scroll>
          <div class="hero"><Art class="fill" :src="heroSrc" :blur="hero?.blur" /><div class="hero-shade" /></div>
          <div class="head">
            <Art class="cover" :src="coverSrc"><div class="ph"><PIcon v-if="platform" :p="platform" :size="44" /></div></Art>
            <div class="head-t">
              <div class="eyebrow row"><PIcon v-if="platform" :p="platform" :size="16" />{{ rom.platform_display_name || platform?.display_name }}</div>
              <GameLogo :logo="store.config.ui.logos !== false ? logoOf(rom) : null" :name="rom.name" cls="t-title" :area="14000" :max-w="360" :max-h="78" />
              <div class="meta">
                <span v-if="yr">{{ yr }}</span>
                <span v-if="info.genres">{{ info.genres }}</span>
                <span v-if="rom.fs_size_bytes">{{ bytes(rom.fs_size_bytes) }}</span>
                <span v-if="info.rating" class="row gold"><Icon name="mdiStar" :size="14" />{{ rating(info.rating) }}</span>
              </div>
            </div>
          </div>

          <div class="acts">
            <button class="pill primary" @click="cmd({ open: true, romId: rom.id })"><Icon name="mdiOpenInNew" :size="19" />Open</button>
            <span v-if="installed" class="pill ok"><Icon name="mdiCheckCircle" :size="18" />On this device</span>
            <button v-else-if="dlActive" class="pill" @click="call('dl:cancel', dl.id)"><Icon name="mdiClose" :size="19" />Cancel</button>
            <button v-else class="pill" :disabled="busyDl" @click="startDl"><Icon name="mdiDownload" :size="19" />Download</button>
          </div>
          <div v-if="dlActive" class="inline-dl">
            <div class="row between"><span>{{ dl.status === 'queued' ? 'Queued' : 'Downloading' }}</span><span class="num">{{ pctOf(dl) }}%<template v-if="dl.speed"> · {{ bytes(dl.speed) }}/s</template></span></div>
            <div class="bar"><i :style="{ width: pctOf(dl) + '%' }" /></div>
          </div>

          <div v-if="summary" class="sum">
            <p class="summary" :class="{ open: bioOpen }">{{ summary }}</p>
            <button v-if="summary.length > 200" class="more" @click="bioOpen = !bioOpen">{{ bioOpen ? 'Show less' : 'Show more' }}<Icon :name="bioOpen ? 'mdiChevronUp' : 'mdiChevronDown'" :size="16" /></button>
          </div>
        </section>

        <!-- Console -->
        <section v-else-if="tab === 'game' && selPlat" :key="'p' + selPlat.id" class="view" data-scroll>
          <div class="hero short"><Art v-if="platArt" class="fill" :src="platArt.src" :blur="platArt.blur" /><div class="hero-shade" /></div>
          <div class="head plain">
            <div class="head-t">
              <img v-if="sysLogo" class="sys-logo" :src="sysLogo" :alt="selPlat.display_name" />
              <div class="eyebrow">System</div>
              <div class="t-title">{{ selPlat.display_name || selPlat.name }}</div>
              <div class="meta">
                <span>{{ selPlat.rom_count || 0 }} {{ selPlat.rom_count === 1 ? 'game' : 'games' }} on your server</span>
                <span v-if="platOnDevice" class="chip green">{{ platOnDevice }} on this device</span>
              </div>
            </div>
          </div>
          <div class="acts"><button class="pill primary" @click="cmd({ open: true, platformId: selPlat.id })"><Icon name="mdiOpenInNew" :size="19" />Open</button></div>
          <div v-if="platStrip.length" class="strip">
            <button v-for="r in platStrip" :key="r.id" class="s-cover" :aria-label="r.name" @click="cmd({ open: true, romId: r.id })"><Art class="fill" :src="r.src" /></button>
          </div>
          <div class="folder">
            <Icon name="mdiFolderOutline" :size="19" />
            <span class="path">{{ selPlat.target?.path || 'No folder set' }}</span>
            <span class="chip" :class="selPlat.target?.source === 'custom' ? 'primary' : selPlat.target?.exists ? 'green' : ''">{{ selPlat.target?.source === 'custom' ? 'Custom' : selPlat.target?.exists ? 'Found' : selPlat.target?.path ? 'Will create' : 'Not set' }}</span>
          </div>
        </section>

        <!-- Collection / Favourites -->
        <section v-else-if="tab === 'game' && selColl" :key="'c' + selColl.id" class="view" data-scroll>
          <div class="hero short"><Art v-if="collArt" class="fill" :src="collArt.src" :blur="collArt.blur" /><div class="hero-shade" /></div>
          <div class="head plain">
            <div class="head-t">
              <div class="eyebrow row"><Icon :name="selColl.favorite ? 'mdiStar' : 'mdiBookmarkMultipleOutline'" :size="14" />{{ selColl.favorite ? 'Favourites' : selColl.smart ? 'Smart collection' : 'Collection' }}</div>
              <div class="t-title">{{ selColl.name }}</div>
              <div class="meta">
                <span>{{ collCount }} {{ collCount === 1 ? 'game' : 'games' }}</span>
                <span v-if="collOnDevice" class="chip green">{{ collOnDevice }} on this device</span>
              </div>
            </div>
          </div>
          <div class="acts"><button class="pill primary" @click="cmd({ open: true, collectionId: selColl.id })"><Icon name="mdiOpenInNew" :size="19" />Open</button></div>
          <div v-if="collStrip.length" class="strip">
            <button v-for="r in collStrip" :key="r.id" class="s-cover" :aria-label="r.name" @click="cmd({ open: true, romId: r.id })"><Art class="fill" :src="r.src" /></button>
          </div>
          <p v-if="selColl.description" class="summary">{{ selColl.description }}</p>
        </section>

        <!-- Nothing highlighted -->
        <section v-else-if="tab === 'game'" key="idle" class="view center">
          <div class="halo"><Logo :size="58" /></div>
          <div class="c-title">{{ routeLabel }}</div>
          <div class="c-sub">{{ libLine }}</div>
          <div class="c-hint">Highlight a game or console on the {{ embedded ? "device" : "top screen" }}</div>
          <div v-if="current" class="mini">
            <Art class="mini-cover" :src="current.cover ? img(current.cover) : ''" />
            <div class="mini-t">
              <div class="row between"><b class="ell">{{ current.name }}</b><span class="num">{{ pctOf(current) }}%</span></div>
              <div class="bar"><i :style="{ width: pctOf(current) + '%' }" /></div>
            </div>
          </div>
        </section>

        <!-- Downloads -->
        <section v-else-if="tab === 'dl' && store.downloads.length" key="dl" class="view" data-scroll>
          <div v-if="current" class="now">
            <Art class="fill" :src="current.cover ? img(current.cover) : ''" blur />
            <div class="now-shade" />
            <Art class="now-cover" :src="current.cover ? img(current.cover) : ''"><div class="ph"><Icon name="mdiGamepadVariantOutline" :size="26" /></div></Art>
            <div class="now-t">
              <div class="eyebrow">{{ current.status === 'queued' ? 'Up next' : 'Downloading' }}</div>
              <div class="now-name">{{ current.name }}</div>
              <div class="now-stats">
                <span class="now-pct num">{{ pctOf(current) }}<small>%</small></span>
                <span class="now-sub num">{{ current.speed ? bytes(current.speed) + '/s · ' : '' }}{{ leftOf(current) }} left<template v-if="itemLeft(current)"> · {{ itemLeft(current) }}</template></span>
              </div>
              <div class="bar"><i :style="{ width: pctOf(current) + '%' }" /></div>
            </div>
            <button class="round small" aria-label="Cancel" @click="call('dl:cancel', current.id)"><Icon name="mdiClose" :size="18" /></button>
          </div>
          <div v-if="qAll.count > 1 && qAll.time" class="all-left num"><Icon name="mdiClockOutline" :size="15" />Everything: {{ bytes(qAll.left) }} · about {{ qAll.time }} left</div>
          <div class="list">
            <div v-for="d in sortedDl.filter((x) => x !== current)" :key="d.id" class="lrow" :class="d.status">
              <Art class="thumb" :src="d.cover ? img(d.cover) : ''"><div class="ph"><Icon name="mdiGamepadVariantOutline" :size="18" /></div></Art>
              <div class="l-t">
                <div class="ell l-name">{{ d.name }}</div>
                <div class="l-sub"><span class="ell">{{ d.platformName }}</span><span class="st num">{{ statusText(d) }}</span></div>
              </div>
              <button v-if="['queued', 'downloading'].includes(d.status)" class="round small" aria-label="Cancel" @click="call('dl:cancel', d.id)"><Icon name="mdiClose" :size="17" /></button>
              <button v-else-if="['error', 'cancelled'].includes(d.status)" class="round small" aria-label="Retry" @click="call('dl:retry', d.id)"><Icon name="mdiRefresh" :size="17" /></button>
              <Icon v-else name="mdiCheckCircle" :size="22" class="done-ic" />
            </div>
          </div>
          <button v-if="finished" class="textbtn" @click="call('dl:clear')">Clear finished</button>
        </section>

        <!-- No downloads -->
        <section v-else-if="tab === 'dl'" key="dl0" class="view center">
          <div class="halo big"><Icon name="mdiTrayArrowDown" :size="50" /></div>
          <div class="c-title">Nothing downloading</div>
          <div class="c-hint">Press Download on a game and it shows up here with live progress.</div>
          <button class="pill" @click="cmd({ tab: 'library' })"><Icon name="mdiViewGridOutline" :size="19" />Browse your library</button>
        </section>

        <!-- Controls -->
        <section v-else key="pad" class="view pad">
          <div class="shoulders">
            <button v-for="k in SHOULDERS" :key="k.b" class="k pill-k" :aria-label="k.b" @pointerdown.prevent="press(k.a)">
              <Btn :b="k.b" :kind="padKindHere" class="gl" />
            </button>
          </div>
          <div class="sticks">
            <div class="dpad">
              <button v-for="d in DIRS" :key="d.a" class="k" :class="d.a" :aria-label="d.a" @pointerdown.prevent="hold(d.a)" @pointerup="release" @pointerleave="release" @pointercancel="release"><Icon :name="d.icon" :size="30" /></button>
            </div>
            <div class="facepad" :class="nintendoFace ? 'nin' : 'xbox'">
              <button v-for="k in FACE" :key="k.b" class="k glyphed" :class="k.b.toLowerCase()" :aria-label="k.b" @pointerdown.prevent="press(k.a)">
                <Btn :b="nintendoFace ? NIN_POS[k.b] : k.b" :kind="padKindHere" class="gl face-gl" />
              </button>
            </div>
          </div>
          <div class="jump">
            <button v-for="t in (embedded ? JUMPS.filter((j) => j.id !== 'settings') : JUMPS)" :key="t.id" class="jbtn" :class="{ on: store.companion?.route === t.id }" @click="cmd({ tab: t.id })"><Icon :name="t.icon" :size="18" />{{ t.label }}</button>
          </div>
        </section>
      </Transition>
    </main>

    <!-- Floating dock: the only chrome on this screen -->
    <nav v-if="!embedded" class="dock">
      <button v-for="t in TABS" :key="t.id" class="d-tab" :class="{ on: tab === t.id }" @click="tabSel = t.id">
        <Icon :name="t.icon" :size="19" /><span>{{ t.label }}</span>
        <b v-if="t.id === 'dl' && active.length" class="badge">{{ active.length }}</b>
      </button>
      <i class="d-sep" />
      <button class="d-gear" aria-label="Settings" @click="showSettings = true"><Icon name="mdiCogOutline" :size="19" /></button>
    </nav>

    <Transition name="cfade">
      <CompanionSettings v-if="showSettings && !embedded" @close="showSettings = false" @off="turnOff" />
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, loadConfig, loadLibrary, loadArt, romById, platformById, collectionById, romsOf, romsOfCollection, cover, backdropOf, logoOf, bytes, year, rating, img, downloadFor, download, queueLeft, itemLeft } from '../store.js';
import { applyTheme } from '../themes.js';
import Btn from '../components/Btn.vue';
import Background from '../components/Background.vue';
import GameLogo from '../components/GameLogo.vue';
import PIcon from '../components/PIcon.vue';
import Logo from '../components/Logo.vue';
import Art from './Art.vue';
import CompanionSettings from './CompanionSettings.vue';
import Icon from '../components/Icon.vue';

const cart = window.cart;
const TABS = [
  { id: 'game', label: 'Game', icon: 'mdiCardsOutline' },
  { id: 'dl', label: 'Downloads', icon: 'mdiTrayArrowDown' },
  { id: 'pad', label: 'Controls', icon: 'mdiGamepadVariantOutline' },
];
const JUMPS = [
  { id: 'home', label: 'Home', icon: 'mdiHomeVariantOutline' },
  { id: 'library', label: 'Library', icon: 'mdiViewGridOutline' },
  { id: 'consoles', label: 'Consoles', icon: 'mdiGamepadSquareOutline' },
  { id: 'search', label: 'Search', icon: 'mdiMagnify' },
  { id: 'downloads', label: 'Downloads', icon: 'mdiTrayArrowDown' },
  { id: 'settings', label: 'Settings', icon: 'mdiCogOutline' },
];
const SHOULDERS = [{ b: 'LT', a: 'lt' }, { b: 'LB', a: 'lb' }, { b: 'SELECT', a: 'select' }, { b: 'START', a: 'start' }, { b: 'RB', a: 'rb' }, { b: 'RT', a: 'rt' }];
const FACE = [{ b: 'Y', a: 'y' }, { b: 'X', a: 'x' }, { b: 'B', a: 'back' }, { b: 'A', a: 'accept' }];
// The same button icons as the top screen, for the controller in use
// Button glyphs as the main screen draws them (abdu2304's Btn), for the controller in use there.
// In the Nintendo face layout the buttons sit where Nintendo puts them, so each one is drawn by the
// Xbox position it occupies (Btn relabels positions for Nintendo: right shows A, bottom shows B).
const padKindHere = computed(() => store.companion.family || 'xbox');
const NIN_POS = { X: 'Y', Y: 'X', A: 'B', B: 'A' };
const nintendoFace = computed(() => store.companion.layout === 'nintendo' || store.companion.family === 'nintendo');
const DIRS = [
  { a: 'up', icon: 'mdiChevronUp' }, { a: 'left', icon: 'mdiChevronLeft' },
  { a: 'right', icon: 'mdiChevronRight' }, { a: 'down', icon: 'mdiChevronDown' },
];
const ROUTES = { home: 'Home', library: 'Library', consoles: 'Consoles', platform: 'Console', collection: 'Collection', game: 'Game', downloads: 'Downloads', settings: 'Settings', search: 'Search', achievements: 'Achievements', 'ra-game': 'Achievements', 'trophy-game': 'Trophies', setup: 'Setup' };

// embedded: inside the phone remote, which has its own navigation and picks the view
const props = defineProps({ embedded: Boolean, view: { type: String, default: 'game' } });
const tabSel = ref('game');
const tab = computed(() => (props.embedded ? props.view : tabSel.value));
const showSettings = ref(false);
store.companion = { route: 'home', romId: null, platformId: null, collectionId: null };
const routeLabel = computed(() => ROUTES[store.companion.route] || 'Cartridge');

// ---------------- highlighted game
const rom = computed(() => (store.companion.romId ? romById(store.companion.romId) : null));
const platform = computed(() => rom.value && platformById(rom.value.platform_id));
const details = new Map(); // romId -> RomM detail, fetched once
const detail = ref(null);
let detailT = null;
watch(() => rom.value?.id, (id) => {
  bioOpen.value = false;
  detail.value = details.get(id) || null;
  clearTimeout(detailT);
  if (!id || details.has(id)) return;
  detailT = setTimeout(async () => {
    try { const d = await call('api:get', { path: `/api/roms/${id}` }); details.set(id, d); if (rom.value?.id === id) detail.value = d; } catch {}
  }, 350); // wait until the highlight settles so scrolling the top screen doesn't flood the server
});
const info = computed(() => {
  const md = detail.value?.metadatum || {};
  return { rating: md.average_rating || rom.value?.rating, genres: (md.genres || rom.value?.genres || []).slice(0, 3).join(' · '), year: md.first_release_date || rom.value?.year };
});
const yr = computed(() => year(info.value.year));
const summary = computed(() => detail.value?.summary || rom.value?.summary || '');
const bioOpen = ref(false);

// ---------------- highlighted console / collection
const selPlat = computed(() => (!rom.value && store.companion.platformId ? platformById(store.companion.platformId) : null));
const platOnDevice = computed(() => (selPlat.value ? romsOf(selPlat.value.id).filter((r) => store.installed[r.id]).length : 0));
const selColl = computed(() => (!rom.value && !selPlat.value && store.companion.collectionId != null ? collectionById(store.companion.collectionId) : null));
const collCount = computed(() => selColl.value?.rom_ids?.length || selColl.value?.rom_count || 0);
// Console banner: the console's own colours, like its tile on the top screen
const sysLogos = new Map();
const sysLogo = ref('');
watch(selPlat, (p) => {
  sysLogo.value = '';
  if (!p) return;
  if (sysLogos.has(p.slug)) { sysLogo.value = sysLogos.get(p.slug); return; }
  call('syslogo:get', { slug: p.slug, fs_slug: p.fs_slug }).then((u) => { sysLogos.set(p.slug, u || ''); if (selPlat.value?.slug === p.slug) sysLogo.value = u || ''; }).catch(() => {});
}, { immediate: true });
// Art for a console or collection, like the top screen's Home header: a screenshot from one of its
// games, else a blurred cover, else nothing (the theme background shows through)
function groupArt(roms) {
  const withShot = roms.find((r) => r.shot);
  if (withShot) return { src: img(withShot.shot), blur: false };
  const first = roms.find((r) => cover(r, true));
  return first ? { src: cover(first, true), blur: true } : null;
}
// A few covers to tap, games on this device first
function strip(roms) {
  return [...roms].sort((a, b) => (store.installed[b.id] ? 1 : 0) - (store.installed[a.id] ? 1 : 0)).slice(0, 6)
    .map((r) => ({ id: r.id, name: r.name, src: cover(r) })).filter((r) => r.src);
}
const platRoms = computed(() => (selPlat.value ? romsOf(selPlat.value.id) : []));
const platArt = computed(() => groupArt(platRoms.value));
const platStrip = computed(() => strip(platRoms.value));
const collRoms = computed(() => (selColl.value ? romsOfCollection(selColl.value.id) : []));
const collArt = computed(() => groupArt(collRoms.value));
const collStrip = computed(() => strip(collRoms.value));
const collOnDevice = computed(() => (selColl.value ? romsOfCollection(selColl.value.id).filter((r) => store.installed[r.id]).length : 0));
const coverSrc = computed(() => rom.value && cover(rom.value, true));
const hero = computed(() => rom.value && backdropOf(detail.value ? { ...rom.value, shot: detail.value.merged_screenshots?.[0] || rom.value.shot } : rom.value));
const heroSrc = computed(() => hero.value?.src || '');
const installed = computed(() => rom.value && !!store.installed[rom.value.id]);

// ---------------- downloads
const active = computed(() => store.downloads.filter((d) => ['queued', 'downloading'].includes(d.status)));
const current = computed(() => active.value.find((d) => d.status === 'downloading') || active.value[0] || null);
const finished = computed(() => store.downloads.some((d) => !['queued', 'downloading'].includes(d.status)));
const ORDER = { downloading: 0, queued: 1, error: 2, cancelled: 3, done: 4 };
const sortedDl = computed(() => [...store.downloads].sort((a, b) => (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5) || b.addedAt - a.addedAt));
const dl = computed(() => rom.value && downloadFor(rom.value.id));
const dlActive = computed(() => dl.value && ['queued', 'downloading'].includes(dl.value.status));
const qAll = computed(() => queueLeft(store.downloads));
const leftOf = (d) => (d?.total ? bytes(Math.max(0, d.total - (d.received || 0))) : '');
const pctOf = (d) => (d?.total ? Math.min(100, Math.round((d.received / d.total) * 100)) : 0);
function statusText(d) {
  if (d.status === 'downloading') return pctOf(d) + '%' + (d.speed ? ' · ' + bytes(d.speed) + '/s' : '');
  if (d.status === 'queued' && d.notice === 'waiting') return 'Waiting for the server';
  return { queued: 'Queued', done: 'Done', error: 'Failed', cancelled: 'Cancelled' }[d.status] || d.status;
}
const busyDl = ref(false);
async function startDl() {
  busyDl.value = true;
  try { await download(rom.value); } catch {}
  busyDl.value = false;
}
const libLine = computed(() => {
  const l = store.lib;
  if (!l) return 'Loading your library…';
  const games = Object.values(l.roms).reduce((s, r) => s + r.length, 0);
  const systems = l.platforms.filter((p) => p.rom_count).length;
  return `${games} ${games === 1 ? 'game' : 'games'} · ${systems} ${systems === 1 ? 'system' : 'systems'}`;
});

// ---------------- top-screen control
const cmd = (c) => call('remote:cmd', c).catch(() => {});
function press(action) { navigator.vibrate?.(8); cmd({ pad: action }); }
let holdT = null;
function hold(action) {
  press(action);
  clearTimeout(holdT);
  const again = (ms) => { holdT = setTimeout(() => { cmd({ pad: action }); again(80); }, ms); };
  again(320);
}
function release() { clearTimeout(holdT); holdT = null; }

function turnOff() { showSettings.value = false; cmd({ dualScreen: false }); }

// ---------------- startup
cart.on('remote:state', (s) => { if (s) store.companion = s; });
// Look & Feel changed on the top screen: theme, colours, fonts, background and wallpaper follow here
cart.on('remote:config', (c) => { if (c) store.config = c; });
onMounted(async () => {
  await loadConfig();
  applyTheme(store.config.ui);
  watch(() => JSON.stringify(store.config?.ui || {}), () => applyTheme(store.config.ui));
  try { store.companion = (await call('remote:get')) || store.companion; } catch {}
  await loadLibrary().catch(() => {});
  loadArt();
  try { store.downloads = await call('dl:list'); } catch {}
});
</script>
<style>
html, body { touch-action: pan-x pan-y; }
* { -webkit-tap-highlight-color: transparent; }
.cfade-enter-active { transition: opacity 0.2s ease-out, transform 0.24s var(--ease); }
.cfade-leave-active { transition: opacity 0.12s ease-in; }
.cfade-enter-from { opacity: 0; transform: translateY(8px); }
.cfade-leave-to { opacity: 0; }
</style>
<style scoped>
.cmp { position: fixed; inset: 0; overflow: hidden; opacity: 0; transition: opacity 0.3s var(--ease); }
.cmp.ready { opacity: 1; }
.cmp.embedded { position: absolute; }
.body { position: absolute; inset: 0; z-index: 1; }
.view { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 18px 92px; display: flex; flex-direction: column; gap: 14px; }
.row { display: flex; align-items: center; gap: 6px; }
.row.between { justify-content: space-between; gap: 10px; }
.num { font-variant-numeric: tabular-nums; }
.ell { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary-t); }
.gold { color: var(--gold); }
.fill { position: absolute; inset: 0; }
.ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--dim); }

/* artwork that melts into the background, like the Home header */
.hero { position: absolute; top: 0; left: 0; right: 0; height: 300px; z-index: -1; -webkit-mask-image: linear-gradient(180deg, #000 40%, transparent 100%); mask-image: linear-gradient(180deg, #000 40%, transparent 100%); }
.hero.short { height: 220px; }
.hero-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(6, 7, 12, 0.72) 0%, rgba(6, 7, 12, 0.25) 60%, transparent 100%), linear-gradient(180deg, transparent 40%, rgba(6, 7, 12, 0.5) 100%); }
.head { display: flex; align-items: flex-end; gap: 16px; margin-top: 120px; }
.head.plain { margin-top: 84px; }
.cover { position: relative; flex: none; width: 118px; height: 158px; border-radius: 10px; background: #1b2030; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.14); }
.head-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; padding-bottom: 2px; }
.head-t :deep(.t-title), .t-title { font-family: var(--display); font-size: 28px; font-weight: 800; line-height: 1.03; letter-spacing: -0.02em; text-shadow: 0 6px 30px rgba(0, 0, 0, 0.55); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sys-logo { max-height: 40px; max-width: 220px; object-fit: contain; object-position: left bottom; margin-bottom: 4px; filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.5)); }
.all-left { display: flex; align-items: center; gap: 6px; margin: 10px 2px 0; color: #cfd4de; font-size: 13px; }
.meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; color: #cfd4de; font-size: 13.5px; }

/* actions */
.acts { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pill { display: inline-flex; align-items: center; gap: 8px; height: 48px; padding: 0 22px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); border: 1px solid var(--line-2); color: var(--text); font: 600 14.5px var(--body); transition: transform 0.12s var(--ease), background 0.15s; backdrop-filter: blur(10px); }
.pill:active { transform: scale(0.96); }
.pill.primary { background: var(--grad); border-color: transparent; color: var(--on-primary); box-shadow: 0 10px 28px rgba(var(--primary-rgb), 0.35); }
.pill.ok { background: rgba(63, 185, 80, 0.14); border-color: rgba(63, 185, 80, 0.4); color: var(--green-l); }
.pill:disabled { opacity: 0.6; }
.inline-dl { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--muted); }
.bar { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: 3px; background: var(--grad); transition: width 0.5s var(--ease); }
.sum { display: flex; flex-direction: column; align-items: flex-start; }
.summary { margin: 0; color: #c3c9d4; font-size: 14px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.summary.open { display: block; }
.more { display: inline-flex; align-items: center; gap: 4px; min-height: 40px; color: var(--primary-t); font: 600 13.5px var(--body); }
.strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.s-cover { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; overflow: hidden; background: #1b2030; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08); transition: transform 0.12s var(--ease); }
.s-cover:active { transform: scale(0.95); }
.folder { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--line); color: var(--muted); }
.folder .path { flex: 1; min-width: 0; font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 12px; color: var(--text); overflow-wrap: anywhere; }

/* centred states (idle, no downloads) */
.center { align-items: center; justify-content: center; text-align: center; gap: 10px; padding-top: 10px; }
.halo { width: 104px; height: 104px; border-radius: 50%; display: grid; place-items: center; color: var(--primary-t); background: radial-gradient(circle at 50% 40%, rgba(var(--primary-rgb), 0.38), rgba(var(--primary-rgb), 0.08) 62%, transparent 72%); box-shadow: inset 0 0 0 1px rgba(var(--primary-l-rgb), 0.25); margin-bottom: 6px; }
.halo.big { width: 124px; height: 124px; }
.c-title { font-family: var(--display); font-size: 26px; font-weight: 800; letter-spacing: -0.01em; }
.c-sub { color: #cfd4de; font-size: 14px; }
.c-hint { color: var(--muted); font-size: 13.5px; max-width: 360px; line-height: 1.5; margin-bottom: 8px; }
.mini { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 420px; padding: 10px 12px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line); text-align: left; margin-top: 6px; }
.mini-cover { position: relative; flex: none; width: 40px; height: 54px; border-radius: 6px; background: #1b2030; }
.mini-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; }

/* downloads */
.now { position: relative; flex: none; margin-top: 18px; height: 178px; border-radius: 20px; overflow: hidden; display: flex; align-items: center; gap: 18px; padding: 18px; background: #151925; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08); }
.now-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 9, 16, 0.85), rgba(8, 9, 16, 0.55)); }
.now-cover { position: relative; flex: none; width: 104px; height: 140px; border-radius: 10px; background: #1b2030; box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.14); }
.now-t { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.now-name { font-family: var(--display); font-size: 19px; font-weight: 700; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.now-stats { display: flex; align-items: baseline; gap: 12px; }
.now-pct { font-family: var(--display); font-size: 36px; font-weight: 800; line-height: 1; }
.now-pct small { font-size: 18px; margin-left: 1px; color: var(--muted); }
.now-sub { font-size: 12.5px; color: var(--muted); }
.now .round { position: absolute; top: 12px; right: 12px; }
.list { display: flex; flex-direction: column; }
.lrow { display: flex; align-items: center; gap: 14px; padding: 10px 2px; border-bottom: 1px solid var(--line); }
.lrow:last-child { border-bottom: 0; }
.thumb { position: relative; flex: none; width: 42px; height: 56px; border-radius: 6px; background: #1b2030; }
.l-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.l-name { font-weight: 600; font-size: 14.5px; }
.l-sub { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; color: var(--muted); }
.lrow.done .st { color: var(--green-l); }
.lrow.error .st { color: var(--red); }
.done-ic { color: var(--green-l); flex: none; margin-right: 10px; }
.textbtn { align-self: center; min-height: 40px; padding: 0 12px; color: var(--muted); font: 600 13px var(--body); }
.round { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.08); border: 1px solid var(--line-2); color: var(--text); }
.round.small { width: 38px; height: 38px; }
.round:active { transform: scale(0.94); }

/* controls */
.pad { justify-content: space-between; padding-top: 16px; }
.k { display: grid; place-items: center; border: 1px solid var(--line-2); background: rgba(255, 255, 255, 0.07); color: var(--text); font: 700 18px var(--display); transition: transform 0.08s var(--ease), background 0.1s; touch-action: none; }
.k:active { transform: scale(0.92); background: rgba(var(--primary-rgb), 0.5); }
.shoulders { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.pill-k { height: 42px; border-radius: 999px; font-size: 14px; }
.gl { pointer-events: none; transform: scale(1.35); }
.sticks { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.dpad { display: grid; grid-template: repeat(3, 60px) / repeat(3, 60px); filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.3)); }
.dpad::before { content: ''; grid-area: 2 / 2; background: rgba(255, 255, 255, 0.07); }
.dpad .k { border-radius: 0; }
.dpad .up { grid-area: 1 / 2; border-radius: 14px 14px 0 0; border-bottom: 0; }
.dpad .down { grid-area: 3 / 2; border-radius: 0 0 14px 14px; border-top: 0; }
.dpad .left { grid-area: 2 / 1; border-radius: 14px 0 0 14px; border-right: 0; }
.dpad .right { grid-area: 2 / 3; border-radius: 0 14px 14px 0; border-left: 0; }
.facepad { display: grid; grid-template: repeat(3, 60px) / repeat(3, 60px); }
.facepad .k { border-radius: 50%; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); }
.facepad .y { grid-area: 1 / 2; } .facepad .x { grid-area: 2 / 1; } .facepad .b { grid-area: 2 / 3; } .facepad .a { grid-area: 3 / 2; }
.facepad.nin .x { grid-area: 1 / 2; } .facepad.nin .y { grid-area: 2 / 1; } .facepad.nin .a { grid-area: 2 / 3; } .facepad.nin .b { grid-area: 3 / 2; }
.facepad .k:not(.glyphed).a { background: var(--grad); border-color: transparent; color: var(--on-primary); }
.facepad .k.glyphed { background: rgba(255, 255, 255, 0.05); }
.face-gl { transform: scale(2); }
.jump { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.jbtn { display: flex; align-items: center; justify-content: center; gap: 7px; height: 44px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.04); color: var(--muted); font: 500 13.5px var(--body); transition: background 0.15s, color 0.15s; }
.jbtn.on { color: #fff; background: rgba(var(--primary-rgb), 0.24); border-color: rgba(var(--primary-l-rgb), 0.45); }
.jbtn:active { transform: scale(0.96); }

/* the dock */
.dock { position: absolute; z-index: 5; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; padding: 5px; border-radius: 999px; background: rgba(12, 14, 22, 0.62); border: 1px solid var(--line-2); backdrop-filter: blur(22px) saturate(1.3); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45); }
.d-tab { position: relative; display: inline-flex; align-items: center; gap: 7px; height: 44px; padding: 0 16px; border-radius: 999px; color: var(--muted); font: 500 13.5px var(--body); transition: background 0.2s, color 0.2s; }
.d-tab.on { color: #fff; background: rgba(var(--primary-rgb), 0.3); box-shadow: inset 0 0 0 1px rgba(var(--primary-l-rgb), 0.45); }
.badge { position: absolute; top: 3px; right: 6px; min-width: 16px; height: 16px; border-radius: 8px; background: var(--peach); color: var(--on-primary); font-size: 10px; font-weight: 700; display: grid; place-items: center; padding: 0 4px; }
.d-sep { width: 1px; height: 22px; background: var(--line-2); margin: 0 2px; }
.d-gear { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: var(--dim); transition: color 0.15s; }
.d-gear:active { color: var(--text); transform: scale(0.94); }
/* narrow phones */
@media (max-width: 440px) {
  .dpad, .facepad { grid-template: repeat(3, 52px) / repeat(3, 52px); }
  .face-gl { transform: scale(1.75); }
  .strip { grid-template-columns: repeat(4, 1fr); }
  .strip .s-cover:nth-child(n + 5) { display: none; }
  .head-t :deep(.t-title), .t-title { font-size: 24px; }
  .cover { width: 104px; height: 140px; }
}
</style>
