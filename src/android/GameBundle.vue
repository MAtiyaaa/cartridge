<template>
  <section class="gb">
    <div class="shelf-title">In this game<span class="count">{{ b.count }} files · {{ bytes(b.size) }}</span></div>
    <span class="status gb-where" :class="where.tone"><Icon :name="where.icon" :size="14" />{{ where.text }}</span>
    <div class="stack">
      <template v-for="r in rows" :key="r.cat">
        <component :is="r.items.length > 1 ? 'button' : 'div'" class="lrow" :data-focus="r.items.length > 1 ? '' : undefined" @click="r.items.length > 1 && (open[r.cat] = !open[r.cat])">
          <Icon :name="ICON[r.cat] || 'mdiFileOutline'" :size="24" />
          <div class="l-mid"><b>{{ r.label }}</b><span v-if="r.sub" class="l-sub">{{ r.sub }}</span></div>
          <span class="l-end">
            {{ bytes(r.size) }}
            <span v-if="ap.installed" class="status" :class="r.tone">{{ r.have }}</span>
            <Icon v-if="r.items.length > 1" :name="open[r.cat] ? 'mdiChevronUp' : 'mdiChevronDown'" :size="20" />
          </span>
        </component>
        <div v-if="open[r.cat]" class="gb-files">
          <div v-for="it in r.items" :key="it.rel" class="gb-file" :class="{ off: ap.installed && !it.on }">
            <Icon :name="ap.installed && it.on ? 'mdiCheck' : 'mdiMinus'" :size="16" />
            <span class="gb-n">{{ it.name }}</span>
            <span v-if="it.version" class="gb-v">{{ it.version }}</span>
            <span class="gb-s">{{ bytes(it.size) }}</span>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { bytes } from '../store.js';
import { emus } from './play.js';
import Icon from '../components/Icon.vue';

const props = defineProps({ ap: { type: Object, required: true } });
const open = reactive({});
const ICON = { game: 'mdiDisc', update: 'mdiUpdate', dlc: 'mdiPuzzleOutline', patch: 'mdiBandage', mod: 'mdiWrenchOutline' };
const b = computed(() => props.ap.bundle);
const device = computed(() => emus.device || 'this device');

const where = computed(() => {
  const on = b.value.onDevice, n = b.value.count;
  if (!props.ap.installed) return { tone: 'none', icon: 'mdiCloudOutline', text: 'On your RomM server' };
  if (on >= n) return { tone: 'ok', icon: 'mdiCheck', text: `Installed on ${device.value}` };
  return { tone: 'warn', icon: 'mdiCircleHalfFull', text: `${on} of ${n} files on ${device.value}` };
});

const rows = computed(() => b.value.groups.map((g) => {
  const items = g.items, one = items.length === 1, on = items.filter((x) => x.on).length;
  let label, sub = '';
  if (g.cat === 'game') { label = 'Base game'; sub = one ? items[0].name : `${items.length} files`; }
  else if (g.cat === 'update') { const v = b.value.latest?.version; label = v ? `Update ${v}` : 'Update'; sub = one ? items[0].name : `${items.length} update files`; }
  else if (g.cat === 'dlc') { label = one ? items[0].name : `${items.length} DLC`; sub = one ? 'DLC' : items.slice(0, 2).map((x) => x.name).join(', ') + (items.length > 2 ? '…' : ''); }
  else { label = one ? items[0].name : `${items.length} ${g.label.toLowerCase()} files`; sub = one ? g.label : ''; }
  const tone = on === items.length ? 'ok' : on ? 'warn' : 'none';
  const have = on === items.length ? 'On device' : on ? `${on} of ${items.length}` : 'Not downloaded';
  return { cat: g.cat, label, sub, items, size: items.reduce((s, x) => s + x.size, 0), tone, have };
}));
</script>

<style scoped>
.gb { display: flex; flex-direction: column; gap: var(--s-3); margin-bottom: var(--s-6); }
.gb .shelf-title { margin: 0; }
.gb-where { align-self: flex-start; }
.lrow > .icon { flex: none; color: var(--muted); }
.lrow:focus > .icon { color: var(--on-focus); }
.gb-files { display: flex; flex-direction: column; padding: 0 var(--s-4) var(--s-2) 56px; }
.gb-file { display: flex; align-items: center; gap: var(--s-3); min-height: 34px; font-size: var(--t-sm); }
.gb-file > .icon { flex: none; color: var(--green-l); }
.gb-file.off { color: var(--muted); }
.gb-file.off > .icon { color: var(--dim); }
.gb-n { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gb-v { flex: none; font-size: var(--t-xs); color: var(--muted); }
.gb-s { flex: none; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
