<template>
  <Background v-if="store.config" />
  <div v-if="!store.config" class="center" style="height: 100%"><div class="spinner" /></div>
  <Welcome v-else-if="store.welcoming || (!store.config.configured && !store.config.welcomed)" />
  <Setup v-else-if="!store.config.configured || store.route.name === 'setup'" />
  <div v-else class="shell" :style="{ '--card-w': cardW }">
    <header class="statusbar" :class="{ 'has-back': store.history.length }">
      <button v-if="store.history.length" class="backbtn" aria-label="Back" @click="back()"><Icon name="mdiArrowLeft" :size="22" /></button>
      <div class="brand"><Logo :size="30" /><span class="brand-word">Cartridge</span></div>
      <nav class="tabs">
        <Btn b="LT" class="tab-trig" />
        <button v-for="t in tabs" :key="t.name" class="tab" :class="{ active: activeTab === t.name }" @click="tab(t.name)">
          <Icon :name="t.icon" :size="18" /><span class="tab-label">{{ t.label }}</span>
          <span v-if="t.name === 'downloads' && activeDl.length" class="tab-badge">{{ activeDl.length }}</span>
          <span v-if="t.name === 'settings' && store.issues" class="tab-dot" :title="`${store.issues} waiting in Settings → Emulators`" />
        </button>
        <Btn b="RT" class="tab-trig" />
      </nav>
      <div class="spacer" />
      <label class="top-search" :class="{ on: store.route.name === 'search' }">
        <Icon name="mdiMagnify" :size="18" />
        <input ref="searchEl" data-focus data-nofirst data-key="top-search" :value="store.lastSearch" :readonly="builtinKb()" placeholder="Search games" autocomplete="off" spellcheck="false" @input="onSearch" @click="searchOsk" />
        <button v-if="store.lastSearch" class="clear" tabindex="-1" @mousedown.prevent @click="clearSearch"><Icon name="mdiClose" :size="16" /></button>
        <Btn v-else b="Y" />
      </label>
      <div class="sys">
        <div v-if="syncBusy" class="item sync-pill"><Icon name="mdiSync" :size="16" class="spin" />{{ syncLabel }}</div>
        <div v-if="steam.progress" class="item sync-pill"><Icon name="mdiSteam" :size="16" />{{ steamProgressLabel(steam.progress) }}</div>
        <div v-if="activeDl.length" class="item">
          <svg width="22" height="22" viewBox="0 0 36 36" class="ring"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="url(#rg)" stroke-width="4" stroke-linecap="round" :stroke-dasharray="`${dlPct * 0.943} 100`" transform="rotate(-90 18 18)" /><defs><linearGradient id="rg"><stop offset="0" style="stop-color: var(--primary-l)" /><stop offset="1" style="stop-color: var(--peach)" /></linearGradient></defs></svg>
          {{ dlPct }}%
        </div>
        <div v-if="store.connection.base" class="item net" :title="store.connection.route === 'local' ? 'Home network (LAN)' : 'Internet (Tunnel)'" :aria-label="store.connection.route === 'local' ? 'LAN' : 'Tunnel'"><Icon :name="store.connection.route === 'local' ? 'mdiHomeOutline' : 'mdiEarth'" :size="20" /></div>
        <div v-else class="item net bad"><Icon name="mdiCloudOffOutline" :size="18" />Offline</div>
        <div v-if="battery" class="item"><Icon :name="batteryIcon" :size="18" />{{ battery.level }}%</div>
        <div class="clock">{{ clock }}</div>
      </div>
    </header>
    <main class="main" ref="mainEl" data-zone>
      <component :is="views[store.route.name]" :key="viewKey" v-bind="store.route.params" />
    </main>
    <footer class="hintbar">
      <div class="left"><span class="hint"><Btn b="START" />Menu</span><span class="hint"><Btn b="SELECT" />Downloads</span></div>
      <span v-for="h in store.hints" :key="h.b + h.label" class="hint"><Btn :b="h.b" />{{ h.label }}</span>
    </footer>
  </div>

  <QuickMenu v-if="store.quickMenu" />
  <Keyboard v-if="store.modal?.type === 'keyboard' && builtinKb()" v-bind="store.modal.props" />
  <TextPrompt v-else-if="store.modal?.type === 'keyboard'" v-bind="store.modal.props" />
  <FolderPicker v-if="store.modal?.type === 'folder'" v-bind="store.modal.props" />
  <Menu v-if="store.modal?.type === 'menu'" v-bind="store.modal.props" />
  <ColorPicker v-if="store.modal?.type === 'color'" v-bind="store.modal.props" />
  <SteamCollections v-if="store.modal?.type === 'steam-collections'" :key="JSON.stringify(store.modal.props.selected) + (store.modal.props.extra || []).join()" v-bind="store.modal.props" />
  <SteamPreview v-if="store.modal?.type === 'steam-preview'" v-bind="store.modal.props" />
  <SteamEmu v-if="store.modal?.type === 'steam-emu'" :key="JSON.stringify(store.modal.props)" v-bind="store.modal.props" />
  <ArtPicker v-if="store.modal?.type === 'art'" :key="store.modal.props.query || ''" v-bind="store.modal.props" />
  <GameTimeline v-if="store.modal?.type === 'timeline'" v-bind="store.modal.props" />
  <FirstTour v-if="store.modal?.type === 'tour'" />
  <ManualViewer v-if="store.modal?.type === 'manual'" v-bind="store.modal.props" />
  <PatchesSheet v-if="store.modal?.type === 'patches'" v-bind="store.modal.props" />
  <IdleScreen v-if="store.config?.configured" />

  <div class="pops">
    <TransitionGroup name="pop">
      <div v-for="p in store.pops" :key="p.id" class="pop glass">
        <div class="pop-icon"><img v-if="p.icon" :src="p.icon" /><Grade v-else :g="p.grade" :size="40" /></div>
        <div class="pop-body">
          <div class="pop-kind"><Grade :g="p.grade" :size="16" />{{ p.grade ? GRADE[p.grade] + ' trophy unlocked' : 'Achievement unlocked' }}<template v-if="p.points"> · {{ p.points }} G</template></div>
          <div class="pop-name">{{ p.name }}</div>
          <div class="pop-game">{{ p.game }}</div>
        </div>
      </div>
    </TransitionGroup>
  </div>
  <div class="toasts" :class="{ shifted: store.quickMenu }">
    <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind"><span class="ti"><Icon :name="t.icon" :size="18" /></span>{{ t.msg }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick, defineAsyncComponent } from 'vue';
import { store, loadConfig, loadLibrary, loadArt, back, tab, go, call, toast, choose, saveConfig, builtinKb, askText, GRADE, activeTabs, TAB_DEFS } from './store.js';
import { pushLayer, focusFirst } from './nav.js';
import { setSoundEnabled, setSoundStyle, sfx } from './sfx.js';
import { applyTheme, CARD_SIZES } from './themes.js';
import { setPointerPref, setRumble, setBackground } from './nav.js';
import { detectPad } from './pad.js';
import Icon from './components/Icon.vue';
import Btn from './components/Btn.vue';
import Logo from './components/Logo.vue';
import Background from './components/Background.vue';
import Welcome from './views/Welcome.vue';
import QuickMenu from './components/QuickMenu.vue';
import TextPrompt from './components/TextPrompt.vue';
import Keyboard from './components/Keyboard.vue';
import Grade from './components/Grade.vue';
import FolderPicker from './components/FolderPicker.vue';
import Menu from './components/Menu.vue';
import ArtPicker from './components/ArtPicker.vue';
import GameTimeline from './components/GameTimeline.vue';
import FirstTour from './components/FirstTour.vue';
// the manual reader brings pdf.js: loaded the first time a manual opens, not at start
const ManualViewer = defineAsyncComponent(() => import('./components/ManualViewer.vue'));
import PatchesSheet from './components/PatchesSheet.vue';
import IdleScreen from './components/IdleScreen.vue';
import SteamCollections from './components/SteamCollections.vue';
import SteamPreview from './components/SteamPreview.vue';
import SteamEmu from './components/SteamEmu.vue';
import { steamReport, steam, steamProgressLabel } from './steam.js';
import ColorPicker from './components/ColorPicker.vue';
import Setup from './views/Setup.vue';
import Home from './views/Home.vue';
import Gallery from './views/Gallery.vue';
import Consoles from './views/Consoles.vue';
import Game from './views/Game.vue';
import Downloads from './views/Downloads.vue';
import SteamMissing from './views/SteamMissing.vue';
import SteamConsole from './views/SteamConsole.vue';
import Settings from './views/Settings.vue';
import Search from './views/Search.vue';
import Achievements from './views/Achievements.vue';
import RaGame from './views/RaGame.vue';
import TrophyGame from './views/TrophyGame.vue';
import Genres from './views/Genres.vue';
import Collections from './views/Collections.vue';
import EmuSetup from './views/EmuSetup.vue';
import ShortcutHealth from './views/ShortcutHealth.vue';
import FrameGen from './views/FrameGen.vue';

const views = { achievements: Achievements, 'ra-game': RaGame, 'trophy-game': TrophyGame, home: Home, library: Gallery, consoles: Consoles, platform: Gallery, collection: Gallery, genre: Gallery, genres: Genres, collections: Collections, game: Game, downloads: Downloads, settings: Settings, search: Search, 'steam-console': SteamConsole, 'steam-missing': SteamMissing, 'emu-setup': EmuSetup, 'steam-health': ShortcutHealth, 'frame-gen': FrameGen };
// the tabs you picked in Look & Feel → Top bar, in your order
const tabs = computed(() => activeTabs().map((name) => ({ name, ...TAB_DEFS[name] })));
const mainEl = ref(null);
const searchEl = ref(null);
// Search box in the top bar: typing jumps to the Search view and filters live
function onSearch(e) {
  store.lastSearch = e.target.value;
  if (store.route.name !== 'search' && e.target.value.trim()) go('search');
}
async function searchOsk() {
  if (!builtinKb()) return;
  const v = await askText({ title: 'Search games', value: store.lastSearch, placeholder: 'Game name', mode: 'game' });
  if (v == null) return;
  store.lastSearch = v;
  if (v.trim() && store.route.name !== 'search') go('search');
  await nextTick();
  toResults();
}
function clearSearch() { store.lastSearch = ''; searchEl.value?.focus(); }
function focusSearch() {
  if (builtinKb()) { searchOsk(); return; }
  if (store.route.name !== 'search') go('search');
  nextTick(() => { searchEl.value?.focus(); searchEl.value?.select(); });
}
function toResults() {
  const first = mainEl.value?.querySelector('.card[data-focus]');
  if (first) first.focus(); else searchEl.value?.blur();
}
const viewKey = computed(() => store.route.name + JSON.stringify(store.route.params));
const cardW = computed(() => (CARD_SIZES[store.config.ui.gridSize] || CARD_SIZES.md).w);
const activeTab = computed(() => {
  const n = store.route.name;
  if (tabs.value.find((t) => t.name === n)) return n;
  return store.history.find((h) => tabs.value.find((t) => t.name === h.name))?.name || '';
});
const activeDl = computed(() => store.downloads.filter((d) => d.status === 'downloading' || d.status === 'queued'));
const dlPct = computed(() => {
  const t = activeDl.value.reduce((s, d) => s + (d.total || 0), 0);
  const r = activeDl.value.reduce((s, d) => s + (d.received || 0), 0);
  return t ? Math.floor((r / t) * 100) : 0;
});
const syncBusy = computed(() => ['running', 'scanning'].includes(store.sync.state));
const syncLabel = computed(() => {
  const s = store.sync;
  if (s.state === 'scanning') return (s.label || 'Scanning server').slice(0, 42);
  return s.total ? `Syncing ${s.done + 1}/${s.total}` : 'Syncing…';
});

// clock + battery (the Deck reports battery through Chromium)
const clock = ref('');
const battery = ref(null);
const batteryIcon = computed(() => {
  const b = battery.value; if (!b) return 'mdiBattery';
  if (b.charging) return 'mdiBatteryCharging';
  const lvl = Math.round(b.level / 10) * 10;
  return lvl >= 100 ? 'mdiBattery' : lvl <= 10 ? 'mdiBatteryAlertVariantOutline' : `mdiBattery${lvl}`;
});
let clockT;
function tick() { clock.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function cycleTab(dir) {
  const list = tabs.value;
  const i = list.findIndex((t) => t.name === activeTab.value);
  // on a page whose tab is switched off, RT goes to the first tab and LT to the last
  tab(list[i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length].name);
}
function viewHandler(action) {
  const h = store.viewHandlers[action];
  return h ? h() : false;
}

onMounted(async () => {
  tick(); clockT = setInterval(tick, 10000);
  navigator.getBattery?.().then((b) => {
    const upd = () => { battery.value = b.level === 1 && b.charging && !b.dischargingTime ? null : { level: Math.round(b.level * 100), charging: b.charging }; };
    // desktops report a permanently full "battery"; hide it there
    if (!(b.level === 1 && b.charging && b.chargingTime === 0)) { upd(); b.onlevelchange = upd; b.onchargingchange = upd; }
  }).catch(() => {});
  await loadConfig();
  setSoundEnabled(store.config.ui.sounds !== false);
  setSoundStyle(store.config.ui.soundPack, store.config.ui.volume);
  setRumble(store.config.ui.rumble);
  applyTheme(store.config.ui);
  detectPad();
  setPointerPref(store.config.ui.pointer);
  await loadLibrary();
  loadArt();
  // Home can be taken off the top bar: start on the first tab instead
  if (store.route.name === 'home' && !activeTabs().includes('home')) tab(activeTabs()[0]);
  // opened from a Steam shortcut whose game is gone (--game <id>), or a second launch handing over
  const openGame = (id) => { if (id && store.lib) { store.quickMenu = false; go('game', { romId: Number(id) }); } };
  call('app:startGame').then(openGame).catch(() => {});
  window.cart.on('open-game', openGame);
  window.cart.on('background', (b) => setBackground(b?.away));
  window.cart.on('toast', (t) => t?.text && toast(t.text, t.kind || 'info', 4500, t.icon));
  setTimeout(steamReport, 2500);
  // 0.9: a new install goes through emulator Setup once, after connecting to RomM (the welcome does it since 0.9.15)
  if (store.config.configured && !store.config.setupDone && !store.welcoming) go('emu-setup', { first: true });
  // a hello with the name from the welcome
  const nm = (store.config.ui.name || '').trim();
  if (nm && store.config.configured && !store.welcoming) { const h = new Date().getHours(); setTimeout(() => toast(`Good ${h < 5 || h >= 18 ? 'evening' : h < 12 ? 'morning' : 'afternoon'}, ${nm}`, 'info', 2600, 'mdiHandWave'), 1200); }
  // anything waiting for you (a moved emulator, games out of their collections, missing BIOS) shows as
  // a dot on Settings and a list in Settings → Emulators, not a pop-up (0.9.3)
  setTimeout(() => { if (store.config.configured) call('issues:list').then((l) => (store.issues = l.length)).catch(() => {}); }, 8000);
  setTimeout(setupNotice, 3500);
  if (store.config.configured) call('server:status').then((c) => (store.connection = c)).catch(() => {});
  pushLayer(document.body, {
    back: () => { if (viewHandler('back') !== false) return; back(); },
    // Bumpers only switch sections inside a page (Achievements, consoles, collections). Top tabs are LT / RT.
    lb: () => { viewHandler('lb'); },
    rb: () => { viewHandler('rb'); },
    y: () => (viewHandler('y') !== false ? undefined : focusSearch()),
    accept: (a) => (a === searchEl.value ? toResults() : false),
    x: () => viewHandler('x'),
    // Triggers always move between the top tabs; bumpers belong to the page (consoles, collections)
    lt: () => cycleTab(-1),
    rt: () => cycleTab(1),
    select: () => (viewHandler('select') !== false ? undefined : tab('downloads')),
    start: () => { if (viewHandler('start') !== false) return; store.quickMenu = !store.quickMenu; },
  });
});
// connected for the first time (the RomM step just finished): emulators next
watch(() => store.config?.configured, (v, was) => { if (v && !was && !store.config.setupDone && !store.welcoming) go('emu-setup', { first: true }); });
// People who set up before 0.9 skipped Emulator setup: tell them about it once
async function setupNotice() {
  // 0.9.15: people who were set up before get the new welcome offered once (it includes the system scan)
  if (store.config?.configured && !store.config.welcomed && !store.config.ui.welcomeNotice && !store.modal && !store.welcoming) {
    saveConfig({ ui: { welcomeNotice: Date.now(), setupNotice: store.config.ui.setupNotice || Date.now() } });
    const w = await choose({ title: 'New: a Fresh Welcome and System Scan', message: 'Take a look? It starts from your current settings: nothing is reset or signed out, and you can leave at any point.\n\nIt\'s always in Settings → About.', options: [
      { label: 'Take a look', value: 'go', icon: 'mdiHandWave' },
      { label: 'Not now', value: 'later', icon: 'mdiClockOutline' },
    ] });
    if (w === 'go') store.welcoming = true;
    return;
  }
  if (store.config?.setupDone !== 'before 0.9' || store.config.ui.setupNotice || store.modal) return;
  saveConfig({ ui: { setupNotice: Date.now() } });
  const v = await choose({ title: 'New: Emulator setup', message: 'Cartridge can now find your emulators wherever they are, even renamed AppImages, and check each console before its games go into Steam: the emulator, its launch options, BIOS and folder access.\n\nIt’s always in Settings → Emulators.', options: [
    { label: 'Open Emulator setup', value: 'open', icon: 'mdiRadar' },
    { label: 'Later', value: 'later', icon: 'mdiClockOutline' },
  ] });
  if (v === 'open') go('emu-setup');
}
onBeforeUnmount(() => clearInterval(clockT));

watch(() => store.config?.ui && JSON.stringify(store.config.ui), () => { applyTheme(store.config.ui); setSoundStyle(store.config.ui.soundPack, store.config.ui.volume); setRumble(store.config.ui.rumble); });

// sync result toasts
watch(() => store.sync, (s) => {
  if (s.state === 'done') {
    if (s.firstSync) toast(`Library synced · ${s.total} games`, 'ok', 3400, 'mdiSync');
    else if (s.added) { toast(`${s.added} new game${s.added > 1 ? 's' : ''} from your server`, 'ok', 5000, 'mdiNewBox'); sfx.done(); }
    else if (store.manualSync) toast('Library is up to date', 'ok', 2400, 'mdiSync');
    store.manualSync = false;
  } else if (s.state === 'error' && store.manualSync) { store.manualSync = false; }
});
// finished downloads chime (once per download)
const announced = new Set();
let dlPrimed = false;
watch(() => store.downloads.map((d) => d.id + d.status).join(), () => {
  for (const d of store.downloads) {
    if (d.status !== 'done' || announced.has(d.id)) continue;
    announced.add(d.id);
    if (dlPrimed) {
      if (d.notice === 'stale') toast(`${d.name} is ready. RomM's checksum for it looks out of date, so a rescan in RomM would fix that.`, 'info', 6000, 'mdiCheckCircle');
      else if (d.notice === 'pkg') toast(`${d.name} is downloaded. Open it and press Install in ${d.installIn || 'RPCS3'} to play it.`, 'ok', 6000, 'mdiPackageDown');
      else toast(`${d.name} is ready to play`, 'ok', 3800, 'mdiCheckCircle');
      sfx.done();
    }
  }
  dlPrimed = true;
});

// focus management on view change
watch(viewKey, async () => {
  store.viewHandlers = {};
  await nextTick();
  if (document.activeElement === searchEl.value) return;
  const key = store.route.focusKey;
  const root = mainEl.value;
  if (!root) return;
  if (key) {
    for (let i = 0; i < 30; i++) {
      const el = root.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', inline: 'center' }); return; }
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  focusFirst(root);
});
</script>

<style scoped>
.tab-trig { margin: 0 4px; }
.top-search { display: flex; align-items: center; gap: 8px; flex: 0 1 260px; min-width: 130px; height: 40px; padding: 0 10px 0 14px; border-radius: 999px; background: var(--s2); color: var(--muted); cursor: text; transition: border-color 0.14s, background 0.14s; }
.top-search.on, .top-search:focus-within { background: var(--sel); border-color: transparent; color: var(--text); }
.top-search:focus-within { box-shadow: var(--ring); }
.top-search input { flex: 1; min-width: 0; height: 100%; font: inherit; font-size: var(--t-sm); color: var(--text); background: none; border: 0; outline: none; }
.top-search input:focus { box-shadow: none !important; }
.top-search input::placeholder { color: var(--muted); }
.top-search .clear { background: none; border: 0; color: var(--muted); padding: 4px; display: grid; place-items: center; }
.backbtn { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--s2); margin-right: -6px; }
.backbtn:active { background: rgba(255, 255, 255, 0.2); }
.tab-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: #ffd978; }
.tab-badge { position: absolute; top: 2px; right: 6px; min-width: 16px; height: 16px; border-radius: var(--r-md); background: var(--peach); color: var(--on-primary); font-size: var(--t-xs); font-weight: 700; display: grid; place-items: center; padding: 0 4px; }
.pops { position: fixed; top: 76px; right: 24px; z-index: 80; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
.pop { display: flex; gap: 14px; align-items: center; width: 380px; padding: 12px 16px 12px 12px; border-radius: var(--r-lg); background: rgba(18, 20, 32, 0.92); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12); }
.pop-icon { width: 60px; height: 60px; border-radius: var(--r-md); overflow: hidden; flex: none; display: grid; place-items: center; background: rgba(0, 0, 0, 0.35); }
.pop-icon img { width: 100%; height: 100%; object-fit: cover; }
.pop-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pop-kind { display: flex; gap: 6px; align-items: center; font-size: var(--t-xs); letter-spacing: 0.04em; color: #cfd6e4; }
.pop-name { font-family: var(--display); font-weight: 700; font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pop-game { font-size: var(--t-xs); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pop-enter-active, .pop-leave-active { transition: opacity 0.3s, transform 0.35s var(--ease); }
.pop-enter-from { opacity: 0; transform: translateX(40px); }
.pop-leave-to { opacity: 0; transform: translateY(-12px); }
.sync-pill { padding: 5px 12px; border-radius: 999px; background: rgba(var(--primary-rgb), 0.18); color: var(--primary-t); }
</style>
