<template>
  <div class="setup" :class="{ embedded }" ref="el" data-scroll>
    <div v-if="!embedded" class="hero">
      <Logo :size="76" />
      <h1>Cartridge</h1>
      <p class="muted">Your RomM library, on the couch.</p>
    </div>

    <div class="steps">
      <span :class="{ on: step === 1 }">1 · Server</span><span :class="{ on: step === 2 }">2 · ROM folders</span>
    </div>

    <section v-if="step === 1" class="glass card-s">
      <h2>Connect to RomM</h2>
      <p class="muted small">Fill in one or both. In Auto mode Cartridge uses the local address when you're home and falls back to the tunnel.</p>
      <div class="grid2">
        <TextField v-model="srv.localUrl" label="Local address" placeholder="http://192.168.1.50:8080" mode="url" icon="mdiLan" />
        <TextField v-model="srv.remoteUrl" label="Remote address (Cloudflare Tunnel)" placeholder="https://romm.example.com" mode="url" icon="mdiCloudOutline" />
      </div>
      <div class="row wrap">
        <span class="lbl">Route</span>
        <div class="seg">
          <button v-for="m in modes" :key="m.v" data-focus :class="{ on: srv.mode === m.v }" @click="srv.mode = m.v">{{ m.l }}</button>
        </div>
      </div>

      <div class="row wrap">
        <span class="lbl">Sign in with</span>
        <div class="seg">
          <button v-for="m in auths" :key="m.v" data-focus :class="{ on: authMode === m.v }" @click="authMode = m.v">{{ m.l }}</button>
        </div>
      </div>
      <div v-if="authMode === 'password'" class="grid2">
        <TextField v-model="srv.username" label="Username" placeholder="admin" icon="mdiAccount" />
        <TextField v-model="srv.password" label="Password" placeholder="••••••" password icon="mdiLock" />
      </div>
      <div v-else-if="authMode === 'pair'" class="stack">
        <p class="muted small">In RomM on your phone or PC: open your profile → <b>Client API Tokens</b> → create a token with read access → <b>Pair</b>. Enter the code shown.</p>
        <div class="row">
          <TextField v-model="pairCode" label="Pairing code" placeholder="ABCD-1234" icon="mdiQrcode" style="flex: 1" />
          <button class="btn primary" data-focus :disabled="!pairCode || busy" @click="pair" style="align-self: flex-end"><Icon name="mdiLinkVariant" />Pair</button>
        </div>
        <p v-if="srv.token" class="chip green" style="align-self: flex-start"><Icon name="mdiCheck" :size="14" />Paired, token saved</p>
        <div v-if="qr" class="qr glass">
          <div class="qr-img" v-html="qr.svg" />
          <div class="qr-t">
            <b>Scan with your phone</b>
            <p class="muted small">Sign in to RomM on your phone and approve Cartridge. This screen continues by itself.</p>
            <p class="small">Or open <span class="mono">{{ qr.url.replace(/\?.*$/, '') }}</span> and enter <b class="qr-code">{{ qr.userCode }}</b></p>
            <p class="muted small qr-wait"><Icon name="mdiSync" :size="14" class="spin" />Waiting for approval…</p>
            <div class="row" style="gap: 10px">
              <button v-if="phonesOnline" class="btn small primary" data-focus @click="sendToPhone"><Icon name="mdiCellphoneArrowDown" :size="18" />Send to my phone</button>
              <button class="btn small" data-focus @click="stopQr"><Icon name="mdiClose" :size="18" />Cancel</button>
            </div>
          </div>
        </div>
        <button v-else class="btn" data-focus style="align-self: flex-start" :disabled="busy || !hasUrl" @click="startQr"><Icon name="mdiQrcodeScan" />Pair with a QR code instead</button>
      </div>
      <div v-else class="stack">
        <TextField v-model="srv.token" label="API token" placeholder="rmm_…" password icon="mdiKeyVariant" />
      </div>

      <button class="toggle-adv" data-focus @click="adv = !adv"><Icon :name="adv ? 'mdiChevronDown' : 'mdiChevronRight'" />Advanced: Cloudflare Access</button>
      <div v-if="adv" class="stack">
        <p class="muted small">Only needed if your tunnel is protected by Cloudflare Zero Trust Access. Create a Service Token in Cloudflare and allow it in the app's policy.</p>
        <div class="grid2">
          <TextField v-model="srv.cfClientId" label="CF-Access-Client-Id" placeholder="xxxx.access" />
          <TextField v-model="srv.cfClientSecret" label="CF-Access-Client-Secret" placeholder="secret" password />
        </div>
      </div>

      <div v-if="results" class="results">
        <div v-for="(r, k) in results" :key="k" class="res" :class="r.ok ? 'ok' : 'bad'">
          <Icon :name="r.ok ? 'mdiCheckCircle' : 'mdiAlertCircle'" />
          <b>{{ k === 'localUrl' ? 'Local' : 'Remote' }}</b>
          <span v-if="r.ok">RomM {{ r.version }} · signed in as {{ r.user }}</span>
          <span v-else>{{ r.error }}</span>
        </div>
      </div>

      <div class="row end">
        <button v-if="embedded" class="btn" data-focus @click="emit('back')"><Icon name="mdiArrowLeft" />Back</button>
        <button v-else-if="store.config.configured" class="btn" data-focus @click="cancel">Cancel</button>
        <button class="btn" data-focus :disabled="busy || !hasUrl" @click="test"><Icon name="mdiLanConnect" />Test connection</button>
        <button class="btn primary" data-focus :disabled="busy || !anyOk" @click="saveServer">Continue<Icon name="mdiArrowRight" /></button>
      </div>
    </section>

    <section v-else class="glass card-s">
      <h2>Where do your ROMs live?</h2>
      <p class="muted small">Pick your EmuDeck / ES-DE <b>roms</b> folder. Each console is matched to its subfolder automatically, and you can override any of them later in Settings.</p>
      <div class="stack">
        <button v-for="r in detected.roots" :key="r.path" class="menu-item" :class="{ selected: romsRoot === r.path }" data-focus @click="romsRoot = r.path">
          <Icon name="mdiFolderSearch" style="color: var(--primary-l)" />
          <span class="mono">{{ r.path }}</span><span class="sub">{{ r.source }}</span>
        </button>
        <div v-if="!detected.roots.length" class="muted">Nothing detected. Browse to it below.</div>
        <button class="menu-item" data-focus @click="browseRoms"><Icon name="mdiFolderOpen" /><span>{{ romsRoot && !detected.roots.find((r) => r.path === romsRoot) ? romsRoot : 'Browse…' }}</span></button>
      </div>
      <h3 style="margin-top: 8px">BIOS folder <span class="muted small">(optional)</span></h3>
      <button class="menu-item" data-focus @click="browseBios"><Icon name="mdiChip" /><span class="mono">{{ biosPath || 'Browse…' }}</span></button>
      <div class="row end">
        <button class="btn" data-focus @click="step = 1"><Icon name="mdiArrowLeft" />Back</button>
        <button class="btn primary" data-focus :disabled="!romsRoot" @click="finish">Finish<Icon name="mdiCheck" /></button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, nextTick, watch } from 'vue';
import { store, call, saveConfig, toast, pickFolder, tab, back } from '../store.js';
import Logo from '../components/Logo.vue';
import { focusFirst } from '../nav.js';
import { useView } from '../useView.js';
import Icon from '../components/Icon.vue';
import TextField from '../components/TextField.vue';

// embedded: inside the welcome (0.9.15), which moves on when this is done
const props = defineProps({ embedded: Boolean });
const emit = defineEmits(['done', 'back']);
const el = ref(null);
const step = ref(1);
const initial = { ...store.config.server, localUrl: store.config.configured ? store.config.server.localUrl : null };
const srv = reactive({ ...store.config.server });
const authMode = ref(srv.auth === 'token' ? 'token' : 'password');
const pairCode = ref('');
const adv = ref(!!srv.cfClientId);
const busy = ref(false);
const results = ref(null);
const detected = reactive({ roots: [], bios: null });
const romsRoot = ref(store.config.romsRoot || '');
const biosPath = ref(store.config.biosPath || '');

const modes = [{ v: 'auto', l: 'Auto' }, { v: 'local', l: 'Local only' }, { v: 'remote', l: 'Remote only' }];
const auths = [{ v: 'password', l: 'Username & password' }, { v: 'pair', l: 'Pairing code' }, { v: 'token', l: 'API token' }];
const hasUrl = computed(() => !!(srv.localUrl || srv.remoteUrl));
const anyOk = computed(() => results.value && Object.values(results.value).some((r) => r.ok));

useView({ back: () => (props.embedded ? (step.value === 2 ? (step.value = 1) : emit('back')) : store.config.configured ? cancel() : step.value === 2 ? (step.value = 1) : undefined) });

function srvPayload() {
  const s = { ...srv, auth: authMode.value === 'password' ? 'password' : 'token' };
  const fix = (u) => (u && !/^https?:\/\//.test(u) ? (/^(\d|localhost)/.test(u) ? 'http://' : 'https://') + u : u);
  s.localUrl = fix(s.localUrl); s.remoteUrl = fix(s.remoteUrl);
  srv.localUrl = s.localUrl; srv.remoteUrl = s.remoteUrl;
  return s;
}

async function test() {
  busy.value = true; results.value = null;
  try { results.value = await call('server:test', srvPayload()); }
  catch (e) { toast(e.message, 'error'); }
  busy.value = false;
}
async function pair() {
  busy.value = true;
  try {
    const s = srvPayload();
    srv.token = await call('server:pair', { base: s.localUrl || s.remoteUrl, code: pairCode.value });
    toast('Paired with RomM', 'ok');
    authMode.value = 'pair';
    await test();
  } catch (e) { toast(e.message, 'error'); }
  busy.value = false;
}
// QR pairing (RomM's device sign-in): show a QR code, poll until the phone approves it
const qr = ref(null);
let qrT = null;
function stopQr() { clearTimeout(qrT); qrT = null; qr.value = null; }
async function startQr() {
  stopQr();
  const s = srvPayload();
  const base = s.localUrl || s.remoteUrl;
  try {
    // the phone opens the link: the remote address works away from home, the local one on your Wi-Fi
    const r = await call('server:qrStart', { base, link: s.remoteUrl || s.localUrl });
    const QRCode = (await import('qrcode')).default;
    const svg = await QRCode.toString(r.url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
    qr.value = { ...r, svg };
    const until = Date.now() + r.expiresIn * 1000;
    let wait = r.interval * 1000;
    const poll = async () => {
      if (!qr.value || qr.value.deviceCode !== r.deviceCode) return;
      if (Date.now() > until) { stopQr(); toast('The QR code expired. Start again.', 'error', 4000); return; }
      try {
        const t = await call('server:qrPoll', { base, deviceCode: r.deviceCode });
        if (t.token) { stopQr(); srv.token = t.token; authMode.value = 'pair'; toast('Paired with RomM', 'ok'); await test(); return; }
        if (t.slow) wait += 2000;
      } catch (e) { stopQr(); toast(e.message, 'error', 5000); return; }
      qrT = setTimeout(poll, wait);
    };
    qrT = setTimeout(poll, wait);
  } catch (e) { toast(e.message, 'error', 5000); }
}
onBeforeUnmount(stopQr);
// A phone connected through Phone remote can open the approval page itself: no camera needed
const phonesOnline = ref(0);
call('remote:settings').then((s) => { phonesOnline.value = s?.online || 0; }).catch(() => {});
const offRemote = window.cart.on?.('remote:settings', (s) => { phonesOnline.value = s?.online || 0; });
onBeforeUnmount(() => offRemote?.());
async function sendToPhone() {
  try {
    const n = await call('remote:link', { title: 'Approve Cartridge in RomM', url: qr.value.url, code: qr.value.userCode });
    toast(n ? 'Sent. Open it on your phone and approve Cartridge.' : 'No phone is connected right now', n ? 'ok' : 'error', 4000, 'mdiCellphoneArrowDown');
  } catch (e) { toast(e.message, 'error'); }
}
watch(authMode, (m) => { if (m !== 'pair') stopQr(); });

async function saveServer() {
  await saveConfig({ server: srvPayload() });
  step.value = 2;
  const d = await call('fs:detect');
  Object.assign(detected, d);
  if (!romsRoot.value) romsRoot.value = d.roots.find((r) => r.exists)?.path || '';
  if (!biosPath.value && d.bios) biosPath.value = d.bios;
}
async function browseRoms() {
  const p = await pickFolder({ title: 'Choose your roms folder', start: romsRoot.value || undefined });
  if (p) romsRoot.value = p;
}
async function browseBios() {
  const p = await pickFolder({ title: 'Choose your BIOS folder', start: biosPath.value || undefined });
  if (p) biosPath.value = p;
}
async function finish() {
  const serverChanged = !store.lib || store.config.server.localUrl !== initial.localUrl || store.config.server.remoteUrl !== initial.remoteUrl || store.config.server.username !== initial.username;
  await saveConfig({ romsRoot: romsRoot.value, biosPath: biosPath.value, configured: true });
  if (serverChanged) await call('library:reset');
  call('library:sync').catch((e) => toast(e.message, 'error'));
  if (props.embedded) emit('done'); else tab('home');
}
function cancel() { if (!back()) tab('settings'); }

watch(step, async () => { await nextTick(); focusFirst(el.value); });
onMounted(async () => { await nextTick(); focusFirst(el.value); });
</script>

<style scoped>
.setup { position: relative; z-index: 1; height: 100%; overflow-y: auto; padding: 40px 20px 60px; display: flex; flex-direction: column; align-items: center; gap: 18px; background: var(--s0); }
.setup.embedded { height: auto; overflow: visible; padding: 0; background: none; }
.hero { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.hero .logo { width: 64px; height: 64px; border-radius: var(--r-md); background: linear-gradient(135deg, var(--primary-l), var(--primary-d)); display: grid; place-items: center; box-shadow: 0 10px 40px rgba(var(--primary-rgb), 0.4); }
.hero h1 { font-size: var(--t-2xl); font-weight: 800; letter-spacing: -0.02em; }
.hero p { margin: 0; }
.steps { display: flex; gap: 20px; color: var(--dim); font-size: var(--t-sm); }
.steps .on { color: var(--primary-l); font-weight: 500; }
.card-s { width: min(820px, 100%); padding: 26px; display: flex; flex-direction: column; gap: 18px; }
.grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
.stack { display: flex; flex-direction: column; gap: 10px; }
.small { font-size: var(--t-sm); margin: 0; line-height: 1.5; }
.lbl { width: 110px; color: var(--muted); font-size: var(--t-sm); }
.wrap { flex-wrap: wrap; }
.end { justify-content: flex-end; }
.toggle-adv { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: var(--t-sm); padding: 6px; border-radius: var(--r-md); align-self: flex-start; }
.toggle-adv:focus { box-shadow: var(--ring); }
.results { display: flex; flex-direction: column; gap: 8px; }
.res { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--r-sm); font-size: var(--t-sm); }
.res.ok { background: rgba(63, 185, 80, 0.1); color: #7ee787; }
.res.bad { background: rgba(218, 54, 51, 0.1); color: #ff9b95; }
.mono { font-family: ui-monospace, monospace; font-size: var(--t-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
h3 { font-size: var(--t-md); }
.qr { display: flex; gap: 20px; align-items: center; padding: 16px; }
.qr-img { width: 190px; height: 190px; flex: none; background: #fff; border-radius: var(--r-md); padding: 8px; }
.qr-img :deep(svg) { width: 100%; height: 100%; display: block; }
.qr-t { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; min-width: 0; }
.qr-t .mono { white-space: normal; word-break: break-all; }

.qr-wait { display: flex; align-items: center; gap: 6px; }
.qr-code { font-family: ui-monospace, monospace; font-size: var(--t-md); letter-spacing: 0.08em; }
</style>
