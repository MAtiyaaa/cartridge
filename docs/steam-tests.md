# Steam manager test harness

These lived only in the chat workspace and were never in the repo before. See `docs/HANDOFF.md` F5 and F6 for context.

These ran with Node 22 and Python 3 with `pip install vdf`. Paths are container paths; adapt them. `HOME` points at the fake home so `os.homedir()` finds the fake Steam.

Typical runs:
```bash
python3 steamfix.py                      # builds /tmp/sthome and /tmp/strun/...
mkdir -p /tmp/stud
HOME=/tmp/sthome DRIVE=/tmp/strun/media/deck/<drive> UD=/tmp/stud node steamtest.js
# alias mapping + duplicate names:
ln -sfn /tmp/strun/media/deck/<drive> /tmp/stalias
HOME=/tmp/sthome DRIVE=/tmp/strun/media/deck/<drive> ALIAS=/tmp/stalias DUPE=1 UD=/tmp/stud node steamtest.js
# apply (helper spawned with node itself unless APPIMAGE is set):
HOME=/tmp/sthome DRIVE=/tmp/strun/media/deck/<drive> UD=/tmp/stud APPLY=1 node steamtest.js
# then remove / undo / templates:
HOME=/tmp/sthome DRIVE=/tmp/strun/media/deck/<drive> UD=/tmp/stud node steamtest2.js
```
In the scripts, `<repo>` stands for your checkout; replace it before running.

### steamfix.py
```python
# Builds a fake Steam + mixed emulator setup modelled on real shortcuts (EmuDeck + AppImages)
import os, vdf, shutil, sys, json
H = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sthome'
DRIVE = sys.argv[2] if len(sys.argv) > 2 else '/tmp/strun/media/deck/<drive>'
shutil.rmtree(H, ignore_errors=True); shutil.rmtree(os.path.dirname(os.path.dirname(DRIVE)), ignore_errors=True)
EMU = f'{DRIVE}/EmuDeck/Emulation'
def mk(p, data=b''):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'wb').write(data if isinstance(data, bytes) else data.encode())
def exe(p): mk(p, '#!/bin/sh\necho "$0 $@" >> /tmp/stlaunch.log\n'); os.chmod(p, 0o755)
L = f'{EMU}/tools/launchers'
for n in ['pcsx2-qt.sh', 'dolphin-emu.sh', 'cemu.sh', 'duckstation.sh', 'retroarch.sh', 'xenia.sh', 'xemu.sh']: exe(f'{L}/{n}')
APPS = f'{H}/Documents/Apps'
for n in ['rpcs3-v0.0.37-x86_64.AppImage', 'shadPS4QtLauncher-qt-v1.0.AppImage', 'Eden-Linux-v0.0.3-amd64.AppImage']: exe(f'{APPS}/{n}')
os.makedirs(f'{APPS}/user/home', exist_ok=True); mk(f'{APPS}/user/config.json', '{}')
R = f'{EMU}/roms'
games = {
 'ps2/God of War.iso': 'x', 'ps2/Jak and Daxter.iso': 'x', 'ps2/Okami (USA).chd': 'x',
 'ps3/Demon\'s Souls [BLUS30443].iso': 'x', 'ps3/Uncharted 2 (USA).iso': 'PS3_DISC.SFB....BCUS98123....', 'ps3/Skate 3/PS3_GAME/USRDIR/EBOOT.BIN': 'x',
 'ps4/Bloodborne CUSA00900/eboot.bin': 'x', 'ps4/Gravity Rush 2/eboot.bin': 'x',
 'gc/Wind Waker.rvz': 'x', 'wii/Mario Galaxy.rvz': 'x', 'wiiu/roms/Zelda BOTW/code/U-King.rpx': 'x',
 'switch/Mario Odyssey.nsp': 'x', 'switch/Zelda TOTK.xci': 'x', 'psx/Crash.chd': 'x', 'snes/Mario World.sfc': 'x',
}
for k, v in games.items(): mk(f'{R}/{k}', v)
mk(f'{H}/.config/rpcs3/games.yml', 'BLUS30405: /x/\nBLUS30443: /x/\n')
os.makedirs(f'{H}/.config/retroarch/cores', exist_ok=True); mk(f'{H}/.config/retroarch/cores/snes9x_libretro.so', 'x')
S = f'{H}/.local/share/Steam'
uid = '87654321'
mk(f'{S}/config/loginusers.vdf', '"users"\n{\n\t"%d"\n\t{\n\t\t"AccountName"\t\t"tester"\n\t\t"PersonaName"\t\t"Tester"\n\t\t"MostRecent"\t\t"1"\n\t\t"Timestamp"\t\t"1700000000"\n\t}\n}\n' % (int(uid) + 76561197960265728))
mk(f'{S}/config/config.vdf', '"InstallConfigStore"\n{\n\t"Software"\n\t{\n\t\t"Valve"\n\t\t{\n\t\t\t"Steam"\n\t\t\t{\n\t\t\t\t"CompatToolMapping"\n\t\t\t\t{\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n}\n')
os.makedirs(f'{S}/userdata/{uid}/config/grid', exist_ok=True)
MAKO = f'{H}/.local/bin/mako-run'
def sc(name, exe, start, lo, last=0):
    return {'appid': 0, 'AppName': name, 'Exe': exe, 'StartDir': start, 'icon': '', 'ShortcutPath': '', 'LaunchOptions': lo, 'IsHidden': 0, 'AllowDesktopConfig': 1, 'AllowOverlay': 1, 'OpenVR': 0, 'Devkit': 0, 'DevkitGameID': '', 'DevkitOverrideAppID': 0, 'LastPlayTime': last, 'FlatpakAppID': '', 'tags': {'0': 'EmuDeck'}}
import zlib
def aid(exe, name): return (zlib.crc32((exe + name).encode()) | 0x80000000) & 0xffffffff
lst = [
 sc('God of War', f'"{L}/pcsx2-qt.sh"', f'"{L}"', f'{MAKO} %command% -batch -fullscreen -nogui "{R}/ps2/God of War.iso"', 5),
 sc('Jak and Daxter', f'"{L}/pcsx2-qt.sh"', f'"{L}"', f'%command% -batch -fullscreen -nogui "{R}/ps2/Jak and Daxter.iso"', 3),
 sc('Killzone 2', f'"{APPS}/rpcs3-v0.0.37-x86_64.AppImage"', '"/tmp/.mount_rpcs3AbCdE/usr/bin"', '--no-gui "%RPCS3_GAMEID%:BLUS30405"', 4),
 sc('The Last of Us Remastered', f'"{APPS}/shadPS4QtLauncher-qt-v1.0.AppImage"', f'"{APPS}"', '-d -g CUSA00552', 2),
 sc('Twilight Princess', f'"{L}/dolphin-emu.sh"', f'"{L}"', f'vblank_mode=0 LSFG_PROCESS=x %command% -b -e "{R}/gc/Twilight Princess.rvz"', 1),
 sc('Xenoblade', f'"{L}/dolphin-emu.sh"', f'"{L}"', f'vblank_mode=0 %command% -b -e "{R}/wii/Xenoblade.rvz"', 1),
 sc('Mario Kart 8', f'"{L}/cemu.sh"', f'"{L}"', f'%command% -f -g "{R}/wiiu/roms/Mario Kart 8/code/Turbo.rpx"', 1),
 sc('Zelda BOTW', f'"{L}/cemu.sh"', f'"{L}"', f'%command% -f -g "{R}/wiiu/roms/Zelda BOTW/code/U-King.rpx"', 1),
 sc('Metroid Prime 4', f'"{APPS}/Eden-Linux-v0.0.3-amd64.AppImage"', f'"{APPS}"', f'"-f" "-g" "{R}/switch/Metroid Prime 4.nsp"', 1),
 sc('Real Steam-ish app', '"/usr/bin/firefox"', '"/usr/bin"', '', 0),
]
for e in lst: a = aid(e['Exe'], e['AppName']); e['appid'] = a - (1 << 32)
data = {'shortcuts': {str(i): e for i, e in enumerate(lst)}}
open(f'{S}/userdata/{uid}/config/shortcuts.vdf', 'wb').write(vdf.binary_dumps(data))
cloud = [["user-collections.uc-abc", {"key": "user-collections.uc-abc", "timestamp": 1, "value": json.dumps({"id": "uc-abc", "name": "PlayStation", "added": [lst[0]["appid"] & 0xffffffff], "removed": []}), "version": "3"}],
         ["user-collections.uc-dyn", {"key": "user-collections.uc-dyn", "timestamp": 1, "value": json.dumps({"id": "uc-dyn", "name": "Dynamic", "filterSpec": {}}), "version": "1"}]]
mk(f'{S}/userdata/{uid}/config/cloudstorage/cloud-storage-namespace-1.json', json.dumps(cloud))
print('ok', H, DRIVE)
```

### steamtest.js
```js
// Unit-ish test of the Steam manager against the fake Steam in /tmp/sthome
const path = require('path'), fs = require('fs');
const HOME = process.env.HOME;
const DRIVE = process.env.DRIVE;
const ALIAS = process.env.ALIAS || DRIVE; // the library sees the drive under another mount path
const R = ALIAS + '/EmuDeck/Emulation/roms';
const PLATFORM_MAP = require('<repo>/electron/platformMap');
const plats = [['ps2', 'ps2'], ['ps3', 'ps3'], ['ps4', 'ps4'], ['ngc', 'gc'], ['wii', 'wii'], ['wiiu', 'wiiu'], ['switch', 'switch'], ['psx', 'psx'], ['snes', 'snes'], ['n64', 'n64']];
let id = 1;
const roms = {}, installed = {};
const files = {
  ps2: ['God of War.iso', 'Okami (USA).chd'], ps3: ["Demon's Souls [BLUS30443].iso", 'Uncharted 2 (USA).iso', 'Skate 3'], ps4: ['Bloodborne CUSA00900', 'Gravity Rush 2'],
  gc: ['Wind Waker.rvz'], wii: ['Mario Galaxy.rvz'], wiiu: ['roms/Zelda BOTW', 'roms/Splatoon'], switch: ['Mario Odyssey.nsp', 'Zelda TOTK.xci'], psx: ['Crash.chd'], snes: ['Mario World.sfc'], n64: ['Mario 64.z64'],
};
const library = { platforms: plats.map(([slug, fs], i) => ({ id: i + 1, slug, fs_slug: fs, display_name: slug.toUpperCase() })), roms };
for (const p of library.platforms) {
  roms[p.id] = [];
  for (const f of files[p.fs_slug] || []) {
    const r = { id: id++, name: path.basename(f).replace(/\.[a-z0-9]+$/i, '').replace(/\s*[\[(].*$/, ''), fs_name: path.basename(f), platform_slug: p.slug, platform_fs_slug: p.fs_slug };
    if (r.name === 'Skate 3' && process.env.DUPE) r.name = 'God of War';
    roms[p.id].push(r);
    installed[r.id] = `${R}/${p.fs_slug}/${f}`;
  }
}
const config = { steam: {} };
const mgr = require('<repo>/electron/steamManager')({
  USER_DATA: process.env.UD, log: (...a) => console.log('  log:', ...a), PLATFORM_MAP, getConfig: () => config, saveConfig: () => {}, broadcast: () => {}, getLibrary: () => library,
  installed: () => installed, MARKED: 'M', markedPath: () => null, romById: (i) => Object.values(roms).flat().find((r) => r.id === i),
  artFor: () => null, fetchImage: async () => null, sgdbImage: async () => null, cropTo: () => null, logoFile: async () => null,
  emulationRoots: () => [DRIVE + '/EmuDeck/Emulation'], isGamescope: () => false,
});
(async () => {
  const ov = mgr.overview();
  console.log('steam:', JSON.stringify(ov.steam), 'collections:', ov.collections.map((c) => c.name));
  for (const c of ov.consoles) console.log(`[${c.key}] ${c.games} games, ${c.inSteam} in Steam | ${c.template ? `${c.template.how} (${c.template.from})\n    Target ${c.template.exe}\n    Start  ${c.template.start}\n    LO     ${c.template.lo}` : 'NO TEMPLATE'}`);
  console.log('games:'); for (const g of ov.games) console.log(`  ${g.name} [${g.console}] inSteam=${g.inSteam}`);
  mgr.queueAdd(ov.games.filter((g) => !g.inSteam).map((g) => ({ romId: g.romId, collections: g.console.startsWith('ps') ? ['PlayStation'] : ['Nintendo New'] })));
  const pv = mgr.preview();
  console.log('\nPREVIEW for', pv.account);
  for (const e of pv.entries) console.log(`  ${e.name}\n    Target ${e.target}\n    Start  ${e.start}\n    LO     ${e.lo}${e.fallback ? '   (fallback ' + e.fallback + ')' : ''}  [${e.how}]`);
  console.log('skipped:', JSON.stringify(pv.skipped));
  if (process.env.APPLY) {
    process.env.CARTRIDGE_NO_SYSTEMD_RUN = '1';
    const r = await mgr.apply({ restart: !!process.env.RESTART });
    console.log('apply:', JSON.stringify(r));
  }
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
```

### steamtest2.js
```js
process.env.CARTRIDGE_NO_SYSTEMD_RUN = '1';
const fs = require('fs');
const base = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// reuse the same fake library setup as steamtest.js
const src = fs.readFileSync(__dirname + '/steamtest.js', 'utf8').split('(async () => {')[0];
eval(src + `
(async () => {
  let ov = mgr.overview();
  console.log('ours:', ov.ours, 'inSteam:', ov.games.filter((g) => g.inSteam).length + '/' + ov.games.length, 'report:', JSON.stringify(mgr.startupReport()));
  const ok = ov.games.find((g) => g.name === 'Okami');
  mgr.queueRemove([ok.appid]);
  console.log('preview removing:', JSON.stringify(mgr.preview().removing));
  await mgr.apply({ restart: false }); await sleep(1500);
  ov = mgr.overview();
  console.log('after remove ours:', ov.ours, 'okami inSteam:', ov.games.find((g) => g.name === 'Okami').inSteam, 'status:', JSON.stringify(mgr.lastStatus()));
  await mgr.undo(); await sleep(1500);
  ov = mgr.overview();
  console.log('after undo okami inSteam:', ov.games.find((g) => g.name === 'Okami').inSteam, 'status:', JSON.stringify(mgr.lastStatus()));
  console.log('missing collections:', JSON.stringify(mgr.verifyCollections()).slice(0, 200));
  console.log('test ps2:', JSON.stringify(mgr.test('ps2')), 'test n64:', JSON.stringify(mgr.test('n64')));
  mgr.setTemplate('n64', { exe: '/usr/bin/flatpak', start: '/usr/bin', lo: 'run org.libretro.RetroArch -L "/x/mupen.so" "{ROM}"' });
  console.log('n64 now:', JSON.stringify(mgr.overview().consoles.find((c) => c.key === 'n64').template));
  mgr.setMode('ps2', 'script'); mgr.queueAdd([{ romId: ov.games.find((g) => g.name === 'Mario 64').romId }]);
  console.log('n64 preview:', JSON.stringify(mgr.preview().entries));
})().catch((e) => { console.error('FAIL', e); process.exit(1); });`);
```

### vdf round-trip check (run after APPLY)
```python
import vdf, json, zlib, os
S='/tmp/sthome/.local/share/Steam/userdata/87654321/config/'
d=vdf.binary_loads(open(S+'shortcuts.vdf','rb').read())
bk=[f for f in os.listdir('/tmp/stud/steam-backups') if f.startswith('shortcuts')][0]
old=vdf.binary_loads(open('/tmp/stud/steam-backups/'+bk,'rb').read())
sc=list(d['shortcuts'].values()); o=list(old['shortcuts'].values())
for a,b in zip(o,sc[:len(o)]): assert a==b, (a,b)          # originals untouched
for e in sc[len(o):]:
    aid=(zlib.crc32((e['Exe']+e['AppName']).encode())|0x80000000)&0xffffffff
    assert (e['appid']&0xffffffff)==aid, e['AppName']      # Steam's appid formula
    print(e['AppName'],'|',e['LaunchOptions'])
for k,v in json.load(open(S+'cloudstorage/cloud-storage-namespace-1.json')):
    val=json.loads(v['value']); print(k, val.get('name'), len(val.get('added',[])), v['version'])
```

### Fake `steam` for helper tests (put its folder first on PATH)
```bash
#!/bin/bash
if [ "$1" = "-shutdown" ]; then echo "shutdown $(date +%T)" >> /tmp/fakesteam.log; kill $(cat /tmp/fakesteam.pid) 2>/dev/null; exit 0; fi
if [ "$1" != "--run" ]; then echo "start $(date +%T)" >> /tmp/fakesteam.log; setsid /tmp/fakesteam/steam --run >/dev/null 2>&1 & exit 0; fi
echo $$ > /tmp/fakesteam.pid
while true; do sleep 1; done
```
Run the helper through a built AppImage with: `PATH=/tmp/fakesteam:$PATH RESTART=1 APPIMAGE=<path to AppImage> APPIMAGE_EXTRACT_AND_RUN=1 HOME=... APPLY=1 node steamtest.js`. The comm name of that script is `steam`, which is what the helper's `steamRunning` looks for.

### Launch check environments (what `/opt/cartest/gm.sh` ran)
Each ran the AppImage as a normal user, with `env -i`, `CARTRIDGE_SMOKE=1 APPIMAGE_EXTRACT_AND_RUN=1`, under headless weston (`WAYLAND_DISPLAY=wl-test`) and Xvfb (`DISPLAY=:0`). Each had to print `SMOKE OK`, and the startup log line was checked:
1. `gamemode`: `XDG_CURRENT_DESKTOP=gamescope GAMESCOPE_WAYLAND_DISPLAY=gamescope-0 SteamGamepadUI=1 SteamDeck=1 XDG_SESSION_TYPE=x11` → expect `gpu=software gamescope=true`
2. `gamemode-wl`: `WAYLAND_DISPLAY=wl-test GAMESCOPE_WAYLAND_DISPLAY=gamescope-0 SteamGamepadUI=1` → software
3. `desktop`: `WAYLAND_DISPLAY=wl-test XDG_SESSION_TYPE=wayland XDG_CURRENT_DESKTOP=KDE KDE_FULL_SESSION=true SteamOS=1` → `gpu=hardware`
4. `steam-desktop`: desktop plus `SteamGameId=12345678901 SteamClientLaunch=1 LD_PRELOAD="<fake>/ubuntu12_32/gameoverlayrenderer.so:<fake>/ubuntu12_64/gameoverlayrenderer.so"` → software, `steam=true overlay=true`
5. `steam-big`: gamescope plus `SteamGameId=123 CARTRIDGE_FROM_STEAM=1 CARTRIDGE_BIG=1` → `gpu=hardware`

`st.sh` ran the generated `steam-launch.sh` with Steam's env (`LD_PRELOAD`, `LD_LIBRARY_PATH` set) and checked `SMOKE OK`, and that the log showed the variables before they were unset.
