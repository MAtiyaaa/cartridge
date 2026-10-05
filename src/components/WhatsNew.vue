<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog wn">
      <div class="wn-head">
        <div style="min-width: 0">
          <div class="eyebrow">What’s New</div>
          <h2>Cartridge {{ cur?.title }}</h2>
        </div>
        <div class="wn-nav"><Btn b="LB" /><span class="muted small">{{ i + 1 }} of {{ versions.length }}</span><Btn b="RB" /></div>
      </div>
      <div class="wn-body" data-scroll ref="body">
        <template v-for="(b, k) in cur?.blocks || []" :key="i + ':' + k">
          <div v-if="b.h" class="cl-h">{{ b.h }}</div>
          <ul v-else class="cl-list"><li v-for="(it, j) in b.items" :key="j" :class="{ sub: it.sub }" v-html="it.html" /></ul>
        </template>
      </div>
      <div class="row" style="justify-content: flex-end">
        <button class="btn" data-focus :disabled="i === versions.length - 1" @click="step(1)"><Icon name="mdiChevronLeft" />Older</button>
        <button class="btn" data-focus :disabled="i === 0" @click="step(-1)">Newer<Icon name="mdiChevronRight" /></button>
        <button class="btn primary" data-focus data-autofocus @click="closeModal(null)">Done</button>
      </div>
    </div>
  </div>
</template>
<script setup>
// Settings → Updates → What's New (0.9.24, owner: open it and see everything): every version from CHANGELOG.md,
// built into the app, newest first; LB/RB or the buttons move between versions
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal } from '../store.js';
import log from '../../CHANGELOG.md?raw';
import Icon from './Icon.vue';
import Btn from './Btn.vue';
const el = ref(null), body = ref(null), i = ref(0);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const versions = computed(() => {
  const out = [];
  for (const line of log.split('\n')) {
    const v = /^##\s+Cartridge\s+(.+)$/.exec(line);
    if (v) { out.push({ title: v[1].trim(), blocks: [] }); continue; }
    const cur = out[out.length - 1]; if (!cur) continue;
    const h = /^###\s+(.+)/.exec(line);
    if (h) { cur.blocks.push({ h: h[1] }); continue; }
    const li = /^(\s*)-\s+(.+)/.exec(line); if (!li) continue;
    if (!cur.blocks.length || cur.blocks[cur.blocks.length - 1].h) cur.blocks.push({ items: [] });
    cur.blocks[cur.blocks.length - 1].items.push({ html: inline(li[2]), sub: li[1].length > 0 });
  }
  return out;
});
const cur = computed(() => versions.value[i.value]);
function step(d) { const n = i.value + d; if (n < 0 || n >= versions.value.length) return; i.value = n; if (body.value) body.value.scrollTop = 0; }
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb: () => step(-1), rb: () => step(1), x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.wn { width: min(880px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-3); }
.wn-head { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--s-4); }
.wn-head h2 { margin: 2px 0 0; font-size: var(--t-xl); }
.wn-nav { display: flex; align-items: center; gap: 8px; }
.wn-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-right: 6px; }
.cl-h { font-weight: 700; margin: var(--s-3) 0 var(--s-1); text-transform: uppercase; letter-spacing: 0.06em; font-size: var(--t-xs); color: var(--muted); }
.cl-list { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: 6px; line-height: 1.45; }
.cl-list li.sub { margin-left: 1.2em; list-style: circle; }
</style>
