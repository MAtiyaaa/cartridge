<template>
  <section class="uv">
    <div class="uv-scroll">
      <!-- From this phone -->
      <div class="uv-card">
        <div class="uv-h"><Icon name="mdiCellphoneArrowDown" :size="20" /><b>From this phone</b></div>
        <p class="uv-sub">Pick a game file on your phone. It goes through {{ dev?.name || 'the device' }} to RomM. Run a scan in RomM afterwards to add it to your library.</p>

        <label v-if="!file" class="uv-drop">
          <input type="file" @change="pick" />
          <span class="uv-drop-ic"><Icon name="mdiFileUploadOutline" :size="30" /></span>
          <b>Choose a file</b>
          <small>Any ROM, disc image or archive</small>
        </label>

        <template v-else>
          <div class="uv-file">
            <div class="uv-file-ic"><Icon name="mdiFileOutline" :size="22" /></div>
            <div class="uv-file-t"><b>{{ file.name }}</b><small>{{ bytes(file.size) }}</small></div>
            <button v-if="!busy" class="uv-x" aria-label="Remove" @click="reset"><Icon name="mdiClose" :size="18" /></button>
          </div>

          <div class="uv-lbl">Console</div>
          <div class="uv-chips">
            <button v-for="p in consoles" :key="p.id" class="uv-chip" :class="{ on: platformId === p.id }" :disabled="busy" @click="platformId = p.id">{{ p.display_name }}</button>
          </div>
          <p v-if="guessed" class="uv-hint"><Icon name="mdiAutoFix" :size="14" />Picked from the file type. Tap another if it's wrong.</p>

          <div v-if="stage" class="uv-prog">
            <div class="uv-prog-t"><span>{{ stageText }}</span><em>{{ Math.round(progress * 100) }}%</em></div>
            <i class="uv-bar"><b :style="{ width: progress * 100 + '%' }" /></i>
          </div>
          <p v-if="err" class="uv-err"><Icon name="mdiAlertCircleOutline" :size="15" />{{ err }}</p>
          <button v-if="stage !== 'done'" class="uv-go" :disabled="!platformId || busy" @click="send">
            <span v-if="busy" class="uv-spin" /><template v-else><Icon name="mdiCloudUploadOutline" :size="20" />Upload to RomM</template>
          </button>
          <button v-else class="uv-go ghost" @click="reset"><Icon name="mdiPlus" :size="20" />Upload another</button>
        </template>
      </div>

      <!-- Found on the device -->
      <div class="uv-card">
        <div class="uv-h">
          <Icon name="mdiFolderSearchOutline" :size="20" /><b>On {{ dev?.name || 'this device' }}, not in RomM</b>
          <button v-if="waiting.length > 1" class="uv-all" @click="all">Upload all</button>
        </div>
        <p class="uv-sub">Files in its console folders that RomM doesn't have yet.</p>
        <div v-if="loading" class="uv-empty"><span class="uv-spin dark" /></div>
        <div v-else-if="!found.length" class="uv-empty"><Icon name="mdiCheckCircleOutline" :size="26" /><span>Everything here is already in RomM</span></div>
        <div v-for="f in found" :key="f.path" class="uv-row">
          <div class="uv-row-t">
            <b>{{ f.name }}</b>
            <small>{{ f.platform }} · {{ bytes(f.size) }}<template v-if="state(f).state === 'error'"> · <span class="bad">{{ state(f).error }}</span></template></small>
            <i v-if="state(f).state === 'uploading'" class="uv-bar thin"><b :style="{ width: (state(f).pct || 0) + '%' }" /></i>
          </div>
          <span v-if="state(f).state === 'done'" class="uv-ok"><Icon name="mdiCheck" :size="18" /></span>
          <button v-else-if="state(f).state === 'uploading'" class="uv-act" aria-label="Cancel" @click="cancel(f)"><Icon name="mdiClose" :size="17" /></button>
          <button v-else class="uv-act up" aria-label="Upload" @click="one(f)"><Icon name="mdiCloudUploadOutline" :size="18" /></button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { store, visiblePlatforms, bytes, call, toast } from '../store.js';
import { hub, selectedDevice, uploadFromPhone } from './hub.js';
import Icon from '../components/Icon.vue';

const dev = selectedDevice;
const consoles = computed(() => visiblePlatforms().slice().sort((a, b) => a.display_name.localeCompare(b.display_name)));

// ---------------- from this phone
const file = ref(null);
const platformId = ref(0);
const guessed = ref(false);
const stage = ref(''); // sending | romm | done
const sent = ref(0);
const rommPct = ref(0);
const err = ref('');
const busy = computed(() => stage.value === 'sending' || stage.value === 'romm');
const progress = computed(() => (stage.value === 'sending' ? sent.value : stage.value === 'romm' ? rommPct.value / 100 : 1));
const stageText = computed(() => ({ sending: `Sending to ${dev.value?.name || 'the device'}`, romm: 'Uploading to RomM', done: 'In RomM. Scan in RomM to add it.' })[stage.value]);
let phonePath = '';

// file extension -> console (slug or folder name as RomM and ES-DE call them)
const EXT = {
  nds: ['nds'], '3ds': ['n3ds', '3ds'], cia: ['n3ds', '3ds'], gba: ['gba'], gbc: ['gbc'], gb: ['gb'], nes: ['nes'], sfc: ['snes'], smc: ['snes'],
  n64: ['n64'], z64: ['n64'], v64: ['n64'], gcm: ['ngc', 'gc'], rvz: ['ngc', 'wii', 'gc'], wbfs: ['wii'], wad: ['wii'], nsp: ['switch'], xci: ['switch'],
  pbp: ['psp'], cso: ['psp'], vpk: ['psvita', 'vita'], md: ['genesis', 'megadrive'], gen: ['genesis', 'megadrive'], sms: ['sms', 'mastersystem'],
  gg: ['gamegear', 'gg'], pce: ['tg16', 'pcengine'], ws: ['wonderswan', 'ws'], wsc: ['wonderswan-color', 'wsc'], ngp: ['ngp'], ngc: ['ngpc'], a26: ['atari2600'], lnx: ['lynx'],
  rpx: ['wiiu'], wua: ['wiiu'], pkg: ['ps3', 'ps4'], xex: ['xbox360'],
};
function guess(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  for (const slug of EXT[ext] || []) {
    const p = consoles.value.find((x) => x.slug === slug || x.fs_slug === slug);
    if (p) return p.id;
  }
  return 0;
}
function pick(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  reset();
  file.value = f;
  platformId.value = guess(f.name);
  guessed.value = !!platformId.value;
}
function reset() { file.value = null; platformId.value = 0; guessed.value = false; stage.value = ''; sent.value = 0; rommPct.value = 0; err.value = ''; phonePath = ''; }
async function send() {
  err.value = ''; stage.value = 'sending'; sent.value = 0;
  try {
    const r = await uploadFromPhone(hub.selected, file.value, platformId.value, (x) => { sent.value = x; });
    phonePath = r.path; stage.value = 'romm'; rommPct.value = 0;
  } catch (e) { err.value = e.message; stage.value = ''; }
}

// ---------------- found on the device
const found = ref([]);
const loading = ref(true);
const active = reactive({}); // path -> { pct, state, error }
const state = (f) => active[f.path] || {};
const waiting = computed(() => found.value.filter((f) => !['uploading', 'done'].includes(state(f).state)));
async function load() {
  try {
    const r = await call('upload:list');
    found.value = r.files || [];
    for (const a of r.active || []) active[a.path] = a;
  } catch (e) { toast(e.message, 'error', 4000); }
  loading.value = false;
}
async function one(f) {
  active[f.path] = { state: 'uploading', pct: 0 };
  try { await call('upload:start', { path: f.path, platformId: f.platformId }); } catch (e) { active[f.path] = { state: 'error', error: e.message }; }
}
function all() { for (const f of waiting.value) one(f); }
const cancel = (f) => call('upload:cancel', { path: f.path }).catch(() => {});

// live progress from the device: its folder files, and this phone's file on its way to RomM
const off = window.cart.on('upload', (u) => {
  if (!u?.path) return;
  if (u.path === phonePath) {
    rommPct.value = u.pct || 0;
    if (u.state === 'done') stage.value = 'done';
    else if (u.state === 'error' || u.state === 'cancelled') { stage.value = ''; err.value = u.error || 'The upload stopped'; }
    return;
  }
  active[u.path] = u;
});
onMounted(load);
onBeforeUnmount(() => off?.());
</script>

<style scoped>
.uv { display: flex; flex-direction: column; }
.uv-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 24px; display: flex; flex-direction: column; gap: 14px; }
.uv-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 22px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line); }
.uv-h { display: flex; align-items: center; gap: 8px; color: var(--primary-t); }
.uv-h b { flex: 1; min-width: 0; color: var(--text); font: 700 16px var(--display); }
.uv-sub { margin: -4px 0 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
.uv-drop { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 16px; border-radius: 18px; border: 1.5px dashed rgba(var(--primary-l-rgb), 0.45); background: rgba(var(--primary-rgb), 0.08); text-align: center; cursor: pointer; transition: background 0.2s; }
.uv-drop:active { background: rgba(var(--primary-rgb), 0.16); }
.uv-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.uv-drop-ic { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; margin-bottom: 4px; color: var(--primary-t); background: rgba(var(--primary-rgb), 0.2); }
.uv-drop b { font: 700 16px var(--display); }
.uv-drop small { color: var(--muted); font-size: 12.5px; }
.uv-file { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: rgba(0, 0, 0, 0.25); }
.uv-file-ic { flex: none; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; color: var(--primary-t); background: rgba(var(--primary-rgb), 0.18); }
.uv-file-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.uv-file-t b { font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uv-file-t small { color: var(--muted); font-size: 12.5px; }
.uv-x { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); background: rgba(255, 255, 255, 0.06); }
.uv-lbl { font: 600 11px var(--body); text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-top: 2px; }
.uv-chips { display: flex; flex-wrap: wrap; gap: 8px; max-height: 190px; overflow-y: auto; }
.uv-chip { height: 34px; padding: 0 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line); color: var(--muted); font: 500 13px var(--body); transition: background 0.2s, color 0.2s; }
.uv-chip.on { background: rgba(var(--primary-rgb), 0.32); border-color: rgba(var(--primary-l-rgb), 0.55); color: #fff; }
.uv-chip:disabled:not(.on) { opacity: 0.45; }
.uv-hint { display: flex; align-items: center; gap: 6px; margin: -4px 0 0; color: var(--muted); font-size: 12px; }
.uv-prog { display: flex; flex-direction: column; gap: 6px; }
.uv-prog-t { display: flex; justify-content: space-between; font-size: 13px; color: #dfe3ea; }
.uv-prog-t em { font-style: normal; font-variant-numeric: tabular-nums; font-weight: 600; }
.uv-bar { display: block; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
.uv-bar.thin { height: 4px; margin-top: 4px; }
.uv-bar b { display: block; height: 100%; background: var(--grad); transition: width 0.3s; }
.uv-err { display: flex; align-items: center; gap: 6px; margin: 0; color: #ffa39c; font-size: 13px; }
.uv-go { display: flex; align-items: center; justify-content: center; gap: 8px; height: 52px; border-radius: 999px; background: var(--grad); color: var(--on-primary); font: 700 15.5px var(--body); box-shadow: 0 10px 26px rgba(var(--primary-rgb), 0.35); transition: opacity 0.2s, transform 0.15s; }
.uv-go:active { transform: scale(0.98); }
.uv-go:disabled { opacity: 0.5; box-shadow: none; }
.uv-go.ghost { background: rgba(255, 255, 255, 0.07); color: var(--text); box-shadow: none; border: 1px solid var(--line-2); }
.uv-spin { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255, 255, 255, 0.35); border-top-color: var(--on-primary); animation: uv-rot 0.8s linear infinite; }
.uv-spin.dark { border-color: var(--line-2); border-top-color: var(--primary-t); }
@keyframes uv-rot { to { transform: rotate(360deg); } }
.uv-all { flex: none; height: 32px; padding: 0 12px; border-radius: 999px; background: rgba(var(--primary-rgb), 0.25); border: 1px solid rgba(var(--primary-l-rgb), 0.45); color: #fff; font: 600 12.5px var(--body); }
.uv-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; color: var(--muted); font-size: 13px; }
.uv-row { display: flex; align-items: center; gap: 12px; padding: 10px 4px 10px 2px; border-top: 1px solid var(--line); }
.uv-row-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.uv-row-t b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uv-row-t small { color: var(--muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uv-row-t .bad { color: #ffa39c; }
.uv-act { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.07); color: var(--text); }
.uv-act.up { background: rgba(var(--primary-rgb), 0.22); color: var(--primary-t); }
.uv-act:active { transform: scale(0.94); }
.uv-ok { flex: none; width: 38px; display: grid; place-items: center; color: var(--green-l); }
</style>
