<template>
  <div class="cl glass">
    <div class="cl-head"><b>What's new in {{ title }}</b></div>
    <div class="cl-body" data-scroll>
      <template v-for="(b, i) in blocks" :key="i">
        <div v-if="b.h" class="cl-h">{{ b.h }}</div>
        <ul v-else class="cl-list"><li v-for="(it, j) in b.items" :key="j" :class="{ sub: it.sub }" v-html="it.html" /></ul>
      </template>
    </div>
  </div>
</template>

<script setup>
// This version's notes (0.9.17, owner: a card with the latest changes), from RELEASE_NOTES.md built
// into the app: "### New" headings and "- **Lead.** text" items, nothing else of Markdown is needed
import { computed } from 'vue';
import notes from '../../RELEASE_NOTES.md?raw';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const title = computed(() => (/^##\s+Cartridge\s+(.+)$/m.exec(notes) || [])[1]?.replace(/\s+·\s+/, ' · ') || 'this version');
const blocks = computed(() => {
  const out = [];
  for (const line of notes.split('\n')) {
    const h = /^###\s+(.+)/.exec(line);
    if (h) { out.push({ h: h[1] }); continue; }
    const li = /^(\s*)-\s+(.+)/.exec(line);
    if (!li) continue;
    if (!out.length || out[out.length - 1].h) out.push({ items: [] });
    out[out.length - 1].items.push({ html: inline(li[2]), sub: li[1].length > 0 });
  }
  return out;
});
</script>

<style scoped>
.cl { padding: var(--s-4) var(--s-5); display: flex; flex-direction: column; gap: var(--s-3); }
.cl-head b { font-family: var(--display); font-size: var(--t-lg); }
.cl-body { max-height: 46vh; overflow-y: auto; padding-right: 6px; }
.cl-h { font-weight: 700; margin: var(--s-3) 0 var(--s-1); text-transform: uppercase; letter-spacing: 0.06em; font-size: var(--t-xs); color: var(--muted); }
.cl-list { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: 6px; line-height: 1.45; }
.cl-list li.sub { margin-left: 1.2em; list-style: circle; }
</style>
