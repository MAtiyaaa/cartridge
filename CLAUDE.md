# Cartridge

A controller-first RomM client for SteamOS and Bazzite, shipped as one AppImage. It is added to Steam and used mostly in Game Mode, on a 1080p handheld and a 4K TV.

This file is the short version every session needs. The full handoff (history, every decision, the reasons behind odd-looking code, test notes) is in **`docs/HANDOFF.md`**. Read the parts that relate to your task before changing code. The Steam manager test scripts are in `docs/steam-tests.md`.

## Stack and layout
- Electron main process (`electron/`) plus a Vue 3 UI (`src/`). No router, no Pinia, no UI kit.
- The UI talks to main only through `window.cart.call(channel, arg)` (wrapped as `call()` in `src/store.js`). Every handler returns `{ ok, data | error }`. Live events come back through `broadcast()` and `window.cart.on()`.
- `electron/main.js`: config, RomM API, library mirror (`library.json`), downloads, `romimg://` images, logos, SteamGridDB, RetroAchievements, updater, rendering choice, single instance, IPC.
- `electron/steamManager.js` + `electron/steamHelper.js`: adding games to Steam (0.6). `electron/steamArt.js`: adding Cartridge itself to Steam.
- `electron/trophies.js` + `electron/trophyService.js`: read-only emulator trophies and RomM notes sync.
- `src/nav.js`: controller focus engine. `src/themes.js`, `src/bgRenderers.js`, `src/sfx.js`: look and feel.
- User data lives in `~/.config/Cartridge/` (list in HANDOFF E4).

## How to work in this repo
- Work on the session's branch, never directly on `main`. **Standing instruction from the owner:** when an update is finished, built and launch-checked, open the PR and merge it to `main` to release it without asking again. Problems get fixed together afterwards.
- **Never change `version` in `package.json` unless the owner asks for a release.** A version change on `main` builds and publishes a release to every user automatically.
- Check every change builds: `npm ci --ignore-scripts && npx vite build` (the cloud container can't download Electron, so the full `npm run dist` may not work here).
- `npm test` runs the detection tests in `test/` (CI runs it before every release build). Everything else is checked by hand: say plainly what was checked and what the owner must test on a device (controller, Game Mode, Steam, TV size).
- Keep changes minimal and match the surrounding code: dense, short comments that explain why.
- Before committing, grep the diff for private info (usernames, IPs, domains, emails, local paths). The repo is public.

## The owner's rules
- Never use em dashes anywhere: UI text, notes, commits, messages. Use commas, colons, full stops, or "·" in titles.
- Plain, direct, not AI-sounding writing. British spelling in feature names ("Colour", "Customisation").
- **No UI overhauls or visual changes beyond what was asked.** Ask first. When a design change is wanted, offer options.
- The design skills in `.claude/skills/` (animate, apple-design, emil-design-eng, taste-skill with redesign/soft/minimalist, img2threejs and the rest) are used only when the owner asks for them. taste-skill and img2threejs are third-party (MIT, Apache 2.0), kept as published.
- When the owner says "don't build yet" or "just answer", don't change code.
- Test that it launches before anything is released. Release notes say exactly what changed.
- Nothing private in the repo or releases.
- Cartridge never touches saves, never downloads or launches emulators itself, and never modifies emulator files.
- **Cartridge is for everyone, not the owner's setup.** Users run SteamOS, Bazzite, other image-based systems and ordinary desktop distros, with emulators from EmuDeck, Flatpak, AppImages, distro packages or Steam (RetroArch), in any mix and any version. Never hard-code the owner's paths, emulators or choices. Detect what is installed, prefer what the user already uses (their Steam shortcuts), let them pick, and fail with a clear message rather than a wrong guess. Test Steam and emulator changes against several setups (EmuDeck, Flatpak only, distro packages, AppImages, nothing installed), not one.
- Paths: home can be a symlink (/home to /var/home on Bazzite and Fedora Atomic), and sandboxed (Flatpak) apps may not follow it. Hand emulators real paths, or names they resolve themselves (RetroArch cores).

## Controls (don't change without asking)
LT/RT switch top tabs. LB/RB only switch sections inside a page. A select, B back, X download or page action, Y search or More, Start Quick Menu, Select Downloads. Every screen must work with a controller, touch and mouse, at 1280x800, 1920x1080 and 3840x2160, with nothing clipped.

## Do not change (full table with reasons: HANDOFF D5)
- Never append `no-sandbox` at runtime (renderer crash 133). `--no-sandbox` only on the `steam-launch.sh` exec line and LAST in the Steam helper argv.
- Rendering rules in `main.js`: software in Game Mode or under Steam on small screens, GPU on big screens, the GPU-crash fallback and the big-window GPU relaunch.
- `steam-launch.sh` (unsets `LD_PRELOAD`/`LD_LIBRARY_PATH`, sets `CARTRIDGE_FROM_STEAM=1`), rewritten on every start.
- The artifact name `Cartridge-x86_64.AppImage`, the `CARTRIDGE_SMOKE` launch check, and `APPIMAGE_EXTRACT_AND_RUN=1` in CI.
- Steam must be closed before `shortcuts.vdf` is written. The helper is copied out of the AppImage and run through `systemd-run --user ... KillMode=process`. Steam's appid formula with quotes around the exe. Existing shortcuts are kept exactly.
- Shortcut learning: keep Target, Start in and Launch options, strip frame generation wrappers (mako-run, lsfg), keep `vblank_mode`, keep quoting, first `/roms/` in a path, replace `/tmp/.mount_` Start In, `styled()` path aliases.
- Trophies: read only; unlocks only added, earliest wins; notes title prefix `'Cartridge troph'`; picture notes under 44,000 characters; folders de-duplicated by device:inode; icons served by token only.
- Touch (rebuilt in 0.8.2 at the owner's request): real touches scroll natively (`touch-action: pan-x pan-y`); mouse-typed pointers (Game Mode can send touches as mouse) use the drag in `nav.js` (applied once per frame, momentum). The app starts in pad mode; instant scroll while a direction is held.
- Delete refuses the ROMs root and console folders; a mark never touches files.
- Single modal slot: nested dialogs save `store.modal.resolve` and reopen themselves (see FolderPicker, SteamCollections, SteamEmu).
- Square-only game icons (`iconOpaque`), `sgScore` match ranking.

## Known issues (details: HANDOFF Part B, "Other bugs" list, and F4)
- The Steam manager has never run against a real Steam client. Treat real-device reports about it as expected beta issues. The least tested parts are listed in HANDOFF F6.
- `steam-games.json` is written before the helper finishes (F4); since 0.9.19 `reconcile()` drops what isn't in shortcuts.vdf at the next start.

## Since the handoff (0.6.1)
- Fixed: helper backup overwrite (per-job lock in `steamHelper.js`, backups never replaced), `addToSteam` key gap, Y on Search, Steam apply progress (`steam-progress` broadcast, top bar pill).
- Download checksums in `main.js` (`checkFile`/`checkFiles`): size for every file, md5/sha1 except zip/7z/rar/chd (RomM hashes their contents). Damaged files are deleted; an identical repeat means RomM's checksum is stale and the file is kept (`notice: 'stale'`).
- Storage manager: `storage:overview` in `main.js`, `src/components/StorageManager.vue`; space check before downloads in `store.download` (`roomFor`).
- Look presets: `config.lookPresets` (up to 5, `LOOK_KEYS` in `Settings.vue`).
- QR pairing: RomM's device flow `/api/auth/device/init` and `/token` (`server:qrStart`, `server:qrPoll`), `config.deviceId`, the `qrcode` package in `Setup.vue`.
- A mock RomM and Playwright checks for these were used in the session; they are not in the repo.

## 0.7.0 (The Library Update)
- slimRom adds `igdb_id`, `series`, `modes`, `players`, `votes`, `hours` (HLTB), `similar`, `user` (RomM `rom_user`: status, backlog, playing, hidden, played).
- Collections: `col:*`, `fav:set`, `rom:user` in `main.js` (`colHandlers`, `apiForm` multipart). Automatic lists, series and genres are built in `store.js` (`autoCollections`, `genres`). QR pairing asks for `collections.write`.
- Top bar tabs: `config.ui.tabs`, `TAB_DEFS`/`activeTabs()` in `store.js`; Settings always shown.
- PS4/PS5 zips: `unzipGame` (yauzl) after `checkFiles`; unpacks to `<name>.partial`, flattens one top folder, then deletes the zip.
- Queue: `dl:move`, `dl:pauseAll`, `dl:resumeAll`, `config.downloads.limitMBs` (`rateWait`). `it.running` stops a resumed item starting a second run before the stopped one ends.
- Recently played: `steam:played` (shortcuts LastPlayTime). Select many: Gallery `selecting`, `addGames` in `steam.js`.

## 0.7.5
- Settings → Steam: console cards open `src/views/SteamConsole.vue` (route `steam-console`, param `ckey`); the old emulator menu lives in its More.
- HLTB: `electron/hltb.js` (RomM's wire contract, search URL read from RomM's repo, cache `hltb.json`, `CARTRIDGE_HLTB_BASE` for tests); the game page prefers RomM's `hltb_metadata`.
- `nav.js`: focusing the first item in a `[data-scroll]` scrolls it to the top. Scrolling lists need `data-scroll` and `flex: none` rows (Menu, SteamCollections).
- `CollTile` `wide` for collections and series; SysTile clips its strip and glyph in `.sys-clip`.

## 0.7.6
- Live Steam changes: `electron/steamLive.js` talks to Steam's CEF port 127.0.0.1:8080 (open when `.cef-enable-remote-debugging` is in the Steam root, which Decky creates) and runs `SteamClient.Apps.AddShortcut` etc. in `SharedJSContext`. `apply()` uses it when available, else the helper. Steam picks the appid, so the registry moves to it; `reg[id].live` counts it as in Steam before Steam saves shortcuts.vdf. `restartSteam` uses `SteamClient.User.StartRestart(false)`. `CARTRIDGE_CEF_PORT` for tests.
- After a live logo, `appDetailsStore.SaveCustomLogoPosition` (as decky-steamgriddb does), or shortcut logos stay blank.
- Helper in Game Mode polls every 100 ms and writes at once (Game Mode restarts Steam immediately).
- Game page More: artwork options grouped under "Change metadata".

## 0.7.8
- Emulators per console: `EMUS` (standalone, args copied from EmuDeck's SRM parsers) and `CORES` in `steamManager.js`; `candidates(key)` lists what is installed. RetroArch cores go by name (`-L snes9x_libretro.so`), never a full path (Flatpak RetroArch on /var/home can't see /home paths). Xbox: `xemu-emu.sh -full-screen -dvd_path`. Xbox 360: `"Z:{ROM}"`.
- `templateFor`: yours > picked (`config.steam.emus[key]`) > learned > first candidate. Shortcuts store `sig`; `outdated` counts ours with another sig; `steam:refresh` re-adds them.
- `readShortcuts` splits args out of Exe (SRM `appendArgsToExecutable`) into `%command% <args>`; `Z:` paths understood.
- Icons: `<appid>_icon.png` in grid (SGDB icon via `gameIconPng`, else cover cropped); live `SetShortcutIcon`, helper sets `icon`.
- Library: series merged by word subset (`STOP` words), games de-duplicated; Gallery `groups` splits collection/genre by console; `GenreTile.vue`.

## 0.7.9
- Emulator detection covers every install kind: `EMU` (per emulator: EmuDeck `scripts`, AppImage `app` pattern, Flatpak ids `fp`, program names `bin`, `args`) and `EMUS` (console -> emulator ids). `candidates()` lists each copy found (first keeps the plain id, others `id@src`). RetroArch from EmuDeck, Flatpak, AppImage, distro package or Steam, each with its own cores; only the sandboxed ones get cores by name.
- `styled()` returns the real path when no learned path style applies.
- The session tested detection with fake homes for EmuDeck, Flatpak-only, distro packages, AppImages + Steam RetroArch, and nothing installed (not in the repo).

## 0.7.10
- `electron/emulators.js` is the emulator database (all known, from EmuDeck's SRM parsers and SRM's `files/presets`): `EMU` (sources, args, `argsBy` per install kind, ares `system` names, `for` consoles), `CORES`, `RA_FIRST`. Only installed ones are offered. Add emulators there, not in steamManager.
- An EmuDeck launcher that runs a Flatpak or an AppImage in ~/Applications hides that copy (the script text is read). RetroArch's Flatpak is hidden when EmuDeck's retroarch.sh wraps it.
- Launch placeholders: `{ROM}`, `{SERIAL}`, `{DIR}` (game folder), `{NAME}` (file name without extension, for MAME).

## 0.7.11
- Shortcuts are SRM style: `plan()` puts `"exe" args` in Target (`entry.target`, used for the appid, the helper `Exe` and live `SetShortcutExe`) and leaves Launch options empty. `%command%` form only with `pre` (env vars, wrappers) or `%RPCS3_GAMEID%`. `sigOf` starts with `v2`, so older shortcuts show Update.
- Folder games: `gameRef` hands the emulator the file inside (`playableFile`: `DISC_FIRST` m3u/cue/gdi..., then `GAME_EXT[key]`, else the biggest file) unless the console takes folders (`DIR_GAMES`).
- In Steam matching: `nameKey` (letters and digits, & = and, no ™), `gameSerial` reads PS3/PSP/Vita serials from the game when the name lacks one.
- Vita: `vita3k` kind `vitaid`: `-F -r <title ID>` only when `ux0/app/<id>` exists (Vita3K pref path); otherwise `missing`, shown as `blocked` in the overview and skipped in `plan()`.
- `src/views/SteamMissing.vue` (route `steam-missing`) replaces "Add N missing". Gallery toolbar: Show/Sort menus, More (Surprise me, Select, Get all); series header uses a game cover (`headArt`).

## 0.7.12
- Real Steam put "%command%" into a live-added shortcut's empty Launch options, which broke launching (args are in Target). `steamLive.settle()` reads the shortcut back (`RegisterForAppDetails`, `strShortcutLaunchOptions`) and sets it again until it sticks. Overview `badLo` (ours, args in Exe, Launch options exactly `%command%`) counts as outdated; `steam:refresh` clears it in place (`reg[id].loFixed`), else re-adds.
- Smoothness (measured without the GPU): scroll containers `will-change: scroll-position` (`.view`, `.shelf`, `.shelves`, `.menu-list`, `[data-scroll]`, `[data-hscroll]`), so scrolling doesn't repaint the one full-screen `.shell` layer. The vignette is painted as `.shell`'s background (`body:has(.xmb-vignette)`), one full-screen layer fewer. Light effects draw the canvas at full size below 4K (stretching it cost the software compositor more). Light effects animate only the card lift, not the shadow.

## 0.7.13
- Console cards (owner picked "Showcase" from mockups): `SysTile` only sets `--sys-a`/`--sys-b` (consoleColors, else a hue from the slug); the look is `.systile` in `styles.css`. The picture (`.glyph`) stays inside the card (top/right inset, height from the card, fade mask to the left); the old bottom strip is gone. PIcon's inline size is overridden inside `.glyph`.
- Consoles header: title plus `.stats` (big numbers, small labels). Top bar connection: `.net` pill (light green LAN, light purple Tunnel, light red Offline on a dark see-through pill), no dot.

## 0.8.0 (Your Library, Alive)
- Play time: `steamManager.playtime()` (localconfig.vdf `apps/<appid>` Playtime/LastPlayed via `parseTextVdf`/`readPlaytime`, long game ids folded to 32-bit) plus RetroArch `.lrtl` runtime logs by file name (`retroarchRuntime` in main.js). `play:stats` -> `store.play`, `playOf`, `playtimeText`; reloaded on the `installed` event.
- Home shelves (Home.vue): Finish what you started, Most played (`GameCard extra`), Short games, Top rated you haven't played, Local multiplayer. Trophy row: `.ach-day` markers and `.ach-when` times.
- Game page More: Edit details (`rom:edit`, PUT /api/roms/{id} form name/summary/url_cover), Timeline (`rom:timeline` + `GameTimeline.vue`), Theme from this game (cover colour via canvas; `romimg` responses carry ACAO *; `ui.gameTheme` keeps the old theme, cleared when a theme is picked in Settings). HLTB card loads `/assets/scrappers/hltb.png` from the RomM server.
- Settings → RomM (`RommUpload.vue`): `upload:list` (files in console folders not in RomM), `upload:start` (RomM 4 chunked /api/roms/upload/start, PUT chunks, /complete; older servers POST /api/roms). QR pairing requests `roms.write`. Settings → About: `ServerStatus.vue` (`server:health`).
- Idle screen `IdleScreen.vue` (`ui.idle` minutes, default 5; its layer eats the waking press). Keyboard `mode: 'game'` suggests titles and words.
- Backgrounds: `bgRenderers.js` keeps waves/ribbons, adds ps2, wii, wiiu, switch, ds, n3ds, xbox, xbox360 with `BG_BASE` CSS bases and a neutral vignette (`body.bg-console`). Picker is one row plus a grouped menu (Menu `heading`).
- Steam: `steam:refreshArt` (style: undefined = Cartridge art, 'top', or SteamGridDB styles), `steamLive.setArtwork`. Storage drives include console folders and list `consoles`; Free up space pre-selects games unplayed for 2 months.

## 0.8.1
- `.net` pill colour coded: nearly solid dark green (LAN), purple (Tunnel), red (Offline) backgrounds with a matching edge.

## 0.8.2
- Launch options: `launchFor()` in steamManager: Target = `"exe"`, Launch options = arguments (no leading `%command%`); with `pre` (vblank_mode, env) `<pre> %command% <args>`. `sigOf` v3. `steam:refresh` converts in place with `steamLive.updateShortcut` (same appid; `reg.inPlace`), else re-adds. `badLo` = ours with arguments in Exe.
- nav.js: gamepad polled on `setInterval(8)`; LT/RT by value only (> 0.6, armed after seen < 0.6), axes 2/5 for non-standard pads; repeat 220 ms then 70/40 ms; `glideBy`/`glideTo` 120 ms scroll; up/down keep a column (`colX`). `padLive`, `lastPointer` feed `ControllerTest.vue` (About).
- Light effects keep a card focus ring (`body.light-fx .card:focus .art`). Card ring shows instantly (transition on transform only).
- Play sessions: `syncPlay()` in main.js posts Steam play-time deltas to RomM `/api/play-sessions` (device from `/api/devices`, `config.rommDevice`), reads other devices' sessions back (`remotePlay`); `play:stats` entries carry `device`/`remote`. Older RomM: `props?update_last_played`. `play-sync.json` keeps what was sent. QR pairing asks `devices.read/write`. Device name (`config.trophies.device`) lives in About; `play:device` renames it in RomM.
- Trophies: `config.trophies.hidden` keys (`trophies:hide`) are left out of summary and recent; TrophyPanel Show/Sort menus and Hidden toggle; TrophyGame More hide/show.
- SteamGridDB heroes ask `dimensions=3840x1240,1920x620` first and sort by width; ArtPicker shows sizes.

## 0.9.0 (Setup)
- Design system (direction B, owner's pick): `docs/design.md`. Tokens in `styles.css` `:root` (`--t-*` type scale, `--s-*` space, `--r-sm/md/lg`, `--s0..s3` surfaces, `--d-*` motion, `--display-stretch`). Focus is white everywhere (`--focus`/`--on-focus`, `--ring` white). Section titles have no icons (`.subh > svg`, `.shelf-title > .icon` hidden). Shared `.lrow`, `.status`, `.page-head`, `.sec-title`. Use tokens, not new px values.
- Brand: `Logo.vue` flat mark in `#EF4B23`; theme `cartridge` (neutral, `neutral: true` gives a flat `--xmb`), font `cartridge` (Archivo + Inter), surface `solid` are the defaults. `configVersion: 3` moves old default look values (purple/glass/outfit/waves) to the new ones and sets `setupDone` for existing users. `steam-art/*` and `build/icon.png` regenerated.
- `electron/detect.js`: AppImages by content (ELF + `AI` type byte), reads `.desktop`/AppStream from the squashfs (gzip, zstd via Node, xz/lzma via system `xz`; DwarFS falls back to name), `.upd_info`, `identify()` (conf 3/2/1, `FAMILY` for yuzu forks), `identifyProgram` (strings, needs 12+ mentions), `walk()` (budgeted home walk), `menuEntries`, `srmConfigs`, `extraBinDirs`, `missingFuse2`, `flatpakCanSee`.
- steamManager: `scanEmulators` → `emulators-found.json`; `foundFor(id)` (conf ≥ 2 or `steam.confirmed[path]`) feeds `candidates()`; SRM configs as `srm:` candidates; learned templates with a missing exe are skipped. `setupOverview`, `preflight` (flatpak access, exec bit, FUSE 2, core, `bios.js` status), `useFile` (Browse), `health`/`healthFix` (relink live via `updateShortcut`), `movedEmulators` (start-up check), `setupReport` (scrubbed), `templateForGame` (`steam.gameEmus[romId]`), `syncConsoleCollections` (`steam.consoleCollections`). Reg entries carry `emu`/`emuExe`.
- Views: `EmuSetup.vue` (route `emu-setup`, `first` on first launch until `config.setupDone`), `ShortcutHealth.vue` (`steam-health`), `FirstTour.vue` (modal `tour`, `ui.toured`), `ManualViewer.vue` (modal `manual`, pdf.js, loaded on demand), `LibraryCheck.vue` (Settings → Storage, `library:verify`). `fs:list` takes `files: '*'`; `clip:write`.
- `npm test`: `test/detect.test.js` (fake homes, squashfs fixtures in `test/fixtures`). Not shipped in the AppImage.

## 0.9.1
- `emulators.js`: `pre` (what goes before `%command%`: `vblank_mode=0` for Cemu, Dolphin, Eden, Citron, yuzu, as EmuDeck), `below: [[version, args]]` (PCSX2 before 1.7), `argsFor(id, key, src, version)`; the AppImage's version comes from the scan (`scanned().version`) or its file name. Refreshed against EmuDeck's SRM parsers and SRM presets (PPSSPP, Azahar).
- `detect.identifyAll` (reading inside found files) runs in `detectWorker.js` (`identifyInWorker`), inline if a worker can't start.
- `redownload()` in main.js (`library:redownload`): the copy is renamed `<path>.cartridge-old`, deleted after the new one passes, put back on error or cancel (`restoreBackup`); `it.redo` skips the automatic Steam add.
- `steamManager.refreshGame(romId)` (`steam:refreshGame`) updates one shortcut; `setup:flatpakAllow` runs `flatpak override --user --filesystem`; `setupNotice` in App.vue (once, `ui.setupNotice`, for `setupDone === 'before 0.9'`); start-up dialogs wait for each other.
- CI runs `npm test` before building.

## 0.9.2 (Controls and colour)
- Cartridge theme accent is white (`bgAccent` keeps the brand colour for animated backgrounds). `applyTheme` sets `--focus` (white, or `colors.highlight`), `--on-focus`/`--on-focus-dim` by luminance, `--sel` (chosen, not focused), `--knob`. Near-white picks stay white (`accentOf`).
- Selected states use a `--sel` fill, never stripes or outlines; the active top tab has a faint outline. A focused `.btn.primary` also gets the ring.
- `nav.js` zones: `move()` never leaves the nearest `[data-zone]` (App `<main>`, Settings `.pane`). Settings' B returns to the rail.
- The 0.9.3 plan is `docs/plan-0.9.3.md`, 0.9.4/0.9.15 is `docs/plan-0.9.4.md`, 0.9.16 is `docs/plan-0.9.16.md`, 0.9.17 is `docs/plan-0.9.17.md`. Work in progress and decisions made in chat are logged in `docs/SESSION-LOG.md` (read its newest entry first).

## 0.9.3 (shipped in parts A to I, Oct 2026; log: docs/SESSION-LOG.md)
- Emulators: Settings → Emulators (Issues list `issues:list`, Emulator setup, Shortcut health, Console Folders). Forks: `FORKS`/`forkOf`, `REAL_NAMES`/`realName` in emulators.js, `steam.forks[path]` (`markFork`, `setup:fork`), `EMU.forkOf` (PrimeHack); forks never default. RetroDECK candidate (`how: 'retrodeck'`) only without EmuDeck. SRM setups no longer candidates. Learned shortcuts are a second choice in `templateFor`. `takeOver` (console page More). shadPS4 `startOf()` (Start in never next to the AppImage). New emulators each read from their own source (DeSmuME, Mupen64Plus, Snes9x, Mesen, Play!, Kronos, Xenia Edge).
- Installs (`electron/pkgInstall.js`): PS3 .pkg through `rpcs3 --headless --installpkg`, licences `<content ID>.rap` found in the download or RomM (`rapsFromRomm`) and staged under the right name, no install without; Vita through Vita3K (`--pkg --zrif`, or .vpk/.zip which opens Vita3K). `installs.json` records them; delete from emulator storage only through `safeToRemove` (per-emulator `RULES`). Steam: `gameRef` starts recorded games by serial; un-installed PS3 packages are `missing` (blocked) until installed; `afterInstall`. PS4 .pkg dropped (keys).
- Patches (`electron/patches.js`, PatchesSheet.vue, `patches:list`/`patches:apply`): RPCS3 `config/patch_config.yml` (js-yaml FAILSAFE), shadPS4 `isEnabled` on `<Metadata>`; `patches.json` records what Cartridge turned on, the only ones it turns off. PCSX2 not done.
- `versionName` in package.json is what users see ("0.9.3 I"); the number keeps rising. `test-build.yml` builds an AppImage for every `claude/**` push.
- UI: Home rows of 15 + Show all (`store.homeLists`), delete ring (`Ring.vue`, `delete-progress`), game page More grouped (Steam and emulator, Details and artwork), score/age badges, one RomM tab in Settings (`OLD_SEC`), Report a problem (About), Refresh Library (Quick Menu), Hidden Games (Settings → Achievements), RA tab filter and sort. RomM game fields read in `electron/romm.js` (tested).
- Owner's open items: shadPS4 PS4 games start only after opening shadPS4 once (black screen 30 s, not IPC); options for Discuss items in `docs/options-0.9.3.md`.

## 0.9.3 K (owner's picks, 2 Oct 2026; log: docs/SESSION-LOG.md)
- Achievements: `AchAll.vue` is the default tab (`store.achTab = 'all'`), RA + trophies merged, grouped by console; LB/RB: all, ra, others.
- `src/recs.js`: `similarTo` (game page) and `recommend` (Home "Recommended for you"); IGDB `similar` only a bonus; each result has a `why`. Tests in `test/recs.test.js`.
- Look & Feel pages (`LOOK_PAGES`, `lookPage`, `lookAdv`, LB/RB `stepLook`). `Menu.vue` takes `tabs` (bottom sheet, LB/RB) or `sheet: true`; used by the game page More, Show and sort, console More.
- Rumble: `setRumble`/`rumble` in nav.js (`ui.rumble`). Stick: stronger axis only, hysteresis 0.55/0.35 (`stickHeld`).
- Connection: `.net` icon (house/globe), red text only when offline.
- Sharp heroes: `sharpHero` in main.js (`art:sharpHero`, `heroes/`, `romimg ?hz=`), `store.sharp`, `wantSharp`; `backdropOf` prefers it. Home header 50%, art runs on under the first row.
- shadPS4 core candidate removed again in L (owner: still a black screen). shadPS4 AppImage shortcuts get `SHAD_START` (`/tmp/.mount_shadPS4/usr/bin`, never exists) as Start in, like the Qt launcher's own (its StartDir is its temporary mount); portable installs keep their folder.
- shadPS4 trophy lists: `readTrp`, `shadTrophyKey`, `cachedTrophyDefs` in trophies.js into `trophylists/`. Trophy names: `isCode`/`nameOf` in trophyService (a code never replaces a real name in notes).
- PCSX2 patches in patches.js: `pcsx2Dirs`, `pcsx2GameList` (gamelist.cache v34), `pcsx2List`, `pcsx2Set` (gamesettings `<SERIAL>_<CRC>.ini` [Patches] `Enable =`), patches.zip via `detect.readAppImageFile`.
- Flatpak Steam: `FLATPAK_STEAM`, `hostLaunch` (`flatpak-spawn --host --directory= --env=`), `readShortcuts` unwraps it, `flatpakSteamAccess` + Issues `fpsteam` (`setup:steamFlatpakAllow`); steamArt wraps Cartridge's own entry. Not for `.exe` (Proton).
- Xenia Windows build: `EMU.xenia.win`, src `windows`, Proton; exec-bit checks skip `.exe`.
- RomM version: `rommTooOld` in romm.js, Issues `romm`.

## 0.9.3 L (2 Oct 2026; log: docs/SESSION-LOG.md)
- Game Mode background: `watchGamescopeFocus` in main.js (xprop GAMESCOPE_FOCUSED_APP vs SteamGameId) → event `background` → nav.js `setBackground` stops pad input.
- Vita3K: EmuDeck's vita3k.sh always adds `-Fr`, so `argsBy.emudeck: '{SERIAL}'`; `vita3kCommand()` never uses the script (EmuDeck's real Vita3K is `~/Applications/Vita3K/Vita3K`); `vitaPrefs` adds XDG_DATA_HOME and `portable/fs`.
- RPCS3 database settings: `rpcs3ApplyDb` in patches.js (writes `config/custom_configs/config_<SERIAL>.yml` from RPCS3's config_database.dat or api.rpcs3.net/config/?api=v1, only when none), `rpcs3Settings` in main.js after download/install, `rpcs3-configs.json` records them.
- `consoleName()` in store.js (RomM's current platform names), `developerOf()` in romm.js, `titleCase()` for Menu labels (`o.raw` opts out), `store.settingsSpot` (store.go remembers the Settings row), `steam:status.added` (`cartridgeInSteam`), `bgPreview()` in bgRenderers.js, Menu `img`.
- Trophies All: one list (`.aa-row`), owner's pick A. Home: one Continue playing row.
- Health: learned shortcuts with a gone game get Remove from Steam (only when their ROMs folder exists).
- PS2 ISO serial/CRC: `ps2IsoInfo` in patches.js (SYSTEM.CNF BOOT2, XOR of the ELF's words) when PCSX2's game list doesn't have the game; CHD still needs the list.

## 0.9.15 (2 Oct 2026; log: docs/SESSION-LOG.md, plan: docs/plan-0.9.4.md)
- One update for 0.9.3 M + the 0.9.4 plan. versionName and release title are plain "0.9.15" again (the 0.9.3 parts ended with L).
- Sign In to Emulators: `electron/raLogin.js` (`ra:emuTargets`, `ra:emuSignin`), each emulator's own login format from its source; password used once, never stored.
- F11 Game Mode: `watchGamescopeFocus` steps aside (`win.hide()`) when Steam starts another app (`steamLaunches`), back with `showInactive`.
- Welcome: `Welcome.vue` (`store.welcoming`, `config.welcomed`; `'romm-local'` opens only RomM on this device), `electron/welcome.js` (EmuDeck app, RetroDECK Flatpak). `Setup.vue` `embedded`, `EmuSetup.vue` `welcome`. Background forced to Ribbons while welcoming.
- RomM on this device: `electron/rommLocal.js` + `RommLocal.vue` (`romm:localInfo/localSetup/localUpdate`, `config.rommLocal`, `romm-local.env`).
- Backgrounds (owner's pick A + B): scenes `ps2`, `gc`, `wii`, `xbox360`, `switch`; `art:<slug>` = `artPan` over that console's covers; `LEGACY_ART` maps retired styles.
- Add-ons (checkable part): `electron/addons.js` (`addons:emulators`, `addons:forGame`, `addons:makeFolder`), game More → Texture packs. Downloads are 0.9.16.
- Per-game templates `steam.gameTemplates` (`steam:setGameTemplate`), `pickEmulator` groups forks, `patchHome` sends patches to the copy the game uses.

## 0.9.16 (2 Oct 2026; log: docs/SESSION-LOG.md, plan: docs/plan-0.9.16.md)
- Downloads: `electron/dlWorker.js` (one worker per download, 1 MB writes, progress every 250 ms, shared speed limit); `downloadTo(..., opts.plain)` never sends RomM auth to other hosts.
- Settings → Emulators pages (`EMU_PAGES`, LB/RB `stepEmu`): Overview, Updates (`electron/emuUpdates.js`, `emuup:list/run`: Flatpak `remote-ls --updates`/`update`, AppImage from the emulator's GitHub releases `REPOS`, replaced at the same path), Game Updates (`electron/ps3Updates.js`, Sony's `<SERIAL>-ver.xml`, `ps3up:*`, installs in order through RPCS3, cache `ps3-updates.json`), Patches (installed games, same sheet), Texture Packs, Console Folders. `electron/emuIcons.js` + `EmuIcon.vue` (Flatpak export, AppImage .DirIcon, .desktop Icon=).
- Patches: `electron/cheats.js` Dolphin (Sys + user GameSettings ID3/ID6, `[OnFrame|ActionReplay|Gecko]`, `<Section>_Enabled/_Disabled`, `[Core] EnableCheats`) and PPSSPP (`PSP/Cheats/<ID>.ini` `_C0/_C1`, cheat.db, `[General] EnableCheats`, `ppssppDownloadDb` from metadata.ppsspp.org/cheats.json). `EMU_PATCH` dolphin/ppsspp refuse while the emulator runs. `freshRpcs3Patches` (rpcs3.net patch API, 7 days). `gcWiiId` reads ISO/GCM/RVZ/WIA/WBFS/CISO.
- Add-ons: `setTextures`/`TEX_KEY` (`addons:setTextures`, `texture-settings.json`), Switch mods (yuzu family `load_directory`, Ryujinx `mods/contents/<id lower>`), Cemu `graphicPacks` (`mods: true`), `psxSerial`, `ciaTitleId`, `switchTitleId`.
- Firmware: `pkgInstall.installFirmware` (RPCS3 `--installfw`, Vita3K `--firmware`) from `downloadBios`.
- nav.js `pickRow`: up/down to the next row (hscroll row: first item; same grid: column; else leftmost); left/right only within the row; `[data-top]` scrolls the page to the top.
- Game page More tabs: Game, Steam, Emulator, Details and Artwork, Options. `steam:addToCollections`.
- Settings background picker: `topConsoles` (play time, then installed) first, `SCENE_OF`.
- Vita: `vitaByName`; PS4 trophy titles remembered (`titles.json`); `developerOf` up to two.

## 0.9.17 (2 Oct 2026; log: docs/SESSION-LOG.md, plan: docs/plan-0.9.17.md)
- Add-ons: `electron/addonSources.js` (EmuCoreX `textures.json` for PS2, GameBanana apiv11 `gbGame`/`gbMods`/`gbFiles`), `electron/addonInstall.js` (zip via yauzl, 7z/rar via bsdtar/7z, `plan()` kinds ps2/switch/plain, never over a file, `removeFiles`), `addons:available/install/remove/installed`, `addons-installed.json`, `AddonsSheet.vue` (modal `addons`), Settings → Emulators → Add-ons.
- `electron/frameGen.js` (`~/lsfg`, `~/.lsfg`, `~/.local/bin/mako-run`; `steam.frameGen` default/consoles/games), `withFg` + `launchFor` (wrapper after env vars, one %command%), `sigOf` adds `fg:` only when set; `FrameGen.vue` (route `frame-gen`).
- shadPS4: `shadVersions()` (`shadPS4QtLauncher/versions.json`), `withShadVersion` (`-e "<path>"` for `-d`), `steam.shadVersions`.
- Multi-disc: `multiDisc()` writes `<folder>.m3u` (flag wx) for `M3U_EMU` emulators.
- `electron/discImage.js`: `open(file)` 2048-byte view of ISO/raw bin/cue/CHD v5 (Huffman map, zlib/LZMA/zstd, cd codecs)/CSO/ZSO/GCZ; `lzmaDecode`, `pbpDiscId`. `patches.isoFile`/`ps2IsoInfo` use it. Fixtures in `test/fixtures/disc` (chdman).
- RomM on this device: `rommLocal.prepare` (podman-launcher into `~/.local/share/cartridge-romm/bin/podman`, `sudo -S usermod --add-subuid/--add-subgid`), `cartridge-romm.service` for Cartridge's own Podman, `romm:localPrepare`.
- `electron/emuGet.js` (`CATALOG` by console, GitHub AppImage into ~/Applications or Flathub `--user`), `emuget:*`, `EmuGet.vue` (welcome Pick your own, Settings → Emulators → Get Emulators).
- `bios.place()` (copy into set-up emulators' folders, never over), `switchNandDirs` + `switchFirmware`, `bios:all`, `electron/emuFolders.js` (`setup:gameFolders`, `emu-folders.json`), default BIOS folder when none.
- `makers.js` Nintendo (HVR88 Monochrome Gaming Logos, `evenodd`).
- Second list (plan section 10): `electron/webFetch.js` (Electron `net.fetch` for outside services, avoids Cloudflare 403s; guarded for plain Node), `electron/github.js` (`release`, release-page fallback `fromPages`/`parseAssets` when the API answers 403). Sony's list HTTPS first (`rejectUnauthorized:false` for that host only). RPCS3 patches from rpcs3.net's own patch API into `<config>/patches/patch.yml`.
- Dolphin Gecko: `geckoTxt`/`geckoDownload`/`addGecko` in cheats.js (codes.rc24.xyz, parsed like GeckoCodeConfig.cpp).
- Emulator updates: `emuup:list` hides forks, `_old`/previous/`.cartridge-*` copies and launcher `versions` folders; `cache.installed[path]` remembers the version. `emuIcons.ICON_URLS`/`webIcon`.
- Updates: `update:releases`, `update:rollback` (`config.updateHold` pauses autoDownload until `update:check`), `ChangelogCard.vue` (`RELEASE_NOTES.md?raw`). `steam:keyboard` (TextPrompt in gamescope).
- Welcome: intro overlay, Your controls step (`ui.buttons`), `.w-back`, `.w-hints`, Flatpak offer (`welcome:flatpak`), `EmuGet.vue` flow (`emuget:drives/prepare/queue/state`, ES-DE folders, `emuDir`), Use without RomM (`config.localOnly`, `electron/localLibrary.js`, negative ids). `builtinKb()` true while welcoming; Keyboard `caps`, cursor on LB/RB. `autoZoom` below 1280x800 (to 0.6).
- Top bar: words-only tabs, `.tab-ink` underline placed by `placeInk()`, LT/RT only in pad mode. `PIcon` trims SVG margins (alpha box, up to 1.8x). Sega/Microsoft in makers.js. Patches/Add-ons pages grouped by console (`patchGroups`, `.con-head`).
- Fluidity: GameCard covers fade in only when not yet loaded (`seen`), `:active`/`.pressed` squeeze (nav.js `pressFx` on A).

## 0.9.18 (2 Oct 2026; log: docs/SESSION-LOG.md)
- `addonInstall.plan` kinds per emulator (pcsx2/duckstation `replacements` anchor + DuckStation `config.yaml`, ppsspp `textures.ini|zip` anchor, dolphin 6/3-char ID folder, azahar/citra title ID folder, cemu `rules.txt` packs, switch Atmosphere `contents/<id>`), `wrapper()` strips folders around everything. `addons:install` dest is the game folder (`/replacements` dropped). PS2 lists GameBanana after EmuCoreX.
- `pkgInstall` Vita3K: `NO_QT` retry without `QT_QPA_PLATFORM=offscreen` (installVita and installFirmware).
- `ps3Serial`: `PS3_GAME/PARAM.SFO` two levels down, then RPCS3 `games.yml` paths.

## 0.9.19 · Start (3 Oct 2026; log: docs/SESSION-LOG.md, plan: docs/plan-0.9.19.md)
- Start: `src/views/Start.vue` (route/tab `start`), `src/startTiles.js` (`TILES` with sizes as [cols, rows] of an 8 by 4 screen, `DEFAULT`, `valid`, `pinToStart`), `ConsoleChip.vue`. Saved in `config.ui.start.tiles`. Grid: 8 columns, rows from `100cqh / 4`, `grid-auto-flow: dense`, TransitionGroup FLIP for moves. Arrange: hold A (`data-hold` + nav.js `HOLD_MS` 450, action `hold`, `cart-hold` event), touch/mouse press and hold 520 ms, drag. `config.ui.openOn`, `ui.startAdded` (adds the tab once). Game More → Pin to Start.
- nav.js: A on `[data-hold]` fires on release; held 450 ms dispatches `hold`. App routes `accept`, `hold` and the D-pad to `store.viewHandlers` first.
- `play:week` + `notePlayDays` in main.js (`play-days.json`: snapshot of totals, minutes added to the day last played).
- Top bar: icon tabs, active `.tab-label` opens (grid 0fr to 1fr), `--tab-ink` (brand orange in Cartridge's theme), search folds (`.top-search.open`). Page arrivals: `store.navDir` ('r','l','in','out') set by `tab`/`go`/`back`, `main.main[data-dir]` keyframes.
- Backgrounds: console scenes removed (owner); `aurora`, `contours` (marching squares), `drift`, `tide` in bgRenderers.js; old scene values map to `art:<slug>` via `LEGACY_ART`.
- Vita: `vitaArchiveContents`/`vitaUnpack` (from Vita3K interface.cpp: gd -> ux0/app, ac -> ux0/addcont/<id>/<content id from 20>, gp -> ux0/patch merged into app; Vitamin refused); NoNpDrm (PCS* with sce_sys/package) through Vita3K with `QT_TRIES` offscreen, minimal, normal, killed at "will auto-boot". Folder dumps (`kind: 'dir'`).
- RPCS3 patch list: `load` uses `json: true`; `readPatchFile`/`loosePatchYaml` fallback. webFetch: hidden-window pass for Cloudflare-style checks (`viaWindow`, only when `looksChecked`). Sony 403 on both schemes = no updates.
- Add-ons: `addons:present` (files in each game's folder, `by` cartridge/other/both). `gbGame` tries `titleForms`. Switch: `pfsEntries`, `switchTitleId(file, keyDirs)` decrypts NCA headers (AES-128-XTS, header_key from prod.keys).
- Get Emulators: `emuUpdates.forgeRelease` (Forgejo), `REPOS[id].forge/first/zipped`, `appImageFromZip`; `emuGet` CATALOG entries carry a lasting `name` and an `fp` fallback.
- `steamManager.reconcile()` at start (HANDOFF F4). `electron/syncthing.js` + `SyncCard.vue` (`sync:status`, read only). RomM local: pod `--hostname` from the server name.

## 0.9.20 · Start, Refined (3 Oct 2026)
- Redesign-skill audit of Start and the top bar (owner asked): tile labels words only (no icons, no counts), `.st-ambient` (first game's cover, blurred, behind cover tiles), covers fill and fade (`mask-image`), staggered `st-in` entry (`--n`), console chips stretch when few, one-trophy layout. Search folds to a round button; the Y hint only in pad mode.
- Start widgets (owner: taste skill): clock `sky` (6 to 18 day, `SKIES` light colours, sun/moon `.st-orb` on `.st-path`), storage `GAUGE` (36 ticks, 270 degrees, `.low` amber under 10%), week `weekNote`, `barH`, bars absolute in `.st-col`, `st-rise`.
- Top bar (owner, after 0.9.19's underline): `.tab-ink` is a white pill (`--focus`) behind the current tab, dark text (`--on-focus`), placed by `placeInk()` with a ResizeObserver; focus is a ring. `--tab-ink` is gone.
- Vue scoped CSS drops everything after `:global(x)`: write `:global(body.pad-mode .thing)`, never `:global(body.pad-mode) .thing` (it compiled to `body.pad-mode { ... }` and shrank the app).

## 0.9.21 · Start, Your Way (3 Oct 2026; log: docs/SESSION-LOG.md)
- Start board: `src/startLayout.js` (no imports, tested in `test/startLayout.test.js`): tiles carry `x, y, w, h` on 8 columns, `MAX_H` 4; `pack` places old saves, `settle(list, fixedId)` pushes overlaps down and lets tiles fall up. Tiles are absolutely placed in pixels (`geo` from a ResizeObserver, `px()`), so moves and resizes are CSS transitions; the look is on `.st-face` (`container-type: size`, content adapts with `@container`).
- Arranging: hold A or press and hold. Controller `mode` '' / 'move' (D-pad swaps with the neighbour or steps one cell) / 'size' (X; D-pad moves `corner`, LB/RB cycle `CORNERS`). Touch/mouse: drag body (`pDown`, `drag`), drag `.st-handle` edges/corners (`hDown`, `sizing`), `ghost` shows the landing cell, `slots` show the grid.
- `StartClock.vue` (phases night, sunrise, morning, afternoon, evening; drawn SVG), `ConsoleCard.vue` (SysTile look, not a button). Trophies/covers/console cards count from `box(t)` (`achFor`, `coversFor`, `cardsFor`). `ConsoleChip.vue` removed.
- `makers.js` entries can have `paths` (all paths of HVR88's files; 0.9.17 kept one, so Sega was an S) and `tall` (Nintendo's pill). `src/consoleOptical.js` `OPTICAL`/`opticalOf`: wordmark scale per logo (ConsoleMark, SysTile, ConsoleCard).
- Settings: `syncthing` section (Sync, `SyncCard.vue`, `sync:browse` reads Syncthing's index, view only); Look & Feel `bg` page folded into `theme`; `.lookpages` never wraps.
- Vita3K installs: `vita3kFsPaths(exe)` (Vita3K's own storage: portable/fs, config.yml pref-path, SDL default) goes first in installVita's search, plus roots named in its "Extracting" lines; `vita3kWhy`/`vita3kLogTail` give its reason; `e.detail` (its output) is logged.
- Emulator updates: `specFor(id, file)` (Xenia Edge, `xenia-win` for xenia_canary.exe, xenia-canary-releases), `pickAsset` (the build closest to your file name), `fileFromTar` (.tar.gz), Eden forge git.eden-emu.dev first; `installedEmulators` lists Windows builds (kind 'windows'); `emuIcons.ICON_URLS` values can be lists. `.status` pills and `.up-bar` read on selected rows (styles.css).
- Game page More → Emulator: Game updates always for installed PS3 games (`ps3check`, `ps3up:game` with `fresh`).
- Heroes: `heroArt(rom)` in store.js (own pick, SteamGridDB sharp hero, else blurred cover; RomM screenshot only without an sgdbKey; null while pending), `wantSharp` is a newest-first queue (8), `bgRom` puts the hero in when it arrives.
- Ready to play: `steam:play` → `steamManager.play` (`steamLive.runGame` `SteamClient.Apps.RunGame`, else steam://rungameid/<appid<<32|0x02000000>).
- Dolphin: tabs in PatchesSheet (`KINDS` by `section`), graphics mods `dolphinMods`/`dolphinModsSet` (Config/GraphicMods/<ID>.json, GFX.ini [Settings] EnableMods, tested), `dolphinUserFiles` (ID6r<N>.ini), dolphinPatchState prefers the user folder holding the game's settings.
- Emulator updates keep the build kind: `installKind` (appimage, folder with data/ lang/, program), `REPOS.vita3k.folder` zip, `replaceFolder`; programs never overwritten. Get Emulators: Xenia Canary first (`binary`, tar.gz), more `ICON_URLS`.
- Settings → Achievements: Sign In to Emulators row with status (`raTargets`, `ra:emuSignin` ids).
- `rpcs3List` leaves out other-version patches when `appVer` is known (unless on).
- nav.js `firstSeen`: a pad's first 400 ms counts as triggers at rest (LT/RT at launch). App `background` event sets `store.away` and `body.away` (CSS animations paused, Background.vue stops drawing).

## Releases (full steps: HANDOFF D8)
Only when the owner asks. Bump `version` and `build.releaseInfo.releaseName` ("Cartridge X.Y.Z") in `package.json`, and set `versionName` (what Settings → About and update messages show). **0.9.3 is shipped in parts (owner, 1 Oct 2026):** the number goes up as usual (0.9.4, 0.9.5...) but `versionName` and the release title are "0.9.3 B", "0.9.3 C"... until the 0.9.3 plan is done; notes heading `## Cartridge 0.9.3 B · Title`. Then put only this version's notes in `RELEASE_NOTES.md` (heading `## Cartridge X.Y.Z · Title`), add them to the top of `CHANGELOG.md`, grouped as New / Changed / Fixed with bold lead-ins. CI builds, launch-checks and publishes.
