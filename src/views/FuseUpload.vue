<template>
  <div class="view" data-scroll>
    <header class="fu-head">
      <div class="eyebrow"><Icon name="mdiCloudUploadOutline" :size="16" />From Fuse</div>
      <h1 class="big">Upload to RomM</h1>
      <p class="muted lead">Cartridge sends this game to your RomM server, so every device can download it. Nothing on this device changes.</p>
    </header>

    <div v-if="error" class="fu-card glass fu-problem">
      <Icon name="mdiAlertCircleOutline" :size="30" class="fu-bad" />
      <div class="fu-mid"><b>Cartridge can’t upload this</b><span class="muted">{{ error }}</span></div>
      <button class="btn" data-focus @click="back()"><Icon name="mdiArrowLeft" :size="18" />Back</button>
    </div>

    <div v-else-if="!plan" class="fu-card glass fu-loading"><Icon name="mdiSync" :size="22" class="spin" /><span class="muted">Checking the game’s files…</span></div>

    <template v-else>
      <section class="fu-card glass">
        <div class="fu-game">
          <div class="fu-mark"><PIcon :p="platform || { slug: plan.platform }" :size="44" /></div>
          <div class="fu-mid">
            <h2>{{ plan.title }}</h2>
            <span class="muted">{{ platform ? platform.display_name || platform.name : plan.platform.toUpperCase() }} · {{ plan.files.length }} file{{ plan.files.length === 1 ? '' : 's' }} · {{ bytes(plan.size) }}</span>
          </div>
        </div>

        <div class="fu-groups">
          <div v-for="g in groups" :key="g.kind" class="fu-group">
            <div class="fu-label">{{ g.label }}<span class="count">{{ g.files.length }}</span></div>
            <div v-for="f in g.files.slice(0, SHOW)" :key="f.folder + '/' + f.name" class="fu-file">
              <Icon :name="g.icon" :size="18" class="fu-ic" />
              <span class="fu-name">{{ f.folder ? `${f.folder}/` : '' }}{{ f.name }}</span>
              <span class="muted">{{ bytes(f.size) }}</span>
            </div>
            <div v-if="g.files.length > SHOW" class="muted small">and {{ g.files.length - SHOW }} more</div>
          </div>
        </div>

        <div v-if="plan.problems.length" class="fu-note bad">
          <Icon name="mdiFileAlertOutline" :size="20" />
          <div>
            <b>Some files can’t be read</b>
            <div v-for="p in plan.problems.slice(0, SHOW)" :key="p.name" class="small">{{ p.name }}: {{ p.reason }}</div>
            <div v-if="plan.problems.some((p) => /may not read/.test(p.reason))" class="small">Allow Cartridge to access all files in Android’s settings, then start the upload again from Fuse.</div>
          </div>
        </div>
        <div v-else-if="!platform" class="fu-note bad">
          <Icon name="mdiServerOff" :size="20" />
          <div><b>RomM has no {{ plan.platform.toUpperCase() }} console yet</b><div class="small">Add the console’s folder on your server, sync Cartridge, then start the upload again from Fuse.</div></div>
        </div>
        <div v-else-if="plan.files.length > 1" class="fu-note">
          <Icon name="mdiInformationOutline" :size="20" />
          <div class="small">The first file becomes the game on RomM. Cartridge then asks RomM to add it and puts the other files in its folder, with DLC and updates in their own. Games with several files need RomM 5.3 or newer.</div>
        </div>

        <div v-if="!job" class="row fu-actions">
          <button class="btn primary" data-focus :disabled="!canUpload || starting" @click="upload"><Icon name="mdiCloudUploadOutline" :size="20" />{{ starting ? 'Starting…' : `Upload ${bytes(plan.size)}` }}</button>
          <button class="btn" data-focus @click="back()">Cancel</button>
        </div>
      </section>

      <section v-if="job" class="fu-card glass fu-progress">
        <div class="row fu-state">
          <Icon :name="STATE_ICON[job.state]" :size="22" :class="['fu-st', job.state, { spin: job.state === 'scanning' }]" />
          <b>{{ stateText(job) }}</b>
          <div class="spacer" />
          <span v-if="job.total" class="pct grad-text">{{ pct(job) }}%</span>
        </div>
        <div v-if="['waiting', 'uploading', 'scanning'].includes(job.state)" class="bar big-bar live"><i :style="{ width: pct(job) + '%' }" /></div>
        <div class="muted small">
          {{ bytes(job.sent) }} of {{ bytes(job.total) }}<template v-if="job.current"> · {{ job.current }}</template>
          <template v-if="job.state === 'failed' && job.error"> · {{ job.error }}</template>
          <template v-else-if="job.note"> · {{ job.note }}</template>
        </div>
        <div class="row fu-actions">
          <button v-if="['waiting', 'uploading', 'scanning'].includes(job.state)" class="btn" data-focus @click="call('fuse:upload:cancel', { id: job.id })"><Icon name="mdiClose" :size="18" />Cancel upload</button>
          <button v-else class="btn primary" data-focus @click="back()"><Icon name="mdiArrowLeft" :size="18" />Done</button>
        </div>
        <p v-if="['waiting', 'uploading', 'scanning'].includes(job.state)" class="muted small" style="margin: 0">You can leave this page: the upload carries on, and Fuse shows its progress.</p>
      </section>
    </template>

    <section v-if="earlier.length" class="fu-earlier">
      <div class="shelf-title"><Icon name="mdiHistory" :size="20" />Earlier uploads from Fuse<span class="count">{{ earlier.length }}</span></div>
      <div class="list">
        <div v-for="u in earlier" :key="u.id" class="fu-row" data-focus tabindex="0">
          <Icon :name="STATE_ICON[u.state]" :size="20" :class="['fu-st', u.state]" />
          <div class="fu-mid"><b>{{ u.title }}</b><span class="muted small">{{ stateText(u) }}<template v-if="u.state === 'failed' && u.error"> · {{ u.error }}</template></span></div>
          <span class="muted small">{{ bytes(u.total) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// A game Fuse handed over to upload to RomM (cartridge://upload, docs/FUSE_BRIDGE.md): the files are checked and
// shown, and nothing is sent before the user confirms here. electron/fuseUpload.js does the uploading.
import { computed, onMounted, ref } from 'vue';
import { store, call, bytes, back, toast } from '../store.js';
import { findPlatform } from '../android/deeplink.js';
import { useView } from '../useView.js';
import Icon from '../components/Icon.vue';
import PIcon from '../components/PIcon.vue';

const SHOW = 8;
const plan = ref(null);
const error = ref('');
const jobId = ref(null);
const starting = ref(false);

const platform = computed(() => (plan.value ? findPlatform(store.lib?.platforms, plan.value.platform, store.fuseUpload?.keyOf || undefined) : null));
const canUpload = computed(() => !!plan.value && !!platform.value && !plan.value.problems.length && plan.value.files.length > 0);
const job = computed(() => store.fuseUploads.find((j) => j.id === jobId.value) || null);
const earlier = computed(() => store.fuseUploads.filter((j) => j.id !== jobId.value).slice(0, 10));

const KINDS = [
  { kind: 'game', label: 'Game', icon: 'mdiDisc' },
  { kind: 'dlc', label: 'DLC', icon: 'mdiPuzzleOutline' },
  { kind: 'update', label: 'Updates', icon: 'mdiUpdate' },
  { kind: 'other', label: 'Other files', icon: 'mdiFileOutline' },
];
const groups = computed(() => KINDS.map((k) => ({ ...k, files: (plan.value?.files || []).filter((f) => f.kind === k.kind) })).filter((g) => g.files.length));

const STATE_ICON = { waiting: 'mdiClockOutline', uploading: 'mdiCloudUploadOutline', scanning: 'mdiRadar', done: 'mdiCheckCircle', failed: 'mdiAlertCircleOutline', cancelled: 'mdiCloseCircleOutline' };
function stateText(j) {
  if (j.state === 'waiting') return 'Waiting for the upload before it';
  if (j.state === 'uploading') return j.files > 1 ? `Uploading file ${Math.min(j.fileIndex + 1, j.files)} of ${j.files}` : 'Uploading';
  if (j.state === 'scanning') return 'RomM is adding it to your library';
  if (j.state === 'done') return 'Uploaded to RomM';
  if (j.state === 'cancelled') return 'Cancelled';
  return 'Upload failed';
}
const pct = (j) => (j.total ? Math.min(100, Math.floor((j.sent / j.total) * 100)) : 0);

async function upload() {
  if (!canUpload.value) return;
  starting.value = true;
  try {
    const j = await call('fuse:upload:start', { token: plan.value.token, platformId: platform.value.id });
    jobId.value = j.id;
  } catch (e) {
    toast(e.message, 'error', 6000);
  } finally {
    starting.value = false;
  }
}

useView({}, [{ b: 'A', label: 'Select' }, { b: 'B', label: 'Back' }]);

onMounted(async () => {
  const src = store.fuseUpload;
  if (!src || (!src.request && !src.json)) { error.value = 'Nothing came with the link. Start the upload again from Fuse.'; return; }
  try {
    plan.value = await call('fuse:upload:open', src.request ? { request: src.request } : { json: src.json });
  } catch (e) {
    error.value = e.message || 'The upload request couldn’t be read.';
  }
});
</script>

<style scoped>
.fu-head { margin: 18px 0 22px; max-width: 760px; }
.fu-head .eyebrow { display: flex; align-items: center; gap: 6px; }
.big { font-size: var(--t-2xl); font-weight: 700; margin: 6px 0 6px; }
.lead { margin: 0; font-size: var(--t-sm); }
.small { font-size: var(--t-xs); }
.spacer { flex: 1; }
.fu-card { display: flex; flex-direction: column; gap: 18px; padding: 20px 24px; max-width: 860px; margin-bottom: 18px; }
.fu-loading { flex-direction: row; align-items: center; gap: 12px; }
.fu-problem { flex-direction: row; align-items: center; gap: 16px; }
.fu-bad { color: var(--red); flex: none; }
.fu-game { display: flex; align-items: center; gap: 18px; }
.fu-mark { width: 72px; height: 72px; border-radius: var(--r-md); background: var(--s2); display: grid; place-items: center; flex: none; }
.fu-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.fu-mid h2 { font-size: var(--t-xl); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
.fu-mid b { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fu-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px 24px; }
.fu-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.fu-label { display: flex; align-items: center; gap: 8px; font-family: var(--display); font-weight: 700; font-size: var(--t-sm); color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.fu-file { display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-radius: var(--r-md); background: var(--s2); min-width: 0; font-size: var(--t-sm); }
.fu-ic { color: var(--muted); flex: none; }
.fu-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fu-note { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: var(--r-md); background: var(--s2); color: var(--muted); }
.fu-note b { color: var(--text); display: block; margin-bottom: 2px; }
.fu-note.bad { color: var(--red); }
.fu-note.bad .small { color: var(--muted); }
.fu-actions { gap: 12px; flex-wrap: wrap; }
.fu-state { gap: 12px; align-items: center; }
.big-bar { height: 12px; border-radius: var(--r-sm); }
.pct { font-family: var(--display); font-weight: 700; font-size: var(--t-xl); }
.fu-st { color: var(--muted); flex: none; }
.fu-st.uploading, .fu-st.scanning { color: var(--primary-l); }
.fu-st.done { color: var(--green-l); }
.fu-st.failed { color: var(--red); }
.fu-earlier { max-width: 860px; }
.list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 26px; }
.fu-row { display: flex; align-items: center; gap: 14px; padding: 10px 16px; border-radius: var(--r-md); background: rgba(16, 19, 28, 0.6); border: 1px solid var(--line); }
.fu-row:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; outline: none; }
.fu-row:focus .muted, .fu-row:focus .fu-st { color: var(--on-focus-dim); }
</style>
