<template>
  <div class="rp glass">
    <div class="rp-top">
      <Icon name="mdiBugOutline" :size="22" />
      <div style="min-width: 0">
        <b>Report a problem</b>
        <div class="muted small">Your setup, with personal details taken out, ready for a GitHub issue. Read it first; nothing is sent until you choose to.</div>
      </div>
      <div class="spacer" />
      <button v-if="!report" class="btn small" data-focus :disabled="busy" @click="load"><Icon name="mdiFileDocumentOutline" :size="18" />Show report</button>
    </div>
    <template v-if="report">
      <pre class="rp-text" tabindex="0" data-focus>{{ report }}</pre>
      <div class="row" style="flex-wrap: wrap">
        <button class="btn small" data-focus @click="copy"><Icon name="mdiContentCopy" :size="18" />Copy</button>
        <button class="btn small primary" data-focus @click="open"><Icon name="mdiGithub" :size="18" />Open a GitHub issue</button>
        <button class="btn small" data-focus @click="showQr"><Icon name="mdiQrcode" :size="18" />QR code for your phone</button>
      </div>
      <div v-if="qr" class="rp-qr"><div class="qr" v-html="qr" /><span class="muted small">Scan to open the issue page on your phone. The report is long, so the phone gets its first part; Copy has all of it.</span></div>
    </template>
  </div>
</template>

<script setup>
// Settings → About (0.9.3 K3): the setup report (already scrubbed by steamManager.setupReport),
// copied or opened as a new GitHub issue. In Game Mode a browser is awkward: a QR code instead.
import { ref } from 'vue';
import { call, toast } from '../store.js';
import Icon from './Icon.vue';

const ISSUES = 'https://github.com/MAtiyaaa/cartridge/issues/new'; // this fork's builds report here
const report = ref('');
const busy = ref(false);
const qr = ref('');
async function load() {
  busy.value = true;
  // Android: its own report (device, WebView, emulators per console); the desktop one is about Steam
  try { report.value = import.meta.env.MODE === 'android' ? await (await import('../android/report.js')).androidReport() : await call('setup:report'); } catch (e) { toast(e.message, 'error'); }
  busy.value = false;
}
// GitHub's new issue link, with the report filled in (links stay short enough to open)
function issueUrl(max = 6000) {
  const body = `**What happened**\n\n\n**What you expected**\n\n\n**Setup report**\n\`\`\`\n${report.value.slice(0, max)}${report.value.length > max ? '\n(cut short: paste the rest from Copy)' : ''}\n\`\`\`\n`;
  return `${ISSUES}?title=${encodeURIComponent('Problem: ')}&body=${encodeURIComponent(body)}`;
}
async function copy() { try { await call('clip:write', { text: report.value }); toast('Report copied', 'ok', 2200, 'mdiContentCopy'); } catch (e) { toast(e.message, 'error'); } }
async function open() {
  if (import.meta.env.MODE === 'android') { const { Native } = await import('../android/native.js'); Native.openUrl({ url: issueUrl() }).catch((e) => toast(e.message, 'error')); return; } // the WebView can't open a browser tab
  window.open(issueUrl(), '_blank'); toast('Opening GitHub in your browser', 'info', 2600, 'mdiGithub'); }
async function showQr() {
  const QRCode = (await import('qrcode')).default;
  qr.value = await QRCode.toString(issueUrl(1200), { type: 'svg', margin: 1, errorCorrectionLevel: 'L', color: { dark: '#000000', light: '#ffffff' } });
}
</script>

<style scoped>
.rp { display: flex; flex-direction: column; gap: var(--s-3); padding: var(--s-4) var(--s-5); }
.rp-top { display: flex; align-items: center; gap: var(--s-3); }
.rp-top .spacer { flex: 1; }
.small { font-size: var(--t-sm); }
.rp-text { margin: 0; max-height: 280px; overflow: auto; padding: var(--s-3); border-radius: var(--r-md); background: var(--s0); font-size: var(--t-xs); white-space: pre-wrap; word-break: break-word; outline: none; }
.rp-text:focus { box-shadow: var(--ring); }
.rp-qr { display: flex; align-items: center; gap: var(--s-4); }
.rp-qr .qr { width: 220px; flex: none; background: #fff; border-radius: var(--r-md); padding: 8px; }
.rp-qr .qr :deep(svg) { display: block; width: 100%; height: auto; }
</style>
