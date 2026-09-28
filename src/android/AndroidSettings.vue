<template>
  <div class="and">
    <h1>Android</h1>

    <div class="subh"><Icon name="mdiFolderLockOpenOutline" :size="22" />Storage</div>
    <div class="card-s glass">
      <div class="kv">
        <span>Access</span>
        <span class="row" style="gap: 8px"><span class="dot" :class="storage.granted ? 'ok' : 'bad'" />{{ storage.granted ? 'All files: allowed' : 'Not allowed yet: games cannot be saved to your ROM folders' }}</span>
      </div>
      <div class="kv"><span>ROMs folder</span><span class="mono">{{ store.config.romsRoot || 'Not set' }}</span></div>
    </div>
    <div v-if="!storage.granted" class="row"><button class="btn primary" data-focus @click="grant"><Icon name="mdiShieldCheckOutline" />Allow access to all files</button></div>

    <div class="lbl2">Found on this device</div>
    <div v-if="roots.length" class="roots">
      <button v-for="r in roots" :key="r.path" class="root glass" data-focus :class="{ on: r.path === store.config.romsRoot }" @click="useRoot(r)">
        <Icon :name="r.path === store.config.romsRoot ? 'mdiCheckCircle' : 'mdiFolderOutline'" :size="22" />
        <div class="root-t">
          <div class="mono">{{ r.path }}</div>
          <div class="muted small">{{ r.source }} · {{ r.systems }} system {{ r.systems === 1 ? 'folder' : 'folders' }}</div>
        </div>
        <span v-if="r.path !== store.config.romsRoot" class="use">Use</span>
      </button>
    </div>
    <p v-else class="muted small">{{ scanning ? 'Looking for ROM folders…' : 'No ROM folders found yet. Pick one under Storage, or create a “ROMs” folder (the ES-DE layout) and it shows up here.' }}</p>
    <div class="row wrap"><button class="btn" data-focus :disabled="scanning" @click="scan"><Icon name="mdiFolderSearchOutline" />Search again</button></div>
    <Toggle :model-value="opt('autoSystemFolders')" label="Find system folders anywhere" desc="If a console has its own folder somewhere else (like NDS or PS2 at the top of your SD card), downloads for it go there" @update:model-value="(v) => set({ autoSystemFolders: v })" />

    <div class="subh"><Icon name="mdiMonitorScreenshot" :size="22" />Dual screen</div>
    <Toggle :model-value="opt('dualScreen')" label="Use the second screen" :desc="displays.secondary ? `Shows the highlighted game, your downloads and touch controls on ${displays.secondary.name || 'the second screen'}. Turn off to leave it free for other apps.` : 'No second screen found right now. On dual-screen devices like the AYN Thor, the bottom screen shows the highlighted game, your downloads and touch controls.'" @update:model-value="(v) => set({ dualScreen: v })" />

    <div class="subh"><Icon name="mdiGamepadVariantOutline" :size="22" />Controller</div>
    <div class="row wrap"><span class="lbl">Button layout</span>
      <div class="seg">
        <button v-for="o in layouts" :key="o.v" data-focus :class="{ on: (store.config.android?.buttonLayout || 'auto') === o.v }" @click="set({ buttonLayout: o.v })">{{ o.l }}</button>
      </div>
    </div>
    <p class="muted small">Sets where A, B, X and Y sit on the second screen's touch controls. Auto follows your controller{{ store.androidPads?.length ? ' (' + store.androidPads.join(', ') + ')' : '' }}: {{ store.androidLayoutDetected === 'nintendo' ? 'Nintendo, A on the right' : 'Xbox, A at the bottom' }}.</p>

    <div class="subh"><Icon name="mdiCellphoneCog" :size="22" />System</div>
    <Toggle :model-value="opt('backgroundDownloads')" label="Keep downloading in the background" desc="Shows a notification while games download so Android does not stop them" @update:model-value="(v) => set({ backgroundDownloads: v })" />
    <Toggle :model-value="opt('immersive')" label="Full screen" desc="Hides the status and navigation bars" @update:model-value="setImmersive" />
    <Toggle :model-value="opt('autoUpdate')" label="Check for updates on start" desc="Downloads new APKs from GitHub Releases; Android asks before installing" @update:model-value="(v) => set({ autoUpdate: v })" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { App } from '@capacitor/app';
import { store, call, saveConfig, toast } from '../store.js';
import { Native } from './native.js';
import Icon from '../components/Icon.vue';
import Toggle from '../components/Toggle.vue';

const storage = ref({ granted: true });
const roots = ref([]);
const scanning = ref(false);
const displays = computed(() => store.androidDisplays || { secondary: null });
const opt = (k) => store.config.android?.[k] !== false;
const set = (patch) => saveConfig({ android: patch });
const layouts = [{ v: 'auto', l: 'Auto' }, { v: 'xbox', l: 'Xbox (A bottom)' }, { v: 'nintendo', l: 'Nintendo (A right)' }];

async function refreshStorage() { storage.value = await Native.storageStatus().catch(() => ({ granted: true })); }
async function scan() {
  scanning.value = true;
  try { roots.value = (await call('android:roots')).roots; } catch (e) { toast(e.message, 'error'); }
  scanning.value = false;
}
async function grant() { await Native.requestStorage().catch(() => {}); }
async function useRoot(r) {
  if (r.path === store.config.romsRoot) return;
  await saveConfig({ romsRoot: r.path });
  toast('ROMs folder set', 'ok', 2000, 'mdiFolderCheckOutline');
}
function setImmersive(v) { set({ immersive: v }); Native.setImmersive({ on: v }).catch(() => {}); }

let sub = null;
onMounted(async () => {
  refreshStorage();
  scan();
  sub = await App.addListener('resume', () => { refreshStorage(); scan(); });
});
onBeforeUnmount(() => sub?.remove());
</script>

<style scoped>
.and { display: flex; flex-direction: column; gap: 14px; }
h1 { font-size: 34px; font-weight: 700; margin: 4px 0 6px; }
.subh { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-size: 19px; font-weight: 700; margin-top: 10px; }
.card-s { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
.kv { display: flex; gap: 16px; font-size: 14px; min-width: 0; }
.kv > span:first-child { width: 110px; color: var(--muted); flex: none; }
.mono { font-family: ui-monospace, 'Roboto Mono', monospace; font-size: 13px; overflow-wrap: anywhere; }
.small { font-size: 13px; }
.lbl2 { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin-top: 4px; font-weight: 600; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--dim); flex: none; }
.dot.ok { background: var(--green); box-shadow: 0 0 10px rgba(63, 185, 80, 0.6); }
.dot.bad { background: var(--red); box-shadow: 0 0 10px rgba(255, 107, 97, 0.5); }
.roots { display: flex; flex-direction: column; gap: 8px; }
.root { display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-align: left; color: var(--text); transition: background 0.15s, border-color 0.15s; }
.root:hover { background: var(--glass-hi); }
.root.on { border-color: rgba(var(--primary-rgb), 0.6); background: rgba(var(--primary-rgb), 0.12); }
.root.on > .icon { color: var(--primary-l); }
.root-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.use { font-size: 13px; font-weight: 600; color: var(--primary-t); padding: 6px 12px; border-radius: 999px; background: rgba(var(--primary-rgb), 0.16); }
.wrap { flex-wrap: wrap; }
.lbl { width: 130px; color: var(--muted); font-size: 13.5px; flex: none; }
</style>
