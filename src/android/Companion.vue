<template>
  <div class="cmp" :class="{ ready: !!store.config }">
    <Background v-if="store.config" still />

    <header class="cbar">
      <div class="where"><Logo :size="24" /><div><div class="eyebrow">Cartridge</div><div class="where-t">{{ routeLabel }}</div></div></div>
      <nav class="tabs">
        <button v-for="t in TABS" :key="t.id" class="tab" :class="{ active: tab === t.id }" @click="tab = t.id">
          <Icon :name="t.icon" :size="18" /><span>{{ t.label }}</span>
          <span v-if="t.id === 'dl' && active.length" class="badge">{{ active.length }}</span>
        </button>
      </nav>
      <button class="round" :class="{ warn: offArmed }" :aria-label="offArmed ? 'Tap again to turn off' : 'Turn off second screen'" @click="turnOff">
        <Icon :name="offArmed ? 'mdiPower' : 'mdiMonitorOff'" :size="20" />
      </button>
    </header>
    <div v-if="offArmed" class="off-hint">Tap again to turn the second screen off</div>

    <main class="body">
      <Transition name="cfade" mode="out-in">
        <!-- Game -->
        <section v-if="tab === 'game' && rom" :key="'g' + rom.id" class="view" data-scroll>
          <div class="banner">
            <Art class="fill" :src="heroSrc" :blur="hero?.blur" />
            <div class="shade" />
            <div class="banner-logo"><GameLogo :logo="store.config.ui.logos !== false ? logoOf(rom) : null" :name="rom.name" cls="b-title" :area="15000" :max-w="340" :max-h="86" /></div>
            <Art class="cover" :src="coverSrc"><div class="cover-ph"><PIcon v-if="platform" :p="platform" :size="44" /></div></Art>
          </div>

          <div class="meta">
            <span class="row"><PIcon v-if="platform" :p="platform" :size="18" />{{ rom.platform_display_name || platform?.display_name }}</span>
            <span v-if="yr">{{ yr }}</span>
            <span v-if="info.genres">{{ info.genres }}</span>
            <span v-if="rom.fs_size_bytes">{{ bytes(rom.fs_size_bytes) }}</span>
            <span v-if="info.rating" class="row gold"><Icon name="mdiStar" :size="15" />{{ rating(info.rating) }}</span>
          </div>

          <div v-if="dlActive" class="dlbox glass">
            <div class="dl-row"><b>{{ dl.status === 'queued' ? 'Queued' : 'Downloading' }}</b><span class="num">{{ pctOf(dl) }}%<template v-if="dl.speed"> · {{ bytes(dl.speed) }}/s</template></span></div>
            <div class="bar"><i :style="{ width: pctOf(dl) + '%' }" /></div>
          </div>

          <div class="acts">
            <button class="btn primary" @click="cmd({ open: true, romId: rom.id })"><Icon name="mdiOpenInNew" />Open</button>
            <span v-if="installed" class="chip green big"><Icon name="mdiCheckCircle" :size="16" />On this device</span>
            <button v-else-if="dlActive" class="btn" @click="call('dl:cancel', dl.id)"><Icon name="mdiClose" />Cancel</button>
            <button v-else class="btn" :disabled="busyDl" @click="startDl"><Icon name="mdiDownload" />Download</button>
          </div>

          <div v-if="summary" class="sum">
            <p class="summary" :class="{ open: bioOpen }">{{ summary }}</p>
            <button v-if="summary.length > 200" class="more" @click="bioOpen = !bioOpen">{{ bioOpen ? 'Show less' : 'Show more' }}<Icon :name="bioOpen ? 'mdiChevronUp' : 'mdiChevronDown'" :size="16" /></button>
          </div>
        </section>

        <!-- Console -->
        <section v-else-if="tab === 'game' && selPlat" :key="'p' + selPlat.id" class="view" data-scroll>
          <div class="banner sys" :style="sysStyle">
            <div class="glyph"><PIcon :p="selPlat" :size="190" /></div>
            <div class="banner-logo">
              <img v-if="sysLogo" class="sys-logo" :src="sysLogo" :alt="selPlat.display_name" />
              <div v-else class="b-title">{{ selPlat.display_name }}</div>
            </div>
          </div>
          <div class="eyebrow">System</div>
          <div class="h-title">{{ selPlat.display_name || selPlat.name }}</div>
          <div class="meta">
            <span>{{ selPlat.rom_count || 0 }} {{ selPlat.rom_count === 1 ? 'game' : 'games' }} on your server</span>
            <span v-if="platOnDevice" class="chip green">{{ platOnDevice }} on this device</span>
          </div>
          <div class="folder glass">
            <Icon name="mdiFolderOutline" :size="20" />
            <span class="path">{{ selPlat.target?.path || 'No folder set' }}</span>
            <span class="chip" :class="selPlat.target?.source === 'custom' ? 'primary' : selPlat.target?.exists ? 'green' : ''">{{ selPlat.target?.source === 'custom' ? 'Custom' : selPlat.target?.exists ? 'Found' : selPlat.target?.path ? 'Will create' : 'Not set' }}</span>
          </div>
          <div class="acts"><button class="btn primary" @click="cmd({ open: true, platformId: selPlat.id })"><Icon name="mdiOpenInNew" />Open</button></div>
        </section>

        <!-- Collection -->
        <section v-else-if="tab === 'game' && selColl" :key="'c' + selColl.id" class="view" data-scroll>
          <div class="banner coll">
            <Art v-if="collArts[0]" class="fill" :src="collArts[0]" blur />
            <div class="shade" />
            <div class="covers" :class="'n' + collArts.length">
              <Art v-for="(a, i) in collArts" :key="a + i" class="c-art" :src="a" />
              <div v-if="!collArts.length" class="c-ph"><Icon :name="selColl.favorite ? 'mdiStar' : 'mdiBookmarkMultipleOutline'" :size="48" /></div>
            </div>
          </div>
          <div class="eyebrow">{{ selColl.favorite ? 'Favourites' : selColl.smart ? 'Smart collection' : 'Collection' }}</div>
          <div class="h-title">{{ selColl.name }}</div>
          <div class="meta">
            <span>{{ collCount }} {{ collCount === 1 ? 'game' : 'games' }}</span>
            <span v-if="collOnDevice" class="chip green">{{ collOnDevice }} on this device</span>
          </div>
          <p v-if="selColl.description" class="summary">{{ selColl.description }}</p>
          <div class="acts"><button class="btn primary" @click="cmd({ open: true, collectionId: selColl.id })"><Icon name="mdiOpenInNew" />Open</button></div>
        </section>

        <!-- Nothing highlighted -->
        <section v-else-if="tab === 'game'" key="idle" class="view idle">
          <Logo :size="64" />
          <div class="h-title">{{ routeLabel }}</div>
          <div class="muted">{{ libLine }}</div>
          <div class="hint">Highlight a game or console on the top screen</div>
          <div v-if="current" class="dlbox glass wide">
            <div class="dl-row"><b class="ell">{{ current.name }}</b><span class="num">{{ pctOf(current) }}%</span></div>
            <div class="bar"><i :style="{ width: pctOf(current) + '%' }" /></div>
          </div>
        </section>

        <!-- Downloads -->
        <section v-else-if="tab === 'dl'" key="dl" class="view" data-scroll>
          <div v-if="!store.downloads.length" class="idle">
            <Icon name="mdiTrayArrowDown" :size="48" />
            <div class="h-title">No downloads</div>
            <div class="hint">Games you download show up here with live progress</div>
          </div>
          <template v-else>
            <div v-for="d in sortedDl" :key="d.id" class="dcard glass" :class="d.status">
              <Art class="thumb" :src="d.cover ? img(d.cover) : ''"><div class="thumb-ph"><Icon name="mdiGamepadVariantOutline" :size="22" /></div></Art>
              <div class="d-main">
                <div class="d-name ell">{{ d.name }}</div>
                <div class="d-sub"><span class="ell">{{ d.platformName }}</span><span class="st num">{{ statusText(d) }}</span></div>
                <div v-if="['queued', 'downloading'].includes(d.status)" class="bar"><i :style="{ width: pctOf(d) + '%' }" /></div>
              </div>
              <button v-if="['queued', 'downloading'].includes(d.status)" class="round" aria-label="Cancel" @click="call('dl:cancel', d.id)"><Icon name="mdiClose" :size="18" /></button>
              <button v-else-if="['error', 'cancelled'].includes(d.status)" class="round" aria-label="Retry" @click="call('dl:retry', d.id)"><Icon name="mdiRefresh" :size="18" /></button>
              <Icon v-else-if="d.status === 'done'" name="mdiCheckCircle" :size="22" class="ok-ic" />
            </div>
            <button v-if="finished" class="btn small clear" @click="call('dl:clear')"><Icon name="mdiNotificationClearAll" />Clear finished</button>
          </template>
        </section>

        <!-- Controls -->
        <section v-else key="pad" class="view pad">
          <div class="shoulders">
            <button class="k pill" @pointerdown.prevent="press('lt')">LT</button>
            <button class="k pill" @pointerdown.prevent="press('lb')">LB</button>
            <button class="k pill" aria-label="Select" @pointerdown.prevent="press('select')"><Icon name="mdiTrayArrowDown" :size="18" /></button>
            <button class="k pill" aria-label="Start" @pointerdown.prevent="press('start')"><Icon name="mdiMenu" :size="18" /></button>
            <button class="k pill" @pointerdown.prevent="press('rb')">RB</button>
            <button class="k pill" @pointerdown.prevent="press('rt')">RT</button>
          </div>
          <div class="sticks">
            <div class="dpad glass">
              <button v-for="d in DIRS" :key="d.a" class="k" :class="d.a" :aria-label="d.a" @pointerdown.prevent="hold(d.a)" @pointerup="release" @pointerleave="release" @pointercancel="release"><Icon :name="d.icon" :size="30" /></button>
            </div>
            <div class="face">
              <button class="k y" aria-label="Y" @pointerdown.prevent="press('y')">Y</button>
              <button class="k x" aria-label="X" @pointerdown.prevent="press('x')">X</button>
              <button class="k b" aria-label="B" @pointerdown.prevent="press('back')">B</button>
              <button class="k a" aria-label="A" @pointerdown.prevent="press('accept')">A</button>
            </div>
          </div>
          <div class="jump">
            <button v-for="t in JUMPS" :key="t.id" class="jbtn" :class="{ on: store.companion?.route === t.id }" @click="cmd({ tab: t.id })"><Icon :name="t.icon" :size="18" />{{ t.label }}</button>
          </div>
        </section>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, loadConfig, loadLibrary, loadArt, romById, platformById, collectionById, romsOf, romsOfCollection, cover, backdropOf, logoOf, bytes, year, rating, img, downloadFor, download } from '../store.js';
import { applyTheme } from '../themes.js';
import Background from '../components/Background.vue';
import GameLogo from '../components/GameLogo.vue';
import PIcon from '../components/PIcon.vue';
import Logo from '../components/Logo.vue';
import Art from './Art.vue';
import { consoleColors } from '../consoleColors.js';
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
const DIRS = [
  { a: 'up', icon: 'mdiChevronUp' }, { a: 'left', icon: 'mdiChevronLeft' },
  { a: 'right', icon: 'mdiChevronRight' }, { a: 'down', icon: 'mdiChevronDown' },
];
const ROUTES = { home: 'Home', library: 'Library', consoles: 'Consoles', platform: 'Console', collection: 'Collection', game: 'Game', downloads: 'Downloads', settings: 'Settings', search: 'Search', achievements: 'Achievements', 'ra-game': 'Achievements', 'trophy-game': 'Trophies', setup: 'Setup' };

const tab = ref('game');
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
const sysStyle = computed(() => {
  const p = selPlat.value;
  const c = p && consoleColors(p);
  if (!c) return { background: 'linear-gradient(145deg, rgba(var(--primary-rgb), .55), rgba(14,16,24,.94) 70%)' };
  const [a, b] = c;
  return { background: `radial-gradient(120% 90% at 0% 0%, ${a}e6 0%, ${a}8c 38%, transparent 70%), linear-gradient(150deg, ${a}66 0%, ${b}59 60%, rgba(12,13,20,.92) 100%), rgba(14,16,24,.9)` };
});
// Collection banner: up to four covers, like its tile on the top screen
const collArts = computed(() => {
  const c = selColl.value;
  if (!c) return [];
  if (c.covers?.length) return c.covers.slice(0, 4).map(img);
  const fromRoms = romsOfCollection(c.id).slice(0, 4).map((r) => cover(r, true)).filter(Boolean);
  return fromRoms.length ? fromRoms : c.cover ? [img(c.cover)] : [];
});
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
const pctOf = (d) => (d?.total ? Math.min(100, Math.round((d.received / d.total) * 100)) : 0);
function statusText(d) {
  if (d.status === 'downloading') return pctOf(d) + '%' + (d.speed ? ' · ' + bytes(d.speed) + '/s' : '');
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
const cmd = (c) => call('android:companion:cmd', c).catch(() => {});
function press(action) { navigator.vibrate?.(8); cmd({ pad: action }); }
let holdT = null;
function hold(action) {
  press(action);
  clearTimeout(holdT);
  const again = (ms) => { holdT = setTimeout(() => { cmd({ pad: action }); again(80); }, ms); };
  again(320);
}
function release() { clearTimeout(holdT); holdT = null; }

const offArmed = ref(false);
let offT = null;
function turnOff() {
  if (!offArmed.value) { offArmed.value = true; clearTimeout(offT); offT = setTimeout(() => (offArmed.value = false), 2500); return; }
  cmd({ dualScreen: false });
}

// ---------------- startup
cart.on('android:companion:state', (s) => { if (s) store.companion = s; });
// Look & Feel changed on the top screen: theme, colours, fonts, background and wallpaper follow here
cart.on('android:config', (c) => { if (c) store.config = c; });
onMounted(async () => {
  await loadConfig();
  applyTheme(store.config.ui);
  watch(() => JSON.stringify(store.config?.ui || {}), () => applyTheme(store.config.ui));
  try { store.companion = (await call('android:companion:get')) || store.companion; } catch {}
  await loadLibrary().catch(() => {});
  loadArt();
  try { store.downloads = await call('dl:list'); } catch {}
});
</script>
<style>
html, body { touch-action: pan-x pan-y; }
* { -webkit-tap-highlight-color: transparent; }
.cfade-enter-active { transition: opacity 0.18s ease-out, transform 0.22s var(--ease); }
.cfade-leave-active { transition: opacity 0.1s ease-in; }
.cfade-enter-from { opacity: 0; transform: translateY(6px); }
.cfade-leave-to { opacity: 0; }
</style>
<style scoped>
.cmp { position: fixed; inset: 0; display: flex; flex-direction: column; overflow: hidden; opacity: 0; transition: opacity 0.3s var(--ease); }
.cmp.ready { opacity: 1; }

/* top bar: the top screen's pill tabs */
.cbar { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 14px 16px 10px; }
.where { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
.where-t { font-family: var(--display); font-weight: 700; font-size: 17px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary-t); }
.tabs { margin-left: 0; flex: none; }
.tab { min-height: 40px; padding: 8px 14px; }
.badge { position: absolute; top: 2px; right: 4px; min-width: 16px; height: 16px; border-radius: 8px; background: var(--peach); color: var(--on-primary); font-size: 10px; font-weight: 700; display: grid; place-items: center; padding: 0 4px; }
.round { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); color: var(--muted); transition: background 0.15s, color 0.15s, transform 0.1s var(--ease); }
.round:active { transform: scale(0.94); }
.round.warn { color: #ffa39c; border-color: rgba(255, 107, 97, 0.55); background: rgba(255, 107, 97, 0.16); }
.off-hint { position: relative; z-index: 2; margin: -4px 16px 6px; font-size: 12.5px; color: #ffa39c; text-align: right; }

.body { position: relative; z-index: 1; flex: 1; min-height: 0; }
.view { height: 100%; overflow-y: auto; overscroll-behavior: contain; padding: 4px 16px 18px; display: flex; flex-direction: column; gap: 12px; }

/* banner: the Game page's */
.banner { position: relative; flex: none; height: 214px; border-radius: 16px; overflow: hidden; background: #141824; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.07); }
.fill { position: absolute; inset: 0; }
.shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 8, 16, 0.78) 0%, rgba(8, 8, 16, 0.35) 45%, transparent 75%), linear-gradient(0deg, rgba(8, 8, 16, 0.72), transparent 55%); }
.banner-logo { position: absolute; left: 22px; bottom: 20px; right: 150px; display: flex; align-items: flex-end; }
.banner :deep(.b-title), .b-title { font-family: var(--display); font-size: 30px; font-weight: 800; line-height: 1.02; letter-spacing: -0.02em; text-shadow: 0 6px 30px rgba(0, 0, 0, 0.55); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.cover { position: absolute; right: 18px; bottom: 18px; width: 112px; height: 150px; border-radius: var(--card-r, 8px); background: #1b2030; box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12); }
.cover-ph, .thumb-ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--dim); }

.sys .glyph { position: absolute; right: -24px; bottom: -34px; opacity: 0.16; color: #fff; }
.sys .banner-logo { right: 22px; top: 0; bottom: 0; align-items: center; }
.sys-logo { max-width: 62%; max-height: 70px; object-fit: contain; filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.4)); }
.coll .covers { position: absolute; inset: 22px; display: grid; gap: 10px; }
.covers.n1 { grid-template-columns: 124px; justify-content: center; }
.covers.n2 { grid-template-columns: repeat(2, 124px); justify-content: center; }
.covers.n3 { grid-template-columns: repeat(3, 124px); justify-content: center; }
.covers.n4 { grid-template-columns: repeat(4, 1fr); }
.c-art { border-radius: var(--card-r, 8px); background: #1b2030; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.1); }
.c-ph { grid-column: 1 / -1; display: grid; place-items: center; color: var(--gold); }
.h-title { font-family: var(--display); font-size: 28px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; margin-top: -6px; }

/* the Home hero's meta line */
.meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 14px; color: #cfd4de; font-size: 14px; }
.meta .row { gap: 6px; }
.gold { color: var(--gold); }
.acts { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.acts .btn { height: 48px; padding: 0 22px; }
.chip.big { height: 40px; padding: 0 14px; font-size: 13.5px; }
.dlbox { padding: 12px 14px; display: flex; flex-direction: column; gap: 9px; }
.dlbox.wide { width: 100%; max-width: 440px; }
.dl-row { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; color: var(--muted); }
.dl-row b { color: var(--text); font-weight: 600; }
.num { font-variant-numeric: tabular-nums; }
.ell { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sum { display: flex; flex-direction: column; align-items: flex-start; }
.summary { margin: 0; color: #c3c9d4; font-size: 14px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.summary.open { display: block; }
.more { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; color: var(--primary-t); font: 600 13.5px var(--body); }
.folder { display: flex; align-items: center; gap: 12px; padding: 12px 14px; color: var(--muted); }
.folder .path { flex: 1; min-width: 0; font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 12.5px; color: var(--text); overflow-wrap: anywhere; }

.idle { height: 100%; align-items: center; justify-content: center; text-align: center; gap: 8px; }
.hint { font-size: 13px; color: var(--dim); }

/* downloads: the top screen's cards */
.dcard { display: flex; align-items: center; gap: 14px; padding: 10px 12px; }
.thumb { flex: none; width: 48px; height: 64px; border-radius: 6px; background: #1b2030; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
.d-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.d-name { font-family: var(--display); font-weight: 600; font-size: 15px; }
.d-sub { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; color: var(--muted); }
.st { flex: none; }
.dcard.done .st { color: var(--green-l); }
.dcard.error .st { color: var(--red); }
.ok-ic { color: var(--green-l); flex: none; margin-right: 10px; }
.clear { align-self: center; }

/* controls */
.pad { justify-content: space-between; }
.k { display: grid; place-items: center; border: 1px solid var(--line-2); background: rgba(255, 255, 255, 0.07); color: var(--text); font: 700 18px var(--display); transition: transform 0.08s var(--ease), background 0.1s; touch-action: none; }
.k:active { transform: scale(0.92); background: rgba(var(--primary-rgb), 0.5); }
.shoulders { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.pill { height: 44px; border-radius: 12px; font-size: 14px; }
.sticks { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; }
.dpad { display: grid; grid-template: repeat(3, 60px) / repeat(3, 60px); border-radius: 20px; padding: 4px; }
.dpad .k { border-radius: 14px; }
.dpad .up { grid-area: 1 / 2; } .dpad .left { grid-area: 2 / 1; } .dpad .right { grid-area: 2 / 3; } .dpad .down { grid-area: 3 / 2; }
.face { display: grid; grid-template: repeat(3, 60px) / repeat(3, 60px); }
.face .k { border-radius: 50%; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); }
.face .y { grid-area: 1 / 2; } .face .x { grid-area: 2 / 1; } .face .b { grid-area: 2 / 3; }
.face .a { grid-area: 3 / 2; background: var(--grad); border-color: transparent; color: var(--on-primary); }
.jump { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.jbtn { display: flex; align-items: center; justify-content: center; gap: 7px; height: 44px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.04); color: var(--muted); font: 500 13.5px var(--body); transition: background 0.15s, color 0.15s; }
.jbtn.on { color: #fff; background: rgba(var(--primary-rgb), 0.28); box-shadow: inset 0 0 0 1px rgba(var(--primary-l-rgb), 0.45); }
.jbtn:active { transform: scale(0.96); }
</style>
