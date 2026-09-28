<template>
  <section class="lv">
    <div class="lv-head">
      <label class="lv-search">
        <Icon name="mdiMagnify" :size="20" />
        <input v-model="q" type="search" placeholder="Search games" enterkeyhint="search" />
        <button v-if="q" aria-label="Clear" @click="q = ''"><Icon name="mdiClose" :size="18" /></button>
      </label>
      <div class="lv-chips">
        <button class="lv-chip" :class="{ on: !pid }" @click="pid = 0">All <small>{{ total }}</small></button>
        <button v-for="p in platforms" :key="p.id" class="lv-chip" :class="{ on: pid === p.id }" @click="pid = p.id">
          {{ p.display_name }} <small>{{ p.rom_count }}</small>
        </button>
      </div>
    </div>

    <div ref="scroller" class="lv-scroll" @scroll.passive="onScroll">
      <div v-if="!store.lib" class="lv-empty"><span class="spinner" /></div>
      <div v-else-if="!list.length" class="lv-empty">
        <Icon name="mdiGamepadVariantOutline" :size="36" />
        <p>{{ q ? `Nothing matches "${q}"` : 'No games here yet' }}</p>
      </div>
      <div v-else class="lv-grid">
        <button v-for="r in shown" :key="r.id" class="lv-card" @click="open(r)">
          <div class="lv-art">
            <img v-if="cover(r)" :src="cover(r)" loading="lazy" decoding="async" alt="" />
            <div v-else class="lv-ph"><Icon name="mdiGamepadVariantOutline" :size="28" /></div>
            <span v-if="homes(r.id).length" class="lv-have" :title="homes(r.id).map((d) => d.name).join(', ')">
              <Icon name="mdiCheck" :size="12" />{{ homes(r.id).length > 1 ? homes(r.id).length : '' }}
            </span>
            <i v-if="activeFor(r.id)" class="lv-prog"><b :style="{ width: pct(activeFor(r.id)) + '%' }" /></i>
          </div>
          <span class="lv-t">{{ r.name }}</span>
        </button>
      </div>
    </div>

    <!-- Game sheet -->
    <Teleport to="body">
    <Transition name="sheet">
      <div v-if="rom" class="lv-scrim" @click.self="rom = null">
        <div class="lv-sheet">
          <div class="lv-grab" />
          <div class="lv-top">
            <div class="lv-cov"><img v-if="cover(rom, true)" :src="cover(rom, true)" alt="" /><Icon v-else name="mdiGamepadVariantOutline" :size="34" /></div>
            <div class="lv-meta">
              <h2>{{ rom.name }}</h2>
              <p>{{ [rom.platform_display_name, year(rom.year), bytes(rom.fs_size_bytes)].filter(Boolean).join(' · ') }}</p>
              <p v-if="rom.genres?.length" class="lv-dim">{{ rom.genres.join(', ') }}</p>
            </div>
          </div>
          <p v-if="rom.summary" class="lv-sum">{{ rom.summary }}</p>

          <h3>On these devices</h3>
          <div class="lv-on">
            <span v-for="d in paired" :key="d.id" class="lv-dchip" :class="{ yes: has(d, rom.id) }">
              <Icon :name="has(d, rom.id) ? 'mdiCheckCircle' : kindIcon(d.kind)" :size="15" />{{ d.name }}
            </span>
          </div>

          <h3>Download to</h3>
          <div class="lv-targets">
            <div v-for="d in paired" :key="d.id" class="lv-tg" :class="{ off: !d.online }">
              <div class="lv-tg-ic"><Icon :name="kindIcon(d.kind)" :size="22" /></div>
              <div class="lv-tg-body">
                <b>{{ d.name }}<span v-if="d.info?.battery" class="lv-bat"><Icon :name="batteryIcon(d.info.battery)" :size="13" />{{ d.info.battery.level }}%</span></b>
                <small v-if="targets[d.id] && !targets[d.id].path" class="lv-warn">No {{ rom.platform_display_name }} folder yet. Choose one on {{ d.name }} in Settings.</small>
                <template v-else-if="targets[d.id]">
                  <small class="lv-path"><Icon name="mdiFolderOutline" :size="13" />{{ short(targets[d.id].path) }}</small>
                  <small class="lv-dim">
                    {{ targets[d.id].exists ? 'Folder found' : 'Folder will be created' }}<template v-if="freeOn(d, targets[d.id].path) != null"> · {{ bytes(freeOn(d, targets[d.id].path)) }} free</template>
                  </small>
                </template>
                <small v-else class="lv-dim">{{ d.online ? 'Checking…' : 'Offline' }}</small>
              </div>
              <span v-if="has(d, rom.id)" class="lv-state ok"><Icon name="mdiCheck" :size="15" />Installed</span>
              <span v-else-if="jobOn(d, rom.id)" class="lv-state">{{ jobOn(d, rom.id).status === 'queued' ? 'Queued' : pct(jobOn(d, rom.id)) + '%' }}</span>
              <button v-else-if="!targets[d.id] || targets[d.id].path" class="lv-dl" :disabled="!d.online || !targets[d.id]?.path || sending === d.id" @click="send(d)">
                <Icon name="mdiDownload" :size="18" />{{ sending === d.id ? 'Sending' : 'Get' }}
              </button>
            </div>
            <p v-if="!paired.length" class="lv-dim">Connect a device first.</p>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { store, visiblePlatforms, romsOf, allRoms, platformById, cover, bytes, year, toast } from '../store.js';
import { hub, pairedDevices, callOn, kindIcon, batteryIcon, pct } from './hub.js';
import Icon from '../components/Icon.vue';

const q = ref('');
const pid = ref(0);
const limit = ref(60);
const scroller = ref(null);

const platforms = computed(() => visiblePlatforms().filter((p) => p.rom_count > 0));
const total = computed(() => platforms.value.reduce((n, p) => n + (p.rom_count || 0), 0));
const list = computed(() => {
  const base = pid.value ? romsOf(pid.value) : allRoms();
  const s = q.value.trim().toLowerCase();
  const out = s ? base.filter((r) => r.name?.toLowerCase().includes(s)) : base.slice();
  return out.sort((a, b) => a.name.localeCompare(b.name));
});
const shown = computed(() => list.value.slice(0, limit.value));
watch([q, pid], () => { limit.value = 60; if (scroller.value) scroller.value.scrollTop = 0; });
function onScroll(e) {
  const el = e.target;
  if (el.scrollTop + el.clientHeight > el.scrollHeight - 600 && limit.value < list.value.length) limit.value += 60;
}

// what each paired device has installed (refreshed in the background)
const paired = computed(() => pairedDevices.value.slice().sort((a, b) => (a.id === hub.selected ? -1 : b.id === hub.selected ? 1 : a.name.localeCompare(b.name))));
const installed = reactive({});
async function loadInstalled() {
  await Promise.all(paired.value.map(async (d) => {
    if (d.id === hub.selected) return;
    try { installed[d.id] = await callOn(d.id, 'installed:get'); } catch {}
  }));
}
loadInstalled();
const timer = setInterval(loadInstalled, 15000);
onBeforeUnmount(() => clearInterval(timer));

const mapOf = (d) => (d.id === hub.selected ? store.installed : installed[d.id]) || {};
const has = (d, id) => !!mapOf(d)[id];
const homes = (id) => paired.value.filter((d) => has(d, id));
const jobOn = (d, id) => (d.dls || []).find((x) => x.romId === id && ['queued', 'downloading'].includes(x.status));
function activeFor(id) { for (const d of paired.value) { const j = jobOn(d, id); if (j) return j; } return null; }
const short = (p) => { const parts = p.split('/').filter(Boolean); return parts.length > 3 ? '…/' + parts.slice(-3).join('/') : p; };
function freeOn(d, target) {
  const st = d.info?.storage || [];
  const hit = st.filter((s) => target.startsWith(s.path)).sort((a, b) => b.path.length - a.path.length)[0] || st[0];
  return hit ? hit.free : null;
}

// ---------------- game sheet
const rom = ref(null);
const targets = reactive({});
async function open(r) {
  rom.value = r;
  for (const k of Object.keys(targets)) delete targets[k];
  const p = platformById(r.platform_id);
  const want = [{ slug: r.platform_slug || p?.slug, fs_slug: r.platform_fs_slug || p?.fs_slug }];
  loadInstalled();
  await Promise.all(paired.value.map(async (d) => {
    try { const res = await callOn(d.id, 'platforms:paths', want); targets[d.id] = res[want[0].slug] || { path: '' }; } catch {}
  }));
}
const sending = ref('');
async function send(d) {
  const r = rom.value;
  sending.value = d.id;
  try {
    await callOn(d.id, 'dl:add', { romId: r.id, name: r.name, platformSlug: r.platform_slug, platformName: r.platform_display_name, size: r.fs_size_bytes, cover: r.path_cover_small || r.url_cover });
    d.dls = await callOn(d.id, 'dl:list').catch(() => d.dls);
    toast(`Downloading ${r.name} on ${d.name}`, 'info', 2400, 'mdiDownload');
  } catch (e) { toast(e.message, 'error', 4000); }
  sending.value = '';
}
</script>

<style scoped>
.lv { display: flex; flex-direction: column; }
.lv-head { padding: 4px 16px 10px; display: flex; flex-direction: column; gap: 10px; }
.lv-search { display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; border-radius: 16px; background: rgba(255, 255, 255, 0.07); border: 1px solid var(--line-2); color: var(--muted); transition: border-color 0.2s, box-shadow 0.2s; }
.lv-search:focus-within { border-color: rgba(var(--primary-l-rgb), 0.6); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.16); }
.lv-search input { flex: 1; min-width: 0; background: none; border: 0; outline: none; color: var(--text); font: 500 15px var(--body); }
.lv-search input::-webkit-search-cancel-button { display: none; }
.lv-search button { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--muted); }
.lv-chips { display: flex; gap: 8px; overflow-x: auto; margin: 0 -16px; padding: 0 16px; scrollbar-width: none; }
.lv-chips::-webkit-scrollbar { display: none; }
.lv-chip { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line); color: var(--muted); font: 500 13px var(--body); white-space: nowrap; transition: background 0.2s, color 0.2s; }
.lv-chip small { font-size: 11px; opacity: 0.7; font-variant-numeric: tabular-nums; }
.lv-chip.on { background: rgba(var(--primary-rgb), 0.3); border-color: rgba(var(--primary-l-rgb), 0.5); color: #fff; }
.lv-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 24px; -webkit-overflow-scrolling: touch; }
.lv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 16px 12px; }
.lv-card { display: flex; flex-direction: column; gap: 7px; text-align: left; color: var(--text); }
.lv-card:active .lv-art { transform: scale(0.97); }
.lv-art { position: relative; aspect-ratio: 2 / 3; border-radius: var(--card-r, 10px); overflow: hidden; background: linear-gradient(160deg, #1d2231, #10131b); box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.06); transition: transform 0.15s ease-out; }
.lv-art img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
.lv-ph { position: absolute; inset: 0; display: grid; place-items: center; color: rgba(255, 255, 255, 0.28); background: linear-gradient(160deg, #2a2346, #12141d 70%); }
.lv-have { position: absolute; top: 6px; right: 6px; display: inline-flex; align-items: center; gap: 2px; height: 20px; min-width: 20px; padding: 0 5px; justify-content: center; border-radius: 999px; background: rgba(63, 185, 80, 0.92); color: #06130a; font: 700 10.5px var(--body); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4); }
.lv-prog { position: absolute; left: 6px; right: 6px; bottom: 6px; height: 5px; border-radius: 3px; background: rgba(0, 0, 0, 0.65); overflow: hidden; }
.lv-prog b { display: block; height: 100%; background: var(--grad); transition: width 0.3s; }
.lv-t { font-size: 12.5px; line-height: 1.3; color: #e6e8ee; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lv-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 70px 20px; color: var(--muted); text-align: center; }
.lv-empty p { margin: 0; font-size: 14px; }

.lv-scrim { position: fixed; inset: 0; z-index: 20; display: flex; align-items: flex-end; background: rgba(3, 4, 8, 0.55); backdrop-filter: blur(4px); }
.lv-sheet { width: 100%; max-height: 88vh; overflow-y: auto; padding: 10px 20px calc(env(safe-area-inset-bottom) + 20px); border-radius: 26px 26px 0 0; background: rgba(18, 20, 30, 0.97); border-top: 1px solid var(--line-2); }
.lv-grab { width: 44px; height: 5px; border-radius: 3px; background: var(--line-2); margin: 0 auto 16px; }
.lv-top { display: flex; gap: 16px; align-items: flex-end; }
.lv-cov { display: grid; place-items: center; color: rgba(255, 255, 255, 0.25); flex: none; width: 96px; aspect-ratio: 2 / 3; border-radius: 12px; overflow: hidden; background: #1a1d28; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5); }
.lv-cov img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lv-meta { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.lv-meta h2 { margin: 0; font: 700 21px/1.2 var(--display); }
.lv-meta p { margin: 0; font-size: 13px; color: var(--muted); }
.lv-sum { margin: 14px 0 0; font-size: 13.5px; line-height: 1.55; color: #cfd3dd; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.lv-sheet h3 { margin: 20px 0 10px; font: 600 11px var(--body); text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
.lv-on { display: flex; flex-wrap: wrap; gap: 8px; }
.lv-dchip { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line); color: var(--dim); font-size: 12.5px; }
.lv-dchip.yes { background: rgba(63, 185, 80, 0.14); border-color: rgba(63, 185, 80, 0.4); color: var(--green-l); }
.lv-targets { display: flex; flex-direction: column; gap: 8px; }
.lv-tg { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 14px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line); }
.lv-tg.off { opacity: 0.5; }
.lv-tg-ic { flex: none; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: var(--primary-t); background: rgba(var(--primary-rgb), 0.18); }
.lv-tg-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.lv-tg-body b { display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 600; }
.lv-bat { display: inline-flex; align-items: center; gap: 2px; font-size: 11.5px; font-weight: 500; color: var(--muted); font-variant-numeric: tabular-nums; }
.lv-tg-body small { font-size: 12px; }
.lv-path { display: flex; align-items: center; gap: 4px; color: #cfd3dd; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lv-path .icon { flex: none; }
.lv-dim { color: var(--muted); font-size: 12.5px; margin: 0; }
.lv-warn { color: #ffc48f; font-size: 12px !important; line-height: 1.4; }
.lv-dl { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border-radius: 999px; background: var(--grad); color: var(--on-primary); font: 700 13.5px var(--body); box-shadow: 0 6px 18px rgba(var(--primary-rgb), 0.35); transition: opacity 0.2s, transform 0.15s; }
.lv-dl:active { transform: scale(0.96); }
.lv-dl:disabled { opacity: 0.4; box-shadow: none; }
.lv-state { flex: none; display: inline-flex; align-items: center; gap: 4px; font: 600 12.5px var(--body); color: var(--primary-t); font-variant-numeric: tabular-nums; }
.lv-state.ok { color: var(--green-l); }
</style>
