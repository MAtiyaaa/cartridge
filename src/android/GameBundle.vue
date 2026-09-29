<template>
  <section class="gb">
    <header class="gb-head">
      <span class="gb-ic"><Icon name="mdiPackageVariantClosed" :size="22" /></span>
      <div class="gb-t">
        <h3>{{ name }}</h3>
        <p>{{ b.count }} {{ b.count === 1 ? 'file' : 'files' }} · {{ bytes(b.size) }}</p>
      </div>
      <span class="gb-where" :class="where.tone"><Icon :name="where.icon" :size="15" />{{ where.text }}</span>
    </header>

    <ul class="gb-rows">
      <li v-for="r in rows" :key="r.cat" class="gb-row">
        <component :is="r.items.length > 1 ? 'button' : 'div'" class="gb-line" :class="{ open: open[r.cat] }" :data-focus="r.items.length > 1 ? '' : undefined" @click="r.items.length > 1 && (open[r.cat] = !open[r.cat])">
          <span class="gb-mark" :class="r.state"><Icon :name="MARK[r.state]" :size="15" /></span>
          <span class="gb-lbl"><b>{{ r.label }}</b><small v-if="r.sub">{{ r.sub }}</small></span>
          <span class="gb-size">{{ bytes(r.size) }}</span>
          <Icon v-if="r.items.length > 1" class="gb-chev" :name="open[r.cat] ? 'mdiChevronUp' : 'mdiChevronDown'" :size="20" />
        </component>
        <ul v-if="open[r.cat]" class="gb-sub">
          <li v-for="it in r.items" :key="it.rel" :class="{ off: !it.on }">
            <span class="gb-mark small" :class="it.on ? 'all' : 'none'"><Icon :name="it.on ? 'mdiCheck' : 'mdiCircleOutline'" :size="12" /></span>
            <span class="gb-n">{{ it.name }}<em v-if="it.version">{{ it.version }}</em></span>
            <span class="gb-size">{{ bytes(it.size) }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { bytes } from '../store.js';
import { emus } from './play.js';
import Icon from '../components/Icon.vue';

const props = defineProps({ ap: { type: Object, required: true }, name: String });
const open = reactive({});
const MARK = { all: 'mdiCheck', some: 'mdiCircleHalfFull', none: 'mdiCircleOutline' };
const b = computed(() => props.ap.bundle);
const device = computed(() => emus.device || 'this device');

const where = computed(() => {
  const on = b.value.onDevice, n = b.value.count;
  if (!props.ap.installed) return { tone: 'off', icon: 'mdiCloudOutline', text: `Not on ${device.value} yet` };
  if (on >= n) return { tone: 'ok', icon: 'mdiCheckCircle', text: `Installed on ${device.value}` };
  return { tone: 'part', icon: 'mdiCircleHalfFull', text: `${on} of ${n} files on ${device.value}` };
});

const state = (items) => { const on = items.filter((x) => x.on).length; return on === items.length ? 'all' : on ? 'some' : 'none'; };
const rows = computed(() => b.value.groups.map((g) => {
  const items = g.items, one = items.length === 1;
  let label, sub = '';
  if (g.cat === 'game') { label = 'Base game'; sub = one ? items[0].name : `${items.length} files`; }
  else if (g.cat === 'update') {
    const v = b.value.latest?.version;
    label = v ? `Update ${v}` : one ? 'Update' : `${items.length} updates`;
    sub = one ? '' : v ? `${items.length} update files` : '';
  } else if (g.cat === 'dlc') { label = one ? items[0].name : `${items.length} DLC files`; sub = one ? 'DLC' : ''; }
  else { label = one ? items[0].name : `${items.length} ${g.label.toLowerCase()} files`; sub = one ? g.label : ''; }
  return { cat: g.cat, label, sub, items, size: items.reduce((s, x) => s + x.size, 0), state: props.ap.installed ? state(items) : 'none' };
}));
</script>

<style scoped>
.gb { display: flex; flex-direction: column; gap: var(--s-3); max-width: 820px; padding: var(--s-4); border-radius: var(--r-lg); background: var(--s1); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); }
.gb-head { display: flex; align-items: center; gap: var(--s-3); min-width: 0; }
.gb-ic { flex: none; width: 40px; height: 40px; border-radius: var(--r-md); display: grid; place-items: center; background: var(--s3); color: var(--text); }
.gb-t { flex: 1; min-width: 0; }
.gb-t h3 { margin: 0; font: 800 var(--t-lg) var(--display); font-stretch: var(--display-stretch); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gb-t p { margin: 2px 0 0; font-size: var(--t-xs); color: var(--muted); }
.gb-where { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: var(--r-sm); font-size: var(--t-xs); font-weight: 700; white-space: nowrap; background: var(--s3); color: var(--muted); }
.gb-where.ok { background: rgba(63, 185, 80, 0.16); color: var(--green-l); }
.gb-where.part { background: rgba(255, 211, 92, 0.14); color: var(--gold); }

.gb-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--s-1); }
.gb-line { width: 100%; display: flex; align-items: center; gap: var(--s-3); min-height: 48px; padding: 6px var(--s-3); border-radius: var(--r-md); background: var(--s2); text-align: left; color: var(--text); font: inherit; transition: background var(--d-fast), color var(--d-fast); }
button.gb-line:hover { background: var(--s3); }
button.gb-line:focus-visible, .pad-mode button.gb-line:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; }
.gb-mark { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--s3); color: var(--dim); }
.gb-mark.all { background: var(--green); color: #07140a; }
.gb-mark.some { background: var(--gold); color: #2b2100; }
.gb-mark.small { width: 18px; height: 18px; }
.gb-lbl { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.gb-lbl b { font-size: var(--t-md); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gb-lbl small { font-size: var(--t-xs); opacity: 0.65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gb-size { flex: none; font-size: var(--t-sm); font-variant-numeric: tabular-nums; opacity: 0.7; }
.gb-chev { flex: none; opacity: 0.7; }

.gb-sub { list-style: none; margin: var(--s-1) 0 var(--s-2) 36px; padding: 0 0 0 var(--s-3); border-left: 2px solid var(--s3); display: flex; flex-direction: column; gap: 2px; animation: gb-in var(--d-med) var(--ease) both; }
@keyframes gb-in { from { opacity: 0; transform: translateY(-4px); } }
.gb-sub li { display: flex; align-items: center; gap: var(--s-3); min-height: 34px; font-size: var(--t-sm); }
.gb-sub li.off { opacity: 0.55; }
.gb-n { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gb-n em { font-style: normal; margin-left: 8px; padding: 1px 7px; border-radius: var(--r-sm); background: var(--s3); color: var(--muted); font-size: var(--t-xs); font-weight: 600; }
</style>
