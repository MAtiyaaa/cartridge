<template>
  <div class="pr">
    <h1>Phone remote</h1>
    <p class="muted lead">Use any phone on the same Wi-Fi as a remote and second screen: see the highlighted game, browse, start downloads on this device, and watch progress. No app to install.</p>

    <Toggle :model-value="s.enabled" label="Allow phones to connect" desc="Opens Cartridge to phones on your network. Each phone must be approved once with a code shown here." @update:model-value="(v) => set({ enabled: v })" />

    <template v-if="s.enabled">
      <div class="connect glass">
        <div class="qr-wrap">
          <QrCode v-if="qr.url" :text="qr.url" />
          <div v-else class="qr-none"><Icon name="mdiWifiOff" :size="34" /><span>No network found</span></div>
        </div>
        <div class="how">
          <div class="subh"><Icon name="mdiQrcodeScan" :size="20" />Scan with your phone's camera</div>
          <p class="muted small">Connects straight away, no code needed. This code works once and for 5 minutes.</p>
          <div class="or">or open this on your phone</div>
          <div class="addr mono">{{ addr || 'Finding address…' }}</div>
          <p class="muted small">You'll be asked for a code that appears on this screen. Other Cartridge devices on your Wi-Fi show up on the phone too.</p>
          <button class="btn small" data-focus @click="newQr"><Icon name="mdiRefresh" />New QR code</button>
        </div>
      </div>

      <div class="row wrap">
        <span class="lbl">Device name</span>
        <button class="btn small" data-focus @click="rename"><Icon name="mdiPencil" />{{ s.name }}</button>
        <span class="muted small">How this device appears on phones</span>
      </div>

      <div class="subh"><Icon name="mdiCellphone" :size="20" />Paired phones <span class="muted small" style="font-weight: 500">· {{ s.online }} connected now</span></div>
      <div v-if="s.phones?.length" class="phones">
        <div v-for="p in s.phones" :key="p.id" class="phone glass">
          <Icon name="mdiCellphone" :size="22" />
          <div class="ph-t"><b>{{ p.name }}</b><span class="muted small">Paired {{ ago(p.pairedAt) }} · last seen {{ ago(p.lastSeen) }}</span></div>
          <button class="btn small danger" data-focus @click="remove(p.id)"><Icon name="mdiLinkOff" />Remove</button>
        </div>
        <div class="row"><button class="btn small" data-focus @click="remove('all')"><Icon name="mdiLinkVariantOff" />Remove all phones</button></div>
      </div>
      <p v-else class="muted small">No phones yet.</p>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { call, askText, ago, toast } from '../store.js';
import Toggle from '../components/Toggle.vue';
import Icon from '../components/Icon.vue';
import QrCode from '../components/QrCode.vue';

const s = reactive({ enabled: false, name: '', phones: [], online: 0, addresses: [], port: 47280 });
const qr = ref({ url: '' });
const addr = computed(() => (s.addresses?.[0] ? `${s.addresses[0]}:${s.port}` : ''));

async function refresh() { Object.assign(s, await call('remote:settings')); if (s.enabled && !qr.value.url) newQr(); }
async function newQr() { try { qr.value = await call('remote:qr'); } catch {} }
async function set(patch) {
  try { Object.assign(s, await call('remote:set', patch)); if (s.enabled) newQr(); } catch (e) { toast(e.message, 'error'); }
}
async function rename() {
  const v = await askText({ title: 'Device name', value: s.name, placeholder: 'Living room Deck' });
  if (v && v.trim()) set({ name: v.trim() });
}
async function remove(id) { Object.assign(s, await call('remote:phones:remove', id)); }

let off = null, timer = null;
onMounted(() => {
  refresh();
  off = window.cart.on('remote:settings', (v) => v && Object.assign(s, v));
  timer = setInterval(() => { if (s.enabled) newQr(); }, 4.5 * 60e3); // keep the QR fresh
});
onBeforeUnmount(() => { off?.(); clearInterval(timer); });
</script>

<style scoped>
.pr { display: flex; flex-direction: column; gap: 16px; }
h1 { font-size: 34px; font-weight: 700; margin: 4px 0 0; }
.lead { margin: -6px 0 0; max-width: 640px; line-height: 1.5; font-size: 14px; }
.subh { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-size: 18px; font-weight: 700; }
.connect { display: flex; gap: 24px; padding: 22px; align-items: center; flex-wrap: wrap; }
.qr-wrap { width: 210px; flex: none; }
.qr-none { aspect-ratio: 1; border-radius: 12px; display: grid; place-content: center; justify-items: center; gap: 8px; color: var(--muted); background: rgba(255, 255, 255, 0.04); }
.how { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.or { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); margin-top: 6px; }
.addr { font-size: 22px; font-weight: 600; color: var(--text); }
.mono { font-family: ui-monospace, 'JetBrains Mono', monospace; }
.small { font-size: 12.5px; }
.lbl { width: 130px; color: var(--muted); font-size: 13.5px; flex: none; }
.wrap { flex-wrap: wrap; }
.phones { display: flex; flex-direction: column; gap: 8px; }
.phone { display: flex; align-items: center; gap: 14px; padding: 12px 16px; }
.ph-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
</style>
