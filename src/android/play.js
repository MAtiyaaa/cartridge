// Android: press Play and the game opens in the right emulator, and the "Ready to play" check that says
// what is missing when it can't. One composable per game page; the emulator scan is shared.
import { reactive, computed, watch, onScopeDispose } from 'vue';
import { App } from '@capacitor/app';
import { store, call, download, saveConfig, toast, choose, bytes, tab } from '../store.js';
import { Native } from './native.js';
import { EMUS, CONSOLES, BIOS, consoleKey, allPackages, candidatesFor, coreFor, planLaunch, familyOf, baseId, emuName, serialOf } from './emulators.js';
import { makeBundle, playablePath } from './bundle.js';

const MARKED = '(marked as installed)';

// ---- what is installed on this device (shared by every game page)
export const emus = reactive({ found: null, device: '', at: 0 });
let scanning = null;
export function scanEmulators(force = false) {
  if (emus.found && !force && Date.now() - emus.at < 4000) return Promise.resolve(emus.found);
  scanning ||= (async () => {
    try {
      const list = (await Native.packages({ list: allPackages() })).apps || [];
      const by = new Map(list.map((x) => [x.pkg, x]));
      const found = {};
      for (const [id, e] of Object.entries(EMUS)) {
        const app = e.apps.find((x) => by.has(x.pkg));
        if (app) found[id] = { ...app, version: by.get(app.pkg).version, label: by.get(app.pkg).label };
      }
      // Forks and betas under other package names (an Azahar beta, a yuzu fork): found by name among
      // the launchable apps, started with their family's intent
      const known = new Set(allPackages());
      const apps = (await Native.launchers({ all: true }).catch(() => ({ apps: [] }))).apps || [];
      for (const a of apps) {
        if (known.has(a.pkg)) continue;
        const fam = familyOf(a.pkg, a.label);
        if (fam && EMUS[fam]) found[`${fam}~${a.pkg}`] = { pkg: a.pkg, activity: EMUS[fam].apps[0]?.activity || "", version: a.version || '', label: a.label, fork: true };
      }
      emus.found = found;
      emus.at = Date.now();
      if (!emus.device) {
        const d = await Native.device().catch(() => null);
        if (d) {
          const m = (d.model || '').trim(), mf = (d.manufacturer || '').trim();
          emus.device = m.toLowerCase().includes(mf.toLowerCase()) ? m : `${mf === mf.toLowerCase() ? mf.charAt(0).toUpperCase() + mf.slice(1) : mf} ${m}`.trim();
        }
      }
    } catch { emus.found ||= {}; }
    scanning = null;
    return emus.found;
  })();
  return scanning;
}

export function usePlay(g) {
  const st = reactive({ scan: null, bios: null, storage: true, checked: false, launching: false });
  const cfg = () => store.config?.android || {};
  const key = computed(() => consoleKey(g.base()?.platform_slug, g.base()?.platform_fs_slug));
  const con = computed(() => (key.value ? CONSOLES[key.value] : null));
  const supported = computed(() => !!con.value && (con.value.emus.length > 0 || con.value.cores.length > 0));
  const cands = computed(() => (emus.found && supported.value ? candidatesFor(key.value, emus.found, cfg(), g.romId()) : []));
  const emuId = computed(() => cands.value[0] || null);
  const app = computed(() => (emuId.value ? emus.found[emuId.value] : null));
  const core = computed(() => (baseId(emuId.value) === 'retroarch' ? coreFor(key.value, cfg()) : null));
  const bundle = computed(() => makeBundle({ files: g.detail()?.files || [], prefix: g.detail()?.full_path ? g.detail().full_path + '/' : '', scan: st.scan }));
  const installed = computed(() => { const p = g.installedPath(); return p && p !== MARKED ? p : ''; });
  const confirmed = (k) => cfg().confirmed?.[k] === true;
  const confirm = (k) => saveConfig({ android: { confirmed: { [k]: true } } });
  // what to install when nothing is: the console's first standalone emulator, else RetroArch
  const wanted = computed(() => con.value?.emus[0] || 'retroarch');

  async function refresh() {
    const p = installed.value;
    st.scan = p ? await call('android:scan', p).catch(() => null) : null; // bundles need this for every console
    if (!supported.value) return;
    await scanEmulators();
    st.storage = (await Native.storageStatus().catch(() => ({ granted: true }))).granted;
    const b = con.value.bios && BIOS[con.value.bios];
    st.bios = b ? await call('android:bios', { dirs: b.dirs, names: b.names.source, minSize: b.minSize }).catch(() => ({ state: 'unknown' })) : null;
    st.checked = true;
  }

  // ---- the six checks
  const items = computed(() => {
    if (!supported.value) return [];
    const base = g.base(), d = g.dl(), out = [];
    const busy = d && ['queued', 'downloading'].includes(d.status);
    const pct = d?.total ? Math.floor((d.received / d.total) * 100) : 0;
    // ROM
    if (installed.value) out.push({ key: 'rom', label: 'ROM', status: 'ok', text: bytes(base?.fs_size_bytes || 0) + (bundle.value.extras ? ` · ${bundle.value.count} files` : '') });
    else if (g.installedPath() === MARKED) out.push({ key: 'rom', label: 'ROM', status: 'warn', text: 'Marked as installed. Cartridge can\'t start it without the real file.' });
    else if (busy) out.push({ key: 'rom', label: 'ROM', status: 'wait', text: d.status === 'queued' ? 'Queued to download' : `Downloading ${pct}%` });
    else out.push({ key: 'rom', label: 'ROM', status: 'bad', text: `Not on this device (${bytes(base?.fs_size_bytes || 0)})`, fix: { label: 'Download', auto: true, run: fixRom } });
    // Emulator
    if (app.value) out.push({ key: 'emu', label: 'Emulator', status: 'ok', text: `${emuName(emuId.value, emus.found)}${core.value ? ' · ' + core.value : ''}${app.value.version ? ' ' + app.value.version : ''}${planLaunch(emuId.value, app.value, { core: core.value, serial: serialOf(base?.fs_name, base?.name, installed.value) })?.openOnly ? ' · opens the app' : ''}`, change: cands.value.length > 1 || (CONSOLES[key.value].cores.length > 1 && !!core.value) });
    else out.push({ key: 'emu', label: 'Emulator', status: 'bad', text: `${EMUS[wanted.value].name} isn't installed`, fix: { label: `Get ${EMUS[wanted.value].name}`, auto: true, last: true, run: fixEmu } });
    // BIOS
    const b = con.value.bios && BIOS[con.value.bios];
    if (!b) out.push({ key: 'bios', label: 'BIOS', status: 'na', text: 'Not needed' });
    else if (confirmed('bios:' + con.value.bios) || st.bios?.state === 'ok') out.push({ key: 'bios', label: 'BIOS', status: 'ok', text: st.bios?.state === 'ok' ? 'Found' : 'Confirmed by you' });
    else if (!st.checked) out.push({ key: 'bios', label: 'BIOS', status: 'wait', text: 'Checking' });
    else if (st.bios?.state === 'missing' && !b.optional) out.push({ key: 'bios', label: 'BIOS', status: 'bad', text: `${b.label} missing`, fix: { label: 'How', run: fixBios } });
    else out.push({ key: 'bios', label: 'BIOS', status: 'warn', text: b.optional ? `${b.label}: optional` : `Can't check for the ${b.label}`, fix: { label: 'I have it', run: fixBios } });
    // Core (RetroArch only)
    if (!core.value) out.push({ key: 'core', label: 'Core', status: 'na', text: 'Not needed' });
    else if (confirmed('core:' + core.value)) out.push({ key: 'core', label: 'Core', status: 'ok', text: `${core.value} confirmed` });
    else out.push({ key: 'core', label: 'Core', status: 'warn', text: `Can't see inside RetroArch. Load the ${core.value} core there once.`, fix: { label: 'I have it', run: () => confirm('core:' + core.value) } });
    // Update
    const bd = bundle.value;
    if (!bd.updates) out.push({ key: 'update', label: 'Update', status: 'na', text: 'No update files' });
    else if (!installed.value) out.push({ key: 'update', label: 'Update', status: 'na', text: `${bd.latest?.version ? 'Update ' + bd.latest.version : 'Update'} comes with the download` });
    else if (bd.latest?.on) out.push({ key: 'update', label: 'Update', status: 'ok', text: bd.latest.version ? `Update ${bd.latest.version}` : 'Update on this device' });
    else out.push({ key: 'update', label: 'Update', status: 'warn', text: `${bd.latest?.version ? 'Update ' + bd.latest.version : 'An update'} is on your server, not on this device`, fix: { label: 'Re-download', run: fixUpdate } });
    // Storage
    const free = g.space()?.free;
    if (!st.storage) out.push({ key: 'storage', label: 'Storage', status: 'bad', text: 'Cartridge can\'t reach your ROM folders', fix: { label: 'Allow', auto: true, first: true, run: fixStorage } });
    else if (!installed.value && !busy && free != null && base?.fs_size_bytes > free) out.push({ key: 'storage', label: 'Storage', status: 'bad', text: `Needs ${bytes(base.fs_size_bytes)}, ${bytes(free)} free`, fix: { label: 'Free up space', run: () => { store.settingsSection = 'storage'; tab('settings'); } } });
    else out.push({ key: 'storage', label: 'Storage', status: 'ok', text: free != null ? `${bytes(free)} free` : 'Access allowed' });
    return out;
  });

  const needed = computed(() => items.value.filter((x) => x.status === 'bad'));
  const doubts = computed(() => items.value.filter((x) => x.status === 'warn'));
  const waiting = computed(() => items.value.some((x) => x.status === 'wait'));
  const state = computed(() => (needed.value.length ? 'needs' : waiting.value ? 'wait' : 'ready'));
  const fixable = computed(() => needed.value.some((x) => x.fix?.auto));

  // ---- fixes
  const rom = () => ({ ...g.base(), id: Number(g.romId()) });
  async function fixRom() { await download(rom()); }
  async function fixStorage() { await Native.requestStorage().catch(() => {}); toast('Allow access, then come back to Cartridge', 'info', 5000, 'mdiShieldCheckOutline'); }
  async function fixEmu() {
    const e = EMUS[wanted.value];
    try { await Native.openUrl({ url: e.get }); } catch (err) { toast(err.message, 'error'); }
  }
  async function fixBios() {
    const b = BIOS[con.value.bios];
    const v = await choose({ title: b.label, message: `${b.hint}\n\nCartridge never downloads or copies BIOS files. Android hides other apps' folders, so it can't always see them.`, options: [
      { label: 'I have it', sub: 'Stop asking for this console', value: 'yes', icon: 'mdiCheck' },
      { label: 'Check again', value: 'again', icon: 'mdiRefresh' },
      { label: 'Close', value: null, icon: 'mdiClose' },
    ] });
    if (v === 'yes') await confirm('bios:' + con.value.bios);
    if (v === 'again') await refresh();
  }
  async function fixUpdate() {
    await call('roms:delete', { romId: Number(g.romId()), path: installed.value }).catch(() => {});
    await download(rom());
  }
  // Everything Cartridge can do by itself, in an order that works: access first, then the game, then the emulator
  async function fixAll() {
    const todo = needed.value.filter((x) => x.fix?.auto);
    if (!todo.length) { toast(needed.value[0]?.text || 'Nothing to fix', 'info', 3500); return; }
    const first = todo.find((x) => x.fix.first);
    if (first) { await first.fix.run(); return; }
    for (const x of todo.filter((y) => !y.fix.last)) await x.fix.run();
    const last = todo.find((x) => x.fix.last);
    const left = needed.value.filter((x) => !x.fix?.auto).map((x) => x.text);
    if (left.length) toast(`Still needed: ${left.join(', ')}`, 'info', 6000, 'mdiAlertCircleOutline');
    if (last) await last.fix.run();
  }

  // ---- play
  async function launch() {
    if (st.launching) return;
    if (!supported.value) { toast('Cartridge can\'t start this console yet', 'info', 3500); return; }
    await scanEmulators(true);
    if (!installed.value) { toast(g.installedPath() === MARKED ? 'Marked games have no file to open' : 'Download it first', 'info', 3000); return; }
    if (!emuId.value) { toast(`${EMUS[wanted.value].name} isn't installed`, 'error', 4500); return; }
    // More than one emulator for this console and none picked yet: ask once, never guess
    const c = cfg();
    if (cands.value.length > 1 && !c.emus?.[key.value] && !c.gameEmus?.[g.romId()]) {
      const id = await choose({ title: `Which emulator do you use for ${con.value.name}?`, message: 'Cartridge remembers it for every game of this console. Change it any time from a game\'s More menu.', options: cands.value.map((x) => ({ label: emuName(x, emus.found), sub: [emus.found[x].version, emus.found[x].pkg].filter(Boolean).join(' · '), value: x, icon: 'mdiGamepadVariantOutline' })) });
      if (!id) return;
      await saveConfig({ android: { emus: { [key.value]: id } } });
    }
    st.launching = true;
    try {
      const scan = st.scan || await call('android:scan', installed.value);
      let path = playablePath(installed.value, bundle.value, scan);
      if (!path) throw new Error('Cartridge couldn\'t find the game file inside its folder');
      const folder = key.value === 'ps3' && scan.folder && !/\.(iso|bin)$/i.test(path);
      if (folder) path = installed.value;
      const plan = planLaunch(emuId.value, app.value, { core: core.value, folder, serial: serialOf(g.base()?.fs_name, g.base()?.name, installed.value) });
      if (plan.openOnly) {
        // this emulator can't be told which game (or needs a title ID this game doesn't carry): open it
        await Native.openApp({ pkg: plan.pkg });
        toast(`Opened ${emuName(emuId.value, emus.found)}. Pick the game inside it.`, 'info', 5000, 'mdiOpenInNew');
      } else await Native.launchGame({ ...plan, path });
    } catch (e) { toast(e.message, 'error', 6500); }
    st.launching = false;
  }

  // ---- choosing the emulator: for this game, or every game of the console
  async function pickEmulator() {
    if (cands.value.length < 1) return;
    const cur = emuId.value;
    const id = cands.value.length === 1 ? cur : await choose({ title: 'Emulator', options: cands.value.map((x) => ({ label: emuName(x, emus.found), sub: [emus.found[x].version, emus.found[x].fork ? emus.found[x].pkg : ''].filter(Boolean).join(' · ') || undefined, value: x, icon: 'mdiGamepadVariantOutline', selected: x === cur })) });
    if (!id) return;
    let c = core.value;
    if (baseId(id) === 'retroarch' && con.value.cores.length > 1) {
      c = await choose({ title: 'RetroArch core', options: con.value.cores.map((x) => ({ label: x, value: x, icon: 'mdiPuzzleOutline', selected: x === c })) }) || c;
    }
    const scope = await choose({ title: `Use ${emuName(id, emus.found)}${baseId(id) === 'retroarch' ? ' · ' + c : ''} for`, options: [
      { label: 'This game only', value: 'game', icon: 'mdiGamepadVariantOutline' },
      { label: `Every ${con.value.name} game`, value: 'console', icon: 'mdiControllerClassic' },
    ] });
    if (!scope) return;
    const patch = scope === 'game' ? { gameEmus: { [g.romId()]: id } } : { emus: { [key.value]: id } };
    if (baseId(id) === 'retroarch' && c) patch.cores = { [key.value]: c };
    await saveConfig({ android: patch });
  }

  const ro = watch([() => g.installedPath(), () => g.dl()?.status, () => !!g.detail(), supported], refresh, { immediate: true });
  let sub = null;
  App.addListener('resume', () => { scanEmulators(true).then(refresh); }).then((h) => { sub = h; });
  onScopeDispose(() => { ro(); sub?.remove(); });

  // reactive() unwraps the refs, so templates read ap.state, ap.items ... directly
  return reactive({ key, con, supported, cands, emuId, app, core, bundle, items, needed, doubts, state, fixable, installed, launch, fixAll, pickEmulator, refresh, st });
}
