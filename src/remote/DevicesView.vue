<template>
  <section class="dv">
    <div class="dv-scroll">
      <article v-for="d in list" :key="d.id" class="dv-card" :class="{ sel: d.id === hub.selected, off: !d.online, unpaired: !d.token }">
        <div class="dv-top">
          <div class="dv-ic"><Icon :name="kindIcon(d.kind)" :size="26" /></div>
          <div class="dv-id">
            <b>{{ d.name }}</b>
            <small><i class="dv-dot" :class="{ on: d.online }" />{{ d.online ? `${kindLabel(d.kind)} · ${d.address}` : `Offline${d.lastSeen ? ', last seen ' + ago(d.lastSeen) : ''}` }}</small>
          </div>
          <span v-if="d.token && d.info?.battery" class="dv-bat" :class="{ low: d.info.battery.level <= 20 && !d.info.battery.charging }">
            <Icon :name="batteryIcon(d.info.battery)" :size="18" />{{ d.info.battery.level }}%
          </span>
        </div>

        <template v-if="d.token">
          <div v-if="d.info?.downloading" class="dv-now">
            <div class="dv-now-t"><Icon name="mdiDownload" :size="15" /><span>{{ d.info.downloading.name }}</span><em>{{ pct(d.info.downloading) }}%</em></div>
            <i class="dv-bar"><b :style="{ width: pct(d.info.downloading) + '%' }" /></i>
            <small v-if="d.info.downloading.count > 1 || queueLeft(d.dls).time">{{ d.info.downloading.count > 1 ? `${d.info.downloading.count - 1} more queued` : '' }}{{ d.info.downloading.count > 1 && queueLeft(d.dls).time ? ' · ' : '' }}{{ queueLeft(d.dls).time ? `about ${queueLeft(d.dls).time} left for everything` : '' }}</small>
          </div>

          <div v-if="d.info?.storage?.length" class="dv-st">
            <div v-for="s in d.info.storage" :key="s.path" class="dv-disk">
              <div class="dv-disk-t"><Icon name="mdiHarddisk" :size="15" /><span class="dv-p">{{ s.path }}</span><em>{{ bytes(s.free) }} free</em></div>
              <i class="dv-bar thin" :class="{ warn: s.free / s.total < 0.1 }"><b :style="{ width: Math.round((1 - s.free / s.total) * 100) + '%' }" /></i>
            </div>
          </div>

          <div class="dv-acts">
            <button v-if="d.id !== hub.selected" class="dv-btn primary" :disabled="!d.online" @click="select(d.id)"><Icon name="mdiGestureTap" :size="17" />Use this device</button>
            <span v-else class="dv-btn ghost"><Icon name="mdiCheck" :size="17" />In use</span>
            <button class="dv-btn" :class="{ danger: confirming === d.id }" @click="drop(d)">
              <Icon name="mdiLanDisconnect" :size="17" />{{ confirming === d.id ? 'Tap to confirm' : 'Disconnect' }}
            </button>
          </div>
        </template>
        <div v-else class="dv-acts">
          <button class="dv-btn primary" :disabled="!d.online" @click="$emit('connect', d)"><Icon name="mdiLinkVariant" :size="17" />Connect</button>
        </div>
      </article>

      <button class="dv-add" @click="$emit('add')"><Icon name="mdiPlus" :size="20" />Add a device by address</button>
      <p class="dv-foot">This phone appears as <b>{{ phoneName }}</b>. Devices can remove it from Settings → Phone remote.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { bytes, ago, toast, queueLeft } from '../store.js';
import { hub, phoneName, select, disconnect, kindIcon, kindLabel, batteryIcon, pct } from './hub.js';
import Icon from '../components/Icon.vue';

defineEmits(['connect', 'add']);
const list = computed(() => Object.values(hub.devices).sort((a, b) => (b.token ? 1 : 0) - (a.token ? 1 : 0) || (a.id === hub.selected ? -1 : b.id === hub.selected ? 1 : 0) || a.name.localeCompare(b.name)));

const confirming = ref('');
let t;
async function drop(d) {
  if (confirming.value !== d.id) { confirming.value = d.id; clearTimeout(t); t = setTimeout(() => { confirming.value = ''; }, 3000); return; }
  confirming.value = '';
  await disconnect(d.id);
  toast(`Disconnected from ${d.name}`, 'info', 2400, 'mdiLanDisconnect');
}
</script>

<style scoped>
.dv { display: flex; flex-direction: column; }
.dv-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 24px; display: flex; flex-direction: column; gap: 12px; }
.dv-card { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 22px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line); transition: border-color 0.2s, background 0.2s; }
.dv-card.sel { background: rgba(var(--primary-rgb), 0.1); border-color: rgba(var(--primary-l-rgb), 0.4); }
.dv-card.unpaired { border-style: dashed; }
.dv-card.off { opacity: 0.65; }
.dv-top { display: flex; align-items: center; gap: 12px; }
.dv-ic { flex: none; width: 48px; height: 48px; border-radius: 15px; display: grid; place-items: center; color: var(--primary-t); background: rgba(var(--primary-rgb), 0.2); }
.dv-id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dv-id b { font: 700 17px var(--display); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv-id small { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--dim); }
.dv-dot.on { background: var(--green); box-shadow: 0 0 8px var(--green); }
.dv-bat { flex: none; display: inline-flex; align-items: center; gap: 3px; font: 600 13px var(--body); font-variant-numeric: tabular-nums; color: #dfe3ea; }
.dv-bat.low { color: #ffa39c; }
.dv-now { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 14px; background: rgba(0, 0, 0, 0.25); }
.dv-now-t { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--primary-t); }
.dv-now-t span { flex: 1; min-width: 0; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv-now-t em { font-style: normal; font-variant-numeric: tabular-nums; font-weight: 600; }
.dv-now small { font-size: 11.5px; color: var(--muted); }
.dv-bar { display: block; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
.dv-bar.thin { height: 4px; }
.dv-bar b { display: block; height: 100%; background: var(--grad); transition: width 0.4s; }
.dv-bar.warn b { background: #ff6b61; }
.dv-st { display: flex; flex-direction: column; gap: 10px; }
.dv-disk { display: flex; flex-direction: column; gap: 6px; }
.dv-disk-t { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
.dv-p { flex: 1; min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; color: #cfd3dd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv-disk-t em { font-style: normal; font-variant-numeric: tabular-nums; }
.dv-acts { display: flex; gap: 8px; }
.dv-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border-radius: 999px; background: rgba(255, 255, 255, 0.07); border: 1px solid var(--line-2); color: var(--text); font: 600 13.5px var(--body); transition: background 0.2s, color 0.2s, transform 0.15s; }
.dv-btn:active { transform: scale(0.97); }
.dv-btn.primary { background: var(--grad); border-color: transparent; color: var(--on-primary); }
.dv-btn.ghost { color: var(--primary-t); background: none; border-color: rgba(var(--primary-l-rgb), 0.35); }
.dv-btn.danger { background: rgba(255, 107, 97, 0.18); border-color: rgba(255, 107, 97, 0.5); color: #ffb3ad; }
.dv-btn:disabled { opacity: 0.45; }
.dv-add { display: flex; align-items: center; justify-content: center; gap: 8px; height: 52px; border-radius: 18px; border: 1px dashed var(--line-2); color: var(--muted); font: 600 14px var(--body); }
.dv-foot { margin: 4px 4px 0; font-size: 12.5px; line-height: 1.5; color: var(--dim); text-align: center; }
.dv-foot b { color: var(--muted); font-weight: 600; }
</style>
