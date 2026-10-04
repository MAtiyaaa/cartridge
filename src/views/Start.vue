<template>
  <div class="start" :class="{ editing, dragging: !!drag, sizing: !!sizing || mode === 'size' }" ref="el">
    <div v-if="editing" class="st-edit-bar">
      <b>Arrange Start</b>
      <span class="muted">{{ barText }}</span>
      <div class="spacer" />
      <button class="btn small" data-focus data-key="st-reset" @click="resetLayout"><Icon name="mdiRestore" :size="18" />Reset</button>
      <button class="btn small primary" data-focus data-key="st-done" @click="stopEdit"><Icon name="mdiCheck" :size="18" />Done</button>
    </div>
    <div class="st-scroll" data-scroll ref="scroller">
      <div class="st-board" :style="{ height: boardH + 'px' }">
        <!-- arranging: the grid's empty cells show, and where the held tile will land -->
        <div v-if="editing" class="st-slots" aria-hidden="true"><i v-for="c in slots" :key="c.k" :style="c.s" /></div>
        <div v-if="ghost" class="st-ghost" :style="ghost" aria-hidden="true" />

        <button v-for="(t, n) in tiles" :key="t.id" class="st-tile" :class="['t-' + t.type, { picked: mode === 'move' && focusedId === t.id, held: drag?.id === t.id, resized: sizing?.id === t.id || (mode === 'size' && focusedId === t.id), art: isArt(t), leaving: leaving === t.id }]"
          :style="tileStyle(t, n)" data-focus :data-key="'tile-' + t.id" :data-id="t.id" :data-hold="editing ? null : ''"
          @click="openTile(t, $event)" @focus="focusTile(t)" @cart-hold="startEdit(t)" @pointerdown="pDown(t, $event)" @contextmenu.prevent>
          <div class="st-face">

          <!-- Continue playing: the game you played last, its art, logo and when -->
          <template v-if="t.type === 'continue'">
            <template v-if="cur">
              <div class="st-art" :style="{ backgroundImage: bgUrl(artOf(cur)) }" />
              <div class="st-scrim" />
              <div class="st-label on-art">Continue playing</div>
              <div class="st-cp">
                <GameLogo :logo="store.config.ui.logos !== false ? logoOf(cur) : null" :name="cur.name" cls="st-cp-name" :area="Math.min(30000, box(t).pw * box(t).ph * 0.11)" :max-w="Math.min(420, box(t).pw * 0.72)" :max-h="Math.min(120, box(t).ph * 0.3)" />
                <span class="st-cp-when">{{ whenText(cur) }}</span>
                <span v-if="box(t).ph >= 230 && box(t).pw >= 200" class="st-cp-go"><Btn b="A" />{{ store.installed[cur.id] ? 'Continue' : 'Open' }}</span>
              </div>
              <div v-if="playing.length > 1 && box(t).pw >= 280" class="st-dots"><i v-for="(g, i) in playing.slice(0, 5)" :key="g.id" :class="{ on: i === cpIndex }" /></div>
            </template>
            <div v-else class="st-empty"><Icon name="mdiPlayCircleOutline" :size="30" /><b>Nothing played yet</b><span>Games you play show here</span></div>
          </template>

          <!-- Clock: a scene for the time of day -->
          <StartClock v-else-if="t.type === 'clock'" :time="now.time" :ampm="now.ampm" :day="now.dayLine" :hour="now.hour" />

          <!-- Storage: free space on the drive the games live on, and a gauge of how much is left -->
          <template v-else-if="t.type === 'storage'">
            <div class="st-store">
              <div class="st-store-text">
                <div class="st-label">Free space</div>
                <div class="st-num"><span class="st-big tnum">{{ space ? sizeNum(space.free) : '–' }}</span><span class="st-unit">{{ space ? sizeUnit(space.free) : '' }}</span></div>
                <div class="st-sub">{{ space ? `of ${bytes(space.total)}` : 'Looking…' }}</div>
              </div>
              <div class="st-gauge" :class="{ low: freePct < 10 }">
                <svg viewBox="0 0 100 100" aria-hidden="true"><line v-for="k in GAUGE" :key="k.i" :x1="k.x1" :y1="k.y1" :x2="k.x2" :y2="k.y2" :class="{ on: space && k.i < freePct / 100 * GAUGE.length }" :style="{ '--i': k.i }" /></svg>
                <span class="tnum">{{ space ? Math.round(freePct) : '' }}<small v-if="space">%</small></span>
              </div>
            </div>
          </template>

          <!-- This week: the total, the day you played most, and a bar for each day (today in white) -->
          <template v-else-if="t.type === 'week'">
            <div class="st-week">
              <div class="st-week-text">
                <div class="st-label">Played this week</div>
                <div class="st-num">
                  <template v-if="weekMin >= 60"><span class="st-big tnum">{{ Math.floor(weekMin / 60) }}</span><span class="st-unit">h</span><template v-if="weekMin % 60"><span class="st-big tnum">{{ weekMin % 60 }}</span><span class="st-unit">m</span></template></template>
                  <template v-else><span class="st-big tnum">{{ weekMin }}</span><span class="st-unit">min</span></template>
                </div>
                <div class="st-sub">{{ weekNote }}</div>
              </div>
              <div class="st-bars">
                <div v-for="(d, i) in week" :key="d.day" class="st-bar" :class="{ today: i === week.length - 1, none: !d.min }" :style="{ '--i': i }">
                  <div class="st-col">
                    <i :style="{ height: d.min ? barH(d.min) + '%' : null }" />
                    <em v-if="i === week.length - 1 && d.min" :style="{ bottom: barH(d.min) + '%' }">{{ shortMin(d.min) }}</em>
                  </div>
                  <span>{{ DOW[d.dow] }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Consoles: the same cards as the Consoles page, as many as fit -->
          <template v-else-if="t.type === 'consoles'">
            <div class="st-label">Consoles</div>
            <div class="st-cards" :style="cardsGrid(t)">
              <ConsoleCard v-for="p in consoles.slice(0, cardsFor(t).n)" :key="p.id" :p="p" :compact="cardsFor(t).compact" />
            </div>
          </template>

          <!-- Rows of covers: new, recently played, favourites, recommended -->
          <template v-else-if="COVER_ROWS[t.type]">
            <div v-if="rowOf(t.type).length" class="st-ambient" :style="{ backgroundImage: bgUrl(cover(rowOf(t.type)[0])) }" />
            <div class="st-label">{{ TILES[t.type].name }}</div>
            <template v-if="rowOf(t.type).length">
              <div class="st-covers" :style="{ gridTemplateRows: `repeat(${coversFor(t).rows}, minmax(0, 1fr))` }">
                <img v-for="(r, i) in rowOf(t.type).slice(0, coversFor(t).n)" :key="r.id" class="st-cover" :src="cover(r)" :style="{ '--i': i }" loading="lazy" alt="" />
              </div>
              <div class="st-sub st-first">{{ firstLine(t.type) }}</div>
            </template>
            <div v-else class="st-empty small"><span>{{ COVER_ROWS[t.type].empty }}</span></div>
          </template>

          <!-- Latest trophies and achievements: as many as the tile holds -->
          <template v-else-if="t.type === 'trophies'">
            <div class="st-label">Latest trophies</div>
            <div v-if="ach.length" class="st-ach" :style="{ gridTemplateColumns: `repeat(${achFor(t).cols}, minmax(0, 1fr))` }">
              <div v-for="(a, i) in ach.slice(0, achFor(t).n)" :key="a.key" class="st-ach-row" :style="{ '--i': i }">
                <img v-if="a.badge" :src="a.badge" class="st-ach-img" alt="" /><span v-else class="st-ach-img"><Grade :g="a.grade" :size="24" /></span>
                <span class="st-ach-t"><b>{{ a.title }}</b><span>{{ a.game }}<template v-if="a.t"> · {{ agoShort(a.t) }}</template></span></span>
              </div>
            </div>
            <div v-else class="st-empty small"><span>Unlocks from your emulators and RetroAchievements show here</span></div>
          </template>

          <!-- Downloads -->
          <template v-else-if="t.type === 'downloads'">
            <div class="st-label">Downloads</div>
            <template v-if="activeDl.length">
              <div class="st-num"><span class="st-big tnum">{{ dlPct }}</span><span class="st-unit">%</span></div>
              <div class="st-meter"><i :style="{ width: dlPct + '%' }" /></div>
              <div class="st-sub">{{ activeDl.length === 1 ? activeDl[0].name : `${activeDl.length} games` }}</div>
            </template>
            <div v-else class="st-sub st-quiet">Nothing downloading</div>
          </template>

          <!-- Surprise me -->
          <template v-else-if="t.type === 'surprise'">
            <div class="st-center"><Icon name="mdiDiceMultipleOutline" :size="40" class="st-dice" /><b>Surprise me</b></div>
          </template>

          <!-- One game, pinned -->
          <template v-else-if="t.type === 'game'">
            <template v-if="romById(t.romId)">
              <div class="st-art" :style="{ backgroundImage: bgUrl(t.h > t.w ? cover(romById(t.romId), true) : artOf(romById(t.romId))) }" />
              <div class="st-scrim" />
              <div class="st-pin"><b>{{ romById(t.romId).name }}</b><span>{{ romById(t.romId).platform_display_name }}</span></div>
            </template>
            <div v-else class="st-empty small"><span>This game isn't in your library any more</span></div>
          </template>

          <!-- One console, pinned -->
          <template v-else-if="t.type === 'console'">
            <ConsoleCard v-if="platformById(t.platformId)" class="st-fill" :p="platformById(t.platformId)" />
            <div v-else class="st-empty small"><span>This console isn't in your library any more</span></div>
          </template>
          </div>

          <!-- arranging: its size, its edges to drag, and buttons for mouse and touch -->
          <template v-if="editing">
            <span v-if="focusedId === t.id || drag?.id === t.id || sizing?.id === t.id" class="st-size tnum">{{ t.w }} × {{ t.h }}</span>
            <span v-for="e in EDGES" :key="e" class="st-handle" :class="['h-' + e, { on: mode === 'size' && focusedId === t.id && corner.includes(e) && e.length === 2 }]" data-nodrag @pointerdown.stop="hDown(t, e, $event)" />
            <span class="st-ctl" data-nodrag>
              <span class="st-ctl-b" title="Remove" @click.stop="removeTile(t)" @pointerdown.stop><Icon name="mdiClose" :size="16" /></span>
            </span>
          </template>
        </button>
        <button v-if="editing" key="add" class="st-tile st-add" :style="addStyle" data-focus data-key="st-add" @click="addTile"><Icon name="mdiPlus" :size="26" /><b>Add a tile</b></button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Start (0.9.19): a menu of tiles the user arranges (owner: inspired by a frontend on someone's device;
// its widget look wasn't wanted, these follow docs/design.md). 0.9.21 (owner: drag to any size, resize
// per edge, smooth weighted motion, more character): tiles sit on an 8-column board at their own place
// (startLayout.js), drawn absolutely so moves and resizes glide; each tile redraws itself for its size.
// Hold A (or press and hold) to arrange. Controller: A picks a tile up and the D-pad moves it, X resizes
// (the D-pad moves a corner, LB/RB pick the corner), Y removes, B is done. Touch and mouse: drag a tile
// to move it, drag an edge or a corner to resize. Saved in config.ui.start.
import { computed, ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { store, heroArt, call, go, tab, img, cover, logoOf, allRoms, visible, visiblePlatforms, romById, isNew, collections, setBg, backdropOf, wantSharp, bytes, saveConfig, choose, playtimeText, loadPlay, toast } from '../store.js';
import { useView } from '../useView.js';
import { recommend } from '../recs.js';
import { ensureFocus, input } from '../nav.js';
import { sfx } from '../sfx.js';
import Icon from '../components/Icon.vue';
import Btn from '../components/Btn.vue';
import Grade from '../components/Grade.vue';
import GameLogo from '../components/GameLogo.vue';
import ConsoleCard from '../components/ConsoleCard.vue';
import StartClock from '../components/StartClock.vue';
import { TILES, DEFAULT, valid, COLS, MAX_H, pack, settle, bottom } from '../startTiles.js';

const ROWS = 4; // rows that fill the screen; more scroll
const COVER_ROWS = {
  fresh: { empty: 'Games added to RomM show here' },
  recent: { empty: 'Games you play show here' },
  favs: { empty: 'Mark games as favourites in RomM or on their page' },
  recs: { empty: 'Play a few games and Cartridge suggests more' },
};
const saved = (store.config.ui.start?.tiles || []).filter(valid);
const tiles = ref(saved.length ? pack(saved.map((t) => ({ ...t }))) : DEFAULT());
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => saveConfig({ ui: { start: { tiles: tiles.value.map(({ id, type, x, y, w, h, romId, platformId }) => ({ id, type, x, y, w, h, ...(romId ? { romId } : {}), ...(platformId ? { platformId } : {}) })) } } }), 400); }

const el = ref(null), scroller = ref(null);
const editing = ref(false), focusedId = ref(null);
const mode = ref(''); // while arranging with a controller: '' | 'move' (picked up) | 'size'
const corner = ref('se'); // which corner the D-pad moves while resizing
const CORNERS = ['se', 'sw', 'nw', 'ne'];
const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const leaving = ref(null);
const isArt = (t) => t.type === 'continue' ? !!cur.value : t.type === 'game';
const bgUrl = (u) => (u ? `url("${String(u).replace(/"/g, '%22')}")` : 'none');
const artOf = (r) => heroArt(r)?.src || ''; // SteamGridDB's hero only, no RomM picture first (0.9.21)
const platformById = (id) => store.lib?.platforms.find((p) => p.id === id) || null;

// ---- the board: cell size from the screen (8 columns, 4 rows fill it), tiles placed in pixels
const geo = reactive({ cw: 120, ch: 150, gap: 16 });
function measure() {
  const s = scroller.value; if (!s) return;
  const cs = getComputedStyle(s);
  const W = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const H = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  geo.gap = Math.round(Math.max(10, Math.min(20, window.innerWidth * 0.011)));
  geo.cw = Math.max(40, (W - (COLS - 1) * geo.gap) / COLS);
  geo.ch = Math.max(80, (H - (ROWS - 1) * geo.gap) / ROWS);
}
const px = (t) => ({ x: t.x * (geo.cw + geo.gap), y: t.y * (geo.ch + geo.gap), w: t.w * geo.cw + (t.w - 1) * geo.gap, h: t.h * geo.ch + (t.h - 1) * geo.gap });
const box = (t) => { const r = px(t); return { pw: r.w, ph: r.h }; };
const boardRows = computed(() => bottom(tiles.value) + (editing.value ? 2 : 0));
const boardH = computed(() => Math.max(1, boardRows.value) * (geo.ch + geo.gap) - geo.gap);
function tileStyle(t, n) {
  const r = px(t), d = drag.value?.id === t.id ? drag.value : null;
  return { width: r.w + 'px', height: r.h + 'px', transform: d ? `translate3d(${d.vx}px, ${d.vy}px, 0)` : `translate3d(${r.x}px, ${r.y}px, 0)`, '--n': n };
}
const addStyle = computed(() => { const r = px({ x: 0, y: bottom(tiles.value), w: 2, h: 1 }); return { width: r.w + 'px', height: r.h + 'px', transform: `translate3d(${r.x}px, ${r.y}px, 0)` }; });
const slots = computed(() => {
  const out = [];
  for (let y = 0; y < boardRows.value; y++) for (let x = 0; x < COLS; x++) { const r = px({ x, y, w: 1, h: 1 }); out.push({ k: x + ',' + y, s: { width: r.w + 'px', height: r.h + 'px', transform: `translate(${r.x}px, ${r.y}px)` } }); }
  return out;
});
// where the held or resized tile will land
const ghost = computed(() => {
  const id = drag.value?.id || sizing.value?.id; if (!id) return null;
  const t = tiles.value.find((x) => x.id === id); if (!t) return null;
  const r = px(t); return { width: r.w + 'px', height: r.h + 'px', transform: `translate(${r.x}px, ${r.y}px)` };
});
// how much fits in a tile of this size
function cardsFor(t) { const { pw, ph } = box(t); const cols = Math.max(1, Math.round(pw / 250)), rws = Math.max(1, Math.round((ph - 34) / 130)); return { cols, rows: rws, n: Math.min(24, cols * rws), compact: ph / rws < 110 }; }
const cardsGrid = (t) => { const c = cardsFor(t); return { gridTemplateColumns: `repeat(${c.cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${c.rows}, minmax(0, 1fr))` }; };
function coversFor(t) { const { pw, ph } = box(t); const area = Math.max(40, ph - 74), rws = Math.max(1, Math.round(area / 190)), coverW = (area / rws) * 0.75 + 10; return { rows: rws, n: Math.min(40, rws * Math.ceil(pw / coverW) + rws) }; }
function achFor(t) { const { pw, ph } = box(t); const cols = Math.max(1, Math.floor(pw / 260)), rws = Math.max(1, Math.floor((ph - 40) / 60)); return { cols, n: Math.min(18, cols * rws) }; }

// ---- data
const played = ref({});
call('steam:played').then((m) => { played.value = m || {}; }).catch(() => {});
loadPlay();
const lastPlay = (r) => Math.max(played.value[r.id] || 0, store.play[r.id]?.last || 0, r.user?.played || 0);
const roms = computed(() => allRoms().filter(visible));
const playing = computed(() => roms.value.filter((r) => lastPlay(r) || r.user?.playing).sort((a, b) => lastPlay(b) - lastPlay(a)));
const cpIndex = ref(0);
const cur = computed(() => playing.value[Math.min(cpIndex.value, playing.value.length - 1)] || null);
function whenText(r) {
  const t = lastPlay(r);
  const mins = store.play[r.id]?.min || 0;
  if (!t) return mins ? playtimeText(mins) + ' played' : 'Not started';
  const m = Math.round((Date.now() - t) / 6e4);
  const ago = m < 1 ? 'just now' : m < 60 ? `${m} minutes ago` : m < 1440 ? `${Math.round(m / 60)} hours ago` : m < 2880 ? 'yesterday' : `${Math.round(m / 1440)} days ago`;
  return `Played ${ago}${mins ? ' · ' + playtimeText(mins) : ''}`;
}
const rows = computed(() => ({
  fresh: [...roms.value].sort((a, b) => (isNew(b) - isNew(a)) || (b.created_at || '').localeCompare(a.created_at || '')),
  recent: playing.value,
  favs: (() => { const f = collections().find((c) => c.favorite && c.mine && !c.smart); return f ? f.rom_ids.map((id) => romById(id)).filter((r) => r && visible(r)) : []; })(),
  recs: recommend(roms.value, { minsOf: (r) => store.play[r.id]?.min || 0, lastPlay }).map((x) => x.rom),
}));
const rowOf = (type) => rows.value[type] || [];
function firstLine(type) {
  const r = rowOf(type)[0];
  if (!r) return '';
  if (type === 'recs') return `Try ${r.name}`;
  return r.name;
}
const consoles = computed(() => {
  const mins = {}, inst = {};
  for (const r of roms.value) { mins[r.platform_id] = (mins[r.platform_id] || 0) + (store.play[r.id]?.min || 0); if (store.installed[r.id]) inst[r.platform_id] = (inst[r.platform_id] || 0) + 1; }
  return [...visiblePlatforms()].sort((a, b) => (mins[b.id] || 0) - (mins[a.id] || 0) || (inst[b.id] || 0) - (inst[a.id] || 0) || b.rom_count - a.rom_count);
});

// clock
const now = reactive({ time: '', ampm: '', date: '', day: '', dayLine: '', hour: 12 });
function tick() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(d);
  now.time = parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
  now.ampm = parts.find((p) => p.type === 'dayPeriod')?.value || '';
  now.day = d.toLocaleDateString(undefined, { weekday: 'long' });
  now.date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  now.dayLine = `${now.day} ${now.date}`;
  now.hour = d.getHours() + d.getMinutes() / 60;
}
tick();
// storage: the drive your games are on
const space = ref(null);
const loadSpace = () => call('fs:space', store.config.romsRoot || store.info?.home || '/').then((s) => { space.value = s; }).catch(() => {});
const sizeNum = (b) => { const s = bytes(b).split(' '); return s[0]; };
const sizeUnit = (b) => { const s = bytes(b).split(' '); return s[1] || ''; };
const freePct = computed(() => space.value?.total ? (space.value.free / space.value.total) * 100 : 0);
// the gauge: 36 ticks round a 270 degree arc, open at the bottom
const GAUGE = Array.from({ length: 36 }, (_, i) => {
  const a = (135 + (i / 35) * 270) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return { i, x1: 50 + c * 38, y1: 50 + s * 38, x2: 50 + c * 46, y2: 50 + s * 46 };
});
// this week
const week = ref([]);
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const weekMin = computed(() => week.value.reduce((s, d) => s + d.min, 0));
const weekMax = computed(() => Math.max(30, ...week.value.map((d) => d.min)));
// bars leave room above for today's minutes
const barH = (m) => Math.max(8, (m / weekMax.value) * 82);
const shortMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`);
const weekNote = computed(() => {
  const w = week.value, top = w.reduce((b, d, i) => (d.min > (w[b]?.min || 0) ? i : b), -1);
  if (top < 0) return 'Nothing played yet';
  if (top === w.length - 1) return 'Most of it today';
  return 'Most on ' + new Date(2026, 0, 4 + w[top].dow).toLocaleDateString(undefined, { weekday: 'long' });
});
const loadWeek = () => call('play:week').then((w) => { week.value = w || []; }).catch(() => {});
// latest trophies and achievements
const ach = ref([]);
const raDate = (d) => { const t = new Date(String(d).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? '' : 'Z')).getTime(); return isNaN(t) ? 0 : t; };
async function loadAch() {
  const out = [];
  await Promise.all([
    store.config.ra?.user ? call('ra:overview').then((o) => { for (const a of o.recent || []) out.push({ key: 'ra' + a.id + a.date, t: raDate(a.date), badge: img(a.badge), title: a.title, game: a.game, open: () => go('ra-game', { gameId: a.gameId }) }); }).catch(() => {}) : null,
    call('trophies:overview').then((o) => { for (const x of o.recent || []) out.push({ key: 'tr' + x.key + x.id, t: x.time || 0, badge: x.icon, grade: x.grade, title: x.name, game: x.game, open: () => go('trophy-game', { tkey: x.key }) }); }).catch(() => {}),
  ]);
  ach.value = out.sort((a, b) => b.t - a.t).slice(0, 6);
}
const agoShort = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
// downloads
const activeDl = computed(() => store.downloads.filter((d) => d.status === 'downloading' || d.status === 'queued'));
const dlPct = computed(() => { const t = activeDl.value.reduce((s, d) => s + (d.total || 0), 0), r = activeDl.value.reduce((s, d) => s + (d.received || 0), 0); return t ? Math.floor((r / t) * 100) : 0; });

// ---- what each tile does
function openTile(t, ev) {
  if (suppressClick) { suppressClick = false; ev?.preventDefault(); return; }
  if (editing.value) return; // arranging: A (accept) and the mouse handle tiles themselves
  const T = t.type;
  if (T === 'continue') return cur.value ? go('game', { romId: cur.value.id }) : tab('library');
  if (T === 'clock') return;
  if (T === 'week') {
    const most = roms.value.filter((r) => store.play[r.id]?.min).sort((a, b) => store.play[b.id].min - store.play[a.id].min);
    if (!most.length) return;
    store.homeLists = { ...(store.homeLists || {}), 'start-most': { id: 'start-most', name: 'Most played', icon: 'mdiChartBar', rom_ids: most.map((r) => r.id), auto: true, ordered: true, description: 'From Start' } };
    return go('collection', { collectionId: 'start-most' });
  }
  if (T === 'storage') { store.settingsSection = 'storage'; return go('settings'); }
  if (T === 'consoles') return tab('consoles');
  if (T === 'trophies') return ach.value[0] ? ach.value[0].open() : tab('achievements');
  if (T === 'downloads') return tab('downloads');
  if (T === 'surprise') { const pool = roms.value; const r = pool[Math.floor(Math.random() * pool.length)]; if (r) go('game', { romId: r.id }); return; }
  if (T === 'game') return romById(t.romId) && go('game', { romId: t.romId });
  if (T === 'console') return platformById(t.platformId) && go('platform', { platformId: t.platformId });
  if (COVER_ROWS[T]) {
    const list = rowOf(T);
    if (!list.length) return;
    store.homeLists = { ...(store.homeLists || {}), ['start-' + T]: { id: 'start-' + T, name: TILES[T].name, icon: TILES[T].icon, rom_ids: list.map((r) => r.id), auto: true, ordered: true, description: 'From Start' } };
    go('collection', { collectionId: 'start-' + T });
  }
}
// the backdrop follows the tile you're on: its game's art, or the last played game's
function focusTile(t) {
  focusedId.value = t.id;
  const r = t.type === 'game' ? romById(t.romId) : t.type === 'continue' ? cur.value : COVER_ROWS[t.type] ? rowOf(t.type)[0] : null;
  if (r) { setBg(backdropOf(r)); wantSharp(r); } else if (cur.value) setBg(backdropOf(cur.value));
  store.hints = hints();
}

// ---- arranging
const barText = computed(() => mode.value === 'move' ? 'Move it with the D-pad. A puts it down.'
  : mode.value === 'size' ? 'The D-pad moves the lit corner. LB and RB pick another corner. A when done.'
  : input.mode === 'pad' ? 'A picks a tile up · X resizes · Y removes' : 'Drag a tile to move it, drag its edges to resize');
function startEdit(t) {
  if (editing.value) return;
  editing.value = true; mode.value = '';
  sfx.accept?.();
  store.hints = hints();
  if (t) nextTick(() => focusKey('tile-' + t.id));
}
function stopEdit() {
  editing.value = false; mode.value = ''; settle(tiles.value); save();
  store.hints = hints();
  nextTick(() => ensureFocus(el.value));
}
function setMode(m) { mode.value = mode.value === m ? '' : m; if (mode.value === 'size') corner.value = 'se'; settle(tiles.value); save(); store.hints = hints(); sfx.accept?.(); }
function removeTile(t) {
  const i = tiles.value.indexOf(t);
  leaving.value = t.id; mode.value = '';
  setTimeout(() => {
    tiles.value = tiles.value.filter((x) => x.id !== t.id); leaving.value = null;
    settle(tiles.value); save();
    toast(`${TILES[t.type].name} removed`, 'info', 2000, 'mdiClose');
    nextTick(() => { const next = tiles.value[Math.min(i, tiles.value.length - 1)]; focusKey(next ? 'tile-' + next.id : 'st-add'); });
  }, 200);
}
async function resetLayout() {
  tiles.value = DEFAULT(); mode.value = ''; save();
  nextTick(() => focusKey('tile-continue'));
}
async function addTile() {
  const have = new Set(tiles.value.map((t) => t.type));
  const opts = Object.entries(TILES).filter(([k]) => k === 'game' || k === 'console' || !have.has(k)).map(([k, v]) => ({ label: v.name, value: k, icon: v.icon, sub: k === 'game' ? 'Pin one game' : k === 'console' ? 'Pin one console' : '' }));
  const type = await choose({ sheet: true, title: 'Add a tile', options: opts });
  if (!type) return nextTick(() => focusKey('st-add'));
  const [w, h] = TILES[type].size;
  const t = { id: type + '-' + Date.now().toString(36), type, w, h, x: 0, y: bottom(tiles.value) };
  if (type === 'game') {
    const pool = [...playing.value.slice(0, 12), ...rows.value.favs.slice(0, 12), ...rows.value.fresh.slice(0, 12)].filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i).slice(0, 30);
    const id = await choose({ sheet: true, title: 'Pin a game', options: pool.map((r) => ({ label: r.name, value: r.id, img: cover(r), sub: r.platform_display_name, raw: true })) });
    if (!id) return nextTick(() => focusKey('st-add'));
    t.romId = id;
  } else if (type === 'console') {
    const id = await choose({ sheet: true, title: 'Pin a console', options: consoles.value.map((p) => ({ label: p.display_name, value: p.id, sub: `${p.rom_count} games`, raw: true })) });
    if (!id) return nextTick(() => focusKey('st-add'));
    t.platformId = id;
  }
  tiles.value.push(t); settle(tiles.value); save();
  nextTick(() => { focusKey('tile-' + t.id); keepInView(t.id); });
}
// D-pad while a tile is picked up: it trades places with the tile that way, or moves one cell into empty space
function moveTile(dir) {
  const t = tiles.value.find((x) => x.id === focusedId.value); if (!t) return;
  const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0, dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
  const me = el.value.querySelector(`[data-id="${CSS.escape(t.id)}"]`), a = me.getBoundingClientRect();
  let other = null, score = Infinity;
  for (const n of el.value.querySelectorAll('.st-tile[data-id]')) {
    if (n === me) continue;
    const r = n.getBoundingClientRect();
    const p = dx > 0 ? r.left - a.right : dx < 0 ? a.left - r.right : dy > 0 ? r.top - a.bottom : a.top - r.bottom;
    const across = dx ? Math.max(0, Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top)) : Math.max(0, Math.min(a.right, r.right) - Math.max(a.left, r.left));
    if (p < -4 || p > geo.gap + 4 || across <= 0) continue; // only a tile right next to it
    if (p - across < score) { score = p - across; other = tiles.value.find((x) => x.id === n.dataset.id); }
  }
  if (other) { const ox = other.x, oy = other.y; other.x = t.x; other.y = t.y; t.x = ox; t.y = oy; }
  else { t.x = Math.max(0, Math.min(COLS - t.w, t.x + dx)); t.y = Math.max(0, t.y + dy); }
  settle(tiles.value, t.id); save();
  sfx.move?.();
  nextTick(() => keepInView(t.id));
}
// D-pad while resizing: the lit corner's edges move that way (one cell)
function sizeTile(dir) {
  const t = tiles.value.find((x) => x.id === focusedId.value); if (!t) return;
  const c = corner.value, before = `${t.x},${t.y},${t.w},${t.h}`;
  if (dir === 'left' || dir === 'right') {
    const d = dir === 'right' ? 1 : -1;
    if (c.includes('e')) t.w = Math.max(1, Math.min(COLS - t.x, t.w + d));
    else { const nx = Math.max(0, Math.min(t.x + t.w - 1, t.x + d)); t.w += t.x - nx; t.x = nx; }
  } else {
    const d = dir === 'down' ? 1 : -1;
    if (c.includes('s')) t.h = Math.max(1, Math.min(MAX_H, t.h + d));
    else { const ny = Math.max(0, Math.min(t.y + t.h - 1, t.y + d)); const nh = t.h + t.y - ny; if (nh <= MAX_H) { t.h = nh; t.y = ny; } }
  }
  if (`${t.x},${t.y},${t.w},${t.h}` === before) { sfx.error?.(); return; }
  settle(tiles.value, t.id); save();
  sfx.move?.();
  nextTick(() => keepInView(t.id));
}
function focusKey(k) { const n = el.value?.querySelector(`[data-key="${CSS.escape(k)}"]`); if (n) n.focus({ preventScroll: true }); }
function keepInView(id) { el.value?.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

// touch and mouse: press and hold a tile to arrange; while arranging, drag a tile to move it and its
// edges to resize it. The tile follows the finger exactly; the others make room as it goes.
let pressT = 0, suppressClick = false;
const drag = ref(null), sizing = ref(null);
function edgeScroll(y) { const s = scroller.value, r = s.getBoundingClientRect(); if (y > r.bottom - 60) s.scrollTop += 14; else if (y < r.top + 60) s.scrollTop -= 14; }
function pDown(t, e) {
  if (e.button && e.button !== 0) return;
  const sx = e.clientX, sy = e.clientY;
  if (!editing.value) {
    clearTimeout(pressT);
    pressT = setTimeout(() => { suppressClick = true; startEdit(t); }, 520);
    const cancel = (ev) => { if (ev.type !== 'pointermove' || Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) { clearTimeout(pressT); off(); } };
    const off = () => { window.removeEventListener('pointermove', cancel); window.removeEventListener('pointerup', cancel); window.removeEventListener('pointercancel', cancel); };
    window.addEventListener('pointermove', cancel, { passive: true }); window.addEventListener('pointerup', cancel); window.addEventListener('pointercancel', cancel);
    return;
  }
  const r0 = px(t), st0 = scroller.value.scrollTop;
  const move = (ev) => {
    if (!drag.value) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return; drag.value = { id: t.id, vx: r0.x, vy: r0.y }; mode.value = ''; }
    const vx = r0.x + ev.clientX - sx, vy = r0.y + ev.clientY - sy + scroller.value.scrollTop - st0;
    drag.value = { id: t.id, vx, vy };
    const nx = Math.max(0, Math.min(COLS - t.w, Math.round(vx / (geo.cw + geo.gap)))), ny = Math.max(0, Math.round(vy / (geo.ch + geo.gap)));
    if (nx !== t.x || ny !== t.y) { t.x = nx; t.y = ny; settle(tiles.value, t.id); }
    edgeScroll(ev.clientY);
  };
  const up = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (drag.value) { suppressClick = true; setTimeout(() => (suppressClick = false), 60); drag.value = null; settle(tiles.value); save(); }
  };
  window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
function hDown(t, edge, e) {
  if (e.button && e.button !== 0) return;
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY, g0 = { x: t.x, y: t.y, w: t.w, h: t.h };
  sizing.value = { id: t.id }; mode.value = '';
  const move = (ev) => {
    const dc = Math.round((ev.clientX - sx) / (geo.cw + geo.gap)), dr = Math.round((ev.clientY - sy) / (geo.ch + geo.gap));
    let { x, y, w, h } = g0;
    if (edge.includes('e')) w = Math.max(1, Math.min(COLS - x, g0.w + dc));
    if (edge.includes('w')) { x = Math.max(0, Math.min(g0.x + g0.w - 1, g0.x + dc)); w = g0.w + g0.x - x; }
    if (edge.includes('s')) h = Math.max(1, Math.min(MAX_H, g0.h + dr));
    if (edge.includes('n')) { y = Math.max(0, Math.max(g0.y + g0.h - MAX_H, Math.min(g0.y + g0.h - 1, g0.y + dr))); h = g0.h + g0.y - y; }
    if (x !== t.x || y !== t.y || w !== t.w || h !== t.h) { Object.assign(t, { x, y, w, h }); settle(tiles.value, t.id); sfx.move?.(); }
    edgeScroll(ev.clientY);
  };
  const up = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    sizing.value = null; suppressClick = true; setTimeout(() => (suppressClick = false), 60); settle(tiles.value); save();
  };
  window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}

// ---- controller
const hints = () => editing.value
  ? (mode.value === 'move' ? [{ b: 'A', label: 'Put down' }, { b: 'B', label: 'Put down' }]
    : mode.value === 'size' ? [{ b: 'LB+RB', label: 'Corner' }, { b: 'A', label: 'Done' }, { b: 'B', label: 'Done' }]
    : [{ b: 'A', label: 'Pick up' }, { b: 'X', label: 'Resize' }, { b: 'Y', label: 'Remove' }, { b: 'B', label: 'Done' }])
  : [{ b: 'A', label: 'Open, hold to arrange' }, ...(focusedId.value === 'continue' && playing.value.length > 1 ? [{ b: 'LB+RB', label: 'Game' }] : []), { b: 'Y', label: 'Search' }];
const focusedTile = () => tiles.value.find((t) => t.id === document.activeElement?.dataset?.id);
const dirH = (dir) => () => {
  if (!editing.value || !focusedTile()) return false;
  if (mode.value === 'move') { moveTile(dir); return true; }
  if (mode.value === 'size') { sizeTile(dir); return true; }
  return false;
};
const stepCorner = (d) => { corner.value = CORNERS[(CORNERS.indexOf(corner.value) + d + CORNERS.length) % CORNERS.length]; sfx.move?.(); };
const stepGame = (d) => { const n = Math.min(5, playing.value.length); cpIndex.value = (cpIndex.value + d + n) % n; focusTile(focusedTile()); };
useView({
  accept: () => {
    const t = focusedTile();
    if (!editing.value || !t) return false;
    setMode(mode.value ? '' : 'move'); return true;
  },
  hold: () => { const t = focusedTile(); if (t && !editing.value) { startEdit(t); return true; } return false; },
  up: dirH('up'), down: dirH('down'), left: dirH('left'), right: dirH('right'),
  x: () => { const t = focusedTile(); if (editing.value && t) { setMode('size'); return true; } return false; },
  y: () => { if (!editing.value) return false; const t = focusedTile(); if (t) removeTile(t); return true; },
  back: () => { if (!editing.value) return false; if (mode.value) setMode(''); else stopEdit(); return true; },
  lb: () => { if (mode.value === 'size') return stepCorner(-1), true; if (focusedTile()?.type === 'continue' && playing.value.length > 1) stepGame(-1); },
  rb: () => { if (mode.value === 'size') return stepCorner(1), true; if (focusedTile()?.type === 'continue' && playing.value.length > 1) stepGame(1); },
}, hints);

let clockT = 0, spaceT = 0, ro = null;
onMounted(async () => {
  clockT = setInterval(tick, 5000);
  loadSpace(); spaceT = setInterval(loadSpace, 60000);
  loadWeek(); loadAch();
  measure();
  ro = new ResizeObserver(measure); ro.observe(scroller.value);
  await nextTick();
  ensureFocus(el.value);
});
onBeforeUnmount(() => { clearInterval(clockT); clearInterval(spaceT); clearTimeout(pressT); ro?.disconnect(); if (editing.value) { settle(tiles.value); save(); } });
watch(() => store.trophyVer, loadAch);
watch(() => store.play, loadWeek);
</script>

<style scoped>
.start { position: absolute; inset: 0; display: flex; flex-direction: column; animation: viewIn var(--d-slow) var(--ease); }
.st-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: var(--s-4) var(--s-7) var(--s-6); }
@media (max-width: 1400px) { .st-scroll { padding-left: 36px; padding-right: 36px; } }
/* the board: tiles placed in pixels from their cell (startLayout.js), so moves and resizes glide */
.st-board { position: relative; transition: height 460ms cubic-bezier(0.32, 0.72, 0, 1); }
.st-tile { --glide: 460ms cubic-bezier(0.32, 0.72, 0, 1); position: absolute; left: 0; top: 0; padding: 0; background: none; border-radius: var(--r-lg); color: var(--text); text-align: left; will-change: transform;
  transition: transform var(--glide), width var(--glide), height var(--glide), opacity 200ms ease; }
.st-tile:focus-visible, .pad-mode .st-tile:focus { box-shadow: none; }
/* the face carries the look, so the tile itself only moves */
.st-face { position: absolute; inset: 0; display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: clamp(10px, min(9cqh, 7cqw), 22px); border-radius: inherit; background: var(--s1); overflow: hidden; isolation: isolate; container-type: size;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: transform 380ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 240ms ease, opacity 200ms ease;
  animation: st-in 640ms cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: calc(var(--n, 0) * 45ms); }
/* tiles arrive one after another, rising and settling */
@keyframes st-in { from { opacity: 0; transform: translateY(18px) scale(0.97); } }
:global(body.motion-reduce .st-face) { animation: none; }
.st-tile:focus-visible .st-face, .pad-mode .st-tile:focus .st-face { box-shadow: var(--ring); transform: translateY(-3px); }
/* a soft light passes over a tile when it's reached */
.st-face::after { content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none; background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.10) 50%, transparent 65%); transform: translateX(-110%); }
.pad-mode .st-tile:focus .st-face::after, .st-tile:focus-visible .st-face::after { animation: st-glint 900ms cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes st-glint { to { transform: translateX(110%); } }
:global(body.motion-reduce .st-face::after) { animation: none !important; }
.st-tile:active .st-face { transform: scale(0.985); transition-duration: 90ms; }
.st-tile.leaving { opacity: 0; }
.st-tile.leaving .st-face { transform: scale(0.9); }

/* arranging: the grid shows, every tile shows its edge; a held tile lifts and follows the finger */
.st-slots i { position: absolute; left: 0; top: 0; border-radius: var(--r-md); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06); background: rgba(255, 255, 255, 0.015); animation: st-fade 300ms ease both; }
@keyframes st-fade { from { opacity: 0; } }
.st-ghost { position: absolute; left: 0; top: 0; border-radius: var(--r-lg); box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.45); background: rgba(255, 255, 255, 0.05); transition: transform 220ms cubic-bezier(0.32, 0.72, 0, 1), width 220ms cubic-bezier(0.32, 0.72, 0, 1), height 220ms cubic-bezier(0.32, 0.72, 0, 1); pointer-events: none; }
.editing .st-face { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12); }
.editing .st-tile:not(.held):not(.picked) .st-face { transform: scale(0.975); }
.editing .st-tile:focus .st-face, .editing .st-tile:focus-visible .st-face { box-shadow: var(--ring); transform: none; }
.st-tile.held { z-index: 5; transition: width var(--glide), height var(--glide); }
.st-tile.held .st-face, .st-tile.picked .st-face { transform: scale(1.035) rotate(-0.6deg); box-shadow: var(--ring), 0 30px 70px rgba(0, 0, 0, 0.6); }
.st-tile.picked { z-index: 5; }
.st-tile.resized { z-index: 4; }
.editing .st-tile[data-id] { touch-action: none; }
.dragging .st-tile:not(.held) .st-face { opacity: 0.9; }

.st-edit-bar { display: flex; align-items: center; gap: var(--s-4); padding: var(--s-3) var(--s-7) 0; font-size: var(--t-sm); }
.st-edit-bar b { font-family: var(--display); font-size: var(--t-lg); font-weight: 700; }
.st-edit-bar .spacer { flex: 1; }
@media (max-width: 1400px) { .st-edit-bar { padding-left: 36px; padding-right: 36px; } }
.st-size { position: absolute; bottom: 10px; left: 10px; z-index: 6; padding: 3px 10px; border-radius: 999px; background: #fff; color: #0c0d10; font-size: var(--t-xs); font-weight: 700; pointer-events: none; }
.st-ctl { position: absolute; top: 10px; right: 10px; z-index: 6; display: flex; gap: 6px; }
.pad-mode .st-ctl { display: none; }
.st-ctl-b { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: rgba(12, 13, 16, 0.82); color: #fff; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18); }
/* edges and corners to drag (mouse and touch); with a controller only the lit corner shows */
.st-handle { position: absolute; z-index: 6; touch-action: none; }
.st-handle::before { content: ''; position: absolute; inset: -10px; } /* a bigger target for fingers */
.st-handle::after { content: ''; position: absolute; inset: 0; border-radius: 999px; background: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); opacity: 0.85; transition: transform 160ms ease, opacity 160ms ease; }
.st-handle:hover::after { transform: scale(1.25); opacity: 1; }
.h-n, .h-s { left: calc(50% - 18px); width: 36px; height: 6px; cursor: ns-resize; }
.h-n { top: -3px; } .h-s { bottom: -3px; }
.h-e, .h-w { top: calc(50% - 18px); width: 6px; height: 36px; cursor: ew-resize; }
.h-e { right: -3px; } .h-w { left: -3px; }
.h-ne, .h-nw, .h-se, .h-sw { width: 14px; height: 14px; }
.h-ne { top: -5px; right: -5px; cursor: nesw-resize; } .h-sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.h-nw { top: -5px; left: -5px; cursor: nwse-resize; } .h-se { bottom: -5px; right: -5px; cursor: nwse-resize; }
.st-tile:not(:hover):not(:focus):not(.held):not(.resized) .st-handle { opacity: 0; pointer-events: none; }
.st-handle { transition: opacity 160ms ease; }
.pad-mode .st-handle { display: none; }
.pad-mode .st-handle.on { display: block; }
.st-handle.on::after { background: var(--focus); box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.25), 0 2px 10px rgba(0, 0, 0, 0.6); transform: scale(1.5); animation: st-pulse 1.4s ease-in-out infinite; }
@keyframes st-pulse { 50% { transform: scale(1.15); } }
:global(body.light-fx .st-handle.on::after) { animation: none; }
.st-add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.16) !important; color: var(--muted); }
.st-add:focus { color: var(--text); box-shadow: var(--ring) !important; }

/* the parts every tile shares; sizes follow the tile (container units) */
.st-label { font-size: clamp(11px, min(10cqh, 6cqw), 15px); font-weight: 600; color: var(--muted); letter-spacing: -0.005em; position: relative; z-index: 1; flex: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-label.on-art { color: rgba(255, 255, 255, 0.86); }
.st-num { display: flex; align-items: baseline; gap: 4px; margin-top: auto; line-height: 1; }
.st-big { font-family: var(--display); font-stretch: var(--display-stretch); font-weight: 800; font-size: clamp(22px, min(32cqh, 20cqw), 104px); letter-spacing: -0.02em; }
.st-unit { font-family: var(--display); font-weight: 700; font-size: clamp(12px, min(11cqh, 7cqw), 24px); color: var(--muted); margin-right: 6px; }
.st-sub { margin-top: 6px; font-size: clamp(11px, min(9cqh, 6cqw), 15px); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: none; }
.st-quiet { margin-top: auto; }
.tnum { font-variant-numeric: tabular-nums; }
.st-meter { height: 4px; margin-top: 10px; border-radius: 2px; background: rgba(255, 255, 255, 0.1); overflow: hidden; flex: none; }
.st-meter i { display: block; height: 100%; border-radius: inherit; background: var(--text); transition: width 600ms var(--ease); }
.st-empty { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; color: var(--muted); }
.st-empty b { color: var(--text); font-family: var(--display); }
.st-empty.small { font-size: var(--t-sm); padding: 0 var(--s-3); }
.st-center { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: var(--display); font-weight: 700; }
.st-tile:focus .st-dice { animation: st-roll 700ms cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes st-roll { 40% { transform: rotate(-20deg) scale(1.12); } 70% { transform: rotate(8deg); } }
@container (max-height: 110px) and (max-width: 200px) { .st-label { display: none; } .st-center b { display: none; } }
@container (max-height: 90px) { .st-sub { display: none; } }

/* art tiles: the picture fills the tile, a scrim keeps the words readable */
.st-art { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center 30%; transition: transform 700ms var(--ease); }
.st-tile.art:focus .st-art { transform: scale(1.04); }
.st-scrim { position: absolute; inset: 0; z-index: -1; background: linear-gradient(to top, rgba(8, 9, 12, 0.92) 0%, rgba(8, 9, 12, 0.55) 38%, rgba(8, 9, 12, 0.08) 72%), linear-gradient(to right, rgba(8, 9, 12, 0.5), transparent 60%); }
.st-cp { margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; max-width: 100%; }
.st-cp :deep(.game-logo) { margin: 0 0 4px; filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.55)); }
.st-cp :deep(.st-cp-name) { margin: 0; font-family: var(--display); font-stretch: var(--display-stretch); font-weight: 800; font-size: clamp(16px, min(14cqh, 9cqw), 44px); line-height: 1.05; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.st-cp-when { font-size: clamp(11px, min(8cqh, 5cqw), 15px); font-weight: 500; color: rgba(255, 255, 255, 0.86); }
.st-cp-go { display: inline-flex; align-items: center; gap: 8px; margin-top: 6px; padding: 8px 18px 8px 10px; border-radius: 999px; background: #fff; color: #0c0d10; font-weight: 700; font-size: var(--t-sm); }
@container (max-height: 140px) { .st-cp-when { display: none; } }
.st-dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
.st-dots i { width: 6px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.4); transition: width var(--d-med) var(--ease), background var(--d-med); }
.st-dots i.on { width: 18px; background: #fff; }
.st-pin { margin-top: auto; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.st-pin b { font-family: var(--display); font-weight: 700; font-size: clamp(13px, min(12cqh, 8cqw), 22px); line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.st-pin span { font-size: var(--t-xs); color: rgba(255, 255, 255, 0.75); }
.t-clock .st-face { padding: 0; background: #0e1736; }

/* storage: wide, the number and a gauge side by side; tall, the gauge on top; small, only the gauge */
.st-store { flex: 1; min-height: 0; display: flex; align-items: stretch; gap: var(--s-3); }
.st-store-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.st-gauge { position: relative; flex: none; height: 100%; aspect-ratio: 1; max-width: 50%; display: grid; place-items: center; container-type: inline-size; }
.st-gauge svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.st-gauge line { stroke: rgba(255, 255, 255, 0.1); stroke-width: 2.6; stroke-linecap: round; transition: stroke 260ms ease; transition-delay: calc(var(--i) * 16ms + 200ms); }
.st-gauge line.on { stroke: #fff; }
.st-gauge.low line.on { stroke: #ffb547; }
.st-gauge > span { font-family: var(--display); font-weight: 700; font-size: clamp(13px, 22cqw, 40px); letter-spacing: -0.02em; }
.st-gauge small { font-size: 0.62em; color: var(--muted); margin-left: 1px; }
:global(body.motion-reduce .st-gauge line) { transition: none; }
@container (aspect-ratio < 1.2) { .st-store { flex-direction: column-reverse; } .st-gauge { height: auto; width: 100%; max-width: none; aspect-ratio: auto; flex: 1; min-height: 0; container-type: size; } .st-gauge > span { font-size: clamp(13px, min(20cqw, 20cqh), 40px); } .st-store-text .st-num { margin-top: 0; } .st-store-text { flex: none; } }
@container (max-width: 190px) and (max-height: 190px) { .st-store-text { display: none; } .st-gauge { max-width: none; width: 100%; height: 100%; } }

/* this week: wide, the total beside the bars; tall, the bars under it; small, the total only */
.st-week { flex: 1; min-height: 0; display: flex; align-items: stretch; gap: var(--s-5); }
.st-week-text { flex: none; min-width: 0; max-width: 46%; display: flex; flex-direction: column; }
.st-bars { flex: 1; min-width: 0; display: flex; align-items: stretch; justify-content: space-between; gap: clamp(4px, 2cqw, 14px); padding-top: 14px; }
.st-bar { flex: 1; max-width: 34px; display: flex; flex-direction: column; align-items: center; gap: 7px; min-height: 0; }
.st-col { flex: 1; min-height: 0; width: 100%; position: relative; }
.st-bar i { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 6px; background: linear-gradient(to top, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.24)); transform-origin: bottom; animation: st-rise 760ms cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: calc(var(--i) * 55ms + 180ms); transition: height 500ms var(--ease); }
.st-bar.today i { background: linear-gradient(to top, rgba(255, 255, 255, 0.78), #fff); }
.st-bar.none i { left: calc(50% - 3px); width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, 0.16); }
.st-bar em { position: absolute; left: 50%; transform: translate(-50%, -6px); font-style: normal; font-size: 11px; font-weight: 700; color: var(--text); white-space: nowrap; font-variant-numeric: tabular-nums; }
.st-bar span { font-size: 11px; font-weight: 600; color: var(--dim); }
.st-bar.today span { color: var(--text); }
@keyframes st-rise { from { transform: scaleY(0); } }
:global(body.motion-reduce .st-bar i) { animation: none; }
@container (aspect-ratio < 1.5) { .st-week { flex-direction: column; gap: var(--s-2); } .st-week-text { max-width: none; } .st-week-text .st-num { margin-top: 6px; } }
@container (max-height: 120px) and (max-width: 220px) { .st-bars { display: none; } .st-week-text { max-width: none; flex: 1; } }

/* consoles: the same cards as the Consoles page */
.st-cards { flex: 1; min-height: 0; margin-top: 10px; display: grid; gap: clamp(6px, 2cqw, 12px); }
.st-cards :deep(.systile.static) { border-radius: var(--r-md); }
@container (max-height: 120px) and (max-width: 220px) { .st-cards { margin-top: 0; } }
.st-fill { position: absolute; inset: 0; border-radius: inherit; }

/* rows of covers, the newest first, fading out at the edge; more rows in taller tiles */
.st-covers { flex: 1; min-height: 0; display: grid; grid-auto-flow: column; grid-auto-columns: max-content; gap: clamp(6px, 1.4cqw, 12px); margin-top: 10px; overflow: hidden; -webkit-mask-image: linear-gradient(90deg, #000 80%, transparent); mask-image: linear-gradient(90deg, #000 80%, transparent); }
.st-ambient { position: absolute; inset: -40px; z-index: -1; background-size: cover; background-position: center; filter: blur(38px) saturate(1.2); opacity: 0.34; }
.st-ambient::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10, 11, 14, 0.2), rgba(10, 11, 14, 0.75)); }
.st-cover { height: 100%; width: auto; aspect-ratio: 3 / 4; object-fit: cover; border-radius: var(--r-sm); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06); transition: transform 380ms cubic-bezier(0.32, 0.72, 0, 1); transition-delay: calc(var(--i) * 18ms); background: var(--s2); }
.st-tile:focus .st-cover { transform: translateY(-3px); }
.st-first { margin-top: 8px; color: var(--text); font-weight: 600; }
@container (max-height: 150px) { .st-first { display: none; } }
@container (max-height: 110px) { .st-covers { margin-top: 0; } }

/* trophies: as many as fit, smaller; a narrow tile shows the newest badge alone */
.st-ach { flex: 1; min-height: 0; display: grid; align-content: start; gap: 10px 16px; margin-top: 8px; }
.st-ach-row { display: flex; align-items: center; gap: 10px; min-width: 0; animation: st-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: calc(var(--i) * 40ms + 120ms); }
.st-ach-img { width: 44px; height: 44px; flex: none; border-radius: var(--r-sm); object-fit: cover; display: grid; place-items: center; background: var(--s2); }
.st-ach-t { display: flex; flex-direction: column; min-width: 0; }
.st-ach-t b { font-family: var(--display); font-weight: 700; font-size: var(--t-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-ach-t span { font-size: var(--t-xs); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@container (max-width: 200px) { .st-ach { place-items: center; align-content: center; margin-top: 4px; } .st-ach-t { display: none; } .st-ach-row:not(:first-child) { display: none; } .st-ach-img { width: min(62cqw, 56cqh); height: min(62cqw, 56cqh); border-radius: var(--r-md); } }
:global(body.motion-reduce .st-ach-row) { animation: none; }
</style>
