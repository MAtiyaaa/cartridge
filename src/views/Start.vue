<template>
  <div class="start" :class="{ editing, dragging: !!drag }" ref="el">
    <div v-if="editing" class="st-edit-bar">
      <b>Arrange Start</b>
      <span class="muted">{{ picked ? 'Move it with the D-pad, A to put it down' : 'A picks a tile up · X changes its size · Y removes it' }}</span>
      <div class="spacer" />
      <button class="btn small" data-focus data-key="st-reset" @click="resetLayout"><Icon name="mdiRestore" :size="18" />Reset</button>
      <button class="btn small primary" data-focus data-key="st-done" @click="stopEdit"><Icon name="mdiCheck" :size="18" />Done</button>
    </div>
    <div class="st-scroll" data-scroll>
      <TransitionGroup tag="div" name="st" class="st-grid" :style="{ '--rows': ROWS }">
        <button v-for="t in tiles" :key="t.id" class="st-tile" :class="['t-' + t.type, 'w' + t.w, 'h' + t.h, { picked: picked === t.id, art: isArt(t) }]"
          :style="{ gridColumn: `span ${t.w}`, gridRow: `span ${t.h}` }" data-focus :data-key="'tile-' + t.id" :data-id="t.id" :data-hold="editing ? null : ''"
          @click="openTile(t, $event)" @focus="focusTile(t)" @cart-hold="startEdit(t)" @pointerdown="pDown(t, $event)" @contextmenu.prevent>

          <!-- Continue playing: the game you played last, its art, logo and when -->
          <template v-if="t.type === 'continue'">
            <template v-if="cur">
              <div class="st-art" :style="{ backgroundImage: bgUrl(artOf(cur)) }" />
              <div class="st-scrim" />
              <div class="st-label on-art"><Icon name="mdiPlayCircleOutline" :size="16" />Continue playing</div>
              <div class="st-cp">
                <GameLogo :logo="store.config.ui.logos !== false ? logoOf(cur) : null" :name="cur.name" cls="st-cp-name" :area="t.w >= 4 ? 26000 : 14000" :max-w="t.w >= 4 ? 380 : 220" :max-h="t.h >= 2 ? 110 : 54" />
                <span class="st-cp-when">{{ whenText(cur) }}</span>
                <span v-if="t.h >= 2" class="st-cp-go"><Btn b="A" />{{ store.installed[cur.id] ? 'Continue' : 'Open' }}</span>
              </div>
              <div v-if="playing.length > 1 && t.w >= 3" class="st-dots"><i v-for="(g, i) in playing.slice(0, 5)" :key="g.id" :class="{ on: i === cpIndex }" /></div>
            </template>
            <div v-else class="st-empty"><Icon name="mdiPlayCircleOutline" :size="30" /><b>Nothing played yet</b><span>Games you play show here</span></div>
          </template>

          <!-- Clock -->
          <template v-else-if="t.type === 'clock'">
            <div class="st-label"><Icon name="mdiClockOutline" :size="16" />{{ now.day }}</div>
            <div class="st-clock"><span class="st-big tnum">{{ now.time }}</span><span v-if="now.ampm" class="st-unit">{{ now.ampm }}</span></div>
            <div class="st-sub">{{ now.date }}</div>
          </template>

          <!-- Storage: the drive the games live on -->
          <template v-else-if="t.type === 'storage'">
            <div class="st-label"><Icon name="mdiHarddisk" :size="16" />Storage</div>
            <div class="st-clock"><span class="st-big tnum">{{ space ? sizeNum(space.free) : '–' }}</span><span class="st-unit">{{ space ? sizeUnit(space.free) : '' }}</span></div>
            <div v-if="space" class="st-meter"><i :style="{ width: Math.min(100, (1 - space.free / space.total) * 100) + '%' }" /></div>
            <div class="st-sub">{{ space ? `free of ${bytes(space.total)}` : 'Looking…' }}</div>
          </template>

          <!-- This week: play time by day -->
          <template v-else-if="t.type === 'week'">
            <div class="st-label"><Icon name="mdiCalendarWeekOutline" :size="16" />This week</div>
            <div class="st-week">
              <div class="st-clock">
                <template v-if="weekMin >= 60"><span class="st-big tnum">{{ Math.floor(weekMin / 60) }}</span><span class="st-unit">h</span></template>
                <span class="st-big tnum">{{ weekMin % 60 }}</span><span class="st-unit">min</span>
              </div>
              <div class="st-bars" :class="{ tall: t.h >= 2 }">
                <div v-for="d in week" :key="d.day" class="st-bar" :class="{ today: d.day === week[week.length - 1].day }">
                  <i :style="{ height: Math.max(4, (d.min / weekMax) * 100) + '%' }" />
                  <span>{{ DOW[d.dow] }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Consoles -->
          <template v-else-if="t.type === 'consoles'">
            <div class="st-label"><Icon name="mdiGamepadSquareOutline" :size="16" />Consoles<span class="st-count">{{ consoles.length }}</span></div>
            <div class="st-chips" :style="{ gridTemplateColumns: `repeat(${t.w + 1}, minmax(0, 1fr))` }">
              <ConsoleChip v-for="p in consoles.slice(0, chipsFor(t) - (consoles.length > chipsFor(t) ? 1 : 0))" :key="p.id" :p="p" />
              <span v-if="consoles.length > chipsFor(t)" class="st-more">+{{ consoles.length - chipsFor(t) + 1 }}</span>
            </div>
          </template>

          <!-- Rows of covers: new, recently played, favourites, recommended -->
          <template v-else-if="COVER_ROWS[t.type]">
            <div class="st-label"><Icon :name="TILES[t.type].icon" :size="16" />{{ TILES[t.type].name }}<span v-if="rowOf(t.type).length" class="st-count">{{ rowOf(t.type).length }}</span></div>
            <template v-if="rowOf(t.type).length">
              <div class="st-covers">
                <img v-for="(r, i) in rowOf(t.type).slice(0, coversFor(t))" :key="r.id" class="st-cover" :src="cover(r)" :style="{ '--i': i }" loading="lazy" alt="" />
              </div>
              <div class="st-sub st-first">{{ firstLine(t.type) }}</div>
            </template>
            <div v-else class="st-empty small"><span>{{ COVER_ROWS[t.type].empty }}</span></div>
          </template>

          <!-- Latest trophies and achievements -->
          <template v-else-if="t.type === 'trophies'">
            <div class="st-label"><Icon name="mdiTrophyOutline" :size="16" />Latest trophies</div>
            <div v-if="ach.length" class="st-ach">
              <div v-for="a in ach.slice(0, t.h >= 2 ? 3 : 1)" :key="a.key" class="st-ach-row">
                <img v-if="a.badge" :src="a.badge" class="st-ach-img" alt="" /><span v-else class="st-ach-img"><Grade :g="a.grade" :size="30" /></span>
                <span class="st-ach-t"><b>{{ a.title }}</b><span>{{ a.game }}</span></span>
              </div>
            </div>
            <div v-else class="st-empty small"><span>Unlocks from your emulators and RetroAchievements show here</span></div>
          </template>

          <!-- Downloads -->
          <template v-else-if="t.type === 'downloads'">
            <div class="st-label"><Icon name="mdiTrayArrowDown" :size="16" />Downloads</div>
            <template v-if="activeDl.length">
              <div class="st-clock"><span class="st-big tnum">{{ dlPct }}</span><span class="st-unit">%</span></div>
              <div class="st-meter"><i :style="{ width: dlPct + '%' }" /></div>
              <div class="st-sub">{{ activeDl.length === 1 ? activeDl[0].name : `${activeDl.length} games` }}</div>
            </template>
            <div v-else class="st-sub st-quiet">Nothing downloading</div>
          </template>

          <!-- Surprise me -->
          <template v-else-if="t.type === 'surprise'">
            <div class="st-center"><Icon name="mdiDiceMultipleOutline" :size="t.w >= 2 ? 40 : 30" /><b v-if="t.w >= 2 || t.h >= 2">Surprise me</b></div>
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
            <ConsoleChip v-if="platformById(t.platformId)" class="st-fill" :p="platformById(t.platformId)" />
            <div v-else class="st-empty small"><span>This console isn't in your library any more</span></div>
          </template>

          <template v-if="editing">
            <span v-if="focusedId === t.id || picked === t.id" class="st-size">{{ t.w }} by {{ t.h }}</span>
            <span class="st-ctl" data-nodrag>
              <span class="st-ctl-b" title="Size" @click.stop="cycleSize(t)" @pointerdown.stop><Icon name="mdiResize" :size="16" /></span>
              <span class="st-ctl-b" title="Remove" @click.stop="removeTile(t)" @pointerdown.stop><Icon name="mdiClose" :size="16" /></span>
            </span>
          </template>
        </button>
        <button v-if="editing" key="add" class="st-tile st-add" style="grid-column: span 2" data-focus data-key="st-add" @click="addTile"><Icon name="mdiPlus" :size="26" /><b>Add a tile</b></button>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
// Start (0.9.19): a menu of tiles the user arranges (owner: inspired by a frontend on someone's device;
// its widget look wasn't wanted, these follow docs/design.md). Hold A, or press and hold with a finger
// or the mouse, to arrange: A picks a tile up and the D-pad moves it, X cycles its size, Y removes it,
// B is done. Saved in config.ui.start.
import { computed, ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { store, call, go, tab, img, cover, logoOf, allRoms, visible, visiblePlatforms, romById, isNew, collections, setBg, backdropOf, wantSharp, bytes, saveConfig, choose, playtimeText, loadPlay, toast } from '../store.js';
import { useView } from '../useView.js';
import { recommend } from '../recs.js';
import { ensureFocus, input } from '../nav.js';
import { sfx } from '../sfx.js';
import Icon from '../components/Icon.vue';
import Btn from '../components/Btn.vue';
import Grade from '../components/Grade.vue';
import GameLogo from '../components/GameLogo.vue';
import ConsoleChip from '../components/ConsoleChip.vue';
import { TILES, DEFAULT, valid } from '../startTiles.js';

const ROWS = 4; // rows that fill the screen; more scroll
const COVER_ROWS = {
  fresh: { empty: 'Games added to RomM show here' },
  recent: { empty: 'Games you play show here' },
  favs: { empty: 'Mark games as favourites in RomM or on their page' },
  recs: { empty: 'Play a few games and Cartridge suggests more' },
};
const tiles = ref(((store.config.ui.start?.tiles || []).filter(valid).map((t) => ({ ...t }))).length ? store.config.ui.start.tiles.filter(valid).map((t) => ({ ...t })) : DEFAULT());
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => saveConfig({ ui: { start: { tiles: tiles.value.map((t) => ({ ...t })) } } }), 400); }

const el = ref(null);
const editing = ref(false), picked = ref(null), focusedId = ref(null);
const isArt = (t) => t.type === 'continue' ? !!cur.value : t.type === 'game';
const bgUrl = (u) => (u ? `url("${String(u).replace(/"/g, '%22')}")` : 'none');
const artOf = (r) => (r ? (store.art?.[r.id]?.hero ? img(store.art[r.id].hero) : store.sharp[r.id] || (r.shot ? img(r.shot) : cover(r, true))) : '');
const platformById = (id) => store.lib?.platforms.find((p) => p.id === id) || null;

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
const coversFor = (t) => Math.max(2, Math.min(9, Math.round(t.w * (t.h >= 2 ? 1.6 : 1.25))));
const consoles = computed(() => {
  const mins = {}, inst = {};
  for (const r of roms.value) { mins[r.platform_id] = (mins[r.platform_id] || 0) + (store.play[r.id]?.min || 0); if (store.installed[r.id]) inst[r.platform_id] = (inst[r.platform_id] || 0) + 1; }
  return [...visiblePlatforms()].sort((a, b) => (mins[b.id] || 0) - (mins[a.id] || 0) || (inst[b.id] || 0) - (inst[a.id] || 0) || b.rom_count - a.rom_count);
});
// a row of chips per tile row, one more chip than the tile has columns, so each stays wide enough to read
const chipsFor = (t) => Math.min(14, (t.w + 1) * t.h);

// clock
const now = reactive({ time: '', ampm: '', date: '', day: '' });
function tick() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(d);
  now.time = parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
  now.ampm = parts.find((p) => p.type === 'dayPeriod')?.value || '';
  now.day = d.toLocaleDateString(undefined, { weekday: 'long' });
  now.date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
}
tick();
// storage: the drive your games are on
const space = ref(null);
const loadSpace = () => call('fs:space', store.config.romsRoot || store.info?.home || '/').then((s) => { space.value = s; }).catch(() => {});
const sizeNum = (b) => { const s = bytes(b).split(' '); return s[0]; };
const sizeUnit = (b) => { const s = bytes(b).split(' '); return s[1] || ''; };
// this week
const week = ref([]);
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const weekMin = computed(() => week.value.reduce((s, d) => s + d.min, 0));
const weekMax = computed(() => Math.max(30, ...week.value.map((d) => d.min)));
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
// downloads
const activeDl = computed(() => store.downloads.filter((d) => d.status === 'downloading' || d.status === 'queued'));
const dlPct = computed(() => { const t = activeDl.value.reduce((s, d) => s + (d.total || 0), 0), r = activeDl.value.reduce((s, d) => s + (d.received || 0), 0); return t ? Math.floor((r / t) * 100) : 0; });

// ---- what each tile does
function openTile(t, ev) {
  if (suppressClick) { suppressClick = false; ev?.preventDefault(); return; }
  if (editing.value) { if (input.mode === 'pad') togglePick(t); return; }
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
function startEdit(t) {
  if (editing.value) return;
  editing.value = true; picked.value = null;
  sfx.accept?.();
  store.hints = hints();
  if (t) nextTick(() => focusKey('tile-' + t.id));
}
function stopEdit() {
  editing.value = false; picked.value = null; save();
  store.hints = hints();
  nextTick(() => ensureFocus(el.value));
}
function togglePick(t) { picked.value = picked.value === t.id ? null : t.id; store.hints = hints(); }
function cycleSize(t) {
  const S = TILES[t.type].sizes, i = S.findIndex(([w, h]) => w === t.w && h === t.h);
  const [w, h] = S[(i + 1) % S.length];
  t.w = w; t.h = h; save();
  sfx.move?.();
  nextTick(() => keepInView(t.id));
}
function removeTile(t) {
  const i = tiles.value.indexOf(t);
  tiles.value.splice(i, 1);
  if (picked.value === t.id) picked.value = null;
  save();
  toast(`${TILES[t.type].name} removed`, 'info', 2000, 'mdiClose');
  nextTick(() => { const next = tiles.value[Math.min(i, tiles.value.length - 1)]; focusKey(next ? 'tile-' + next.id : 'st-add'); });
}
async function resetLayout() {
  tiles.value = DEFAULT(); picked.value = null; save();
  nextTick(() => focusKey('tile-continue'));
}
async function addTile() {
  const have = new Set(tiles.value.map((t) => t.type));
  const opts = Object.entries(TILES).filter(([k]) => k === 'game' || k === 'console' || !have.has(k)).map(([k, v]) => ({ label: v.name, value: k, icon: v.icon, sub: k === 'game' ? 'Pin one game' : k === 'console' ? 'Pin one console' : '' }));
  const type = await choose({ sheet: true, title: 'Add a tile', options: opts });
  if (!type) return nextTick(() => focusKey('st-add'));
  const [w, h] = TILES[type].sizes[0];
  const t = { id: type + '-' + Date.now().toString(36), type, w, h };
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
  tiles.value.push(t); save();
  nextTick(() => focusKey('tile-' + t.id));
}
// D-pad while a tile is picked up: it trades places with the tile in that direction
function moveTile(dir) {
  const ids = tiles.value.map((t) => t.id), me = el.value.querySelector(`[data-id="${CSS.escape(picked.value)}"]`);
  if (!me) return;
  const a = me.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, score = Infinity;
  for (const n of el.value.querySelectorAll('.st-tile[data-id]')) {
    if (n === me) continue;
    const r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const p = dir === 'right' ? x - ax : dir === 'left' ? ax - x : dir === 'down' ? y - ay : ay - y;
    if (p <= 4) continue;
    const s = p + Math.abs(dir === 'left' || dir === 'right' ? y - ay : x - ax) * 0.6;
    if (s < score) { score = s; best = n.dataset.id; }
  }
  if (!best) return;
  const i = ids.indexOf(picked.value), j = ids.indexOf(best), list = [...tiles.value];
  [list[i], list[j]] = [list[j], list[i]];
  tiles.value = list; save();
  sfx.move?.();
  nextTick(() => { focusKey('tile-' + picked.value); keepInView(picked.value); });
}
function focusKey(k) { const n = el.value?.querySelector(`[data-key="${CSS.escape(k)}"]`); if (n) n.focus({ preventScroll: true }); }
function keepInView(id) { el.value?.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

// touch and mouse: press and hold a tile to arrange; while arranging, drag a tile to move it
let pressT = 0, suppressClick = false;
const drag = ref(null);
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
  // arranging: follow the pointer; the tile moves to wherever it is dragged over
  const move = (ev) => {
    if (!drag.value) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return; drag.value = t.id; picked.value = t.id; }
    const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.st-tile[data-id]');
    if (!over || over.dataset.id === t.id) return;
    const list = [...tiles.value], i = list.findIndex((x) => x.id === t.id), j = list.findIndex((x) => x.id === over.dataset.id);
    const [m] = list.splice(i, 1); list.splice(j, 0, m); tiles.value = list;
  };
  const up = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (drag.value) { suppressClick = true; setTimeout(() => (suppressClick = false), 60); drag.value = null; picked.value = null; save(); }
  };
  window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}

// ---- controller
const hints = () => editing.value
  ? (picked.value ? [{ b: 'A', label: 'Put down' }, { b: 'B', label: 'Put down' }] : [{ b: 'A', label: 'Pick up' }, { b: 'X', label: 'Size' }, { b: 'Y', label: 'Remove' }, { b: 'B', label: 'Done' }])
  : [{ b: 'A', label: 'Open' }, { b: 'A', label: 'Hold to arrange' }, ...(focusedId.value === 'continue' && playing.value.length > 1 ? [{ b: 'LB+RB', label: 'Game' }] : []), { b: 'Y', label: 'Search' }];
const focusedTile = () => tiles.value.find((t) => t.id === document.activeElement?.dataset?.id);
const dirH = (dir) => () => (editing.value && picked.value ? (moveTile(dir), true) : false);
useView({
  accept: () => {
    const t = focusedTile();
    if (!editing.value || !t) return false;
    togglePick(t); sfx.accept?.(); return true;
  },
  hold: () => { const t = focusedTile(); if (t && !editing.value) { startEdit(t); return true; } return false; },
  up: dirH('up'), down: dirH('down'), left: dirH('left'), right: dirH('right'),
  x: () => { const t = focusedTile(); if (editing.value && t) cycleSize(t); },
  y: () => { if (!editing.value) return false; const t = focusedTile(); if (t) removeTile(t); },
  back: () => { if (!editing.value) return false; if (picked.value) { picked.value = null; store.hints = hints(); } else stopEdit(); },
  lb: () => { if (focusedTile()?.type === 'continue' && playing.value.length > 1) { cpIndex.value = (cpIndex.value + Math.min(5, playing.value.length) - 1) % Math.min(5, playing.value.length); focusTile(focusedTile()); } },
  rb: () => { if (focusedTile()?.type === 'continue' && playing.value.length > 1) { cpIndex.value = (cpIndex.value + 1) % Math.min(5, playing.value.length); focusTile(focusedTile()); } },
}, hints);

let clockT = 0, spaceT = 0;
onMounted(async () => {
  clockT = setInterval(tick, 5000);
  loadSpace(); spaceT = setInterval(loadSpace, 60000);
  loadWeek(); loadAch();
  await nextTick();
  ensureFocus(el.value);
});
onBeforeUnmount(() => { clearInterval(clockT); clearInterval(spaceT); clearTimeout(pressT); if (editing.value) save(); });
watch(() => store.trophyVer, loadAch);
watch(() => store.play, loadWeek);
</script>

<style scoped>
.start { position: absolute; inset: 0; display: flex; flex-direction: column; animation: viewIn var(--d-slow) var(--ease); }
.st-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: var(--s-4) var(--s-7) var(--s-6); container-type: size; }
@media (max-width: 1400px) { .st-scroll { padding-left: 36px; padding-right: 36px; } }
/* eight columns, four rows that fill the screen at any size (1280x800 to 4K); more scroll */
.st-grid { --gap: clamp(10px, 1.1vw, 20px); display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); grid-auto-rows: calc((100cqh - (var(--rows) - 1) * var(--gap)) / var(--rows)); grid-auto-flow: row dense; gap: var(--gap); }
.st-tile { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: clamp(12px, 1.2vw, 22px); border-radius: var(--r-lg); background: var(--s1); color: var(--text); text-align: left; overflow: hidden; isolation: isolate;
  transition: transform var(--d-med) var(--ease), background var(--d-fast); }
.st-tile:focus { transform: translateY(-3px); }
.st-tile:active, .st-tile.pressed { transform: scale(0.985); transition-duration: 90ms; }
/* arranging: every tile shows its edge; the picked one lifts and the rest step back a little */
.editing .st-tile { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12); }
.editing .st-tile:focus { box-shadow: var(--ring); }
.editing .st-tile.picked { transform: translateY(-6px) scale(1.025); box-shadow: var(--ring), 0 24px 60px rgba(0, 0, 0, 0.55); z-index: 2; }
.editing.dragging .st-tile:not(.picked) { opacity: 0.86; }
.editing .st-tile[data-id] { touch-action: none; }
.st-move { transition: transform 340ms cubic-bezier(0.23, 1, 0.32, 1); }
.st-enter-from { opacity: 0; transform: scale(0.94); }
.st-enter-active { transition: opacity 260ms var(--ease), transform 340ms cubic-bezier(0.23, 1, 0.32, 1); }
.st-leave-to { opacity: 0; transform: scale(0.94); }
.st-leave-active { transition: opacity 180ms ease-in, transform 180ms ease-in; position: absolute; }
:global(body.motion-reduce) .st-move, :global(body.motion-reduce) .st-enter-active { transition: none; }

.st-edit-bar { display: flex; align-items: center; gap: var(--s-4); padding: var(--s-3) var(--s-7) 0; font-size: var(--t-sm); }
.st-edit-bar b { font-family: var(--display); font-size: var(--t-lg); font-weight: 700; }
.st-edit-bar .spacer { flex: 1; }
@media (max-width: 1400px) { .st-edit-bar { padding-left: 36px; padding-right: 36px; } }
.st-size { position: absolute; top: 10px; right: 10px; z-index: 3; padding: 3px 10px; border-radius: 999px; background: #fff; color: #0c0d10; font-size: var(--t-xs); font-weight: 700; font-variant-numeric: tabular-nums; }
.st-ctl { position: absolute; bottom: 10px; right: 10px; z-index: 3; display: flex; gap: 6px; }
.pad-mode .st-ctl { display: none; }
.st-ctl-b { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: rgba(12, 13, 16, 0.78); color: #fff; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18); }
.st-add { align-items: center; justify-content: center; gap: 8px; background: transparent; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.16) !important; color: var(--muted); }
.st-add:focus { color: var(--text); box-shadow: var(--ring) !important; }

/* the parts every tile shares */
.st-label { display: flex; align-items: center; gap: 8px; font-size: var(--t-sm); font-weight: 600; color: var(--muted); position: relative; z-index: 1; }
.st-label.on-art { color: rgba(255, 255, 255, 0.86); }
.st-count { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--dim); font-weight: 500; }
.st-clock { display: flex; align-items: baseline; gap: 4px; margin-top: auto; line-height: 1; }
.st-big { font-family: var(--display); font-stretch: var(--display-stretch); font-weight: 800; font-size: clamp(30px, 3.2vw, 64px); letter-spacing: -0.02em; }
.h2 .st-big, .h3 .st-big { font-size: clamp(44px, 5vw, 96px); }
.st-unit { font-family: var(--display); font-weight: 700; font-size: clamp(14px, 1.1vw, 22px); color: var(--muted); margin-right: 6px; }
.st-sub { margin-top: 6px; font-size: var(--t-sm); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-quiet { margin-top: auto; }
.tnum { font-variant-numeric: tabular-nums; }
.st-meter { height: 4px; margin-top: 10px; border-radius: 2px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.st-meter i { display: block; height: 100%; border-radius: inherit; background: var(--text); transition: width 600ms var(--ease); }
.st-empty { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; color: var(--muted); }
.st-empty b { color: var(--text); font-family: var(--display); }
.st-empty.small { font-size: var(--t-sm); padding: 0 var(--s-3); }
.st-center { margin: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: var(--display); font-weight: 700; }

/* art tiles: the picture fills the tile, a scrim keeps the words readable */
.st-art { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center 30%; transition: transform 600ms var(--ease); }
.st-tile.art:focus .st-art { transform: scale(1.035); }
.st-scrim { position: absolute; inset: 0; z-index: -1; background: linear-gradient(to top, rgba(8, 9, 12, 0.92) 0%, rgba(8, 9, 12, 0.55) 38%, rgba(8, 9, 12, 0.08) 72%), linear-gradient(to right, rgba(8, 9, 12, 0.5), transparent 60%); }
.st-cp { margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; max-width: 100%; }
.st-cp :deep(.game-logo) { margin: 0 0 4px; filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.55)); }
.st-cp :deep(.st-cp-name) { margin: 0; font-family: var(--display); font-stretch: var(--display-stretch); font-weight: 800; font-size: clamp(22px, 2.4vw, 44px); line-height: 1.05; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.st-cp-when { font-size: var(--t-sm); font-weight: 500; color: rgba(255, 255, 255, 0.86); }
.st-cp-go { display: inline-flex; align-items: center; gap: 8px; margin-top: 6px; padding: 8px 18px 8px 10px; border-radius: 999px; background: #fff; color: #0c0d10; font-weight: 700; font-size: var(--t-sm); }
.st-dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
.st-dots i { width: 6px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.4); transition: width var(--d-med) var(--ease), background var(--d-med); }
.st-dots i.on { width: 18px; background: #fff; }
.st-pin { margin-top: auto; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.st-pin b { font-family: var(--display); font-weight: 700; font-size: var(--t-md); line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.st-pin span { font-size: var(--t-xs); color: rgba(255, 255, 255, 0.75); }

/* this week: the total, and a bar for each day (today in white) */
.st-week { flex: 1; display: flex; align-items: flex-end; gap: var(--s-4); min-height: 0; }
.st-bars { margin-left: auto; height: 70%; display: flex; align-items: flex-end; gap: clamp(6px, 0.6vw, 12px); }
.st-bars.tall { height: 82%; }
.st-bar { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; width: clamp(12px, 1.1vw, 22px); }
.st-bar i { width: 100%; border-radius: 4px; background: rgba(255, 255, 255, 0.22); transition: height 700ms var(--ease); }
.st-bar.today i { background: #fff; }
.st-bar span { font-size: 11px; font-weight: 600; color: var(--dim); }
.st-bar.today span { color: var(--text); }
.w3 .st-bars, .w2 .st-bars { gap: 4px; }

/* consoles: coloured chips with their wordmarks, never squished: they wrap or count the rest */
.st-chips { flex: 1; min-height: 0; margin-top: 10px; display: grid; grid-auto-rows: minmax(0, 1fr); gap: 8px; overflow: hidden; }
.st-more { display: grid; place-items: center; border-radius: var(--r-md); background: var(--s2); font-family: var(--display); font-weight: 700; color: var(--muted); }
.st-fill { position: absolute; inset: 0; border-radius: inherit; }
.st-fill :deep(.cchip-logo) { max-height: 38%; }

/* rows of covers, fanned and overlapping a little, the newest first */
.st-covers { flex: 1; min-height: 0; display: flex; align-items: stretch; gap: clamp(6px, 0.6vw, 12px); margin-top: 10px; overflow: hidden; }
.st-cover { flex: none; height: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: var(--r-sm); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06); transform-origin: bottom center; transition: transform var(--d-med) var(--ease); transition-delay: calc(var(--i) * 18ms); background: var(--s2); }
.st-tile:focus .st-cover { transform: translateY(-3px); }
.st-first { margin-top: 8px; color: var(--text); font-weight: 600; flex: none; }

/* trophies */
.st-ach { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; margin-top: 8px; min-height: 0; }
.st-ach-row { display: flex; align-items: center; gap: 12px; min-width: 0; }
.st-ach-img { width: clamp(40px, 3.6vw, 64px); height: clamp(40px, 3.6vw, 64px); flex: none; border-radius: var(--r-sm); object-fit: cover; display: grid; place-items: center; background: var(--s2); }
.st-ach-t { display: flex; flex-direction: column; min-width: 0; }
.st-ach-t b { font-family: var(--display); font-weight: 700; font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-ach-t span { font-size: var(--t-sm); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
