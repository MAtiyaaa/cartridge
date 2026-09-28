<template>
  <div class="cmp" :class="{ ready: !!store.config }">
    <Background v-if="store.config" />

    <header class="cbar">
      <div class="where"><Logo :size="22" /><span>{{ routeLabel }}</span></div>
      <nav class="seg tabs">
        <button v-for="t in TABS" :key="t.id" :class="{ on: tab === t.id }" @click="tab = t.id">
          <Icon :name="t.icon" :size="17" />{{ t.label }}<b v-if="t.id === 'dl' && active.length" class="count">{{ active.length }}</b>
        </button>
      </nav>
      <button class="icon-btn" :class="{ warn: offArmed }" :aria-label="offArmed ? 'Tap again to turn off' : 'Turn off second screen'" @click="turnOff">
        <Icon name="mdiMonitorOff" :size="19" /><span v-if="offArmed">Tap again</span>
      </button>
    </header>

    <main class="body">
      <Transition name="fadeup" mode="out-in">
        <!-- Game -->
        <section v-if="tab === 'game' && rom" :key="'g' + rom.id" class="game">
          <div class="hero">
            <img v-if="heroSrc" :key="heroSrc" :src="heroSrc" class="hero-img" :class="{ blur: hero?.blur }" alt="" @error="(e) => retryImg(e)" />
            <div class="hero-fade" />
          </div>
          <div class="g-main">
            <div class="cover glass">
              <img v-if="coverSrc && !coverFailed" :src="coverSrc + (coverRetry ? '&r=1' : '')" alt="" @error="coverError" />
              <Icon v-else name="mdiGamepadVariantOutline" :size="40" />
            </div>
            <div class="meta">
              <div class="plat"><PIcon v-if="platform" :p="platform" :size="20" />{{ rom.platform_display_name || platform?.display_name }}</div>
              <GameLogo :logo="store.config.ui.logos !== false ? logoOf(rom) : null" :name="rom.name" cls="g-title" :area="16000" :max-w="330" :max-h="84" />
              <div class="chips">
                <span v-if="yr" class="chip">{{ yr }}</span>
                <span v-if="info.rating" class="chip gold"><Icon name="mdiStar" :size="14" />{{ rating(info.rating) }}</span>
                <span v-if="rom.fs_size_bytes" class="chip">{{ bytes(rom.fs_size_bytes) }}</span>
                <span v-if="installed" class="chip green"><Icon name="mdiCheckCircle" :size="14" />Installed</span>
              </div>
              <div v-if="info.genres" class="genres muted">{{ info.genres }}</div>
            </div>
          </div>

          <div v-if="dl && ['queued', 'downloading'].includes(dl.status)" class="dlcard glass">
            <div class="row between"><b>{{ dl.status === 'queued' ? 'Queued' : 'Downloading' }}</b><span class="muted num">{{ pctOf(dl) }}%<template v-if="dl.speed"> · {{ bytes(dl.speed) }}/s</template></span></div>
            <div class="bar-p"><i :style="{ width: pctOf(dl) + '%' }" /></div>
            <div class="muted small num">{{ bytes(dl.received) }} of {{ bytes(dl.total) }}</div>
          </div>

          <div class="acts">
            <button class="btn primary" @click="cmd({ open: true, romId: rom.id })"><Icon name="mdiOpenInNew" />Open on top screen</button>
            <button v-if="!installed && !dlActive" class="btn" :disabled="busyDl" @click="startDl"><Icon name="mdiDownload" />Download</button>
            <button v-else-if="dlActive" class="btn" @click="call('dl:cancel', dl.id)"><Icon name="mdiClose" />Cancel</button>
          </div>

          <div v-if="summary" class="sum-wrap">
            <p class="summary" :class="{ open: bioOpen }">{{ summary }}</p>
            <button v-if="summary.length > 220" class="more" @click="bioOpen = !bioOpen">{{ bioOpen ? 'Less' : 'More' }}<Icon :name="bioOpen ? 'mdiChevronUp' : 'mdiChevronDown'" :size="16" /></button>
          </div>
        </section>

        <!-- Console -->
        <section v-else-if="tab === 'game' && selPlat" :key="'p' + selPlat.id" class="game">
          <div class="p-main">
            <div class="tile-wrap"><SysTile :p="selPlat" @open="cmd({ open: true, platformId: selPlat.id })" /></div>
            <div class="meta">
              <div class="plat"><PIcon :p="selPlat" :size="20" />Console</div>
              <div class="g-title">{{ selPlat.display_name || selPlat.name }}</div>
              <div class="chips">
                <span class="chip">{{ selPlat.rom_count || 0 }} {{ selPlat.rom_count === 1 ? 'game' : 'games' }}</span>
                <span class="chip" :class="{ green: platOnDevice }">{{ platOnDevice }} on this device</span>
                <span class="chip" :class="selPlat.target?.source === 'custom' ? 'primary' : selPlat.target?.exists ? 'green' : ''">{{ selPlat.target?.source === 'custom' ? 'Custom folder' : selPlat.target?.exists ? 'Folder found' : selPlat.target?.path ? 'Folder will be created' : 'No folder' }}</span>
              </div>
              <div v-if="selPlat.target?.path" class="path muted">{{ selPlat.target.path }}</div>
            </div>
          </div>
          <div class="acts"><button class="btn primary" @click="cmd({ open: true, platformId: selPlat.id })"><Icon name="mdiOpenInNew" />Open on top screen</button></div>
        </section>

        <!-- Collection -->
        <section v-else-if="tab === 'game' && selColl" :key="'c' + selColl.id" class="game">
          <div class="p-main">
            <div class="tile-wrap"><CollTile :c="selColl" @open="cmd({ open: true, collectionId: selColl.id })" /></div>
            <div class="meta">
              <div class="plat"><Icon name="mdiBookmarkMultipleOutline" :size="18" />Collection</div>
              <div class="g-title">{{ selColl.name }}</div>
              <div class="chips">
                <span class="chip">{{ collCount }} {{ collCount === 1 ? 'game' : 'games' }}</span>
                <span class="chip" :class="{ green: collOnDevice }">{{ collOnDevice }} on this device</span>
              </div>
              <p v-if="selColl.description" class="summary">{{ selColl.description }}</p>
            </div>
          </div>
          <div class="acts"><button class="btn primary" @click="cmd({ open: true, collectionId: selColl.id })"><Icon name="mdiOpenInNew" />Open on top screen</button></div>
        </section>

        <section v-else-if="tab === 'game'" key="idle" class="idle">
          <Logo :size="54" />
          <div class="idle-t">{{ routeLabel }}</div>
          <div class="muted">{{ libLine }}</div>
          <div class="muted small">Highlight a game on the top screen to see it here</div>
          <div v-if="current" class="dlcard glass wide">
            <div class="row between"><b class="ell">{{ current.name }}</b><span class="muted num">{{ pctOf(current) }}%</span></div>
            <div class="bar-p"><i :style="{ width: pctOf(current) + '%' }" /></div>
          </div>
        </section>

        <!-- Downloads -->
        <section v-else-if="tab === 'dl'" key="dl" class="dls" data-scroll>
          <div v-if="!store.downloads.length" class="idle">
            <Icon name="mdiTrayArrowDown" :size="44" />
            <div class="idle-t">No downloads</div>
            <div class="muted small">Games you download show up here with live progress</div>
          </div>
          <template v-else>
            <div v-for="d in sortedDl" :key="d.id" class="dl glass">
              <div class="thumb"><img v-if="d.cover" :src="img(d.cover)" alt="" /><Icon v-else name="mdiGamepadVariantOutline" :size="22" /></div>
              <div class="dl-t">
                <div class="row between"><b class="ell">{{ d.name }}</b><span class="st" :class="d.status">{{ statusText(d) }}</span></div>
                <div class="muted small ell">{{ d.platformName }}</div>
                <div v-if="['queued', 'downloading'].includes(d.status)" class="bar-p"><i :style="{ width: pctOf(d) + '%' }" /></div>
              </div>
              <button v-if="['queued', 'downloading'].includes(d.status)" class="icon-btn" aria-label="Cancel" @click="call('dl:cancel', d.id)"><Icon name="mdiClose" :size="18" /></button>
              <button v-else-if="['error', 'cancelled'].includes(d.status)" class="icon-btn" aria-label="Retry" @click="call('dl:retry', d.id)"><Icon name="mdiRefresh" :size="18" /></button>
            </div>
            <button v-if="finished" class="btn small clear" @click="call('dl:clear')"><Icon name="mdiNotificationClearAll" />Clear finished</button>
          </template>
        </section>

        <!-- Controls -->
        <section v-else key="pad" class="pad">
          <div class="shoulders">
            <button class="k pill" @pointerdown.prevent="press('lt')">LT<small>Tab</small></button>
            <button class="k pill" @pointerdown.prevent="press('lb')">LB</button>
            <button class="k pill" @pointerdown.prevent="press('select')"><Icon name="mdiTrayArrowDown" :size="16" /></button>
            <button class="k pill" @pointerdown.prevent="press('start')"><Icon name="mdiMenu" :size="16" /></button>
            <button class="k pill" @pointerdown.prevent="press('rb')">RB</button>
            <button class="k pill" @pointerdown.prevent="press('rt')">RT<small>Tab</small></button>
          </div>
          <div class="sticks">
            <div class="dpad">
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
            <button v-for="t in JUMPS" :key="t.id" class="chip-btn" :class="{ on: store.companion?.route === t.id }" @click="cmd({ tab: t.id })"><Icon :name="t.icon" :size="18" />{{ t.label }}</button>
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
import SysTile from '../components/SysTile.vue';
import CollTile from '../components/CollTile.vue';
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
  coverFailed.value = false;
  coverRetry.value = false;
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
const coverFailed = ref(false);
const coverRetry = ref(false);
const bioOpen = ref(false);
// A cover that fails (server busy, connection dropped) gets one more try before the placeholder shows
function coverError() {
  if (coverRetry.value) { coverFailed.value = true; return; }
  setTimeout(() => (coverRetry.value = true), 1500);
}
function retryImg(e) {
  const el = e.target;
  if (el.dataset.retried) return;
  el.dataset.retried = '1';
  setTimeout(() => { el.src = el.src + '&r=1'; }, 1500);
}

// ---------------- highlighted console / collection
const selPlat = computed(() => (!rom.value && store.companion.platformId ? platformById(store.companion.platformId) : null));
const platOnDevice = computed(() => (selPlat.value ? romsOf(selPlat.value.id).filter((r) => store.installed[r.id]).length : 0));
const selColl = computed(() => (!rom.value && !selPlat.value && store.companion.collectionId != null ? collectionById(store.companion.collectionId) : null));
const collCount = computed(() => selColl.value?.rom_ids?.length || selColl.value?.rom_count || 0);
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
.fadeup-enter-active, .fadeup-leave-active { transition: opacity 0.15s, transform 0.2s var(--ease); }
.fadeup-enter-from { opacity: 0; transform: translateY(6px); }
.fadeup-leave-to { opacity: 0; }
* { -webkit-tap-highlight-color: transparent; }
</style>
<style scoped>
.cmp { position: fixed; inset: 0; display: flex; flex-direction: column; overflow: hidden; opacity: 0; transition: opacity 0.3s var(--ease); }
.cmp.ready { opacity: 1; }
.cbar { position: relative; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 12px 14px 8px; }
.where { display: flex; align-items: center; gap: 8px; font-family: var(--display); font-weight: 700; font-size: 16px; min-width: 0; flex: 1; }
.where span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tabs { flex: none; }
.tabs button { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; }
.count { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--primary); color: var(--on-primary); font-size: 11px; display: inline-grid; place-items: center; }
.icon-btn { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 44px; min-width: 44px; padding: 0 10px; justify-content: center; border-radius: 10px; border: 1px solid var(--line-2); background: var(--glass-2); color: var(--muted); font: 500 13px var(--body); transition: background 0.15s, color 0.15s; }
.icon-btn:active { transform: scale(0.95); }
.icon-btn.warn { color: #ffa39c; border-color: rgba(255, 107, 97, 0.5); background: rgba(255, 107, 97, 0.14); }
.body { position: relative; z-index: 1; flex: 1; min-height: 0; padding: 4px 14px 14px; }
.body > section { height: 100%; }

.game { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; overscroll-behavior: contain; }
.hero { position: absolute; inset: -60px -14px auto; height: 300px; z-index: -1; pointer-events: none; }
.hero-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.55; }
.hero-img.blur { filter: blur(24px) saturate(1.2); transform: scale(1.15); }
.hero-fade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(var(--tint-rgb), 0.2) 0%, var(--bg) 96%); }
.g-main { display: flex; gap: 16px; align-items: flex-end; }
.cover { flex: none; width: 150px; aspect-ratio: 3 / 4; border-radius: var(--card-r, 8px); overflow: hidden; display: grid; place-items: center; color: var(--dim); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55); }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.plat { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--primary-t); }
.meta :deep(.g-title) { font-family: var(--display); font-size: 26px; line-height: 1.1; font-weight: 700; margin: 0; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip.gold { color: var(--gold); }
.genres { font-size: 13px; }
.dlcard { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.dlcard.wide { width: 100%; max-width: 420px; margin-top: 10px; }
.bar-p { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
.bar-p i { display: block; height: 100%; background: var(--grad); border-radius: 3px; transition: width 0.5s var(--ease); }
.acts { display: flex; gap: 10px; flex-wrap: wrap; }
.acts .btn { height: 46px; padding: 0 18px; }
.sum-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.summary { margin: 0; font-size: 14px; line-height: 1.55; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.summary.open { -webkit-line-clamp: unset; display: block; }
.more { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0 12px 0 0; color: var(--primary-t); font: 600 13.5px var(--body); }
.p-main { display: flex; gap: 18px; align-items: center; }
.tile-wrap { flex: none; width: 230px; }
.tile-wrap :deep(.systile), .tile-wrap :deep(.coll) { width: 100%; }
.g-title { font-family: var(--display); font-size: 26px; line-height: 1.1; font-weight: 700; }
.path { font-size: 12.5px; overflow-wrap: anywhere; }
.row.between { justify-content: space-between; gap: 10px; }
.ell { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.small { font-size: 12.5px; }
.num { font-variant-numeric: tabular-nums; }

.idle { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--muted); }
.idle-t { font-family: var(--display); font-size: 24px; font-weight: 700; color: var(--text); }

.dls { overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 8px; }
.dl { display: flex; align-items: center; gap: 12px; padding: 10px 12px; }
.thumb { flex: none; width: 44px; height: 58px; border-radius: 6px; overflow: hidden; background: var(--glass-hi); display: grid; place-items: center; color: var(--dim); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.dl-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.st { flex: none; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.st.done { color: var(--green-l); }
.st.error { color: var(--red); }
.clear { align-self: center; margin-top: 4px; }

.pad { display: flex; flex-direction: column; justify-content: space-between; gap: 12px; }
.k { display: grid; place-items: center; border: 1px solid var(--line-2); background: var(--glass-2); color: var(--text); font: 700 18px var(--display); transition: transform 0.08s var(--ease), background 0.1s; touch-action: none; }
.k:active { transform: scale(0.92); background: rgba(var(--primary-rgb), 0.5); }
.shoulders { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.pill { height: 44px; border-radius: 12px; font-size: 14px; display: flex; flex-direction: column; gap: 0; line-height: 1.05; }
.pill small { font: 500 10px var(--body); color: var(--muted); }
.sticks { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.dpad { display: grid; grid-template: repeat(3, 62px) / repeat(3, 62px); }
.dpad .k { border-radius: 14px; }
.dpad .up { grid-area: 1 / 2; } .dpad .left { grid-area: 2 / 1; } .dpad .right { grid-area: 2 / 3; } .dpad .down { grid-area: 3 / 2; }
.face { display: grid; grid-template: repeat(3, 62px) / repeat(3, 62px); }
.face .k { border-radius: 50%; }
.face .y { grid-area: 1 / 2; } .face .x { grid-area: 2 / 1; } .face .b { grid-area: 2 / 3; } .face .a { grid-area: 3 / 2; background: var(--primary); border-color: transparent; color: var(--on-primary); }
.jump { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.chip-btn { display: flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border-radius: 10px; border: 1px solid var(--line); background: var(--glass-bg); color: var(--muted); font: 500 13.5px var(--body); }
.chip-btn.on { color: var(--text); border-color: rgba(var(--primary-l-rgb), 0.5); background: rgba(var(--primary-rgb), 0.2); }
.chip-btn:active { transform: scale(0.96); }
</style>
