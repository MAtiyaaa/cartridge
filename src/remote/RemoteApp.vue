<template>
  <div class="rm" :class="{ ready: !!store.config || hub.ready }">
    <Background v-if="store.config" still />

    <!-- Devices on this network -->
    <header class="top">
      <div class="brand"><Logo :size="22" /><span>Cartridge</span></div>
      <div class="devbar">
        <button v-for="d in devices" :key="d.id" class="dev" :class="{ on: d.id === hub.selected, off: !d.online, unpaired: !d.token }" @click="tapDevice(d)">
          <Icon :name="kindIcon(d.kind)" :size="18" />
          <span class="dev-n">{{ d.name }}</span>
          <span v-if="!d.token" class="dev-c">{{ d.login ? 'Sign in' : 'Connect' }}</span>
          <span v-else-if="d.info?.battery" class="dev-b"><Icon :name="batteryIcon(d.info.battery)" :size="14" />{{ d.info.battery.level }}%</span>
          <i v-if="d.info?.downloading" class="dev-p" :style="{ width: pct(d.info.downloading) + '%' }" />
        </button>
        <button class="dev add" aria-label="Add a device" @click="adding = true"><Icon name="mdiPlus" :size="18" /></button>
      </div>
    </header>

    <main class="main">
      <!-- Opened through a tunnel (or on a device with sign-in on): sign in first -->
      <section v-if="!selectedDevice && loginHere" class="signin-page">
        <SignIn :device="loginHere" page @done="signedIn(loginHere)" />
      </section>
      <!-- Nothing connected yet -->
      <section v-else-if="!selectedDevice" class="welcome">
        <div class="halo"><Icon name="mdiCellphoneLink" :size="46" /></div>
        <h1>Connect to Cartridge</h1>
        <p>Pick a device on your Wi-Fi. A code appears on its screen; enter it here once and this phone is remembered.</p>
        <div class="found">
          <button v-for="d in devices" :key="d.id" class="found-d" @click="tapDevice(d)">
            <Icon :name="kindIcon(d.kind)" :size="24" />
            <div><b>{{ d.name }}</b><small>{{ d.online ? d.address : 'Offline' }}</small></div>
            <span class="pill small">{{ d.token ? 'Open' : d.login ? 'Sign in' : 'Connect' }}</span>
          </button>
          <p v-if="!devices.length" class="muted">Looking for devices… Turn on <b>Settings → Phone remote</b> on your Cartridge.</p>
        </div>
      </section>

      <template v-else>
        <Transition name="cfade" mode="out-in">
          <section v-if="tab === 'now'" :key="'now' + hub.selected" class="pane now">
            <div class="seg now-seg">
              <button :class="{ on: nowView === 'game' }" @click="nowView = 'game'">Now showing</button>
              <button :class="{ on: nowView === 'pad' }" @click="nowView = 'pad'">Controls</button>
            </div>
            <div class="now-body"><Companion embedded :view="nowView" /></div>
          </section>
          <LibraryView v-else-if="tab === 'library'" :key="'lib' + hub.selected" class="pane" />
          <DownloadsView v-else-if="tab === 'dl'" key="dl" class="pane" />
          <UploadView v-else-if="tab === 'upload'" :key="'up' + hub.selected" class="pane" />
          <DevicesView v-else key="devs" class="pane" @connect="tapDevice" @add="adding = true" />
        </Transition>
      </template>
    </main>

    <nav v-if="selectedDevice" class="dock">
      <button v-for="t in TABS" :key="t.id" class="d-tab" :class="{ on: tab === t.id }" @click="tab = t.id">
        <Icon :name="t.icon" :size="21" /><span>{{ t.label }}</span>
        <b v-if="t.id === 'dl' && activeCount" class="badge">{{ activeCount }}</b>
      </button>
    </nav>

    <!-- Enter the code shown on the device -->
    <Transition name="sheet">
      <div v-if="pairing" class="scrim" @click.self="pairing = null">
        <div class="sheet">
          <div class="grab" />
          <div class="sh-ic"><Icon :name="kindIcon(pairing.kind)" :size="28" /></div>
          <h2>Connect to {{ pairing.name }}</h2>
          <p class="muted">Enter the 6-digit code shown on {{ pairing.name }}'s screen.</p>
          <input ref="codeEl" v-model="code" class="code-in" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" @input="code = code.replace(/\D/g, '')" @keyup.enter="finish" />
          <p v-if="pairErr" class="err">{{ pairErr }}</p>
          <button class="pill primary wide" :disabled="code.length !== 6 || busy" @click="finish">{{ busy ? 'Connecting…' : 'Connect' }}</button>
          <button class="textbtn" @click="pairing = null">Cancel</button>
        </div>
      </div>
    </Transition>

    <!-- Sign in to a device that asks for a username and password -->
    <Transition name="sheet">
      <div v-if="signing" class="scrim" @click.self="signing = null">
        <div class="sheet"><div class="grab" /><SignIn :device="signing" @done="signedIn(signing)" @cancel="signing = null" /></div>
      </div>
    </Transition>

    <!-- Add a device by address -->
    <Transition name="sheet">
      <div v-if="adding" class="scrim" @click.self="adding = false">
        <div class="sheet">
          <div class="grab" />
          <h2>Add a device</h2>
          <p class="muted">Type the address shown in <b>Settings → Phone remote</b> on the device.</p>
          <input v-model="addr" class="addr-in" inputmode="url" placeholder="192.168.1.20:47280" @keyup.enter="add" />
          <p v-if="addErr" class="err">{{ addErr }}</p>
          <button class="pill primary wide" :disabled="!addr || busy" @click="add">Add</button>
          <button class="textbtn" @click="adding = false">Cancel</button>
        </div>
      </div>
    </Transition>

    <!-- A device sent a link to open here (RomM's QR sign-in approval page) -->
    <Transition name="sheet">
      <div v-if="hub.link" class="scrim" @click.self="hub.link = null">
        <div class="sheet">
          <div class="grab" />
          <div class="sh-ic"><Icon name="mdiShieldCheckOutline" :size="28" /></div>
          <h2>{{ hub.link.title || 'Open a link' }}</h2>
          <p class="muted">Sent from {{ hub.link.from }}. Sign in if RomM asks, then approve. {{ hub.link.from }} carries on by itself.</p>
          <p v-if="hub.link.code" class="link-code">{{ hub.link.code }}</p>
          <a class="pill primary wide" :href="hub.link.url" target="_blank" rel="noopener" @click="hub.link = null"><Icon name="mdiOpenInNew" :size="18" />Open</a>
          <button class="textbtn" @click="hub.link = null">Not now</button>
        </div>
      </div>
    </Transition>

    <div class="toasts rm-toasts">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind"><span class="ti"><Icon :name="t.icon" :size="18" /></span>{{ t.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { store, call, loadConfig, loadLibrary, loadArt, toast } from '../store.js';
import { applyTheme } from '../themes.js';
import { setPointerPref } from '../nav.js';
import { hub, selectedDevice, discover, pairStart, pairFinish, pairWithQr, addByAddress, select, refresh, kindIcon, batteryIcon, pct } from './hub.js';
import Background from '../components/Background.vue';
import Logo from '../components/Logo.vue';
import Icon from '../components/Icon.vue';
import Companion from '../android/Companion.vue';
import LibraryView from './LibraryView.vue';
import DownloadsView from './DownloadsView.vue';
import DevicesView from './DevicesView.vue';
import SignIn from './SignIn.vue';
import UploadView from './UploadView.vue';

setPointerPref('touch');
const TABS = [
  { id: 'now', label: 'Now', icon: 'mdiCardsOutline' },
  { id: 'library', label: 'Library', icon: 'mdiViewGridOutline' },
  { id: 'dl', label: 'Downloads', icon: 'mdiTrayArrowDown' },
  { id: 'upload', label: 'Upload', icon: 'mdiCloudUploadOutline' },
  { id: 'devices', label: 'Devices', icon: 'mdiDevices' },
];
const tab = ref('now');
const nowView = ref('game');
const devices = computed(() => Object.values(hub.devices).sort((a, b) => (b.token ? 1 : 0) - (a.token ? 1 : 0) || a.name.localeCompare(b.name)));
const activeCount = computed(() => Object.values(hub.devices).reduce((n, d) => n + (d.dls || []).filter((x) => ['queued', 'downloading'].includes(x.status)).length, 0));

// ---------------- pairing
const pairing = ref(null);
const code = ref('');
const codeEl = ref(null);
const pairErr = ref('');
const busy = ref(false);
const signing = ref(null);
// the device that served this page, when it wants a sign-in and this phone has none yet
const loginHere = computed(() => { const d = hub.devices[hub.here]; return d && d.login && !d.token ? d : null; });
function signedIn(d) { signing.value = null; toast(`Signed in to ${d.name}`, 'ok', 2500, 'mdiCheck'); tab.value = 'now'; }
async function tapDevice(d) {
  if (d.token) { select(d.id); return; }
  if (d.login) { signing.value = d; return; }
  pairErr.value = ''; code.value = '';
  try {
    await pairStart(d.id);
    pairing.value = d;
    await nextTick(); codeEl.value?.focus();
  } catch (e) { toast(e.message || `Can't reach ${d.name}`, 'error', 4000); }
}
async function finish() {
  busy.value = true; pairErr.value = '';
  try { await pairFinish(pairing.value.id, code.value); toast(`Connected to ${pairing.value.name}`, 'ok', 2500, 'mdiCheck'); pairing.value = null; tab.value = 'now'; }
  catch (e) { pairErr.value = e.message; code.value = ''; }
  busy.value = false;
}
const adding = ref(false);
const addr = ref('');
const addErr = ref('');
async function add() {
  busy.value = true; addErr.value = '';
  try { const d = await addByAddress(addr.value); adding.value = false; addr.value = ''; if (!d.token) tapDevice(d); }
  catch (e) { addErr.value = `Couldn't find Cartridge at that address. ${e.message || ''}`; }
  busy.value = false;
}

// ---------------- the selected device backs the shared store
async function loadDevice() {
  if (!selectedDevice.value?.token) { store.config = null; return; }
  try {
    await loadConfig();
    applyTheme(store.config.ui);
    store.companion = (await call('remote:get').catch(() => null)) || store.companion || { route: 'home' };
    await loadLibrary();
    loadArt();
    store.downloads = await call('dl:list').catch(() => []);
  } catch (e) { toast(e.message, 'error', 4000); }
}
watch(() => hub.selected, loadDevice);
watch(() => JSON.stringify(store.config?.ui || {}), () => store.config && applyTheme(store.config.ui));
window.cart.on('remote:config', (c) => { if (c) store.config = c; });
window.cart.on('remote:state', (s) => { if (s) store.companion = s; });

onMounted(async () => {
  store.companion = store.companion || { route: 'home' };
  const params = new URLSearchParams(location.search);
  const secret = params.get('pair');
  if (secret && !hub.devices[hub.here]?.login) {
    history.replaceState(null, '', location.pathname);
    try { await pairWithQr(secret); toast('Connected', 'ok', 2000, 'mdiCheck'); } catch (e) { toast(e.message, 'error', 5000); }
  }
  await discover();
  await loadDevice();
  refresh();
});
</script>

<style>
html, body { touch-action: pan-x pan-y; overscroll-behavior: none; }
* { -webkit-tap-highlight-color: transparent; }
.cfade-enter-active { transition: opacity 0.2s ease-out, transform 0.24s var(--ease); }
.cfade-leave-active { transition: opacity 0.12s ease-in; }
.cfade-enter-from { opacity: 0; transform: translateY(8px); }
.cfade-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.25s; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet, .sheet-enter-active .lv-sheet, .sheet-leave-active .lv-sheet { transition: transform 0.3s var(--ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet, .sheet-enter-from .lv-sheet, .sheet-leave-to .lv-sheet { transform: translateY(40px); }
</style>
<style scoped>
.rm { position: fixed; inset: 0; display: flex; flex-direction: column; opacity: 0; transition: opacity 0.3s; }
.rm.ready { opacity: 1; }
.top { position: relative; z-index: 3; padding: calc(env(safe-area-inset-top) + 12px) 0 8px; background: linear-gradient(180deg, rgba(6, 7, 12, 0.7), rgba(6, 7, 12, 0)); }
.brand { display: flex; align-items: center; gap: 8px; padding: 0 16px 10px; font-family: var(--display); font-weight: 700; font-size: 17px; }
.devbar { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 4px; scrollbar-width: none; }
.devbar::-webkit-scrollbar { display: none; }
.dev { position: relative; flex: none; display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); color: var(--muted); font: 500 13.5px var(--body); overflow: hidden; transition: background 0.2s, color 0.2s; }
.dev.on { color: #fff; background: rgba(var(--primary-rgb), 0.3); border-color: rgba(var(--primary-l-rgb), 0.5); }
.dev.off { opacity: 0.55; }
.dev.unpaired { border-style: dashed; }
.dev-n { max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dev-c { font-size: 12px; color: var(--primary-t); font-weight: 600; }
.dev-b { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-variant-numeric: tabular-nums; }
.dev-p { position: absolute; left: 0; bottom: 0; height: 2px; background: var(--grad); }
.dev.add { width: 42px; padding: 0; justify-content: center; }
.main { position: relative; z-index: 1; flex: 1; min-height: 0; }
.pane { position: absolute; inset: 0; }
.now { display: flex; flex-direction: column; }
.now-seg { align-self: center; margin: 2px 0 8px; z-index: 2; }
.now-body { position: relative; flex: 1; min-height: 0; }
.signin-page { position: absolute; inset: 0; overflow-y: auto; display: flex; padding: 16px 16px calc(env(safe-area-inset-bottom) + 24px); }
.welcome { position: absolute; inset: 0; overflow-y: auto; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 30px 22px 40px; gap: 10px; }
.welcome h1 { font-family: var(--display); font-size: 28px; font-weight: 800; margin: 6px 0 0; }
.welcome p { color: var(--muted); font-size: 14.5px; line-height: 1.5; max-width: 360px; margin: 0; }
.halo { width: 116px; height: 116px; border-radius: 50%; display: grid; place-items: center; color: var(--primary-t); background: radial-gradient(circle at 50% 40%, rgba(var(--primary-rgb), 0.4), rgba(var(--primary-rgb), 0.08) 62%, transparent 72%); box-shadow: inset 0 0 0 1px rgba(var(--primary-l-rgb), 0.25); }
.found { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.found-d { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 18px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); text-align: left; color: var(--text); }
.found-d div { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.found-d small { color: var(--muted); font-size: 12.5px; }
.pill { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 22px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); border: 1px solid var(--line-2); color: var(--text); font: 600 15px var(--body); }
.pill.small { height: 34px; padding: 0 14px; font-size: 13px; }
.pill.primary { background: var(--grad); border-color: transparent; color: var(--on-primary); box-shadow: 0 10px 28px rgba(var(--primary-rgb), 0.35); }
.pill.wide { width: 100%; }
.pill:disabled { opacity: 0.55; }
.textbtn { min-height: 44px; color: var(--muted); font: 600 14px var(--body); }
.dock { position: relative; z-index: 3; display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; margin: 0 12px calc(env(safe-area-inset-bottom) + 10px); padding: 6px; border-radius: 26px; background: rgba(12, 14, 22, 0.68); border: 1px solid var(--line-2); backdrop-filter: blur(22px) saturate(1.3); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45); }
.d-tab { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; height: 56px; border-radius: 20px; color: var(--muted); font: 500 11px var(--body); transition: background 0.2s, color 0.2s; }
.d-tab.on { color: #fff; background: rgba(var(--primary-rgb), 0.28); }
.badge { position: absolute; top: 6px; right: calc(50% - 22px); min-width: 16px; height: 16px; border-radius: 8px; background: var(--peach); color: var(--on-primary); font-size: 10px; font-weight: 700; display: grid; place-items: center; padding: 0 4px; }
.scrim { position: fixed; inset: 0; z-index: 20; display: flex; align-items: flex-end; background: rgba(3, 4, 8, 0.55); backdrop-filter: blur(4px); }
.sheet { width: 100%; padding: 10px 22px calc(env(safe-area-inset-bottom) + 18px); border-radius: 26px 26px 0 0; background: rgba(18, 20, 30, 0.97); border-top: 1px solid var(--line-2); display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.grab { width: 44px; height: 5px; border-radius: 3px; background: var(--line-2); margin-bottom: 8px; }
.sh-ic { width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; color: var(--primary-t); background: rgba(var(--primary-rgb), 0.2); }
.sheet h2 { font-family: var(--display); font-size: 22px; margin: 0; }
.sheet p { margin: 0; font-size: 14px; line-height: 1.5; }
.code-in, .addr-in { width: 100%; height: 64px; border-radius: 16px; border: 1px solid var(--line-2); background: rgba(255, 255, 255, 0.06); color: var(--text); text-align: center; font: 700 30px var(--display); letter-spacing: 0.4em; outline: none; margin: 6px 0; }
.addr-in { font-size: 18px; letter-spacing: 0.02em; font-weight: 500; }
.code-in:focus, .addr-in:focus { border-color: rgba(var(--primary-l-rgb), 0.7); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.2); }
.err { color: #ffa39c; }
.link-code { font: 700 26px var(--display); letter-spacing: 0.14em; margin: 4px 0 !important; }
a.pill { text-decoration: none; }
.muted { color: var(--muted); }
.rm-toasts { top: auto; bottom: calc(env(safe-area-inset-bottom) + 90px); right: 12px; left: 12px; align-items: center; }
</style>
