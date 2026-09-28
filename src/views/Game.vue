<template>
  <div class="view game" data-scroll ref="el">
    <div v-if="!base" class="center"><div class="spinner" /></div>
    <template v-else>
      <section class="g-banner">
        <img v-if="banner.src" class="g-banner-img" :class="{ blur: banner.blur }" :src="banner.src" @error="bannerFail = true" />
        <div class="g-banner-shade" />
        <div class="g-banner-logo"><GameLogo :logo="store.config.ui.logos !== false ? logoOf(base) : null" :name="base.name" cls="g-title" :area="40000" :max-w="560" :max-h="150" /></div>
      </section>
      <section class="g-hero">
        <div class="g-info">
          <div class="eyebrow row" style="gap: 8px"><PIcon :p="{ slug: base.platform_slug, fs_slug: base.platform_fs_slug }" :size="18" />{{ base.platform_display_name }}</div>
          <div class="g-meta">
            <span v-if="isNew(base)" class="chip new">NEW</span>
            <span v-if="yr">{{ yr }}</span>
            <span v-if="dev">{{ dev }}</span>
            <span v-if="genres">{{ genres }}</span>
            <span v-if="base.rating" class="row" style="gap: 4px; color: var(--gold)"><Icon name="mdiStar" :size="16" />{{ rating(base.rating) }}</span>
          </div>

          <div class="g-actions">
            <template v-if="dl && dl.status === 'downloading'">
              <div class="dlbox glass">
                <div class="row" style="justify-content: space-between; font-size: 13px">
                  <b>Downloading</b><span class="muted">{{ pct }}% · {{ bytes(dl.speed) }}/s</span>
                </div>
                <div class="bar live"><i :style="{ width: pct + '%' }" /></div>
                <div class="muted mono" style="font-size: 11.5px">{{ dl.currentFile || bytes(dl.received) + ' of ' + bytes(dl.total) }}</div>
              </div>
              <button class="btn danger" data-focus data-autofocus @click="call('dl:cancel', dl.id)"><Icon name="mdiPause" />Pause</button>
            </template>
            <template v-else-if="dl && dl.status === 'queued'">
              <button class="btn xl" data-focus data-autofocus disabled><Icon name="mdiClockOutline" />Queued</button>
              <button class="btn danger" data-focus @click="call('dl:cancel', dl.id)"><Icon name="mdiClose" />Cancel</button>
            </template>
            <template v-else-if="installedPath && marked">
              <button class="btn ok xl" data-focus data-autofocus @click="toast('You marked this game as installed', 'info', 3000, 'mdiCheckCircle')"><Icon name="mdiCheckCircle" />Marked as installed</button>
              <button class="btn" data-focus @click="dlNow"><Icon name="mdiDownload" />Download zip</button>
              <button class="btn" data-focus @click="setMark(false)"><Icon name="mdiCheckboxBlankOffOutline" />Unmark</button>
            </template>
            <template v-else-if="installedPath">
              <button class="btn ok xl" data-focus data-autofocus @click="toast(installedPath, 'info', 4000, 'mdiFolder')"><Icon name="mdiCheckCircle" />Ready to play</button>
              <button class="btn" data-focus @click="redownload"><Icon name="mdiRefresh" />Re-download</button>
              <button class="btn danger" data-focus @click="remove"><Icon name="mdiDeleteOutline" />Delete</button>
            </template>
            <template v-else>
              <button class="btn primary xl" data-focus data-autofocus @click="dlNow"><Icon name="mdiDownload" :size="22" />{{ dl?.status === 'cancelled' ? 'Resume' : 'Download' }} · {{ bytes(base.fs_size_bytes) }}</button>
            </template>
            <button class="btn icon-btn" data-focus title="More options" @click="more"><Icon name="mdiDotsHorizontal" :size="22" /><span>More</span></button>
          </div>
          <div v-if="dl && dl.status === 'error'" class="chip red" style="align-self: flex-start">Last attempt failed: {{ dl.error }}</div>
          <div class="dest"><Icon name="mdiFolderArrowDownOutline" :size="16" /><span class="mono">{{ marked ? 'Marked as installed by you. Extract the zip into ' + (target?.path || 'your folder') + ' when it finishes downloading.' : installedPath || target?.path || 'No folder set for this system' }}</span><span v-if="space" class="muted">· {{ bytes(space.free) }} free</span></div>
        </div>
        <div class="g-cover">
          <img v-if="coverSrc && !coverFail" :src="coverSrc" @error="coverFail = true" />
          <div v-else class="noart">{{ base.name }}</div>
        </div>
      </section>

      <section class="g-body">
        <div class="col">
          <template v-if="summary">
            <div class="shelf-title"><Icon name="mdiTextBoxOutline" :size="20" />About</div>
            <p class="summary">{{ summary }}</p>
          </template>
          <template v-if="ra">
            <div class="shelf-title" style="margin-top: 22px"><Icon name="mdiTrophyOutline" :size="20" />Achievements<span class="count">{{ ra.earned }} / {{ ra.total }}</span></div>
            <div class="ra-sum">
              <div class="bar ra-sum-bar"><i :style="{ width: (ra.total ? Math.round((ra.earned / ra.total) * 100) : 0) + '%' }" /></div>
              <span class="muted small">{{ ra.total ? Math.round((ra.earned / ra.total) * 100) : 0 }}% complete<template v-if="ra.earnedHc"> · {{ ra.earnedHc }} hardcore</template><template v-if="ra.award === 'mastered'"> · Mastered</template></span>
              <button class="btn small" data-focus @click="go('ra-game', { gameId: ra.gameId })"><Icon name="mdiTrophyVariantOutline" :size="18" />See all</button>
            </div>
            <div class="shelf ra-badges" data-hscroll>
              <button v-for="a in raBadges" :key="a.id" class="ra-b" :class="{ locked: !a.earned && !a.earnedHc }" data-focus :title="a.title" @click="go('ra-game', { gameId: ra.gameId })" @focus="raFocus = a">
                <img :src="img(a.badge)" loading="lazy" />
              </button>
            </div>
            <div v-if="raFocus" class="ra-focus"><b>{{ raFocus.title }}</b> · {{ raFocus.points }} pts<template v-if="!raFocus.earned && !raFocus.earnedHc"> · Locked</template><div class="muted">{{ raFocus.desc }}</div></div>
          </template>
          <template v-if="tro">
            <div class="shelf-title" style="margin-top: 22px"><Grade :g="tro.kind === 'gamerscore' ? null : 'G'" :size="20" />{{ tro.kind === 'gamerscore' ? 'Achievements' : 'Trophies' }}<span class="count">{{ tro.light.earned }} / {{ tro.light.total }}</span></div>
            <div class="ra-sum">
              <div class="bar ra-sum-bar tro-bar"><i :style="{ width: (tro.light.total ? Math.round((tro.light.earned / tro.light.total) * 100) : 0) + '%' }" /></div>
              <span class="muted small tro-grades">
                <template v-if="tro.kind === 'gamerscore'">{{ tro.light.score }} / {{ tro.light.possible }} G</template>
                <template v-else><template v-for="k in ['P', 'G', 'S', 'B']" :key="k"><span v-if="tro.light.grades[k]"><Grade :g="k" :size="14" />{{ tro.light.grades[k] }}</span></template>{{ tro.light.total ? Math.round((tro.light.earned / tro.light.total) * 100) : 0 }}% complete</template>
                <template v-if="tro.light.devices.length > 1"> · {{ tro.light.devices.length }} devices</template>
              </span>
              <button class="btn small" data-focus @click="go('trophy-game', { tkey: tro.key })"><Icon name="mdiTrophyVariantOutline" :size="18" />See all</button>
            </div>
            <div class="shelf ra-badges" data-hscroll>
              <button v-for="t in troBadges" :key="t.id" class="ra-b" :class="{ locked: !t.unlocked }" data-focus @click="go('trophy-game', { tkey: tro.key })" @focus="troFocus = t">
                <img v-if="t.icon && (t.unlocked || !t.hidden)" :src="t.icon" loading="lazy" /><span v-else class="tro-ph"><Grade :g="t.grade" :size="30" /></span>
              </button>
            </div>
            <div v-if="troFocus" class="ra-focus"><Grade :g="troFocus.grade" :size="14" /> <b>{{ troFocus.hidden && !troFocus.unlocked ? 'Hidden trophy' : troFocus.name }}</b><template v-if="troFocus.points"> · {{ troFocus.points }} G</template><template v-if="!troFocus.unlocked"> · Locked</template><template v-else-if="troFocus.time"> · {{ new Date(troFocus.time).toLocaleDateString() }}</template><div class="muted">{{ troFocus.hidden && !troFocus.unlocked ? '' : troFocus.desc }}</div></div>
          </template>
          <template v-if="shots.length">
            <div class="shelf-title" style="margin-top: 22px"><Icon name="mdiImageMultipleOutline" :size="20" />Screenshots</div>
            <div class="shelf shots" data-hscroll>
              <button v-for="(s, i) in shots" :key="s" class="shot" data-focus @click="viewer = i"><img :src="img(s)" loading="lazy" /></button>
            </div>
          </template>
          <template v-if="detail?.sibling_roms?.length">
            <div class="shelf-title" style="margin-top: 16px"><Icon name="mdiLayersOutline" :size="20" />Other versions</div>
            <div class="row" style="flex-wrap: wrap; gap: 10px">
              <button v-for="s in detail.sibling_roms" :key="s.id" class="btn small" data-focus @click="goVersion(s.id)">{{ s.fs_name_no_ext }}</button>
            </div>
          </template>
        </div>
        <aside class="facts glass">
          <div v-for="f in facts" :key="f.k" class="fact"><span>{{ f.k }}</span><b>{{ f.v }}</b></div>
        </aside>
      </section>
    </template>

    <div v-if="viewer !== null" class="viewer" @click="viewer = null">
      <img :src="img(shots[viewer])" />
      <div class="vhint"><Btn b="LB" /><Btn b="RB" />{{ viewer + 1 }} / {{ shots.length }}<Btn b="B" style="margin-left: 12px" />Close</div>
    </div>
  </div>
</template>

<script setup>
import { addGame, removeGame, applyChanges } from '../steam.js';
import { computed, onMounted, ref, nextTick, watch } from 'vue';
import { store, call, img, go, cover, bytes, year, rating, toast, confirm, download, downloadFor, romById, platformById, isNew, setBg, logoOf, resetLogos, artFor, choose, openModal } from '../store.js';
import { useView } from '../useView.js';
import { IS_ANDROID } from '../platform.js';
import { ensureFocus, focusFirst } from '../nav.js';
import Icon from '../components/Icon.vue';
import Btn from '../components/Btn.vue';
import PIcon from '../components/PIcon.vue';
import GameLogo from '../components/GameLogo.vue';
import Grade from '../components/Grade.vue';

const props = defineProps({ romId: Number });
const el = ref(null);
const detail = ref(null);
const coverFail = ref(false);
const viewer = ref(null);
const space = ref(null);

const cached = computed(() => romById(props.romId));
// Merge: cached (instant, offline) + detail (full metadata)
const base = computed(() => {
  const c = cached.value, d = detail.value;
  if (!c && !d) return null;
  if (!d) return c;
  const md = d.metadatum || {};
  return { ...c, ...d, name: d.name || d.fs_name_no_ext, year: md.first_release_date, rating: md.average_rating, genres: md.genres || [], developer: md.developers?.[0] || md.companies?.[0] || '', shot: d.merged_screenshots?.[0] || c?.shot };
});
const coverSrc = computed(() => base.value && cover(base.value, true));
const shots = computed(() => detail.value?.merged_screenshots || (cached.value?.shot ? [cached.value.shot] : []));
const summary = computed(() => detail.value?.summary || cached.value?.summary || '');
const target = computed(() => platformById(base.value?.platform_id)?.target);
const installedPath = computed(() => store.installed[props.romId]);
const dl = computed(() => downloadFor(props.romId));
const pct = computed(() => (dl.value?.total ? Math.floor((dl.value.received / dl.value.total) * 100) : 0));
const md = computed(() => detail.value?.metadatum || {});
const yr = computed(() => year(base.value?.year));
const dev = computed(() => base.value?.developer);
const genres = computed(() => (base.value?.genres || []).slice(0, 3).join(' · '));
const facts = computed(() => {
  const r = base.value, m = md.value, out = [];
  if (m.publishers?.length) out.push({ k: 'Publisher', v: m.publishers.slice(0, 2).join(', ') });
  if (m.developers?.length) out.push({ k: 'Developer', v: m.developers.slice(0, 2).join(', ') });
  if (m.franchises?.length) out.push({ k: 'Franchise', v: m.franchises[0] });
  if (m.game_modes?.length) out.push({ k: 'Modes', v: m.game_modes.join(', ') });
  if (m.player_count) out.push({ k: 'Players', v: m.player_count });
  if (m.age_ratings?.length) out.push({ k: 'Rating', v: m.age_ratings.slice(0, 2).join(', ') });
  if (r.regions?.length) out.push({ k: 'Region', v: r.regions.join(', ') });
  if (detail.value?.languages?.length) out.push({ k: 'Languages', v: detail.value.languages.join(', ') });
  out.push({ k: 'File', v: r.fs_name });
  out.push({ k: 'Size', v: bytes(r.fs_size_bytes) });
  if (detail.value?.files?.length > 1) out.push({ k: 'Files', v: `${detail.value.files.length} files` });
  if (detail.value?.crc_hash) out.push({ k: 'CRC32', v: detail.value.crc_hash.toUpperCase() });
  return out;
});

useView(
  {
    back: () => { if (viewer.value !== null) { viewer.value = null; return; } return false; },
    lb: () => { if (viewer.value !== null) viewer.value = (viewer.value - 1 + shots.value.length) % shots.value.length; },
    rb: () => { if (viewer.value !== null) viewer.value = (viewer.value + 1) % shots.value.length; },
    x: () => { if (!installedPath.value && !['queued', 'downloading'].includes(dl.value?.status)) dlNow(); },
    y: () => more(),
  },
  [{ b: 'A', label: 'Select' }, { b: 'X', label: 'Download' }, { b: 'Y', label: 'More' }, { b: 'B', label: 'Back' }],
);

async function dlNow() { await download(base.value); }
async function redownload() {
  if (!(await confirm('Re-download this game?', 'The copy on this device will be replaced.', 'Re-download'))) return;
  await call('roms:delete', { romId: props.romId, path: installedPath.value }).catch(() => {});
  dlNow();
}
async function remove() {
  if (!(await confirm(`Delete ${base.value.name}?`, `Removes it from this device:\n${installedPath.value}\n\nIt stays on your RomM server.`, 'Delete', true))) return;
  try { await call('roms:delete', { romId: props.romId, path: installedPath.value }); toast('Deleted from this device', 'ok', 2400, 'mdiDeleteOutline'); } catch (e) { toast(e.message, 'error'); }
}
// PS4 / PS5: games come as zips you extract yourself, so let the user mark them as installed
const folderSystem = computed(() => ['ps4', 'ps5'].includes(base.value?.platform_slug) || ['ps4', 'ps5'].includes(base.value?.platform_fs_slug));
const marked = computed(() => installedPath.value === '(marked as installed)');
async function setMark(on) {
  try {
    await call('roms:mark', { romId: Number(props.romId), on });
    toast(on ? 'Marked as installed' : 'Mark removed', 'ok', 2200, on ? 'mdiCheckCircle' : 'mdiCheckboxBlankOffOutline');
  } catch (e) { toast(e.message, 'error'); }
}
// RetroAchievements for this game (only for consoles RA supports, and only when signed in)
const ra = ref(null);
const raFocus = ref(null);
const raBadges = computed(() => {
  const l = ra.value?.achievements || [];
  return [...l.filter((a) => a.earned || a.earnedHc), ...l.filter((a) => !a.earned && !a.earnedHc)];
});
async function loadRa() {
  if (!store.config.ra?.user || store.config.ui.raOnGames === false || !base.value) return;
  try {
    const b = base.value;
    const gameId = await call('ra:forRom', { ra_id: b.ra_id || detail.value?.ra_id || null, name: b.name, slug: b.platform_slug, fs_slug: b.platform_fs_slug });
    if (gameId) ra.value = await call('ra:game', { gameId });
  } catch {}
}
// Emulator trophies (PS3 / PS4 / Xbox 360 / Vita), read on this device and synced through RomM
const TROPHY_SLUGS = ['ps3', 'ps4', 'xbox360', 'psvita'];
const trophySystem = computed(() => TROPHY_SLUGS.includes(base.value?.platform_slug) || TROPHY_SLUGS.includes(base.value?.platform_fs_slug));
const tro = ref(null);
const troFocus = ref(null);
const troBadges = computed(() => { const l = tro.value?.trophies || []; return [...l.filter((t) => t.unlocked).sort((a, b) => (b.time || 0) - (a.time || 0)), ...l.filter((t) => !t.unlocked)]; });
async function loadTrophies() {
  if (!trophySystem.value || store.config.ui.trophyOnGames === false) { tro.value = null; return; }
  try { tro.value = await call('trophies:forRom', { romId: Number(props.romId) }); } catch { tro.value = null; }
}
watch(() => store.trophyVer, loadTrophies);
async function linkTrophies() {
  const list = await call('trophies:linkable', { slug: base.value.platform_slug, fs_slug: base.value.platform_fs_slug }).catch(() => []);
  if (!list.length) { toast('No trophy data for this console yet. Check Settings → Achievements.', 'info', 4500, 'mdiTrophyOutline'); return; }
  const opts = list.map((g) => ({ label: g.title, sub: `${g.earned}/${g.total} · ${g.short}${g.romId && g.romId !== Number(props.romId) ? ' · linked to another game' : ''}`, value: g.key, icon: 'mdiTrophyOutline', selected: tro.value?.key === g.key }));
  if (tro.value) opts.push({ label: 'Unlink', sub: 'Show no trophies on this game', value: '__none', icon: 'mdiLinkOff' });
  const v = await choose({ title: 'Link trophies to ' + base.value.name, options: opts });
  if (!v) return;
  if (v === '__none') await call('trophies:link', { key: tro.value.key, romId: null });
  else await call('trophies:link', { key: v, romId: Number(props.romId) });
  await loadTrophies();
  toast(v === '__none' ? 'Trophies unlinked' : 'Trophies linked', 'ok', 2200, 'mdiLink');
}
// Header banner: your chosen background, else the first screenshot, else the cover (blurred)
const bannerFail = ref(false);
const banner = computed(() => {
  if (!base.value) return {};
  const h = artFor(props.romId).hero;
  if (h) return { src: img(h) };
  const shot = !bannerFail.value && (detail.value?.merged_screenshots?.[0] || cached.value?.shot);
  if (shot) return { src: img(shot) };
  return { src: cover(base.value, true), blur: true };
});
// More options: custom artwork from SteamGridDB, plus handy extras
let steamInfo = null;
const PC_SLUGS = /^(win|windows|win3x|pc|dos)$/i; // PC games (Android: open in GameNative, GameHub or Winlator)
async function more() {
  const has = artFor(props.romId);
  const opts = [
    { label: 'Change cover', sub: 'SteamGridDB', value: 'grid', icon: 'mdiImageEditOutline' },
    { label: 'Change logo', sub: 'SteamGridDB', value: 'logo', icon: 'mdiFormatTitle' },
    { label: 'Change background', sub: 'SteamGridDB', value: 'hero', icon: 'mdiPanoramaVariantOutline' },
  ];
  if (Object.keys(has).length) opts.push({ label: 'Reset artwork', sub: 'Back to RomM and automatic logo', value: 'reset', icon: 'mdiRestore' });
  if (folderSystem.value) {
    if (marked.value) opts.push({ label: 'Unmark as installed', sub: 'Only removes the mark, no files are touched', value: 'unmark', icon: 'mdiCheckboxBlankOffOutline' });
    else if (!installedPath.value) opts.push({ label: 'Mark as installed', sub: 'For games you extracted yourself', value: 'mark', icon: 'mdiCheckboxMarkedCircleOutline' });
  }
  if (trophySystem.value) opts.push({ label: tro.value ? 'Change linked trophies' : 'Link to trophies', sub: 'Pick which emulator trophy set belongs to this game', value: 'trophies', icon: 'mdiLinkVariant' });
  // Android: Steam options only when Settings → Android → Steam & PC game apps is on
  const steamOn = !IS_ANDROID || store.config.android?.steamApps === true;
  if (IS_ANDROID && steamOn && PC_SLUGS.test(base.value.platform_slug || '')) opts.push({ label: 'Open in a PC game app', sub: installedPath.value ? 'GameNative, GameHub or Winlator' : 'Downloads it first', value: 'pcapp', icon: 'mdiMicrosoftWindows' });
  if (installedPath.value && steamOn) {
    const st = await call('steam:forRom', { romId: Number(props.romId) }).catch(() => null);
    if (st?.steam) {
      if (st.queued === 'add') opts.push({ label: 'Waiting to be added to Steam', sub: 'Apply from Settings → Steam', value: 'steamapply', icon: 'mdiSteam' });
      else if (st.inSteam) opts.push({ label: 'Remove from Steam', sub: st.ours ? 'Only the shortcut, not the game' : 'Added outside Cartridge', value: 'steamrm', icon: 'mdiSteam' });
      else opts.push({ label: 'Add to Steam', sub: 'Launches with your emulator setup', value: 'steamadd', icon: 'mdiSteam' });
      steamInfo = st;
    }
  }
  opts.push({ label: 'Refresh details from RomM', value: 'refresh', icon: 'mdiRefresh' });
  if (installedPath.value) opts.push({ label: 'Show file location', value: 'path', icon: 'mdiFolderOutline' });
  const v = await choose({ title: base.value.name, options: opts });
  if (!v) return;
  if (import.meta.env.MODE === 'android' && v === 'pcapp') { const { openInPcApp } = await import('../android/pcApps.js'); await openInPcApp({ ...base.value, id: Number(props.romId) }, installedPath.value); return; }
  if (v === 'steamadd') { await addGame({ ...base.value, id: Number(props.romId) }); return; }
  if (v === 'steamrm') {
    if (!steamInfo.ours && !(await confirm('Remove from Steam?', 'Cartridge did not add this shortcut. Remove it anyway?', 'Remove', true))) return;
    await removeGame(base.value, steamInfo.appid); return;
  }
  if (v === 'steamapply') { await applyChanges(); return; }
  if (v === 'mark' || v === 'unmark') { await setMark(v === 'mark'); return; }
  if (v === 'trophies') { await linkTrophies(); return; }
  if (v === 'path') { toast(installedPath.value, 'info', 5000, 'mdiFolder'); return; }
  if (v === 'refresh') { try { detail.value = await call('api:get', { path: `/api/roms/${props.romId}` }); resetLogos(props.romId); toast('Details refreshed', 'ok', 2000, 'mdiRefresh'); } catch (e) { toast(e.message, 'error'); } return; }
  if (v === 'reset') { store.art = { ...store.art }; delete store.art[props.romId]; await call('art:reset', { id: props.romId }); resetLogos(props.romId); toast('Artwork reset', 'ok', 2000, 'mdiRestore'); return; }
  if (!store.config.sgdbKey) { toast('Add a SteamGridDB API key in Settings → Look & feel first', 'error', 4500); return; }
  const url = await openModal('art', { kind: v, romName: base.value.name });
  if (!url) return;
  const o = await call('art:set', { id: props.romId, kind: v, url });
  store.art = { ...store.art, [props.romId]: o };
  if (v === 'logo') resetLogos(props.romId);
  if (v === 'hero') setBg({ src: img(url) });
  toast({ grid: 'Cover', logo: 'Logo', hero: 'Background' }[v] + ' updated', 'ok', 2000, 'mdiCheck');
}
function goVersion(id) { store.route = { ...store.route, params: { romId: id } }; }

watch([installedPath, () => dl.value?.status], async () => { await nextTick(); ensureFocus(el.value); });
onMounted(async () => {
  const hero = artFor(props.romId).hero;
  if (hero) setBg({ src: img(hero) });
  else if (cached.value) setBg(cached.value.shot ? { src: img(cached.value.shot) } : { src: cover(cached.value, true), blur: true });
  await nextTick();
  focusFirst(el.value);
  try {
    detail.value = await call('api:get', { path: `/api/roms/${props.romId}` });
    if (!hero && detail.value.merged_screenshots?.[0]) setBg({ src: img(detail.value.merged_screenshots[0]) });
  } catch (e) { if (!cached.value) toast(e.message, 'error'); }
  loadRa();
  loadTrophies();
  const p = platformById(base.value?.platform_id);
  if (p) call('fs:space', p.target?.path).then((s) => (space.value = s));
  await nextTick();
  ensureFocus(el.value);
});
</script>

<style scoped>
.game { padding: 0 0 50px; }
.g-banner { position: relative; margin: 18px 56px 0; height: clamp(190px, 34vh, 360px); border-radius: 16px; overflow: hidden; background: #141824; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.07); }
.g-banner-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.g-banner-img.blur { filter: blur(24px) saturate(1.3) brightness(0.8); transform: scale(1.15); }
.g-banner-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 8, 16, 0.78) 0%, rgba(8, 8, 16, 0.35) 45%, transparent 75%), linear-gradient(0deg, rgba(8, 8, 16, 0.7), transparent 55%); }
.g-banner-logo { position: absolute; left: 32px; bottom: 26px; right: 330px; display: flex; align-items: flex-end; }
.g-hero { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 40px; padding: 22px 56px 24px; }
.g-info { display: flex; flex-direction: column; gap: 16px; max-width: 760px; min-width: 0; }
.g-title { font-size: clamp(38px, 5vw, 68px); font-weight: 800; line-height: 1; letter-spacing: -0.025em; text-shadow: 0 8px 40px rgba(0, 0, 0, 0.55); }
.g-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 15px; color: #d4d8e2; }
.g-actions { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
.dlbox { width: 380px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.dest { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); max-width: 700px; white-space: nowrap; min-width: 0; }
.dest .mono { min-width: 0; }
.g-cover { flex: none; width: 250px; margin-top: -190px; margin-right: 26px; z-index: 2; aspect-ratio: 2/3; border-radius: 10px; overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08); transform: perspective(1000px) rotateY(-8deg); background: #161a25; }
.g-cover img { width: 100%; height: 100%; object-fit: cover; }
.noart { height: 100%; display: grid; place-items: center; padding: 20px; text-align: center; font-family: var(--display); font-size: 20px; }
.g-body { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 40px; padding: 16px 56px; background: linear-gradient(180deg, transparent, rgba(var(--tint-rgb), 0.45) 140px); }
.col { min-width: 0; }
.summary { margin: 0; line-height: 1.7; color: #cdd2dc; font-size: 15px; white-space: pre-line; max-width: 820px; }
.shots { padding: 18px 20px 18px 56px; margin: -8px 0 0 -56px; scroll-padding: 0 56px; }
.shot { flex: none; width: 340px; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; background: #161a25; transition: transform 0.2s var(--ease), box-shadow 0.2s; }
.shot img { width: 100%; height: 100%; object-fit: cover; }
.shot:focus { transform: scale(1.04); }
.facts { width: 250px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; align-self: start; box-sizing: border-box; }
.icon-btn span { font-size: 14px; }
.fact { display: flex; flex-direction: column; gap: 3px; word-break: break-word; }
.fact span { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
.fact b { font-weight: 400; font-size: 13.5px; }
.viewer { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.94); z-index: 40; display: grid; place-items: center; animation: fade 0.2s; }
.viewer img { max-width: 94vw; max-height: 84vh; border-radius: 7px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7); }
.vhint { position: absolute; bottom: 26px; display: flex; gap: 8px; align-items: center; color: var(--muted); font-size: 13px; }
@media (max-width: 1100px) { .g-body { grid-template-columns: minmax(0, 1fr) 200px; gap: 28px; } .g-cover, .facts { width: 200px; } .g-cover { margin-top: -150px; } .g-banner-logo { right: 270px; } }
.ra-sum { display: flex; align-items: center; gap: 14px; margin: -2px 0 4px; }
.ra-sum-bar { flex: 0 1 320px; height: 7px; }
.ra-sum-bar i { background: linear-gradient(90deg, #f5c542, #ffdf80); }
.small { font-size: 13px; }
.ra-badges { gap: 10px; padding: 12px 20px 12px 56px; margin: 0 0 0 -56px; }
.ra-b { flex: none; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; transition: transform 0.14s ease-out; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4); }
.ra-b img { width: 100%; height: 100%; display: block; }
.ra-b.locked { opacity: 0.55; }
.ra-b:focus { transform: scale(1.12); }
.tro-bar i { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); }
.tro-grades { display: inline-flex; gap: 10px; align-items: center; }
.tro-grades span { display: inline-flex; gap: 3px; align-items: center; }
.tro-ph { width: 100%; height: 100%; display: grid; place-items: center; background: rgba(0, 0, 0, 0.35); }
.ra-focus { font-size: 13px; margin: 2px 0 6px; max-width: 760px; }
</style>
