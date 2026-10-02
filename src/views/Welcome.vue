<template>
  <div class="welcome" ref="el">
    <div class="w-top">
      <Logo :size="34" />
      <div class="w-dots"><template v-if="!only"><i v-for="(s, i) in STEPS" :key="s" :class="{ on: i === at, done: i < at }" /></template></div>
      <button class="btn small" data-focus @click="leave"><Icon name="mdiClose" :size="18" />{{ only ? 'Close' : replay ? 'Leave' : 'Skip setup' }}</button>
    </div>

    <Transition :name="dir > 0 ? 'w-next' : 'w-prev'" mode="out-in">
      <section :key="step" class="w-step" :class="'w-' + step" data-scroll>
        <!-- 1 -->
        <template v-if="step === 'hello'">
          <Logo :size="96" class="w-logo" />
          <h1 class="w-big">Welcome to Cartridge</h1>
          <p class="w-lead">{{ IS_ANDROID ? 'Your RomM library in your hands: find a game, download it, play it with your emulators and keep track of it, all with a controller.' : 'Your RomM library on the couch: find a game, download it, play it from Steam and keep track of it, all with a controller.' }}</p>
          <div class="w-act"><button class="btn primary xl" data-focus @click="next()">Get started<Icon name="mdiArrowRight" /></button></div>
        </template>

        <!-- 2 -->
        <template v-else-if="step === 'name'">
          <h1>What should we call you?</h1>
          <p class="w-lead">For a hello when Cartridge starts, and to name this device in RomM.</p>
          <div class="w-box"><TextField v-model="name" label="Your name" placeholder="Sam" icon="mdiAccount" /></div>
          <p v-if="name.trim()" class="muted small">This device will be called <b>{{ deviceName }}</b>. You can change it in Settings → About.</p>
          <div class="w-act">
            <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
            <button class="btn primary" data-focus @click="saveName">{{ name.trim() ? 'Continue' : 'Skip' }}<Icon name="mdiArrowRight" /></button>
          </div>
        </template>

        <!-- 3 -->
        <template v-else-if="step === 'lang'">
          <h1>Language</h1>
          <p class="w-lead">More languages are coming in Cartridge 1.0.</p>
          <div class="w-box"><button class="lrow" data-focus :class="{ sel: true }" @click="next()"><Icon name="mdiTranslate" :size="24" /><div class="l-mid"><b>English</b></div><Icon name="mdiCheck" :size="20" /></button></div>
          <div class="w-act">
            <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
            <button class="btn primary" data-focus @click="next()">Continue<Icon name="mdiArrowRight" /></button>
          </div>
        </template>

        <!-- 4 -->
        <template v-else-if="step === 'pad'">
          <h1>Controller check</h1>
          <p class="w-lead">Press <Btn b="A" /> on your controller.</p>
          <div class="w-pad" :class="{ ok: padOk }"><Icon :name="padOk ? 'mdiCheckCircle' : 'mdiGamepadVariantOutline'" :size="72" /><b>{{ padOk ? 'Your controller works' : 'Waiting for A…' }}</b></div>
          <div class="w-act">
            <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
            <button class="btn primary" data-focus @click="padPress">{{ padOk ? 'Continue' : 'Press A' }}<Icon name="mdiArrowRight" /></button>
          </div>
          <p class="muted small">Using touch, a mouse or a keyboard? Tap Press A to go on. Everything works with all of them.</p>
        </template>

        <!-- 5 -->
        <template v-else-if="step === 'steam'">
          <h1>Instant Steam changes</h1>
          <template v-if="!st.steam"><p class="w-lead">Steam wasn't found on this device. Games can go into Steam later, once it's installed and signed in.</p></template>
          <template v-else-if="st.live.flag || liveDone">
            <div class="w-good"><Icon name="mdiCheckCircle" :size="28" /><span>Instant Steam changes are on</span></div>
            <p class="w-lead">Games you add show up in Steam straight away{{ st.live.on ? '' : ' after Steam restarts once' }}.</p>
          </template>
          <template v-else>
            <p class="w-lead">Cartridge can add games, artwork and collections to Steam while it's running, without closing Steam each time. It turns on Steam's own developer switch for this (the one Decky uses); no plugins are installed.</p>
            <p class="muted small">Steam has to restart once before it works.</p>
          </template>
          <div class="w-act">
            <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
            <template v-if="st.steam && !st.live.flag && !liveDone">
              <button class="btn" data-focus @click="next()">Not now</button>
              <button class="btn primary" data-focus @click="liveOn"><Icon name="mdiFlash" />Turn on</button>
            </template>
            <button v-else class="btn primary" data-focus @click="next()">Continue<Icon name="mdiArrowRight" /></button>
          </div>
        </template>

        <!-- 6 -->
        <template v-else-if="step === 'emus'">
          <template v-if="st.emudeck || st.retrodeck">
            <h1>Emulators</h1>
            <div class="w-good"><Icon name="mdiCheckCircle" :size="28" /><span>Good news, you already have {{ st.emudeck && st.retrodeck ? 'EmuDeck and RetroDECK' : st.emudeck ? 'EmuDeck' : 'RetroDECK' }}</span></div>
            <p class="w-lead">Cartridge uses the emulators it set up. The system scan in a moment finds every other one too.</p>
            <div class="w-act">
              <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
              <button class="btn primary" data-focus @click="next()">Continue<Icon name="mdiArrowRight" /></button>
            </div>
          </template>
          <template v-else>
            <h1>Get your emulators</h1>
            <p class="w-lead">Cartridge starts games with the emulators on this device. If you don't have any yet, one of these sets them up for you.</p>
            <div v-if="getting" class="w-box glass w-prog">
              <b>{{ getting === 'emudeck' ? 'Downloading EmuDeck' : 'Installing RetroDECK' }}</b>
              <div class="bar live"><i :style="{ width: (progress ?? 0) + '%' }" /></div>
              <span class="muted small">{{ progress != null ? progress + '%' : 'Starting…' }}</span>
            </div>
            <div v-else-if="opened" class="w-box glass w-prog">
              <b>{{ opened === 'emudeck' ? 'EmuDeck is open' : 'RetroDECK is open' }}</b>
              <span class="muted">Pick your emulators there. When it's finished, come back here and press Continue: Cartridge looks again.</span>
            </div>
            <div v-else class="w-box stack">
              <button class="lrow" data-focus @click="getEmuDeck">
                <Icon name="mdiDownload" :size="26" />
                <div class="l-mid"><b>EmuDeck <span class="status ok">Recommended</span></b><span class="l-sub">Cartridge downloads EmuDeck's official app and opens it. You pick emulators there and EmuDeck installs them.</span></div>
              </button>
              <button class="lrow" data-focus @click="getRetroDeck">
                <Icon name="mdiPackageDown" :size="26" />
                <div class="l-mid"><b>RetroDECK</b><span class="l-sub">Installed from Flathub with a progress bar (works in Game Mode), then opened for its own setup.</span></div>
              </button>
              <button class="lrow" data-focus @click="next()">
                <Icon name="mdiHandBackRight" :size="26" />
                <div class="l-mid"><b>I'll set up emulators myself</b><span class="l-sub">The system scan finds whatever is installed.</span></div>
              </button>
            </div>
            <div class="w-act">
              <button class="btn" data-focus :disabled="!!getting" @click="prev"><Icon name="mdiArrowLeft" />Back</button>
              <button v-if="opened" class="btn primary" data-focus @click="recheck">Continue<Icon name="mdiArrowRight" /></button>
            </div>
          </template>
        </template>

        <!-- 7 -->
        <template v-else-if="step === 'romm'">
          <template v-if="romm === 'signin'">
            <h1>Sign in to RomM</h1>
            <Setup embedded @done="next()" @back="romm = ''" />
          </template>
          <template v-else-if="romm === 'local'">
            <RommLocal @done="only ? close() : next()" @back="only ? close() : (romm = 'what')" />
          </template>
          <template v-else-if="store.config.configured && romm !== 'change'">
            <h1>RomM</h1>
            <div class="w-good"><Icon name="mdiCheckCircle" :size="28" /><span>Connected to {{ serverName }}</span></div>
            <div class="w-act">
              <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
              <button class="btn" data-focus @click="romm = 'signin'">Change</button>
              <button class="btn primary" data-focus @click="next()">Continue<Icon name="mdiArrowRight" /></button>
            </div>
          </template>
          <template v-else-if="romm === 'what'">
            <h1>What is RomM?</h1>
            <p class="w-lead">RomM is a free server for your game collection. It keeps your games in one place, finds their covers and details, and lets Cartridge, your browser and other devices download them. Cartridge is a RomM client, so it needs one.</p>
            <div class="w-box stack">
              <button v-if="!IS_ANDROID" class="lrow" data-focus @click="romm = 'local'">
                <Icon name="mdiServer" :size="26" />
                <div class="l-mid"><b>Set up RomM on this device</b><span class="l-sub">Cartridge does it for you in the background. You choose your own RomM username and password.</span></div>
              </button>
              <button class="lrow" data-focus @click="romm = 'other'">
                <Icon name="mdiMonitor" :size="26" />
                <div class="l-mid"><b>Set it up on another computer</b><span class="l-sub">A home server or an always-on PC. Scan a QR code for RomM's guide.</span></div>
              </button>
              <button class="lrow" data-focus @click="next()">
                <Icon name="mdiClockOutline" :size="26" />
                <div class="l-mid"><b>Later</b><span class="l-sub">Cartridge asks for your server again when you're ready.</span></div>
              </button>
            </div>
            <div class="w-act"><button class="btn" data-focus @click="romm = ''"><Icon name="mdiArrowLeft" />Back</button></div>
          </template>
          <template v-else-if="romm === 'other'">
            <h1>RomM on another computer</h1>
            <div class="w-qr glass">
              <div class="qr-img" v-html="guideQr" />
              <div class="stack">
                <b>Scan with your phone</b>
                <p class="muted small">RomM's guide explains the setup step by step. When the server is running, come back and pick "Yes, sign in".</p>
                <p class="small mono">{{ ROMM_GUIDE }}</p>
              </div>
            </div>
            <div class="w-act">
              <button class="btn" data-focus @click="romm = 'what'"><Icon name="mdiArrowLeft" />Back</button>
              <button class="btn" data-focus @click="next()">Later</button>
              <button class="btn primary" data-focus @click="romm = 'signin'">Yes, sign in</button>
            </div>
          </template>
          <template v-else>
            <h1>Do you have a RomM server?</h1>
            <p class="w-lead">Your games, covers and progress come from RomM.</p>
            <div class="w-act w-act-c">
              <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
              <button class="btn" data-focus @click="romm = 'what'">No</button>
              <button class="btn primary" data-focus @click="romm = 'signin'">Yes, sign in</button>
            </div>
          </template>
        </template>

        <!-- 8 -->
        <template v-else-if="step === 'scan'">
          <p class="w-lead w-scan-lead">Let us scan your system. Everything here can be changed later in Settings → Emulators.</p>
          <EmuSetup welcome @done="next()" @back="prev" class="w-emu" />
        </template>

        <!-- 9 -->
        <template v-else-if="step === 'extras'">
          <h1>Optional extras</h1>
          <p class="w-lead">Both can be added later in Settings.</p>
          <div class="w-box stack">
            <div class="subh">SteamGridDB</div>
            <p class="muted small">A free key from steamgriddb.com (Preferences → API) gives every game its logo{{ IS_ANDROID ? ', and a cover when RomM has none' : ' and better Steam artwork' }}.</p>
            <div v-if="store.config.sgdbKey" class="w-good"><Icon name="mdiCheckCircle" :size="22" /><span>Key saved</span></div>
            <TextField v-else v-model="sgdb" label="SteamGridDB API key" placeholder="Paste your key" password icon="mdiKeyVariant" />
            <div class="subh" style="margin-top: 10px">RetroAchievements</div>
            <div v-if="store.config.ra?.user" class="w-good"><Icon name="mdiCheckCircle" :size="22" /><span>Signed in as {{ store.config.ra.user }}</span></div>
            <template v-else>
              <p class="muted small">Your username and the web API key from retroachievements.org → Settings → Authentication. Your password isn't needed.</p>
              <div class="grid2">
                <TextField v-model="raUser" label="Username" placeholder="Your username" icon="mdiAccount" />
                <TextField v-model="raKey" label="Web API key" placeholder="Paste your key" password icon="mdiKeyVariant" />
              </div>
            </template>
          </div>
          <div class="w-act">
            <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
            <button class="btn primary" data-focus :disabled="busy" @click="saveExtras">{{ sgdb || (raUser && raKey) ? 'Save and continue' : 'Skip' }}<Icon name="mdiArrowRight" /></button>
          </div>
        </template>

        <!-- 10 -->
        <template v-else-if="step === 'self'">
          <h1>Add Cartridge to Steam</h1>
          <template v-if="st.inSteam || selfDone">
            <div class="w-good"><Icon name="mdiCheckCircle" :size="28" /><span>Cartridge is in Steam</span></div>
            <p class="w-lead">Find it in your library in Game Mode, with its own artwork.</p>
          </template>
          <template v-else>
            <p class="w-lead">So you can open Cartridge from Game Mode, with its artwork. Steam closes and reopens once to pick it up.</p>
            <p v-if="!st.appimage" class="muted small">This only works from the AppImage build. You can do it later in Settings → Steam.</p>
          </template>
          <div class="w-act">
            <button class="btn" data-focus @click="prev"><Icon name="mdiArrowLeft" />Back</button>
            <template v-if="!st.inSteam && !selfDone && st.appimage">
              <button class="btn" data-focus @click="next()">Skip</button>
              <button class="btn primary" data-focus :disabled="busy" @click="addSelf"><Icon name="mdiSteam" />{{ busy ? 'Adding…' : 'Add to Steam' }}</button>
            </template>
            <button v-else class="btn primary" data-focus @click="next()">Continue<Icon name="mdiArrowRight" /></button>
          </div>
        </template>

        <!-- 11 -->
        <template v-else-if="step === 'done'">
          <div class="w-good w-done"><Icon name="mdiCheckCircle" :size="72" /></div>
          <h1 class="w-big">{{ name.trim() ? `You're all set, ${name.trim()}` : "You're all set" }}</h1>
          <p class="w-lead">{{ store.config.configured ? 'Your library is on its way.' : 'Connect to RomM when you\'re ready and your library comes in.' }}</p>
          <div class="w-act"><button class="btn primary xl" data-focus @click="finish">Start<Icon name="mdiArrowRight" /></button></div>
        </template>
      </section>
    </Transition>
  </div>
</template>

<script setup>
// The welcome (0.9.15, plan section 0): new installs, and Settings → About → Run the welcome again.
// A replay starts from the current settings: done steps show a green check, nothing is reset, and
// leaving halfway keeps everything as it was.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { store, call, saveConfig, toast, tab, confirm, openModal } from '../store.js';
import { focusFirst, input } from '../nav.js';
import { useView } from '../useView.js';
import Logo from '../components/Logo.vue';
import Icon from '../components/Icon.vue';
import Btn from '../components/Btn.vue';
import TextField from '../components/TextField.vue';
import Setup from './Setup.vue';
import EmuSetup from './EmuSetup.vue';
import RommLocal from '../components/RommLocal.vue';
import { IS_ANDROID } from '../platform.js';

// Android: no Steam, no EmuDeck or RetroDECK, no desktop scan; emulators are picked in Settings → Emulators
const DESKTOP_ONLY = ['steam', 'emus', 'scan', 'self'];
const STEPS = ['hello', 'name', 'lang', 'pad', 'steam', 'emus', 'romm', 'scan', 'extras', 'self', 'done'].filter((s) => !IS_ANDROID || !DESKTOP_ONLY.includes(s));
const ROMM_GUIDE = 'https://docs.romm.app';
const el = ref(null);
const at = ref(0), dir = ref(1);
const step = computed(() => STEPS[at.value]);
const replay = !!store.config.welcomed;
// Settings → RomM → Set up RomM on this device opens just that step, on the same background
const only = store.welcoming === 'romm-local';
function close() { store.welcoming = false; }
const st = ref({ steam: false, live: { on: false, flag: false }, emudeck: false, retrodeck: false, inSteam: false, appimage: false, gamescope: false, host: '', device: '' });
const name = ref(store.config.ui.name || '');
const padOk = ref(false), liveDone = ref(false), selfDone = ref(false), busy = ref(false);
const getting = ref(''), opened = ref(''), progress = ref(null);
const romm = ref('');
const sgdb = ref(''), raUser = ref(''), raKey = ref('');
const guideQr = ref('');

const deviceName = computed(() => `${name.value.trim()}'s ${st.value.device || 'device'}`);
const serverName = computed(() => { const s = store.config.server || {}; try { return new URL(s.localUrl || s.remoteUrl).host; } catch { return 'your RomM server'; } });

function go(i, d) { dir.value = d; at.value = Math.max(0, Math.min(STEPS.length - 1, i)); }
function next() { romm.value = ''; go(at.value + 1, 1); }
function prev() { romm.value = ''; go(at.value - 1, -1); }

async function saveName() {
  const n = name.value.trim().slice(0, 40);
  const patch = { ui: { name: n } };
  if (n && !(store.config.trophies?.device || '').trim()) patch.trophies = { device: deviceName.value };
  await saveConfig(patch);
  next();
}
// A from a controller counts; touch, mouse and keyboard just go on
let padT = null;
function padPress() {
  if (padOk.value || input.mode !== 'pad' || !input.padName) return next();
  padOk.value = true; padT = setTimeout(next, 700);
}
async function liveOn() {
  try { await call('steam:liveEnable'); liveDone.value = true; toast('Instant Steam changes are on. They work after Steam restarts once.', 'ok', 4500, 'mdiSteam'); }
  catch (e) { toast(e.message, 'error'); }
}
let off = null;
async function getEmuDeck() {
  if (st.value.gamescope) return toast("EmuDeck's app opens as a desktop window: switch to Desktop Mode for this step, then open Cartridge there. It picks up where you left off.", 'info', 7000, 'mdiMonitor');
  getting.value = 'emudeck'; progress.value = null;
  try { await call('welcome:emudeck'); opened.value = 'emudeck'; }
  catch (e) { toast(e.message, 'error', 6000); }
  getting.value = '';
}
async function getRetroDeck() {
  getting.value = 'retrodeck'; progress.value = null;
  try { await call('welcome:retrodeck'); opened.value = 'retrodeck'; }
  catch (e) { toast(e.message, 'error', 6000); }
  getting.value = '';
}
async function recheck() { await load(); opened.value = ''; next(); }
async function saveExtras() {
  busy.value = true;
  try {
    if (sgdb.value.trim()) await saveConfig({ sgdbKey: sgdb.value.trim() });
    if (raUser.value.trim() && raKey.value.trim()) {
      const r = await call('ra:signin', { user: raUser.value.trim(), key: raKey.value.trim() });
      store.config = await call('config:get');
      toast(`Signed in to RetroAchievements as ${r.user}`, 'ok', 2600, 'mdiTrophy');
    }
    next();
  } catch (e) { toast(e.message, 'error', 5000); }
  busy.value = false;
}
async function addSelf() {
  try {
    const s = await call('steam:status');
    if (s.running && !(await confirm('Close and reopen Steam?', 'Steam has to restart to pick up the new shortcut. Anything open in Steam will close.', 'Restart Steam and add'))) return;
    busy.value = true;
    await call('steam:add', { restartSteam: true });
    selfDone.value = true;
    toast('Cartridge is in Steam', 'ok', 3500, 'mdiSteam');
  } catch (e) { toast(e.message, 'error', 6000); }
  busy.value = false;
}
async function finish() {
  await saveConfig({ welcomed: Date.now() });
  store.welcoming = false;
  if (store.config.configured) tab('home');
  if (!store.config.ui.toured) { await openModal('tour'); saveConfig({ ui: { toured: true } }); }
}
async function leave() {
  if (only) return close();
  if (!replay && !(await confirm('Skip the setup?', 'You can run it again any time from Settings → About.', 'Skip'))) return;
  if (!replay) await saveConfig({ welcomed: 'skipped' });
  store.welcoming = false;
  if (store.config.configured) tab(replay ? 'settings' : 'home');
}
async function load() { try { st.value = await call('welcome:state'); } catch {} }

// On the controller check any face button counts: some pads (and Android's button layouts) send B for the
// button marked A, and going back from here looked like the check failed
const handlers = { back: () => { if (step.value === 'pad' && input.mode === 'pad') return padPress(); if (step.value === 'romm' && romm.value) { romm.value = romm.value === 'other' || romm.value === 'local' ? 'what' : ''; return; } if (at.value > 0) prev(); } };
useView(handlers, [{ b: 'A', label: 'Select' }, { b: 'B', label: 'Back' }]);
// Setup and the scan bring their own buttons; the welcome's come back after them
watch([step, romm], async () => {
  if (step.value === 'self' && st.value.inSteam === false) await load();
  await nextTick(); await nextTick();
  if (!(step.value === 'scan' || (step.value === 'romm' && (romm.value === 'signin' || romm.value === 'local')))) store.viewHandlers = handlers;
  setTimeout(() => focusFirst(el.value?.querySelector('.w-step') || el.value, '.w-act .btn.primary, .w-step [data-focus]'), 280);
  if (step.value === 'romm' && romm.value === 'other' && !guideQr.value) {
    const QRCode = (await import('qrcode')).default;
    guideQr.value = await QRCode.toString(ROMM_GUIDE, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
  }
});
onMounted(async () => {
  if (only) { at.value = STEPS.indexOf('romm'); romm.value = 'local'; }
  store.welcoming ||= true;
  off = window.cart.on('welcome-progress', (p) => { if (p.percent != null) progress.value = p.percent; });
  await load();
  await nextTick(); focusFirst(el.value, '.w-act .btn.primary');
});
onBeforeUnmount(() => { off?.(); clearTimeout(padT); });
</script>

<style scoped>
.welcome { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.w-top { display: flex; align-items: center; gap: var(--s-4); padding: var(--s-4) var(--s-5); flex: none; }
.w-dots { flex: 1; display: flex; justify-content: center; gap: 8px; }
.w-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, 0.22); transition: background var(--d-2, 0.2s), transform var(--d-2, 0.2s); }
.w-dots i.done { background: rgba(255, 255, 255, 0.55); }
.w-dots i.on { background: #fff; transform: scale(1.3); }
.w-step { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: var(--s-4); padding: var(--s-5) 20px 48px; text-align: center; }
.w-step > * { max-width: 860px; width: 100%; }
.w-hello, .w-done { justify-content: center; }
.w-step h1 { font-size: var(--t-2xl); font-weight: 800; letter-spacing: -0.02em; margin: 0; }
.w-big { font-size: calc(var(--t-2xl) * 1.35) !important; }
.w-logo { width: auto !important; margin-bottom: var(--s-2); }
.w-lead { color: var(--muted); font-size: var(--t-md); line-height: 1.55; margin: 0; }
.w-box { text-align: left; }
.w-act { display: flex; justify-content: center; gap: var(--s-3); flex-wrap: wrap; margin-top: var(--s-3); }
.w-good { display: flex; align-items: center; justify-content: center; gap: var(--s-2); color: #7ee787; font-weight: 600; font-size: var(--t-md); }
.w-done { color: #7ee787; }
.w-pad { display: flex; flex-direction: column; align-items: center; gap: var(--s-2); padding: var(--s-5); color: var(--muted); transition: color var(--d-2, 0.2s); }
.w-pad.ok { color: #7ee787; }
.w-prog { display: flex; flex-direction: column; gap: var(--s-2); padding: var(--s-4) var(--s-5); }
.w-qr { display: flex; gap: 20px; align-items: center; padding: 16px; text-align: left; }
.qr-img { width: 190px; height: 190px; flex: none; background: #fff; border-radius: var(--r-md); padding: 8px; }
.qr-img :deep(svg) { width: 100%; height: 100%; display: block; }
.stack { display: flex; flex-direction: column; gap: var(--s-2); }
.grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
.small { font-size: var(--t-sm); margin: 0; line-height: 1.5; }
.mono { font-family: ui-monospace, monospace; word-break: break-all; }
.lrow .status { margin-left: 8px; vertical-align: middle; }
.lrow.sel { background: var(--sel); }
.w-scan { text-align: left; align-items: stretch; }
.w-scan-lead { text-align: center; max-width: 1100px !important; }
.w-emu { position: relative !important; inset: auto !important; height: auto !important; overflow: visible !important; padding: 0 !important; text-align: left; max-width: 1100px !important; }
.w-next-enter-active, .w-next-leave-active, .w-prev-enter-active, .w-prev-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.w-next-enter-from, .w-prev-leave-to { opacity: 0; transform: translateX(40px); }
.w-next-leave-to, .w-prev-enter-from { opacity: 0; transform: translateX(-40px); }
@media (prefers-reduced-motion: reduce) { .w-next-enter-active, .w-next-leave-active, .w-prev-enter-active, .w-prev-leave-active { transition: opacity 0.15s; transform: none !important; } }
</style>
