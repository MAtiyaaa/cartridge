<template>
  <div class="qm-scrim" @click.self="close">
    <aside class="qm" ref="el" data-scroll>
      <!-- the top bar's status, in full: time, connection, battery -->
      <header class="qm-head">
        <div class="qm-time">
          <b>{{ time }}</b>
          <span>{{ date }}</span>
        </div>
        <div class="qm-pills">
          <span class="qm-bpill" :class="{ off: netClass === 'bad' }"><Icon :name="netIcon" :size="16" />{{ netLabel }}</span>
          <span v-if="bat" class="qm-bpill"><Icon :name="batIcon" :size="16" />{{ bat.level }}%</span>
        </div>
      </header>

      <section class="qm-card">
        <div v-if="bat" class="qm-row">
          <Icon :name="batIcon" :size="20" class="qm-ic" :class="batTone" />
          <div class="qm-mid">
            <b>{{ bat.level }}% <span class="qm-soft">· {{ batState }}</span></b>
            <div class="qm-bar"><i :class="batTone" :style="{ width: bat.level + '%' }" /></div>
            <small v-if="batTime || batFacts.length">{{ [batTime, ...batFacts].filter(Boolean).join(' · ') }}</small>
          </div>
        </div>
        <div class="qm-row">
          <Icon :name="store.connection.base ? 'mdiServerNetwork' : 'mdiServerNetworkOff'" :size="20" class="qm-ic" />
          <div class="qm-mid">
            <b>{{ store.connection.base ? (store.connection.route === 'local' ? 'On your network' : 'Through your tunnel') : 'Server not reachable' }}</b>
            <small>{{ host || 'Games already on this device still play' }}</small>
          </div>
        </div>
        <div class="qm-row">
          <Icon name="mdiBookshelf" :size="20" class="qm-ic" :class="{ spin: busy }" />
          <div class="qm-mid">
            <b>{{ total.toLocaleString() }} games <span class="qm-soft">· {{ systems }} systems</span></b>
            <small>{{ busy ? store.sync.label || 'Syncing…' : 'Synced ' + ago(store.lib?.syncedAt) }}</small>
          </div>
        </div>
      </section>

      <button v-if="store.update.state === 'ready'" class="qm-item upd" data-focus data-autofocus @click="call('update:install')"><Icon name="mdiUpdate" /><div><b>Restart to update</b><small>Cartridge {{ store.update.version }} is downloaded</small></div></button>

      <div class="qm-tiles">
        <button class="qm-tile" data-focus :data-autofocus="store.update.state === 'ready' ? undefined : ''" :disabled="busy" @click="run(refreshLibrary)"><Icon name="mdiSync" :class="{ spin: busy }" /><b>Refresh</b><small>{{ busy ? 'Working…' : 'Library' }}</small></button>
        <button class="qm-tile" data-focus @click="nav('downloads')"><Icon name="mdiDownload" /><b>Downloads</b><small>{{ activeCount ? `${activeCount} active` : 'Queue' }}</small></button>
        <button class="qm-tile" data-focus @click="shot"><Icon name="mdiCamera" /><b>Screenshot</b><small>To Pictures</small></button>
        <button class="qm-tile" :class="{ on: store.config.ui.sounds }" data-focus @click="toggleSounds"><Icon :name="store.config.ui.sounds ? 'mdiVolumeHigh' : 'mdiVolumeOff'" /><b>Sounds</b><small>{{ store.config.ui.sounds ? 'On' : 'Off' }}</small></button>
        <button v-if="IS_ANDROID && store.androidDisplays?.secondary" class="qm-tile" :class="{ on: secondOn }" data-focus @click="toggleSecond"><Icon name="mdiMonitorScreenshot" /><b>Second Screen</b><small>{{ secondOn ? 'On' : 'Off' }}</small></button>
        <button v-else class="qm-tile" data-focus @click="call('app:fullscreen')"><Icon name="mdiFullscreen" /><b>Fullscreen</b><small>Toggle</small></button>
        <button class="qm-tile" data-focus @click="nav('settings')"><Icon name="mdiCog" /><b>Settings</b><small>Everything</small></button>
      </div>

      <div class="qm-list">
        <button class="qm-item" data-focus @click="rescan"><Icon name="mdiHarddisk" /><div><b>Rescan This Device</b><small>Refresh which games are installed</small></div></button>
        <button class="qm-item" data-focus @click="phone"><Icon name="mdiCellphoneLink" /><div><b>Connect a Phone</b><small>A remote and second screen</small></div></button>
        <button class="qm-item" data-focus @click="checkUpdate"><Icon name="mdiCloudDownloadOutline" /><div><b>Check for Updates</b><small>{{ updLabel }}</small></div></button>
        <button class="qm-item danger" data-focus @click="call('app:quit')"><Icon name="mdiPower" /><div><b>Quit Cartridge</b></div></button>
      </div>
    </aside>
  </div>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { store, call, refreshLibrary, tab, ago, saveConfig, toast } from '../store.js';
import { pushLayer, focusFirst } from '../nav.js';
import { setSoundEnabled } from '../sfx.js';
import Icon from './Icon.vue';
import { IS_ANDROID } from '../platform.js';

const el = ref(null);
const busy = computed(() => ['running', 'scanning'].includes(store.sync.state));
const total = computed(() => (store.libVersion, store.lib ? Object.values(store.lib.roms).reduce((s, l) => s + l.length, 0) : 0));
const systems = computed(() => store.lib?.platforms.filter((p) => p.rom_count).length || 0);
const activeCount = computed(() => store.downloads.filter((d) => ['queued', 'downloading'].includes(d.status)).length);
const secondOn = computed(() => store.config.android?.dualScreen !== false);
const close = () => (store.quickMenu = false);
// Android dual-screen devices: turn the bottom screen back on (or off) without digging into Settings
const toggleSecond = () => saveConfig({ android: { dualScreen: !secondOn.value } });
function run(fn) { close(); fn(); }
function nav(n) { close(); tab(n); }
function phone() { store.settingsSection = 'remote'; nav('settings'); }
const updLabel = computed(() => {
  const u = store.update;
  return { checking: 'Checking…', downloading: `Downloading ${u.version || ''} · ${u.percent || 0}%`, ready: `${u.version} ready`, current: `Up to date · ${store.info.version}`, error: 'Could not check' }[u.state] || `Version ${store.info.version}`;
});
async function checkUpdate() { try { await call('update:check'); } catch (e) { toast(e.message, 'info', 3000); } }
async function shot() {
  close();
  await new Promise((r) => setTimeout(r, 450));
  try { const f = await call('app:screenshot'); toast(`Screenshot saved: ${f.split('/').pop()}`, 'ok', 3000, 'mdiCamera'); } catch (e) { toast(e.message, 'error'); }
}
async function rescan() { await call('installed:rescan'); toast('Device rescanned', 'ok', 2000, 'mdiHarddisk'); }
async function toggleSounds() { const v = !store.config.ui.sounds; await saveConfig({ ui: { sounds: v } }); setSoundEnabled(v); }

// ---- status: time, connection, battery
const now = ref(new Date());
const time = computed(() => now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
const date = computed(() => now.value.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }));
// the top bar's connection icon (abdu2304's 0.9.3 K: house for LAN, globe for Tunnel, colour only offline)
const netIcon = computed(() => (store.connection.route === 'local' ? 'mdiHomeOutline' : store.connection.base ? 'mdiEarth' : 'mdiCloudOffOutline'));
const netClass = computed(() => (store.connection.route === 'local' ? 'ok' : store.connection.base ? 'remote' : 'bad'));
const netLabel = computed(() => (store.connection.route === 'local' ? 'LAN' : store.connection.base ? 'Tunnel' : 'Offline'));
const host = computed(() => { try { return new URL(store.connection.base).host; } catch { return ''; } });
// Android adds temperature, health, power and time to full (native BatteryManager); elsewhere the WebView's level
const native = ref(null);
const bat = computed(() => {
  const n = native.value;
  if (n && n.level >= 0) return { level: n.level, charging: n.status === 'charging' || n.status === 'full', full: n.status === 'full' };
  return store.battery;
});
const batIcon = computed(() => {
  const b = bat.value; if (!b) return 'mdiBattery';
  if (b.charging) return 'mdiBatteryCharging';
  const lvl = Math.round(b.level / 10) * 10;
  return lvl >= 100 ? 'mdiBattery' : lvl <= 10 ? 'mdiBatteryAlertVariantOutline' : `mdiBattery${lvl}`;
});
const batTone = computed(() => (bat.value?.charging ? 'good' : bat.value?.level <= 15 ? 'low' : ''));
const batState = computed(() => {
  const b = bat.value, n = native.value;
  if (b.full) return 'Full';
  if (!b.charging) return 'On battery';
  const how = { ac: 'charger', usb: 'USB', wireless: 'wireless' }[n?.plugged];
  return how ? `Charging by ${how}` : 'Charging';
});
const dur = (s) => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim(); };
const batTime = computed(() => {
  const b = bat.value, n = native.value;
  if (!b || b.full) return '';
  if (b.charging) { const s = n?.toFullMs > 0 ? n.toFullMs / 1000 : store.battery?.toFull; return s > 0 && isFinite(s) ? `Full in about ${dur(s)}` : ''; }
  const s = store.battery?.toEmpty; return s > 0 && isFinite(s) ? `About ${dur(s)} left` : '';
});
const batFacts = computed(() => {
  const n = native.value; if (!n) return [];
  const out = [];
  if (n.tempTenths > 0) out.push(`${(n.tempTenths / 10).toFixed(1)} °C`);
  const w = Math.abs(n.currentUa || 0) / 1e6 * (n.voltageMv || 0) / 1e3;
  if (w > 0.1 && w < 200) out.push(`${w.toFixed(1)} W`);
  if (n.health && n.health !== 'good') out.push(`Health: ${n.health}`);
  return out;
});
let timer = 0;
async function readNative() {
  if (import.meta.env.MODE !== 'android') return;
  try { const { Native } = await import('../android/native.js'); native.value = await Native.battery(); } catch {}
}

let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: close, start: close, lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value);
  readNative();
  timer = setInterval(() => { now.value = new Date(); readNative(); }, 5000);
});
onBeforeUnmount(() => { layer.pop(); clearInterval(timer); });
</script>
<style scoped>
.qm-scrim { position: fixed; inset: 0; z-index: 45; background: rgba(3, 4, 7, 0.5); animation: fade 0.2s; }
.qm { position: absolute; top: 0; right: 0; bottom: 0; width: 440px; padding: var(--s-5); display: flex; flex-direction: column; gap: var(--s-3); background: var(--s0); border-left: 1px solid var(--line-2); box-shadow: -30px 0 80px rgba(0, 0, 0, 0.6); animation: slide 0.28s var(--ease); overflow-y: auto; }
@keyframes slide { from { transform: translateX(60px); opacity: 0; } }

/* time, with the connection and battery pills from the top bar */
.qm-head { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--s-3); padding: 2px 4px var(--s-1); }
.qm-time { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.qm-time b { font-family: var(--display); font-stretch: var(--display-stretch); font-size: 40px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.qm-time span { color: var(--muted); font-size: var(--t-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qm-pills { display: flex; align-items: center; gap: 8px; flex: none; padding-bottom: 3px; }
.qm-bpill.off { color: #ffb4b4; }
.qm-bpill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px 4px 8px; border-radius: 999px; background: var(--s2); font-size: var(--t-xs); font-weight: 700; font-variant-numeric: tabular-nums; }

/* status card */
.qm-card { display: flex; flex-direction: column; padding: 6px var(--s-4); border-radius: var(--r-lg); background: var(--s1); border: 1px solid var(--line); }
.qm-row { display: flex; align-items: flex-start; gap: var(--s-3); padding: 12px 0; }
.qm-row + .qm-row { border-top: 1px solid var(--line); }
.qm-ic { flex: none; margin-top: 1px; color: var(--muted); }
.qm-ic.good { color: var(--green-l); }
.qm-ic.low { color: #ff8c8c; }
.qm-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.qm-mid b { font-size: var(--t-sm); font-weight: 600; }
.qm-soft { color: var(--muted); font-weight: 500; }
.qm-mid small { color: var(--muted); font-size: var(--t-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qm-bar { height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.qm-bar i { display: block; height: 100%; border-radius: 2px; background: rgba(255, 255, 255, 0.85); transition: width var(--d-med) var(--ease); }
.qm-bar i.good { background: var(--green-l); }
.qm-bar i.low { background: #ff8c8c; }

/* quick tiles */
.qm-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-2); }
.qm-tile { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-height: 84px; padding: 12px; border-radius: var(--r-md); background: var(--s1); border: 1px solid var(--line); text-align: left; transition: background var(--d-fast), color var(--d-fast); }
.qm-tile > .icon { margin-bottom: auto; color: var(--muted); }
.qm-tile b { font-size: var(--t-sm); font-weight: 600; line-height: 1.2; }
.qm-tile small { color: var(--muted); font-size: var(--t-xs); }
.qm-tile.on { background: var(--sel); }
.qm-tile.on > .icon { color: var(--text); }
.qm-tile:hover { background: var(--s2); }
.qm-tile:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; }
.qm-tile:focus > .icon, .qm-tile:focus small { color: var(--on-focus-dim); }
.qm-tile[disabled] { opacity: 0.45; }

/* the rest, as a plain list */
.qm-list { display: flex; flex-direction: column; margin-top: var(--s-1); }
.qm-item { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: var(--r-md); transition: background var(--d-fast), color var(--d-fast); }
.qm-item > .icon { flex: none; color: var(--muted); }
.qm-item div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.qm-item b { font-weight: 500; font-size: var(--t-sm); }
.qm-item small { color: var(--muted); font-size: var(--t-xs); }
.qm-item:hover { background: var(--s2); }
.qm-item:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; }
.qm-item:focus > .icon, .qm-item:focus small { color: var(--on-focus-dim); }
.qm-item.danger, .qm-item.danger > .icon { color: #ffa39c; }
.qm-item.danger:focus, .qm-item.danger:focus > .icon { color: var(--on-focus); }
.qm-item.upd { background: var(--grad); color: var(--on-primary); }
.qm-item.upd small, .qm-item.upd > .icon { color: var(--on-primary); }
.qm-item[disabled] { opacity: 0.4; }
</style>
