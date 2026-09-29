<template>
  <section class="dd">
    <div class="dd-scroll">
      <div v-if="!groups.length" class="dd-empty">
        <Icon name="mdiTrayArrowDown" :size="36" />
        <p>No devices connected</p>
      </div>
      <div v-for="g in groups" :key="g.d.id" class="dd-group">
        <header class="dd-h">
          <div class="dd-ic"><Icon :name="kindIcon(g.d.kind)" :size="20" /></div>
          <div class="dd-hb">
            <b>{{ g.d.name }}</b>
            <small>
              <template v-if="!g.d.online">Offline</template>
              <template v-else-if="g.active">{{ g.active }} active<template v-if="g.all.time"> · {{ g.all.time }} left</template></template>
              <template v-else>Idle</template>
              <template v-if="g.d.info?.battery"> · <Icon :name="batteryIcon(g.d.info.battery)" :size="12" />{{ g.d.info.battery.level }}%</template>
            </small>
          </div>
          <button v-if="g.active" class="dd-clear" @click="act(g.d, 'dl:pauseAll')"><Icon name="mdiPause" :size="15" />Pause all</button>
          <button v-else-if="g.paused" class="dd-clear" @click="act(g.d, 'dl:resumeAll')"><Icon name="mdiPlay" :size="15" />Resume all</button>
          <button v-if="g.finished" class="dd-clear" @click="clear(g.d)">Clear finished</button>
        </header>

        <div v-if="!g.items.length" class="dd-none">Nothing in the queue</div>
        <TransitionGroup name="dd-l" tag="div" class="dd-list">
          <div v-for="it in g.items" :key="it.id" class="dd-it" :class="it.status">
            <div class="dd-cov"><img v-if="imgOn(g.d, it.cover)" :src="imgOn(g.d, it.cover)" alt="" loading="lazy" /></div>
            <div class="dd-b">
              <b>{{ it.name }}</b>
              <small>{{ line(it) }}</small>
              <i v-if="it.status === 'downloading' || it.status === 'queued'" class="dd-bar"><em :style="{ width: pct(it) + '%' }" /></i>
            </div>
            <template v-if="it.status === 'queued' && g.queued > 1">
              <button class="dd-act small" aria-label="Move up" :disabled="it === g.firstQueued" @click="act(g.d, 'dl:move', { id: it.id, dir: -1 })"><Icon name="mdiChevronUp" :size="18" /></button>
              <button class="dd-act small" aria-label="Move down" :disabled="it === g.lastQueued" @click="act(g.d, 'dl:move', { id: it.id, dir: 1 })"><Icon name="mdiChevronDown" :size="18" /></button>
            </template>
            <button v-if="it.status === 'downloading' || it.status === 'queued'" class="dd-act" aria-label="Cancel" @click="act(g.d, 'dl:cancel', it.id)"><Icon name="mdiClose" :size="18" /></button>
            <button v-else-if="it.status === 'error' || it.status === 'cancelled'" class="dd-act" aria-label="Retry" @click="act(g.d, 'dl:retry', it.id)"><Icon name="mdiRefresh" :size="18" /></button>
            <span v-else-if="it.status === 'done'" class="dd-ok"><Icon name="mdiCheck" :size="18" /></span>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { bytes, toast, queueLeft, itemLeft } from '../store.js';
import { hub, pairedDevices, callOn, kindIcon, batteryIcon, pct, imgOn } from './hub.js';
import Icon from '../components/Icon.vue';

const ORDER = { downloading: 0, queued: 1, error: 2, paused: 2, cancelled: 3, done: 4 };
const groups = computed(() => pairedDevices.value
  .slice()
  .sort((a, b) => (a.id === hub.selected ? -1 : b.id === hub.selected ? 1 : a.name.localeCompare(b.name)))
  .map((d) => {
    // waiting games keep the device's queue order (they can be moved); finished ones newest first
    const items = (d.dls || []).slice().sort((a, b) => (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5) || (a.status === 'queued' ? 0 : b.addedAt - a.addedAt));
    const waiting = items.filter((x) => x.status === 'queued');
    return {
      d, items,
      all: queueLeft(items),
      queued: waiting.length, firstQueued: waiting[0], lastQueued: waiting[waiting.length - 1],
      paused: items.some((x) => x.status === 'cancelled'),
      active: items.filter((x) => x.status === 'downloading' || x.status === 'queued').length,
      finished: items.some((x) => !['downloading', 'queued'].includes(x.status)),
    };
  }));

function line(it) {
  if (it.status === 'downloading') return `${pct(it)}% · ${bytes(it.received)} of ${bytes(it.total)}${it.speed ? ` · ${bytes(it.speed)}/s` : ''}${itemLeft(it) ? ` · ${itemLeft(it)} left` : ''}`;
  if (it.status === 'queued') return `${it.notice === 'waiting' ? 'Waiting for the server' : 'Queued'} · ${bytes(it.total)}`;
  if (it.status === 'error') return it.error || 'Failed';
  if (it.status === 'cancelled') return 'Cancelled';
  if (it.status === 'paused') return 'Paused';
  return `${it.platformName || ''}${it.platformName ? ' · ' : ''}${bytes(it.total)}`;
}
async function act(d, ch, id) {
  try { await callOn(d.id, ch, id); d.dls = await callOn(d.id, 'dl:list'); }
  catch (e) { toast(e.message, 'error', 3500); }
}
const clear = (d) => act(d, 'dl:clear');
</script>

<style scoped>
.dd { display: flex; flex-direction: column; }
.dd-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 24px; display: flex; flex-direction: column; gap: 22px; }
.dd-h { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.dd-ic { flex: none; width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: var(--primary-t); background: rgba(var(--primary-rgb), 0.18); }
.dd-hb { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dd-hb b { font: 700 16px var(--display); }
.dd-hb small { display: inline-flex; align-items: center; gap: 3px; color: var(--muted); font-size: 12.5px; font-variant-numeric: tabular-nums; }
.dd-clear { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); color: var(--text); font: 600 12px var(--body); }
.dd-list { display: flex; flex-direction: column; gap: 8px; }
.dd-none { padding: 16px; border-radius: 16px; border: 1px dashed var(--line-2); color: var(--dim); font-size: 13px; text-align: center; }
.dd-it { display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 10px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line); }
.dd-it.done, .dd-it.cancelled { opacity: 0.7; }
.dd-cov { flex: none; width: 42px; height: 56px; border-radius: 8px; overflow: hidden; background: linear-gradient(160deg, #26262b, #151518); }
.dd-cov img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dd-b { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.dd-b b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-b small { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-it.error small { color: #ffa39c; }
.dd-bar { display: block; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.08); overflow: hidden; margin-top: 2px; }
.dd-bar em { display: block; height: 100%; background: var(--grad); transition: width 0.4s; }
.dd-act { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.07); color: var(--text); }
.dd-act:active { transform: scale(0.94); }
.dd-act.small { width: 32px; height: 32px; background: rgba(255, 255, 255, 0.04); }
.dd-act:disabled { opacity: 0.3; }
.dd-ok { flex: none; width: 38px; display: grid; place-items: center; color: var(--green-l); }
.dd-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 70px 20px; color: var(--muted); }
.dd-empty p { margin: 0; font-size: 14px; }
.dd-l-enter-active, .dd-l-leave-active { transition: opacity 0.25s, transform 0.25s var(--ease); }
.dd-l-enter-from, .dd-l-leave-to { opacity: 0; transform: translateX(-12px); }
</style>
