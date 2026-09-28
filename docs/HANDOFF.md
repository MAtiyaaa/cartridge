# Cartridge handoff (full)

This file is the handoff from the chat sessions that built Cartridge 0.1.0 to 0.6.0. The short rules every session needs are in `CLAUDE.md` at the repo root; this file has the full detail. Read the relevant parts before changing anything.

It is written for the state of `main` at commit `5d60917` ("Cartridge 0.6.0 · The Steam Update"). Everything built in chat is committed and pushed. Nothing exists only in chat, except the test harness described in section F5, which lived outside the repo; its Steam tests are in `docs/steam-tests.md`.

The repo is public. For that reason this file leaves out private details on purpose: server addresses, domains, usernames, account IDs, device serials. Where a real path contained the owner's username it is written as `<user>`.

Wherever something is not certain, it says **unsure**.

## Quick orientation

- **What it is:** a controller-first RomM client, shipped as one AppImage, for SteamOS, Bazzite and any Linux desktop. It is added to Steam and used in Game Mode.
- **Stack:** Electron main process plus a Vue 3 UI. There is no router, no Pinia and no UI kit.
- **Build:** `npm ci && npm run dist` produces `release/Cartridge-x86_64.AppImage`. The UI builds with Vite into `dist/`.
- **Release:** bump `version` in `package.json` on `main`. The GitHub Action (`.github/workflows/release.yml`) builds, runs a headless launch check, then publishes release `v<version>`. Set `build.releaseInfo.releaseName` in `package.json` to the release title (at 0.6.0 it is just `"Cartridge 0.6.0"`; the commit message and the notes heading carry the "· The Steam Update" part). The release body comes from `RELEASE_NOTES.md`.
- **Owner's rules:** see D7. The most important ones:
  - never use em dashes
  - test that it launches before anything is released
  - no private info in the repo
  - release notes say exactly what changed
  - one GitHub release per version
  - no UI overhauls unless asked
  - Cartridge never touches saves, never downloads or launches emulators, never modifies emulator files

## Source files at 0.6.0 (line counts)

| File | Lines | What it is |
|---|---|---|
| `electron/main.js` | 1648 | Main process: config, server/API, library mirror, downloads, images (`romimg://`), logos, SteamGridDB, RetroAchievements, updater, window, IPC handlers, Steam manager wiring, single instance |
| `electron/steamManager.js` | 750 | NEW in 0.6. Steam ROM manager: learning shortcuts, finding emulators, queue, plan/preview/apply, undo, collections |
| `electron/steamHelper.js` | 204 | NEW in 0.6. Standalone Node script that closes Steam, writes files, restarts Steam |
| `electron/steamArt.js` | ~170 | Add Cartridge itself to Steam, VDF parse/write, `shortcutId`, `steamRunning` |
| `electron/trophies.js` | 570 | Trophy parsers and emulator discovery (RPCS3, shadPS4, Xenia, Vita3K) |
| `electron/trophyService.js` | 430 | Trophy state, watching, RomM notes sync, icons, IPC `trophies:*` |
| `electron/platformMap.js` | | RomM slug to ES-DE folder names |
| `electron/preload.js` | | `window.cart.call(channel, arg)` and `window.cart.on(channel, fn)` |
| `src/App.vue` | | Shell: top bar, tabs, hint bar, modals, pop-ups, global pad layer |
| `src/store.js` | 270 | Global reactive store, routing (`go`, `back`, `tab`), toasts, modals, config helpers, library index |
| `src/nav.js` | 281 | Focus engine, gamepad and keyboard input, layers, repeat, drag to scroll |
| `src/pad.js` | 32 | NEW in 0.6. Which controller glyph set to draw |
| `src/steam.js` | 89 | NEW in 0.6. UI flow for Steam: collections, queue, preview, apply, report |
| `src/themes.js`, `src/bgRenderers.js`, `src/sfx.js` | | Themes, animated backgrounds, sound packs (0.5.0) |
| `src/views/*.vue` | | Home, Gallery (Library, console, collection grids), Consoles, Game, Search, Downloads, Settings, Setup, Achievements, RaPanel, RaGame, TrophyPanel, TrophyGame |
| `src/components/*.vue` | | Btn (glyphs), GameCard, GameLogo, GameIcon, ConsoleMark, SysTile, CollTile, PIcon, Menu, Keyboard, TextPrompt, TextField, FolderPicker, ColorPicker, ArtPicker, Toggle, MediaBar, QuickMenu, Background, Grade, Icon, Logo, and the new SteamSettings, SteamPreview, SteamCollections, SteamEmu |

---

# PART A · What Claude Code understood at 0.5.6, checked against 0.6.0

**A1. Architecture.** Still correct.
- The renderer calls `window.cart.call(channel, arg)` (wrapped as `call()` in `store.js`, which JSON-clones the argument). That reaches `ipcMain.handle`. Every handler is wrapped so it returns `{ ok: true, data }` or `{ ok: false, error: message }`. `preload.js` throws on `ok: false`, so UI code uses try/catch.
- Live events go main → renderer through `broadcast(channel, data)`, which is `win.webContents.send`.
- `main.js` is now about 1,650 lines (it was about 1,460).
- Broadcast channels at 0.6.0: `connection`, `downloads`, `installed`, `installed-changed`, `library`, `logos-progress`, `sync`, `update`, `trophies`, `trophies-scan`, `trophies-sync`, `trophy-unlocked`, plus NEW `open-game`, `steam-auto` and `steam-queue`.

**A2. Library mirror.** Still correct.
- `library.json` holds `{ platforms, roms: {platformId: [slimRom]}, firstSeen, syncedAt, base, lastNew, collections }`.
- `slimRom()` in `main.js` keeps only the fields the UI needs. 0.4 added `has_notes`.
- Sync runs:
  - on launch (`config.sync.onLaunch`, default true)
  - on a timer (`config.sync.everyMinutes`, default 60)
  - from the Quick Menu or Settings
- "Scan server for new ROMs" asks RomM to scan, then resyncs. It needs username and password sign-in.
- The owner asked for the "Argosy-style" name and approach, after the Argosy launcher (github.com/rommapp/argosy-launcher).

**A3. `romimg://`.** Still correct, and it grew. `handleImage` in `main.js` serves:
- RomM image paths, with login headers and an SHA1-keyed disk cache in `imgcache/`
- `f=` prepared logos from `logos/`
- `sys` console logos from `syslogos/`. With `png=1` it serves the bundled `build/syslogos/ps5.png`, added in 0.4.
- `tr=` trophy icons, by opaque token only. Tokens come from `trophies.registerIcon`, so the renderer can never ask for an arbitrary file path.
- `wp=` the wallpaper (0.5)

**A4. Logos.** Still correct.
- Order: the user's pick (`artwork.json`), then RomM (ScreenScraper `logo_path` or gamelist `marquee_path`), then SteamGridDB.
- `prepareLogo()` trims transparent edges, measures brightness and saturation, and flags `dark` when luminance is under 0.22 and saturation under 0.35. The UI draws dark logos white.
- `GameLogo.vue` gives every logo the same on-screen area, not the same height.
- Why: owner screenshots on the handheld (0.2.x) showed Midnight Club 3 huge next to a tiny Twisted Metal, and the Jet Set Radio Future logo drawn black on the dark header. That led to the 0.2.2 fix.
- Changed in 0.6: trophy cards also use `GameLogo` with their own area and max sizes:
  - TrophyPanel: area 4200, max width 200, max height 38
  - TrophyGame header: area 15000, 440 × 100

**A5. Rendering.** Still correct, with detail:
- `isGamescope()` checks `GAMESCOPE_WAYLAND_DISPLAY`, `SteamGamepadUI`, `SteamOS=1` without `KDE_FULL_SESSION`, or `gamescope` in the desktop env vars.
- `launchedBySteam()` checks `CARTRIDGE_FROM_STEAM`, `SteamGameId`, `SteamAppId`, `SteamClientLaunch`, `SteamOverlayGameId`, or `gameoverlayrenderer` in `LD_PRELOAD`.
- `biggestDisplay()` reads `/sys/class/drm/card*-*/modes` before Chromium starts. `bigScreen` is 2560 wide or 1440 high and up, or `CARTRIDGE_BIG=1`.
- `forceSoftware = ((inGamescope || fromSteam) && !bigScreen) || --disable-gpu || CARTRIDGE_SAFE_GPU=1`. `useGpu = !forceSoftware && config.graphics !== 'software'`.
- If the GPU child process dies (not a clean exit) within 20 s of start: set `config.graphics = 'software'`, save, relaunch.
- 2.5 s after ready: if the GPU is off, the user didn't choose software, and the window is 2500 × 1400 or larger, set `CARTRIDGE_BIG=1` and relaunch once.

**A6. No `no-sandbox` at runtime.** Still correct and critical.
- The comment near the top of `main.js` explains it. 0.1.1 appended the switch at runtime. On normal (non-root) desktops the renderer and GPU process then crashed with exit code 133 and "/dev/shm ... No such process". The owner's `cartridge.log` showed `renderer gone crashed 133` on every start, and the window was grey or missing.
- 0.1.2 removed it.
- The AppImage's own `AppRun` adds `--no-sandbox` before Chromium starts when `unshare -Ur true` fails. That is fine because it happens at process start.
- The Steam launch script also passes `--no-sandbox` on its `exec` line.
- NEW in 0.6: the Steam helper is spawned with `--no-sandbox` as the LAST argument, on purpose. See F7.

**A7. `steam-launch.sh`.** Still correct.
- It sits in the userData folder (`~/.config/Cartridge/steam-launch.sh`) and is written by `writeSteamLauncher()`.
- It writes the environment to `steam-launch.log` (the log is rewritten on each launch), unsets `LD_PRELOAD` and `LD_LIBRARY_PATH`, exports `CARTRIDGE_FROM_STEAM=1`, then `exec`s the AppImage with `--no-sandbox`, appending the app's output to the same log.
- It is rewritten on every start when running from an AppImage and the script already exists, so it follows the AppImage if it is moved.

**A8. Add to Steam (Cartridge itself) closes Steam first.** Still correct.
- `steamArt.steamRunning()` checks, in order: `/proc/*/comm` for `steam`, `steamwebhelper` or `steam.sh`; `/proc/*/cmdline` matching `ubuntu12_32|ubuntu12_64/steam(webhelper)` or `/steam.sh`; the pid files `~/.steam/steam.pid` and the Flatpak one (checked with `process.kill(pid, 0)`); then `pgrep -x steam || pgrep -x steamwebhelper`.
- The history behind it: the owner's log showed `steam add ... "restarted":false` right after an add. Steam was running but not detected, and Steam wrote its old `shortcuts.vdf` back on exit, which silently undid the add. That was fixed in commit `63540e4` and shipped in 0.2.2.
- NEW in 0.6: `steamHelper.js` has a reduced copy of `steamRunning`: `/proc` only, without the `comm === 'steam.sh'` check, and no pid-file or pgrep fallback.

**A9. Controller navigation.** Still correct.
- `nav.js` uses layers. A modal calls `pushLayer(el, handlers)` and gets all input; `pop()` removes the layer.
- Moves go to the spatial nearest neighbour.
- Held directions repeat after `DELAY = 300` ms, then every `RATE = 70` ms. Repeatable keys are up, down, left, right, LT and RT.
- While a direction is held, scrolling is instant (`scrollMode`, 0.5.5). Single presses scroll smoothly.
- The app starts in pad mode (`pad-mode` class on start, 0.5.5). Before that, Home could not scroll down on the first press, and rows stayed half hidden behind the bottom bar. The owner sent a TV photo with the cut-off row circled in red.
- LT and RT switch top tabs. LB and RB only call the current view's `lb`/`rb` handler (sections inside a page). This changed in 0.5.5 at the owner's explicit request: "disable LB and RB for it and keep it RT/LT leave the bumpers for the usual inner section swap".
- Left and right skip elements marked `data-nofirst`. Right on the last item of a row stays put instead of jumping to the search box (0.5.5).

**A10. Touch.** Still correct.
- `html, body { touch-action: none }`, and inputs use `touch-action: manipulation`.
- `nav.js` implements drag to scroll: it picks an axis, scrolls the nearest scroller on that axis, keeps momentum on release, and swallows the click that ends a drag. Elements marked `[data-nodrag]` and inputs are excluded.
- Game Mode delivers touches as mouse events, which is why touch is implemented on pointer events.
- The cursor only shows for a real mouse. The Settings pointer option is Auto, Touch or Mouse.
- This was rewritten in 0.2.2.

**A11. Interface size.** Still correct.
- `autoZoom() = clamp(1, 3, round to 0.05 of min(w/1920, h/1080))` gives 4K 200%, 1440p 135% (1.333 rounds to 1.35; the 0.2.3 notes say 133%), and 100% on the handheld and the Deck.
- The manual choice is 75% to 300%, stored as `ui.scale` (`'auto'` or a number as a string).
- Added in 0.2.3 after the owner's photos of the UI rendered tiny on a 4K TV.

**A12. Light effects.** Still correct.
- `lightEffects(ui, info)` in `themes.js` is true when `ui.effects === 'light'`, or when it is `'auto'` and the GPU is off.
- In light mode, `Background.vue`:
  - renders at 0.5× or 0.75× resolution
  - frames every 50 ms (instead of 33 ms)
  - skips frames within 900 ms of the last input (`lastInput` from `nav.js`)
- The `light-fx` body class drops blur, grain and heavy shadows.
- 0.5.6 also made progress bar shimmer run only while something is active.

**A13. Downloads.** Still correct.
- "Pause" is cancel: `dl:cancel` aborts the request, and the Downloads view labels `cancelled` as "Paused" (`LABEL` in `Downloads.vue`).
- Resume uses `.part` files and HTTP Range. Multi-file games skip files that are already complete.
- Multi-disc games get an `.m3u`. With `downloads.esdeM3uFolders` they are saved as an ES-DE `Game.m3u/` folder.
- `downloads.flattenSingleFile` is on.
- `powerSaveBlocker('prevent-app-suspension')` runs while downloads are active.
- NEW in 0.6: when a download finishes, `steamMgr.onDownloaded(romId)` queues it for Steam if `steam.autoAdd` is on, and broadcasts `steam-auto`.

**A14. PS4/PS5 installed detection.** Still correct.
- For ps4/ps5 only (`FOLDER_SYSTEMS`), `installedState()` looks for a folder named like the archive without `.zip`, `.7z` or `.rar`, or a folder whose name contains the same `CUSA` or `PPSA` title ID.
- Manual marks live in `marked.json`, and `installedMap` holds the sentinel string `MARKED = '(marked as installed)'`.
- `roms:delete` refuses to delete the ROMs root or any console folder. For a mark it only removes the mark.
- NEW in 0.6: `marked.json` entries can carry `path` (set with `steam:setPath` when adding a marked PS4 game to Steam). `markedPath(rom)` reads it.

**A15. Trophies.** Mostly correct, with 0.6 changes.
- Parsers are read only:
  - RPCS3 `TROPUSR.DAT` (big endian) plus `TROP.SFM` (or `TROPCONF.SFM` if there is no TROP.SFM)
  - Vita3K `TROPUSR.DAT` (little endian)
  - shadPS4 XML
  - Xenia XDBF/GPD
- Discovery has 3 layers: the emulator's own settings, a limited background scan (maxDepth 10), then a folder the user picks (validated, and it looks one level down if the pick is too high).
- Sync: RomM notes titled `Cartridge trophies`. Unlocks are only added; the earliest time wins (`merged()` in `trophyService.js`).
- Changed in 0.6:
  - shadPS4 supports every layout, not 3:
    - newest: `<user>/trophy/<NP>/Xml/TROP*.XML` plus `<home>/<uid>/trophy/<NP>.xml`
    - builds in between: `<home>/<uid>/trophy/<ID>/` as a folder
    - older: `game_data/<CUSA>/TrophyFiles/trophy00/Xml/TROP.XML`
    - `home_dir` can be moved in `config.json` or `config.toml`
  - A shadPS4 folder counts as found even with no trophies (`isShadUser`).
  - The trophy key state is reported (`shadKeyState`).
  - Trophy PICTURES sync as extra notes titled `Cartridge trophy icons <set> <n>`.
  - The notes filter matches the prefix `Cartridge troph` (see D5).
  - Folders reachable under two mount paths are de-duplicated by device:inode.
  - `~/Documents/Apps` was added to `APP_DIRS`.

**A16. Releases and updates.** Still correct.
- The workflow builds, runs `CARTRIDGE_SMOKE=1 APPIMAGE_EXTRACT_AND_RUN=1 timeout 90 xvfb-run -a ./Cartridge-x86_64.AppImage`, and requires `SMOKE OK` in the output before `npm run release` publishes.
- `electron-updater` replaces the AppImage in place.
- The artifact name MUST stay `Cartridge-x86_64.AppImage`. The README download link, `install.sh` and in-place updates all depend on it.
- The smoke test lives in `createWindow()`: with `CARTRIDGE_SMOKE`, it waits for `did-finish-load` plus 3 s, checks that `document.body.innerText` contains "Cartridge", prints `SMOKE OK`, and exits 0 (otherwise `SMOKE FAIL`, exit 1, 30 s timeout).

**A17. Settings migration.** Still correct.
- If `config.json` does not exist, `config.json` and `installed.json` are copied from `~/.config/RomDeck` (RomDeck was the first name of the app, used for one evening before it became Cartridge).
- `configVersion` 2: 0.1.1 and 0.1.2 saved `graphics: 'software'` as a default, not as a user choice. Migration moves everyone to `'auto'`.

---

# PART B · Things Claude Code noticed at 0.5.6

**B1. Y on the Search page does not open the built-in keyboard.**
- Real bug, not fixed in 0.6.
- `Search.vue` registers `y: () => ask()`. The view handler wins over `App.vue`'s `focusSearch()`. `searchOsk()` is reached from `focusSearch()` and from the input's own `@click` (App.vue line 20). `ask()` only calls `.focus()`, which does not fire a click, so the keyboard never opens.
- Suggested fix: in Search.vue, when `builtinKb()` is true, make `y` call the same keyboard path as `focusSearch` (for example expose `searchOsk` through the store).
- It is small. Test in Game Mode with the Keyboard setting on Auto.

**B2. `steamArt.addToSteam` keys a new shortcut `String(Object.keys(list).length)`.**
- Real weak spot, not fixed.
- If Steam's numbering has a gap (for example keys 0, 1, 3), the new entry gets key `3` and overwrites an existing shortcut.
- The 0.6 helper (`steamHelper.writeShortcuts`) does not have this problem: it rebuilds the whole list and renumbers from 0.
- Fix: use `max(numeric keys) + 1`, or renumber like the helper does. This only affects "Add Cartridge itself to Steam".

**B3. Comment near the top of `main.js` says software rendering is the default and the GPU is opt-in.**
- Out of date. It is from 0.1.1.
- The real policy is in the later comments and in `forceSoftware`: GPU by default, software in Game Mode and under Steam on handheld-size screens.
- Safe to rewrite the comment. Do not change the code.

**B4. Secrets in plain text in `config.json` (mode 600).**
- Known and accepted. The very first build told the owner: "Your password or token is saved in plain text ... readable only by your user. The system keyring doesn't work in Game Mode."
- The reason: gamescope sessions usually have no Secret Service or KWallet, so `safeStorage` or libsecret either fail or prompt.
- There is also an API-token sign-in, so a password need not be stored.
- Secure storage was never implemented. If you add it, it must fall back to plain text silently in Game Mode.

**B5. No automated tests in the repo.**
- True. Tests existed only outside the repo, in the chat workspace (never in git), and are now gone with it. See F5 for exactly what existed, and `docs/steam-tests.md` for the Steam tests pasted in full.
- The only safety net in the repo is the CI launch check.
- How the owner tests today: he downloads the release (or updates in app) on his 1080p handheld (Bazzite) and his Bazzite PC on a 4K TV, tries it in Desktop Mode and in Game Mode, and sends phone photos of anything wrong.
- Before every release the chat sessions ran:
  - the launch check in 5 environments (F5)
  - Playwright UI scripts against a mock RomM server
  - a clipping sweep
  - a privacy grep
  - after CI published, a download of the actual release AppImage and a rerun of the launch check
- Recommended: add a `test/` folder with the mock server and the Steam fixtures (`docs/steam-tests.md`) so this is repeatable.

**B6. `ui.raOnGames`, `ui.raOnHome` and `ui.trophyOnGames` are not in DEFAULT_CONFIG and rely on `!== false`.**
- Intentional pattern: absent means on, so older configs get the new default without a migration.
- `ui.raOnHome` is legacy (0.3). In 0.6 Home reads `ui.homeAch` (`'all' | 'ra' | 'trophies' | 'off'`) and only falls back to `raOnHome === false ? 'trophies' : 'all'`.
- Other keys that use the same "absent = default" pattern:
  - `ui.homeAch`, `ui.buttons` (glyph set, absent = auto)
  - `trophies.syncIcons`
  - every `config.steam.*` key (`preview`, `autoAdd`, `autoRemove`, `consoleInName`, `templates`, `modes`, `lastCollections`, `seenJob`, `proton`)
- Keep the pattern, or add the keys to DEFAULT_CONFIG with the same defaults. Either works.

**B7. RomDeck → Cartridge migration.**
- RomDeck existed for one evening and only on the owner's own device. It is almost certainly safe to remove now.
- Unsure whether anyone else ever ran RomDeck. The repo never published it; it was sent in chat as a split file.
- It costs nothing to keep.

**B8. `main.js` migration lines that both set graphics to `'auto'`.**
- Leftover. Together they set `'auto'` whatever the old value was, which is the intended outcome of configVersion 2.
- They can be collapsed to one line: `config.graphics = 'auto'`.
- Do not change the behaviour. A user who genuinely picked Compatible after 0.1.x has `configVersion >= 2` and is not affected.

**B9. `roms:delete` deletes whatever path the UI sends (with the console-folder guard).**
- Intentional, but a weak spot. The UI always sends `installedPath` from `installedMap`.
- The guard refuses the ROMs root and any console folder.
- A stricter guard would require the path to be inside the ROMs root or a console folder, or equal to `manifest[romId].path`. Worth adding.
- It never follows a MARKED sentinel (marks only remove the mark).

**B10. Downloads: a cancelled download is labelled "Paused".**
- Intentional. Resume works from `.part` plus Range, so from the user's side a cancel is a pause.
- Queue state is not persisted across app restarts (the `.part` file is). A restarted download resumes because the file is there.

**B11. `Game.vue` `TROPHY_SLUGS` duplicates `trophies.SOURCES` slugs.**
- Not deliberate, just convenience. They must stay in sync: ps3, ps4, xbox360, psvita.
- Better: expose the slugs through an IPC call or a shared constant. Low priority.

**B12. Home "Picks for you" reshuffles on every library change.**
- Intended. The original design was "Picks for you (random each sync)", mirroring RomM's home.
- Correction to what the code actually does: `discoverSeed` is a `let` inside Home.vue's `<script setup>`, so it belongs to each Home instance. Views are mounted with `<component :is ... :key>` and no KeepAlive, so the picks reshuffle on EVERY visit to Home, not only when `store.libVersion` changes. It picks 24 random games that have a cover.
- The intent was once per sync. To get that, move `discoverSeed` to module scope (outside `<script setup>`) or the store. Ask the owner which he prefers; reshuffling on every visit may feel fine or random to him.

## Other bugs, quirks, weak spots and debt known at 0.6.0

1. `steamManager.apply()` writes `steam-games.json` before the helper confirms (see F4 in the follow-up answers).
2. The Steam manager does all its file work and `flatpak list` synchronously on the main process:
   - `steam:overview`, `steam:preview` and `steam:forRom` read `shortcuts.vdf` and learn all shortcuts on every call
   - the first `flatpak list` can block for up to 8 s
   - Game.vue calls `steam:forRom` every time the More menu opens

   It is fine on the test fixture. Unsure how it feels on a large real Steam library.
3. `apply()` fetches artwork for every entry one after another before the helper starts. It uses SteamGridDB and RomM over the network. With many games and a slow network the Apply button can look stuck for a long time, and there is no progress UI.
4. Undo only restores `shortcuts.vdf`. It does not undo collection changes in `cloud-storage-namespace-1.json` or the Proton entries in `config/config.vdf`.
5. Proton support is untested. `writeCompat` only inserts into an existing `"CompatToolMapping" {` block and skips otherwise.
6. There is no automatic Xenia finder. `xbox360` has only the EmuDeck `xenia.sh` launcher; no AppImage or `.exe` search.
7. `findTemplate` Flatpak IDs are best guesses:
   - `net.pcsx2.PCSX2`, `org.duckstation.DuckStation`, `org.DolphinEmu.dolphin-emu`, `info.cemu.Cemu`, `org.yuzu_emu.yuzu`, `net.rpcs3.RPCS3`, `net.shadps4.shadPS4`, `org.ppsspp.PPSSPP`, `org.azahar_emu.Azahar`, `net.kuribo64.melonDS`, `app.xemu.xemu`
   - Unsure every one of these is current.
8. `Achievements.vue`: the tab styles are duplicated inside the 1100px media query (follow-up Q1).
9. `.padbtn` rules in `styles.css` are dead after the 0.6 Btn redesign (follow-up Q3).
10. RetroAchievements game page: X = Refresh, Y = Filter. Trophy game page: X = Filter, Y = More (follow-up Q2).
11. `steamHelper.js`'s own `steamRunning` is reduced: no `steam.sh` comm check, no pid-file or pgrep fallback. `steamArt.js` has all three.
12. `verifyCollections()` runs at every start (`steam:report` 2.5 s after mount). If Steam has not written the cloud file yet, it can warn about missing collections too early. Unsure how often that happens.
13. `startupReport()` marks the last job as seen when it is read. If the renderer reloads before the toast shows, the toast is lost. Minor.
14. The `SteamEmu.vue` focus restore uses `.se-f:nth-of-type(n)`. It depends on the three field buttons being the only `button` children of `.dialog`.
15. Modals are a single slot (`store.modal`). A modal that opens another one (the keyboard, the folder picker) is replaced. `FolderPicker.newFolder`, `SteamCollections.addNew` and `SteamEmu.edit/browse` save `store.modal.resolve` and reopen themselves afterwards. Any new nested flow must do the same, or its promise never resolves.
16. The trophy "Change icon" and the main SteamGridDB matching share `sgdbGames()` ranking. Good, but the name cleanup (`cleanName`) strips everything in brackets, so a game titled with brackets on purpose can match badly.
17. `install.sh` fetches the latest release asset and makes a menu entry. It was not changed in 0.6.
18. The Steam helper's backup can be overwritten if the `systemd-run` copy and the 5 s fallback copy both run (details in F7). Fix before relying on Undo.
19. `steamManager.test()` calls `ctx.biosCheck?.(key)`, but `main.js` never passes `biosCheck`, so that BIOS note never shows.

---

# PART C · What changed in 0.6.0

There is no version after 0.6.0. It was released on 2026-09-28 as GitHub release `v0.6.0`. The release title is "Cartridge 0.6.0" (from `releaseInfo.releaseName`); the notes heading and the commit message say "Cartridge 0.6.0 · The Steam Update".

Before release, CI passed and the downloaded release AppImage passed the launch check in all 5 environments plus the Steam launch script. The Steam helper was also run through the released AppImage against a fake Steam (F5).

## C1. Release notes for 0.6.0, exactly as published

### Cartridge 0.6.0 · The Steam Update

#### New: your games in Steam
Settings → Steam now adds the games you downloaded to Steam as non-Steam shortcuts, so you can start them straight from Game Mode.

- **Launches the way your setup already does.** Cartridge reads the shortcuts you already have (from Steam ROM Manager, EmuDeck or made by hand) and copies each console's **Target**, **Start in** and **Launch options**, only swapping in the new game. Mixed setups work, for example EmuDeck for PS2 and Dolphin next to AppImages for RPCS3, shadPS4 and Eden.
  - Frame generation wrappers (like `mako-run` and lsfg-vk) are left out. Prefixes like `vblank_mode=0` are kept.
  - Quoting is kept exactly as your shortcuts write it.
  - PS3 games start by game ID (`%RPCS3_GAMEID%:BLUS…`) when RPCS3 already knows the game, and from the file when it doesn't.
  - PS4 games through the shadPS4 launcher start by title ID (`-g CUSA…`) or from `eboot.bin`.
  - Wii U game folders start from their `.rpx`.
  - Paths are written the way your shortcuts write them, even when a drive shows up under two paths (`/run/media/…` and `/media/…`).
- **Consoles with no shortcut yet** use the emulator Cartridge finds: the EmuDeck launcher, then an AppImage (including `~/Documents/Apps`), then a Flatpak, then RetroArch with a matching core.
- **See it before it happens.** A preview lists every Target, Start in and Launch options before Steam is touched. You can turn it off.
- **Collections.** Pick one or more of your Steam collections, none, or make a new one. Cartridge remembers the choice per console, tells you if Steam Cloud drops them, and can put them back.
- **Artwork.** Cover, background, logo and wide banner from RomM and SteamGridDB, each checked for the right shape.
- **Safe to use.** Steam closes for a moment while its files change, then opens again (Game Mode brings it back by itself). Your other shortcuts are not touched, the shortcuts file is backed up first, and **Undo last change** puts it back.
- **Games already in Steam are skipped**, whoever added them. Games that share a name get the console added, like "God of War (PS3)", or always if you prefer.
- **Per game:** More → **Add to Steam** or **Remove from Steam** on any downloaded game. PS4 games you marked as installed ask for their folder once.
- **Edit any console** in Settings → Steam → Emulators: Target, Start in and Launch options, with a Test button.
- **Optional:** add games to Steam after they download, and remove them when you delete them. Both are off by default.
- **Remove everything Cartridge added** in one go, and **Restart Steam** from Cartridge.
- **Start through Cartridge (optional, per console).** A shortcut can go through a small script instead of starting the emulator directly. If the game is gone, Cartridge opens on that game's page so you can download it again.
- Clear messages when Steam isn't installed or no account has signed in yet. Flatpak Steam works too. With several accounts, the one that signed in last is used.

#### New: trophies
- **Trophies & Gamerscore tab, redesigned** in the style of the RetroAchievements tab.
- **Game logos and console wordmarks** on trophy cards and trophy pages instead of plain names, sized evenly.
- **Latest achievements on Home include trophies**, mixed with RetroAchievements, newest first. Choose All, RetroAchievements, Trophies or Off in Settings → Achievements.
- **Trophy pictures sync between devices.** Small copies are stored with your trophies in RomM, so a device that never played the game still shows them. You can turn this off.
- **Change a game's icon** from its trophy page (More → Change icon), picked from SteamGridDB.
- **Icons are always full rounded squares.** Round icons with see-through corners are skipped.
- **Better SteamGridDB matches.** Exact names come first, so Skate 3 no longer picks up "skate: recompiled".

#### New: your controller's buttons
- **Button hints match the controller you're holding**: Xbox, PlayStation, Nintendo (with A/B and X/Y in their real places) or Steam. Cartridge reads the real controller even when Steam presents it as an Xbox pad. Pick one yourself in Settings → Look & Feel → Button icons.

#### Fixed
- **shadPS4 showed "Not found" without a trophy key.** It is now found as soon as its folder exists and says "no trophy key" until you add one in shadPS4. The shadPS4 Qt launcher's folder is no longer used, since it only holds emulator versions.
- **Portable shadPS4 in `~/Documents/Apps`** is now found for trophies.
- **Start and Select icons were too big** in the button bar, and **LT had a white box** that RT didn't.
- **Cartridge sometimes wouldn't open again until Steam restarted.** Only one Cartridge runs at a time now: opening it again brings the running one forward, and one that stopped responding is closed so the new one can start.

## C2. Every file added or changed since 0.5.6

`git diff --stat f06dd1b..5d60917`: 32 files, +2079 −104. No files were deleted or renamed.

**New files**
- `electron/steamManager.js` (750 lines): the Steam ROM manager. It is a factory, `createSteamManager(ctx)`. Internals are in C3.
- `electron/steamHelper.js` (204 lines): a standalone script that runs as Node inside Cartridge's own binary (`ELECTRON_RUN_AS_NODE=1`). Why it exists:
  - Steam must be closed while `shortcuts.vdf` changes, because Steam rewrites the file when it exits.
  - Closing Steam also ends everything Steam started, which includes Cartridge itself when it was launched from Steam (always the case in Game Mode). So the writing has to happen in a process that outlives both.
  - It has its own copy of the binary VDF reader and writer, so it needs nothing from the AppImage mount.
- `src/steam.js`: the renderer side of the Steam flow:
  - `pickCollections`, `addGame`, `removeGame`, `applyChanges`, `restartSteam`, `steamReport`
  - listens for `steam-queue` and `steam-auto`
- `src/components/SteamSettings.vue`: the new Settings → Steam body:
  - status card
  - queue banner
  - "Add N missing games" and "Restart Steam"
  - emulator list
  - options (preview, auto add, auto remove, console in names)
  - undo and clean up
- `src/components/SteamPreview.vue`: modal `steam-preview`. It shows every entry's Target, Start in and Launch options, what gets removed, and what was skipped and why.
- `src/components/SteamCollections.vue`: modal `steam-collections`, a multi-select of the user's Steam collections, None, and "New collection…".
- `src/components/SteamEmu.vue`: modal `steam-emu`, which edits one console's Target, Start in and Launch options, with "Pick Target", "Test" and "Automatic".
- `src/pad.js`: controller glyph selection (`padKind`, `padInfo`, `detectPad`).
- `src/components/ConsoleMark.vue`: the console wordmark drawn at text scale (0.8em, white) on trophy cards.

**Changed files**
- `electron/main.js`:
  - Single-instance lock and heartbeat (`running.json`), `--game <id>` (`argGame`, `startGame`, `app:startGame`, the `open-game` broadcast).
  - Steam manager wiring:
    - `coverCrop`, `asPng`
    - `sgdbImage(name, kind)` with a shape check
    - `romIndexMain`
    - the `steamMgr` ctx
    - IPC `steam:*` (the full list is in C3)
  - Auto add after a download, auto remove after `roms:delete`.
  - `detectPad()` reading `/proc/bus/input/devices`, and IPC `pad:detect`.
  - Square game icons from SteamGridDB:
    - `iconOpaque`, `pickIcon`, `gameIcon` (cache `gameicons2.json`)
    - `sgNorm`, `SG_EXTRA`, `sgScore`, `sgdbGames(name, year)` ranking
    - IPC `icon:get`, `icon:set`, `icon:reset`
- `electron/trophies.js`:
  - `APP_DIRS` gained `~/Documents/Apps` and `~/Emulators`, and is exported.
  - `emulationRoots` is exported, so the Steam finder uses the same lists.
  - shadPS4 discovery rewritten: `shadps4Roots`, `isShadUser`, `shadHomes`, `shadps4Games`, `shadKeyState`, `watchPaths`. The Qt launcher folder is excluded.
  - `validate()` also checks immediate children.
- `electron/trophyService.js`:
  - Picture sync: `packIcons`, `pushIcons`, `unpackIcons`, remote icons registered at start.
  - `notesAll` prefix fix.
  - device:inode de-duplication (`dirsOf`).
  - The `note` field (`nokey`, `empty`) and `found[].watch` in `status()`.
  - Explicit links win over remote romId in `merged()`.
- `src/components/Btn.vue`: rewritten.
  - Glyphs per layout (xbox, playstation, nintendo, steam), including `LT+RT`.
  - PlayStation shapes as SVG.
  - Nintendo A/B and X/Y swapped to their real positions.
  - Classes `.pb`, `.face`, `.shoulder`, `.sys`. Start and Select are smaller; LT and RT are drawn the same.
- `src/components/GameIcon.vue`: small change. The rounded square with the SteamGridDB icon or a fitted image over a blurred copy already existed in 0.5.6. 0.6 adds `iconKey`, passes the release `year` to `icon:get` (for ranking), and re-renders when `store.iconVer` changes (after Change or Reset icon).
- `src/views/Achievements.vue`: the second section is renamed "Trophies & Gamerscore" (design A: a trophy mark with a small G badge, and gradient words).
- `src/views/TrophyPanel.vue` and `src/views/TrophyGame.vue`:
  - Game logo instead of the name, and the console wordmark.
  - GameIcon.
  - TrophyGame: More → Change icon / Reset icon, X = Filter.
- `src/views/Home.vue`: `loadAch()` merges RetroAchievements and trophies into one "Latest achievements" row, honouring `ui.homeAch`.
- `src/views/Game.vue`: More menu gains "Add to Steam", "Remove from Steam", or "Waiting to be added to Steam".
- `src/views/Settings.vue`:
  - Steam section now renders `<SteamSettings />` above the old "Cartridge itself" card.
  - Look & Feel gained "Button icons" with a live demo.
  - Achievements gained "On Home", "Sync trophy pictures", and the shadPS4 "no trophy key" note.
- `src/App.vue`:
  - Registers the three Steam modals.
  - On mount: `app:startGame` plus the `open-game` listener, and `steamReport()` after 2.5 s.
  - The LT/RT `Btn`s get the `tab-trig` class instead of an inline margin, and the START/SELECT hints are wrapped in `.hint` spans.
  - Calls `detectPad()`.
- `src/store.js`: `iconVer`, `iconKey`, `iconChanged`.
- `src/styles.css`: the bottom hint bar's colours (theme tint variables) and the gap on its left side (10 to 18 px).
- `src/views/Consoles.vue`, `Downloads.vue`, `Gallery.vue`, `RaPanel.vue`, `src/components/ArtPicker.vue`: small changes for the glyph redesign (hint labels, `Btn` usage). Nothing functional.
- `package.json`: version 0.6.0, releaseName "Cartridge 0.6.0".
- `README.md`: the "One-click Add to Steam" highlight became "Your games in Steam".
- `CHANGELOG.md` and `RELEASE_NOTES.md`: the 0.6.0 notes.

## C3. How the 0.6 features work inside

### C3.1 Steam ROM manager (`electron/steamManager.js`)

**Context passed from `main.js`**
- `USER_DATA`, `log`, `PLATFORM_MAP`, `getConfig`, `saveConfig`, `broadcast`, `getLibrary`
- `installed: () => installedMap`, `MARKED`, `markedPath: (r) => marks[r.id]?.path || null`
- `romById`, `artFor: (id) => artOverrides[id]`
- `fetchImage` (returns PNG), `sgdbImage`, `cropTo: coverCrop`
- `logoFile` (runs `logoFor`, then returns the path of the prepared logo PNG)
- `emulationRoots: () => trophies.emulationRoots([emuDeck emulationPath, dirname(romsRoot)])`
- `isGamescope`

**Steam install and account**
- `steamRoots()`: `~/.local/share/Steam`, `~/.steam/steam`, `~/.steam/root`, and the two Flatpak roots. De-duplicated by realpath.
- `loginUsers(root)` parses `config/loginusers.vdf`. `accountid = steamid64 − 76561197960265728`.
- `environment()` lists every `userdata/<id>/config` and picks the account marked `MostRecent`, then the newest timestamp.
- It reports `nosteam`, `noaccount`, or `{ accounts, account, running }`. `account.flatpak` is true when the root is under `com.valvesoftware.Steam`.
- Files per account: `userdata/<id>/config/shortcuts.vdf`, `.../config/grid/`, `.../config/cloudstorage/cloud-storage-namespace-1.json` (collections), and `<root>/config/config.vdf` (Proton mapping).

**Learning from existing shortcuts**
- `readShortcuts` reads the binary VDF: `appid`, name, `Exe` (quotes removed and raw), `StartDir`, `LaunchOptions`, `LastPlayTime`.
- `tokenize(s)` splits like a shell but keeps each token's raw text, so quoting is copied exactly.
- `learnOne(sc)` finds the game reference in the launch options, in this order:
  1. `%RPCS3_GAMEID%:XXXX12345` gives kind `serial`, console ps3.
  2. A path containing `/roms/<folder>/`. It uses the FIRST `/roms/`, because Wii U games live under `roms/wiiu/roms/`. The folder names the console. The file decides the kind: `eboot.bin` gives `eboot`, `.rpx` gives `rpx`, anything else `path`.
  3. A bare `CUSA12345` or `PPSA12345` token gives kind `titleid`, console ps4.
  4. Any absolute path to a file, with the console taken from the emulator name (`EMU_CONSOLE` regexes on the Exe).
- The game token becomes a placeholder, `{ROM}` or `{SERIAL}`.
- Tokens before `%command%` are kept, minus frame generation wrappers:
  - `FRAMEGEN`: `mako-run`, `lsfg`, `lsfg-vk*`, `framegen`
  - `FRAMEGEN_ENV`: `LSFG_*`, `ENABLE_LSFG*`, `MAKO_*`
- `vblank_mode=0` and any other environment prefix stay.
- A Start In under `/tmp/.mount_...` (an AppImage's temporary mount, which is gone after the app closes) or an empty one becomes `dirname(Exe)`.
- `learnAll` skips Cartridge's own shortcuts (in the registry, or with "cartridge" in name or exe). For each console it picks the pattern most shortcuts use, with ties going to the most recently played. It also collects every `romRoot` it saw into `romRoots`.
- The result per console is `{ exe, start, pre[], command, args, kind, romRoot, sub, sample, from, fromId, how: 'learned', count }`.

**Finding emulators when nothing can be learned (`findTemplate`)**
1. An EmuDeck launcher script in `<Emulation>/tools/launchers/` (`EMUS[console][0]` names, for example `pcsx2-qt.sh`, `dolphin-emu.sh`, `cemu.sh`, `eden.sh`, `rpcs3.sh`, `shadps4.sh`).
2. An AppImage matching the console's regex in `APP_DIRS`: `~/Documents/Apps`, `~/Applications`, `~/AppImages`, `~/Downloads`, `~/.local/bin`, `~/Games`, `~/Emulators`, `<Emulation>/tools`. The shadPS4 Qt launcher is only used if it is the only match, and then the args become `-d -g "{ROM}"`.
3. A Flatpak from `flatpak list --app` (cached for the process lifetime), as `/usr/bin/flatpak run <id> <args>`.
4. For retro consoles, RetroArch with the first core found (`CORES` table) through the EmuDeck `retroarch.sh`, else Flatpak RetroArch.
- PS4 found templates use kind `eboot`. Wii U uses `rpx`.
- `templateFor(key)` checks, in order: the user's template (`config.steam.templates[key]`, `how: 'yours'`), then learned (refreshed every 60 s), then found.

**Per game (`gameRef`, `buildLaunch`)**
- `serial` (PS3):
  - `serialOf` reads the serial from the file name tag (`[BLUS30443]`), then `PS3_GAME/PARAM.SFO`, then the first 1 MB of the ISO.
  - If `rpcs3Knows(serial)` (in `~/.config/rpcs3/games.yml` or the Flatpak one), it uses `%RPCS3_GAMEID%:SERIAL`.
  - Otherwise it falls back to the path: an EBOOT inside a folder game, or the ISO. `fallback: 'path'`. RPCS3 can only start a serial it has seen before; this matches the owner's rule "If RPCS3 doesn't know the game, fall back to launching by path".
- `titleid` (PS4): the title ID from the file name, folder name, rom name or `sce_sys/param.sfo`. Otherwise it falls back to the eboot path.
- `eboot`: `findEboot(dir)` searches 3 levels deep for `eboot.bin`, case-insensitively.
- `rpx`: `<folder>/code/*.rpx`.
- `styled(file, t)` writes the path the way the shortcuts write theirs. It maps the real path back onto the console's `romRoot` or any learned `romRoot`, so `/run/media/...` vs `/media/...` and `/var/home` vs `/home` match the user's own style.
- Launch options = `[pre..., '%command%' if the template had it, args with {ROM}/{SERIAL} filled]`.

**Library view (`overview`)**
- `installedGames()` lists every downloaded or marked game with its file and console key. `keyOf(slug, fs_slug)` maps through `PLATFORM_MAP` to one key per console (ngc → gc, ps → psx and so on).
- `inSteamIndex(shortcuts)` decides whether a game is already in Steam:
  - by any absolute path in the launch options (including an eboot inside the game folder)
  - by PS3 serial or PS4 title ID
  - by the same name, but only when that shortcut is for the same console
  - by "Name (Console)"
- Name-only matching was restricted after a test found a PS2 "God of War" hiding the PS3 one.
- Returns: steam status and messages, games, consoles (with template and mode), queue, last status, the number of games Cartridge added, collections, backup count.

**Queue**
- `steam-queue.json` holds `{ add: [{romId, collections}], remove: [appid], collections }`.
- It survives restarts, and every change broadcasts `steam-queue`.

**Plan and preview**
- `plan()` builds each entry: name, exe, start, launch options, appid, how, fallback, proton, collections. It skips games with no file (marked PS4 without a folder) or no emulator, with a reason.
- Names:
  - A name gets " (SHORT)" if it collides inside the batch, or with an existing Steam shortcut for a different game.
  - Always add it if `config.steam.consoleInName === 'always'`.
  - `SHORT` holds short console names (PS2, GameCube and so on).
- `appid = crc32('"' + exe + '"' + name) | 0x80000000`, the same formula Steam uses for non-Steam shortcuts.
- Mode `script`: `exe = <userData>/play.sh`, `start = <userData>`, launch options = the romId. `play.sh` is a `case` on the romId:
  - if the file is gone, it runs `exec <AppImage> --game <id>`
  - otherwise it `cd`s to Start In and runs the direct command
  - it is rewritten on every start and every apply (`writeScript`)
- `preview()` returns the plan in display form.

**Apply**
1. Build the plan.
2. Write artwork into `userdata/<id>/config/grid/`. This happens while Steam is still running; Steam reads the folder at start.
   - `<appid>p.png` cover: the user's pick, then RomM `path_cover_large`/`small`/`url_cover`, then SteamGridDB 600x900.
   - `<appid>_hero.png`: the user's picked background, then the first screenshot, then a SteamGridDB hero.
   - `<appid>.png` wide: SteamGridDB 920x430 or 460x215, else the hero cover-cropped to 920x430.
   - `<appid>_logo.png`: the prepared logo.
   - `sgdbImage` only accepts the right shape: grid portrait, wide wider than 1.6:1, hero wider than 1.4:1. Everything is converted to PNG.
3. Delete the grid art of appids being removed (only Cartridge's own).
4. Update the registry `steam-games.json` (`appid → { romId, name, console, exe, mode, at, account, collections }`) and save it. Removed ones move to `steam-games-removed.json`, so Undo can give them back.
5. `writeScript()` (regenerate `play.sh` from the registry).
6. `runHelper('last', job)`: write `steam-jobs/last.json`, delete `last.status.json`, copy `steamHelper.js` to `steam-jobs/`, then spawn it (F7).
7. Remember `lastCollections[console]` in config and save.
8. Clear the queue (keeping `collections`).

**Helper job flow (`steamHelper.js`)**
1. Write status `closing`, and record `wasRunning`.
2. `closeSteam()`: `steam -shutdown` (and the Flatpak one for Flatpak Steam), then poll `/proc` every 500 ms for up to 45 s. When Steam is gone, wait 1.5 s more.
3. `onlyRestart` jobs stop there.
4. `restore` jobs (Undo) parse the backup first, back up the current file as `shortcuts.vdf.undo-<ts>`, copy the backup over, and rename the used backup to `shortcuts.vdf.used-<stamp>`.
5. Normal jobs:
   - Back up `shortcuts.vdf`, the cloud file and `config.vdf` to `steam-backups/<name>.<stamp>`.
   - `writeShortcuts()`: remove the listed appids, add or merge entries, renumber from 0, write to `.tmp`, rename over, then read it back and compare the count.
   - `writeCompat()`: Proton for `.exe` targets.
   - `writeCollections()`: edit or create `user-collections.uc-<id>` rows, bump `timestamp` and `version`.
6. Write status `done` or `error` to `<job>.status.json`.
7. `finally`: if restart is wanted and Steam was running (or `onlyRestart`), wait 12 s in Game Mode (1.5 s otherwise), then start `steam` if it is not back.

Log: `steam-apply.log`. Backups listed for Undo match `shortcuts.vdf.<digit>...`, so used and undo backups are ignored.

**Other functions**
- `undo()` restores the newest backup through the helper and fixes the registry.
- `restartSteam()` runs an `onlyRestart` job.
- `removeAllOurs()` queues every registry appid for removal.
- `verifyCollections()` lists registry games missing from their collections. `fixCollections()` writes them back through the helper.
- `test(key, template?)` checks the Target exists and is executable, or that the Flatpak is installed.
- `setTemplate(key, {exe,start,lo} | null)` and `setMode(key, 'direct'|'script')`.
- `forRom(romId)` is the per-game status for the More menu.
- `startupReport()` returns the last job result once, plus missing collections.
- `onDownloaded` and `onDeleted` are the auto add and remove hooks.

**IPC channels (all new in 0.6)**
- `steam:overview`, `steam:preview`, `steam:apply {restart}`, `steam:undo`, `steam:restart`
- `steam:queueAdd [{romId, collections}]`, `steam:queueRemove [appid]`, `steam:queueClear`, `steam:removeAll`
- `steam:collections`, `steam:test {key}`, `steam:testTemplate {key, template}`, `steam:setTemplate {key, template}`, `steam:setMode {key, mode}`
- `steam:verify`, `steam:fixCollections`, `steam:report`, `steam:last`, `steam:forRom {romId}`, `steam:setConfig patch`, `steam:setPath {romId, path}`
- `app:startGame`

Unchanged from before: `steam:add`, `steam:status`, `steam:applyArt` (Cartridge's own shortcut).

**Config keys (`config.steam`, none in DEFAULT_CONFIG, absent = default)**
- `preview` (default on)
- `autoAdd` (off), `autoRemove` (off)
- `consoleInName` (`'clash'` default, or `'always'`)
- `templates{}`, `modes{}` (default `'direct'`)
- `lastCollections{}`
- `seenJob`
- `proton` (default `'proton_experimental'`)

**New files in `~/.config/Cartridge/`**
- `steam-games.json`, `steam-games-removed.json`, `steam-queue.json`
- `steam-jobs/` (`last.json`, `last.status.json`, `restart.json`, `restart.status.json`, `steamHelper.js`)
- `steam-backups/`, `steam-apply.log`, `play.sh`
- `running.json` (single-instance heartbeat)
- `gameicons2.json`
- `trophyicons/remote/<set>/`

**UI flow (`src/steam.js`)**
- More → Add to Steam:
  1. `steam:forRom`
  2. For a marked PS4 game with no folder, a folder picker, then `steam:setPath`.
  3. The collections modal, preset to that console's last choice.
  4. `steam:queueAdd`
  5. A menu: "Apply now" or "Later".
- `applyChanges()`:
  1. If preview is on: `steam:preview`, then the preview modal.
  2. `steam:apply`
  3. A toast if Steam will restart.
  4. Poll `steam:last` every second for up to 90 s until `done` or `error`.
  5. Consume `steam:report`, so the result is not reported again at the next start.
  6. "Done. N games added." or "Still waiting for Steam to close...".
- `steamReport()` runs 2.5 s after start. It toasts the last result (when Cartridge was closed by the Steam restart) and any missing collections.

### C3.2 Single instance and `--game`
In `main.js`, after `log` is defined and before `isGamescope`:
- `app.requestSingleInstanceLock({ game })` is skipped for `CARTRIDGE_SMOKE` and `CARTRIDGE_MULTI` (used by tests).
- **Got the lock:**
  - Write `running.json` `{pid, t}` every 5 s.
  - On `second-instance`: restore, show and focus the window, and broadcast `open-game` if the second launch had `--game <id>`.
  - Remove the file on `will-quit`.
- **No lock:**
  - Read `running.json`. If its time is under 20 s old, the other instance is alive: log "handing over" and exit 0.
  - Otherwise kill its pid (SIGKILL), remove `SingletonLock`, wait 700 ms (`Atomics.wait`), `app.relaunch` with the same arguments, exit.
- The renderer asks `app:startGame` once on mount (for the first launch with `--game`) and listens for `open-game`. Both call `go('game', { romId })`.

### C3.3 Controller glyphs
- `main.js detectPad()` reads `/proc/bus/input/devices` and maps vendor:product with `PADS`:
  - `054c` → playstation
  - `057e` → nintendo
  - `28de:1205` → steam (label "Steam Deck")
  - other Steam Controller IDs (`28de:`) → steam
  - `045e`, `0b05`, `17ef`, `2dc8` → xbox
- It skips Steam Input's virtual pad `28de:11ff`, marks built-in pads (Deck, ASUS `0b05`, Lenovo `17ef`, bus 0019), and prefers an external pad over a built-in one, then the newest device.
- It returns `{ kind, name, devices }`.
- `pad.js`: `padKind` = the `ui.buttons` setting if not auto, else the detected kind. Detection falls back to the browser Gamepad API id, then xbox. It re-runs on connect or disconnect and every 30 s.
- `Btn.vue` draws per kind.
- Why: the owner's Steam Controller showed as an Xbox 360 pad, because Steam Input hides the real device from the browser.

### C3.4 Trophy work in 0.6
- **Trophies & Gamerscore tab (design A):** the owner picked "A" from options shown to him, after saying the Others tab "looks uncool, make it cooler like RetroAchievements".
- **GameIcon:** square rounded icons only.
  - `iconOpaque(buf)` accepts a PNG of at least 96 px, square within 8%, with all four corners (inset 4%) at alpha over 200. That rejects the old round icons with transparent corners.
  - `pickIcon(gid)` tries the 8 most square, largest candidates.
  - Custom picks from "Change icon" are stored with `custom: true` and never refetched.
- **`sgScore` ranking:**
  - exact normalized name = 100
  - prefix match = 60 minus 6 × word-count difference
  - otherwise word overlap
  - −40 when the extra words include remaster, recompiled, demo, mod, hack, collection and similar, unless the query has them too
  - +8 if verified
  - −3 per year of release-year difference (up to −15)
  - tie-break by SteamGridDB order
  - Why: Skate 3 matched "skate: recompiled".
- **Logos on cards:** a game logo (`GameLogo`) instead of the name, and `ConsoleMark` wordmarks. The owner said scaling mattered most.
- **Home:** `loadAch()` merges RetroAchievements recent unlocks with emulator trophies. The Settings "On Home" option is All, RetroAchievements, Trophies or Off.
- **Trophy pictures sync:**
  - Pictures are packed as base64 JPEG (quality 82): the game icon at 200 px wide and each trophy at 64×64.
  - They go into notes titled `Cartridge trophy icons <set> <n>`, each part under 44,000 characters, because RomM on MariaDB keeps notes in a column limited to 64 KB.
  - Pushed only if no picture notes exist yet and `trophies.syncIcons !== false`.
  - Pulled into `trophyicons/remote/<set>/` and registered as icon tokens at start.
  - Why: on the handheld, trophies synced from the Bazzite PC showed generic cup icons (owner photo).
- **shadPS4:** found as soon as its user folder exists (`isShadUser`: games present, or at least 2 of config.json, config.toml, keys.json, home, trophy, game_data, shader, sys_modules, custom_trophy, or both log and home).
  - `shadKeyState`: `keys.json` `TrophyKeySet.ReleaseTrophyKey`, or older `config.toml [Keys] TrophyKey`, gives `set` / `missing` / `unknown`.
  - The Settings chip shows "Found · no trophy key".
  - The Qt launcher's `~/.local/share/shadPS4QtLauncher` is never used; it only holds emulator versions.
  - Why: 0.5.6 showed "Not found" whenever no trophies existed yet, which was a regression the owner reported with a photo.

## C4. Bugs fixed in 0.6

1. **shadPS4 "Not found" without a trophy key** (a 0.5.6 regression).
   - Cause: 0.5.6 only accepted a folder that already held trophy files. Without a trophy key, shadPS4 never writes any.
   - Fix: folder signature (`isShadUser`) plus key state.
2. **Portable shadPS4 in `~/Documents/Apps` not found.**
   - Cause: `APP_DIRS` lacked that folder. The owner keeps all his AppImages there: Cartridge, Eden, RPCS3, shadPS4QtLauncher and Xenia, visible in his file manager photo.
   - Fix: added it, and shared the list with the Steam finder.
3. **Start/Select glyphs too big, LT with a white box but RT without.**
   - Cause: unsure. In 0.5.6 `.padbtn.b-lt` and `.b-rt` shared one style. The likely cause is hint labels such as `{ b: 'LT', label: '/ RT  Tabs' }`, which drew LT as a glyph and RT as plain text.
   - Fix: the Btn.vue rewrite (LT and RT use the same `.shoulder` class; `.sys` is 28 px), and hints now use `b: 'LT+RT'` so both triggers are drawn.
4. **Steam Controller shown as an Xbox 360 pad.**
   - Cause: Steam Input's virtual pad (28de:11ff).
   - Fix: read the real devices from `/proc/bus/input/devices`.
5. **Round or cropped, blurry trophy game icons, and the wrong game for Skate 3.**
   - Fix: square-only icons plus ranking (C3.4).
6. **Trophy pictures missing on a second device.** Fix: picture sync (C3.4).
7. **"Cartridge sometimes wouldn't open again until Steam restarted."**
   - Cause: unsure. The best guess is a previous Cartridge process still alive without a window, or a stale Chromium singleton.
   - Fix: single instance plus heartbeat (C3.2 and F8).
8. **Trophy sync broke during development of 0.6** (never shipped).
   - The notes filter used `startsWith('Cartridge trophy')`, which does not match the title "Cartridge trophies" (troph-ies, not troph-y). It is now `'Cartridge troph'`.

## C5. New "looks wrong but must stay" code in 0.6
- `argv = [helper, jobFile, '--no-sandbox']` in `runHelper`. The trailing `--no-sandbox` is deliberate (F7).
- The helper is copied out to `steam-jobs/steamHelper.js` before it runs. The original is inside `app.asar` inside the AppImage's temporary mount, which disappears when Cartridge exits.
- `systemd-run --user --collect --quiet -p KillMode=process ...` with a 5 s "did it report in" fallback (F7).
- `env.LD_PRELOAD` is deleted for the helper, so Steam's overlay library is not injected into it.
- Registry writes happen before the helper runs. See F4 for why, and the known downside.
- The name-only "already in Steam" match requires the same console.
- The first `/roms/` in a path is the console folder, not the last (Wii U).
- `/tmp/.mount_*` Start In is replaced with the AppImage's own folder.
- `iconOpaque` rejects icons with transparent corners even when they look fine as a picture. That is the owner's rule: "no circle icons, full rounded squares".
- `Btn.vue` swaps Nintendo A/B and X/Y labels, so the glyph matches the physical position.
- The notes prefix `'Cartridge troph'`.
- De-duplicating trophy folders by device:inode. `/run/media/...` and `/media/...` reach the same drive on Bazzite.
- In `SteamCollections` and `SteamEmu`: `store.modal = {..., resolve: resolveOuter}` after `askText` or `pickFolder`. This is the reopen pattern for the single modal slot.

## C6. Half-finished, experimental or known-broken in 0.6
- **The Steam manager has never run on a real device against a real Steam client.** Everything was tested with fixtures (F6). Treat the first real use as a beta. The owner was told to try one game from Desktop Mode with the preview on.
- Game Mode Steam restart behaviour (does gamescope-session bring Steam back, and how fast) is unverified. The 12 s wait is a guess.
- The `systemd-run` path is unverified (the test container has no user systemd).
- Proton mapping, Flatpak Steam and multiple accounts are untested.
- Undo does not revert collections or Proton entries.
- The registry can claim a game was added when the helper failed (F4).
- The single-instance "stale heartbeat" branch was only tested with a SIGSTOPped process in a container. There, Chromium's own singleton timeout (about 20 s) killed the hung instance, and the new launch became the app. The explicit kill-and-relaunch branch never actually ran.
- Everything else in 0.6 (trophies, glyphs, UI) was tested with the Playwright suite and the clipping sweep.

## C7. Committed and pushed?
Yes. `main` on GitHub is at `5d60917`, the same as the local repo. There are no uncommitted changes. No code exists only in chat. The only thing that was never in the repo is the test harness (F5); its Steam parts are pasted in `docs/steam-tests.md`.

---

# PART D · What the code alone does not show

## D1. Project vision

**Who it's for**
- First the owner himself. He started with: "I want to develop an app that connects to my romM server ... a Linux app that's a dot app image ... primarily made for Bazzite or SteamOS systems that you can just like install on desktop mode and then add the app image as a Steam ... add to Steam and then use it in game mode it should have full controller support". He chose to build his own, "because this is gonna be something personal for me".
- Later he required that it "must work for anyone's setup, not just mine". The public repo, README and install script are for anyone with RomM.

**The feel**
- "a console experience with game mode as the priority", "very sick with the design and very nice".
- Take Playnite's fullscreen mode and the Argosy launcher (a RomM client for Android) into consideration, including a downloads page and a server resync.
- The home screen should be "similar to RomM": recently added, "picks for you" (random), consoles, collections.
- The background is a PSP XMB-style purple gradient with slow white waves ("the background looks a little whack tho maybe replace it with a gradient that's purple similar to the psp xmb menu"). That is the default (`bgStyle: 'waves'`, theme `purple`).

**What it is and is not**
- It is a download agent plus library browser.
- Metadata comes only from RomM ("metadata scraping is already all there on RomM"). Cartridge never scrapes, except logos, icons and artwork from SteamGridDB, which the user opts into with their own key.
- It is NOT a save sync tool: "I don't want to get involved in saves at all, Syncthing does that".
- It does not download or launch emulators.
- It never modifies emulator files (trophies are read only).
- Since 0.6 it can add games to Steam, launching them with the emulators the user already has.

**What "done right" means to the owner**
- It works first time on his devices.
- It looks polished at handheld size AND on a 4K TV.
- It is fully usable with a controller.
- Nothing is clipped or cut off.
- It is smooth in Game Mode.
- Release notes say exactly what changed.

**What he dislikes**
- Things that look "whack", "uncool" or placeholder-y (made-up games in screenshots).
- Round icons in square tiles.
- Cropped or blurry art.
- UI elements clipped by bars.
- Sluggishness.
- AI-sounding writing, and em dashes.
- Being asked to test builds that don't launch: "please test the app internally make sure it at least f***ing launches ... please make sure of everything working before you upload anything".

## D2. Every image and file the owner shared

Shared on 27 and 28 September 2026. Photos were taken with a phone of the device screen.

**27 Sep, first day**
1. Screenshot of GitHub's "Create a new repository" form. "fill this out for me make it sleek". Answer: name `cartridge`, a description, Public, no README, no license, no .gitignore (the first push added its own README, MIT license and .gitignore).
2. Screenshot of the repo README, showing the first demo screenshots with placeholder art ("GAME 1", "GAME 2", coloured circle covers, made-up titles like "Chrono Quest"). Shared with "use realistic games and their actual images don't use random made up games ... call this the 0.1 release not 2.3 cause we're starting from here".
   - Result: versions reset to 0.1.0.
   - Commercial box art was declined for the public README (copyright), and the demo was rebuilt from open-source homebrew games with credit (0.1.1: "Demo screenshots rebuilt from open-source homebrew games").
   - The owner was also offered to use his own Game Mode screenshots. Unsure whether he ever sent any for the README. The current `docs/*.png` are homebrew demo screenshots.
3. Photo of the handheld in Desktop Mode. The Cartridge window is completely grey (0.1.0/0.1.1). This is the "blank grey window" bug.
4. Photo of the Dolphin file manager at `/var/home/<user>/Documents/Apps` with `Cartridge-x86_64.appimage` (lower-case `.appimage`), Eden, lsfg-vk-ui.desktop, MAKO-Decky zip, NX Optimizer, shadPS4QtLauncher-qt.AppImage, TOTKOptimizer, xenia_canary_linux.AppImage. This shows where the owner keeps AppImages. It was shared while debugging the launch crash.
5. Five photos of Cartridge on the handheld, apparently 0.1.3, the first time it ran well on his real library of 336 games and 21 consoles:
   - Home with the blue theme and XMB waves
   - Downloads with Midnight Club 3 at 8% and 27.6 MB/s
   - the Jet Set Radio Future game page (Ready to play, Re-download, Delete; the info box overlapping the screenshots)
   - the PlayStation 3 console grid
   - the Consoles tab

   What changed after: unsure exactly which comments came with them. The next releases (0.2.0/0.2.1/0.2.2) added game logos, fixed the game page layout ("the info box sits directly under the cover and the screenshot row stops before it"), fixed the Deck-width top bar, and rewrote touch scrolling.
6. Four desktop screenshots of 0.2.0 in a window: Library (All games, 336 games, 55 on device), Home with the media bar (JSRF screenshot as hero), and the Prince of Persia game page (big title text, no logo). Unsure of the exact comment. The next version (0.2.1) added SteamGridDB logos because RomM had none for most games.
7. Two `cartridge.log` files. They showed:
   - 0.1.1 `renderer gone crashed 133` on every start (the runtime `--no-sandbox` bug, fixed in 0.1.2)
   - 0.1.3 `child gone GPU crashed 133` then "gpu failed at startup, relaunching in software mode" (the safety net working)
   - 0.2.1 `steam add ... "restarted":false` while Steam was running (the missed Steam detection, fixed in commit 63540e4 and shipped in 0.2.2)
   - a launch from Steam in Desktop Mode with `steam=true overlay=true` that worked in software mode
8. Photo of the handheld in Game Mode showing only the Steam spinner with "B Abort game": Cartridge stuck launching from Steam ("stuck on Running"). The fix series:
   - 0.1.4 software in gamescope
   - 0.2.0 software under Steam
   - 0.2.1 `steam-launch.sh` removing the overlay and runtime libraries
   - 0.2.2 reliable Steam detection so the shortcut change actually sticks

   Unsure which of these the 17:02 photo was taken on. The timing suggests the shortcut still pointed at the AppImage because Steam overwrote the change.
9. Photo of Dolphin in `~/.config/Cartridge` showing `steam-launch.sh`, `logos.json`, `library.json`, `installed.json`, `config.json`, `cartridge.log` and Chromium files. He was checking the launch script existed.
10. Eight photos of Home on the handheld with game logos (0.2.1):
    - Midnight Club 3 logo huge
    - Shadow of the Colossus medium
    - Prince of Persia
    - Metal Gear
    - Twisted Metal tiny
    - Sonic and the Black Knight
    - JSRF logo drawn BLACK on the dark header (almost invisible)
    - the JSRF game page with its info box over the screenshots

    Led to 0.2.2: equal-area logos ("so they sit at a similar size to Midnight Club 3"), white versions of black logos, and the game page layout fix.
11. Five photos of the Bazzite PC on the 4K TV: Settings, Downloads, Library, Home and Consoles, all rendered tiny in one corner at 100%. Led to 0.2.3 "the TV update" (auto interface size, GPU on big screens).
12. Photo of the TV showing "Change cover" for JSRF, with SteamGridDB grid images stacked and overlapping each other. Led to the 0.2.3 fix (each image gets its own tile; logos on a checkered backdrop).
13. Photo of the TV Consoles tab, every tile in the same purple and pink gradient. Led to 0.2.5 "console overhaul": official white console wordmarks from Art Book Next and each console's own colours.

**28 Sep**
14. A PNG of the PS5 logo as a thin OUTLINE (PS symbol plus "PS5"). The PS5 tile had no logo (Art Book Next lacks one). 0.4.0 ships `build/syslogos/ps5.png` as a FILLED white wordmark ("The PS5 tile now shows a filled PS5 wordmark"), not the outline he sent.
15. Two TV photos, 0.5.0, with red circles:
    - (a) Home: "Picks for you" row half hidden behind the bottom bar, circled
    - (b) the header's console label ("PLAYSTATION 2") clipped under the top bar, circled, above the Shadow of the Colossus logo

    With them: scrolling stuck at launch, the icon clipped at the top, and holding the D-pad not keeping up. Led to 0.5.5 Fixes.
16. Four photos, 0.5.5:
    - (a) the Achievements → Others tab on the handheld: 0 of every grade, 30 gamerscore; Xenia game icons cropped and stretched from 16:9 art; Skate 3 an orange block
    - (b) a Google AI overview of where shadPS4 stores trophies (`user/home/[user_id]/trophy/`, older `user/game_data/[CUSA]/TrophyFiles/`)
    - (c) Settings → Achievements with shadPS4 "Found · 0 games" from `~/.local/share/shadPS4`, and the same Xenia and Vita3K folders listed 4 times under `/run/media/...` and `/media/...`
    - (d) the folder picker in `~/.local/share` showing both `shadPS4` and `shadPS4QtLauncher`

    Message: trophy images blurry and cropped, use SteamGridDB square icons; shadPS4 trophy dir wrong, check shadPS4 and shadPS4QtLauncher; the app is sluggish; add colour customisation for highlights and bars; push 0.5.6, don't build 0.6. Led to 0.5.6.
17. Seven photos of real Steam shortcut properties on the 4K TV (Game Mode, maximum resolution 3840x2160). Instruction: "understand them don't build anything yet". These are the ground truth for the Steam manager:
    - **PS4 Bloodborne GOTY:** Target `"/home/<user>/Documents/Apps/shadPS4QtLauncher-qt.AppImage"`. Start In `/tmp/.mount_shadPS4oBLBC/usr/bin` (an AppImage temp mount, broken once the app closes). Launch options `/home/<user>/.local/bin/mako-run %command% -d -g "/media/<user>/<drive>/EmuDeck/Emulation/roms/ps4/Bloodborne - Game of The Year..."`, a PATH, via the `/media` alias.
    - **GameCube Super Mario Sunshine:** Target `"/run/media/<user>/<drive>/EmuDeck/Emulation/tools/launchers/dolphin-emu.sh"`, Start In `/run/media/<user>/<drive>/EmuDeck/Emulation/tools/launchers`, Launch options `vblank_mode=0 %command% -b -e "/run/media/<user>/<drive>/EmuDeck/Emulation/roms/gc/Super Mario Sunshine.iso"`.
    - **Wii Super Mario Galaxy 2:** the same Dolphin Target and Start In; `vblank_mode=0 /home/<user>/.local/bin/mako-run %command% -b -e "/run/media/.../roms/wii/Super Mario..."`.
    - **PS2 God of War:** Target `"/run/media/<user>/<drive>/EmuDeck/Emulation/tools/launchers/pcsx2-qt.sh"`, Start In the launchers folder, `/home/<user>/.local/bin/mako-run %command% -batch -fullscreen -nogui "/run/media/.../roms/ps2/God of W..."`.
    - **Switch Mario Tennis Aces:** Target `"/var/home/<user>/Documents/Apps/Eden-Linux-v0.2.0-amd64-clang-pgo.AppImage"`, Start In `/var/home/<user>/Documents/Apps/`, `/home/<user>/.local/bin/mako-run %command% "-f" "-g" "/media/<user>/<drive>/EmuDeck/Emulation/roms/switch/Mario Tennis Aces.xci"`. Note `/var/home` vs `/home` and `/media` vs `/run/media` within the same shortcut.
    - **Wii U Mario Tennis Ultra Smash:** Target `"/run/media/.../tools/launchers/cemu.sh"`, `vblank_mode=0 %command% -f -g "/run/media/.../roms/wiiu/roms/Mario Tennis - Ultra Smash.wua"`. Wii U games are under `roms/wiiu/roms/`.
    - **PS3 Dante's Inferno:** Target `"/var/home/<user>/Documents/Apps/rpcs3-v0.0.41-...-linux64.AppImage"`, Start In `/var/home/<user>/Documents/Apps/`, `/home/<user>/.local/bin/mako-run %command% --no-gui "%RPCS3_GAMEID%:BLUS30405"`.

    Follow-up instruction: "you can ignore the mako-run or any other SteamOS or Steam Deck or Linux or Bazzite frame generation... or LSFG VK, you can ignore. But also take into consideration the target, the start in area, the launch options as well, not just the launch option, all three of those choices". This is why `learnOne` keeps all three fields, strips frame generation, keeps `vblank_mode`, maps `/tmp/.mount_` Start In, and handles path aliases.
18. Close photo of the Achievements → Others tab on the TV: grade chips, latest unlocks (Dante's Inferno "Abandon All Hope"), games list. "Others tab looks uncool, make it cooler like RetroAchievements." Led to the Trophies & Gamerscore redesign; the owner picked "A".
19. TV photo of the Others games grid: ROUND icons with transparent corners (Uncharted, God of War, inFamous 2), and Skate 3 showing the "skate: recompiled" icon. "No circle icons, full rounded squares; option to change the icon via SteamGridDB; Skate 3 matched to recompiled." Led to `iconOpaque`, "Change icon" and `sgScore`.
20. TV photo of Home with "Latest achievements" (RetroAchievements only: Super Mario Bros "Shrooooms", Metroid, Jet Set Radio, Castlevania SotN) and console tiles with logos. "Latest achievements on Home should include the other achievements." Led to the merged row and the "On Home" setting.
21. Handheld photo of Others after sync: latest unlocks from the device "bazzite" with GENERIC gold cup icons instead of the trophy pictures; the game list shows "from bazzite". "On the handheld, synced trophies show no images; can we get them working?" Led to trophy picture sync through RomM notes.
22. TV photo of Settings → Achievements on 0.5.6: RPCS3 found (10 games, `~/.config/rpcs3/dev_hdd0/home/00000001/trophy`), **shadPS4 "Not found"**, Xenia found by scan (`~/.local/share/Xenia/content`, 3 games), Vita3K found (2 folders). "shadPS4 now errors; forget the QtLauncher folder; find the path even with no trophies until the user sets trophy keys." Fixed in 0.6.
23. Also mentioned in words, without a photo: "Bottom bar START/SELECT icons too big; LT has a white square but RT doesn't; detect the real controller (the Steam Controller is detected as an X360 pad); build the UI around native icons."

**Visual references he pointed to**
- PSP XMB purple gradient and waves: the default background.
- Playnite fullscreen and Argosy: layout and download page.
- RomM's own home layout.
- For 0.5 backgrounds: one each "inspired by" PSP (XMB Waves), PS3 (Ribbons), PS5 (Bokeh), Xbox (Blades), Nintendo (Dots) and Steam (Glow). They are original designs; no copied assets.
- Steam's 2:3 grid posters (0.2.0 "Box art is 2:3, like Steam, and no longer cropped at the top. Corners are less rounded").
- The PS3/PS5 trophy look for the Trophies tab.
- No specific pixel values, timings or colours were given by the owner beyond these descriptions. All numbers in the code were chosen in chat.

## D3. Full history, version by version

All on 27 and 28 September 2026 (owner's local time).

**Pre-0.1 (26 Sep night, RomDeck 1.0.0, then Cartridge 2.0 to 2.3.1)**
- Built "RomDeck" as a download agent: sign-in by LAN, tunnel or both, with Auto preferring LAN; username/password, pairing code or `rmm_` API token; optional Cloudflare Access service token; EmuDeck/ES-DE folder detection; controller UI with an on-screen keyboard; download queue; `.m3u`; BIOS; resume.
- Sent in chat as a 130 MB AppImage split into 5 parts (the chat upload limit was 30 MB).
- Renamed to Cartridge (options offered: Cartridge, Homebrew, Loadout, Sideload, Rommie, Couch Co-op).
- Console-style redesign, the library mirror and resync, the Consoles tab, RomM-like Home, XMB background.
- GitHub repo created; first release v2.3.1. The owner then asked to restart numbering at 0.1, and v2.3.1 had to be deleted by hand, otherwise 0.1.0 installs would "update" to it.

**0.1.0** · The first public release on GitHub, one AppImage. On the handheld it showed a blank grey window (photo 3).

**0.1.1** (commit 864853d)
- Software rendering by default, X11 forced, a diagnostics log, Settings → Steam "Add Cartridge to Steam" with artwork, homebrew demo screenshots.
- Broke: every start crashed the renderer (`crashed 133`) because `--no-sandbox` was appended at runtime.

**CI launch check** (commit 4b2b09d): the release workflow only publishes if the AppImage opens and renders.

**0.1.2** (0a61680)
- Stopped appending `--no-sandbox` at runtime.
- Added `install.sh` (one-line installer).
- The CI check now runs as a normal user with no flags.
- Launched fine on the handheld in Desktop and Game Mode (log shows `session=x11 desktop=gamescope`).

**0.1.3** (66fc611)
- LT/RT switch tabs, 2:3 posters, flatter corners, 60 fps rendering (from about 25 to 30), Home media bar, background colours (8 XMB colours), touch mode, in-app updates, Quick Menu screenshot, refreshed README.
- Moved to the GPU by default. The GPU crashed on start once (the safety net relaunched in software).
- In Game Mode, launching from Steam then hung.

**0.1.4** (5e46e35) · Game Mode (gamescope) always software, Desktop Mode GPU. The startup log records the session.

**0.2.0** · "The first big update":
- search box in the top bar
- game logos
- media bar
- background colours
- touch mode without a cursor
- in-app updates
- screenshots
- install.sh
- Add to Steam
- the on-screen keyboard REMOVED (real inputs, Steam keyboard)
- LT/RT tabs, LB/RB consoles or collections
- 2:3 box art
- 60 fps
- software rendering whenever Steam or Game Mode launches it
- blank grey window fixed
- duplicate "ready to play" toasts fixed

**0.2.1**
- Launching from Steam goes through `steam-launch.sh` (removes the overlay and Steam runtime libraries, no sandbox), logged to `steam-launch.log`. The owner had to press Add to Steam once more.
- SteamGridDB logos with a free key.
- Sharper waves.
- Home opens on games, not the search box.

**Commit 63540e4** · More reliable detection of a running Steam (process names, command lines, pid file).

**0.2.2**
- More menu on the game page: Change cover, logo or background from SteamGridDB; Reset; Refresh details; Show file location. Picks are saved in `artwork.json`.
- Logos: equal area, black logos drawn white.
- Game page layout fixed.
- Touch scrolling rewritten.
- Deck width top bar.
- Add to Steam detection.

**0.2.3 "the TV update"**
- Interface size (auto from 1080p; 4K = 200%).
- GPU always on big screens, even under Steam.
- If the screen can't be read, restart once with the GPU.
- GPU safety net under Steam too.
- Waves sharpness per size.
- The Change art picker fixed (no stacking).

**0.2.4**
- PS4/PS5 "Mark as installed" (`marked.json`) and automatic folder or title ID detection.
- "Fetch all logos" with progress and Stop.
- PS5 folder mapping.
- Safer delete.

**0.2.5 "console overhaul"**
- Official console logos (white wordmarks from Art Book Next for ES-DE, cached in `syslogos/`).
- Per-console colours, a colour strip, the logo grows on focus.

**0.3.0 "The RetroAchievements Update"**
- Achievements tab: profile, latest unlocks (30 days), recently played, per-game achievement lists with rarity and hardcore, X refresh, offline cache.
- Achievements on game pages (by RomM `ra_id`, else an exact title match per console).
- Latest achievements row on Home.
- RA sign-in with username plus web API key.
- Icon-only inactive tabs below about 1560 px wide.

**0.4.0 "The All Achievements Update"** (built overnight while the owner slept)
- Trophies from RPCS3, shadPS4, Xenia and Vita3K.
- The Others section (summary, latest unlocks, games, per-game pages with Y filter).
- Trophies on game pages, and "Link to trophies".
- Three-layer discovery.
- Settings → Other sources.
- Sync through RomM notes.
- Trophy pop-ups.
- Game page header banner.
- On-screen keyboard BACK as an option (Auto, Built-in, Steam) with Paste.
- Paste buttons on text fields.
- Filled PS5 logo.
- Title Case settings sidebar.

**0.5.0 "The Customisation Update"**
- Themes colour everything: 14 themes plus custom colour; Panels Glass, Solid or OLED; Text Standard, High contrast or Soft.
- New backgrounds: XMB Waves, Ribbons, Bokeh, Blades, Dots, Glow, Still, Game artwork, Wallpaper.
- Six fonts.
- Box art sizes, corners, spacing, names toggle.
- Motion: Normal, Fast, Reduced; Effects: Auto, Full, Light.
- Sounds: Soft, Retro, Bubble; three volumes.
- Reset Look & Feel.
- Look & Feel grouped into sections.

**0.5.5 "Fixes"**
- Home could not scroll down after launch; the app now starts in pad mode.
- Holding the D-pad now keeps up (instant scroll while held).
- The Home header top was clipped (the logo now shrinks to fit, and the info line is a single line).
- The end of a row no longer jumps to the search box.
- LB/RB no longer switch top tabs.
- Broke: a Home `watch` referenced `heroRom` before it was declared. That is a TDZ error ("Cannot access 's' before initialization") in the built bundle. Shipped in 0.5.5, fixed in 0.5.6.

**0.5.6**
- Square icons (SteamGridDB, else fitted over a blurred copy).
- Fine-tune colours (Highlights, Buttons, Progress bars, Background).
- shadPS4 found in more layouts.
- De-duplicated trophy folders.
- Stale folders removed.
- The Home header refits on every game change.
- Performance work (shimmer only while active, half the layout work on moves, the background pauses while navigating, lighter shadows).
- Regression: shadPS4 "Not found" without a trophy key (fixed in 0.6).

**0.6.0 "The Steam Update"** · See Part C.

**The recurring themes, in one place**

1. **Game Mode and Steam launch saga**
   - Grey window: GPU on AMD with KDE Wayland, fixed by software.
   - Renderer crash 133: runtime `--no-sandbox`, removed.
   - Stuck on "Running" in Game Mode: the GPU under gamescope, and the Steam overlay injected into Chromium's GPU process. Fixed by software under gamescope and Steam, and by the launch script dropping `LD_PRELOAD` and `LD_LIBRARY_PATH`.
   - Shortcut edits silently undone: Steam rewrote `shortcuts.vdf` on exit. Fixed by better detection and by closing Steam first.
   - Slow on the TV: software at 4K. Fixed by the GPU on big screens.
   - "Won't open until Steam restarts": single instance (0.6).
2. **Touch:** Game Mode delivers touches as mouse clicks, and taps made pages jump. Rewritten on pointer events with drag detection, momentum and click swallowing (0.2.2).
3. **Logos:** uneven sizes, black logos, and RomM lacking logos. Fixed by SteamGridDB, trimming, equal area and dark detection (0.2.1 to 0.2.2).
4. **Home header clipping:** the console label went under the top bar with a tall logo plus a long info line. Fixed by fitting the logo and a single-line info row (0.5.5), refitting on every game change (0.5.6), and the 0.5.5 TDZ crash fixed in 0.5.6.
5. **Focus and scrolling:** rows half hidden until touched (pad mode at start); held D-pad outrunning the scroll (instant scroll while held); right at a row end jumping to search (stay).
6. **shadPS4 detection:** 0.4 had one layout; 0.5.6 added all layouts and the home_dir setting; 0.6 counts the folder without trophies, adds key state, drops the Qt launcher folder, and adds `~/Documents/Apps` portable installs.

## D4. Approaches tried and rejected (do not try again)

1. Appending `no-sandbox` with `app.commandLine.appendSwitch` at runtime. It crashes the renderer and GPU (exit 133, /dev/shm).
2. Software rendering everywhere. Unusably slow on a 4K TV.
3. GPU rendering in Game Mode on handhelds. It hangs, blank or stuck on Running.
4. Letting Steam start the AppImage directly with the overlay injected. It hangs. Keep `steam-launch.sh`.
5. Writing `shortcuts.vdf` while Steam runs. Steam overwrites it on exit.
6. Sending builds as split files in chat. Replaced by GitHub Releases.
7. Version numbers 1.x/2.x. The owner restarted at 0.1.
8. Commercial box art in the public README. Declined for copyright; homebrew demo instead.
9. Local metadata scraping. Never; RomM is the source.
10. Save sync, emulator downloads, emulator launching from inside Cartridge. Out of scope by the owner's decision.
11. The on-screen keyboard as the only input (removed in 0.2.0), and no on-screen keyboard at all. Both rejected; now it is a setting with Auto.
12. LB/RB switching top tabs. Removed in 0.5.5; LT/RT only.
13. Round SteamGridDB icons in square tiles. Rejected.
14. Cropping 16:9 emulator art into square tiles. Rejected (0.5.6).
15. Using the shadPS4 Qt launcher's folder for trophies. It only holds emulator versions.
16. Requiring trophy files before calling shadPS4 "found". Breaks for users without a key.
17. Matching existing Steam games by name only. Hid the PS3 God of War behind the PS2 one in tests.
18. Copying frame generation wrappers (mako-run, lsfg) into new shortcuts. The owner said to ignore them.
19. Taking the LAST `/roms/` in a path as the console folder. Wrong for Wii U.
20. Running the Steam helper with a leading `--no-sandbox`. Node mode rejects it ("bad option").
21. Running the helper from inside the AppImage mount. The mount vanishes when Cartridge exits.
22. `startsWith('Cartridge trophy')` for note titles. Misses "Cartridge trophies".
23. RetroDECK folder presets. The owner said "ignore retro deck" for ROM paths, because he uses the EmuDeck/ES-DE layout. Trophy discovery still looks in RetroDECK folders.
24. "Add each game to Steam" in the 0.1 era. The owner dropped it then ("never mind, let's just keep it as a download agent"), then asked for it as the big 0.6 feature, done properly (learning his real shortcut setups).

## D5. "Do not change" list

| What | Where | Protects against | Breaks if removed |
|---|---|---|---|
| Never append `no-sandbox` at runtime | top of `main.js` | Renderer and GPU crash 133 on normal desktops | Grey window or no window |
| `forceSoftware` rules (gamescope or Steam on small screens) | `main.js` | Blank window or hang under gamescope and the Steam overlay | Game Mode launches |
| GPU on big screens and the relaunch-with-GPU check | `main.js` | Stutter at 4K | TV performance |
| GPU-crash-in-first-20 s → software and relaunch | `child-process-gone` | Machines where the GPU path dies | App never opens on those |
| `steam-launch.sh` (unset `LD_PRELOAD`/`LD_LIBRARY_PATH`, `--no-sandbox` on exec, `CARTRIDGE_FROM_STEAM=1`) | `writeSteamLauncher` | Overlay and runtime libs hanging Chromium | Launch from Steam |
| Rewriting `steam-launch.sh` on every start | `main.js` | AppImage moved or updated | Stale path |
| Artifact name `Cartridge-x86_64.AppImage` | `package.json` | Updater, `install.sh`, README link | Updates and installs |
| `CARTRIDGE_SMOKE` path in `createWindow` and the CI step | `main.js`, workflow | Publishing a build that doesn't open | The release safety net |
| `APPIMAGE_EXTRACT_AND_RUN=1` in CI | workflow | No FUSE on runners | CI |
| Close Steam before writing `shortcuts.vdf` | steamArt, steamHelper | Steam rewriting the file on exit | Changes silently lost |
| Helper copied to `steam-jobs/` and spawned outside Cartridge | `runHelper` | The AppImage mount vanishing; Steam killing its children | Writes never happen |
| `--no-sandbox` LAST in the helper argv | `runHelper` | AppRun prepending `--no-sandbox` on systems without user namespaces, which Node mode rejects | Helper fails on those systems |
| `systemd-run ... -p KillMode=process` | `runHelper` | Steam's cleanup killing the helper; the unit's cgroup killing the Steam the helper starts | Steam not restarted, or killed |
| `appid = crc32('"' + exe + '"' + name) \| 0x80000000` with quotes | steamArt, steamManager | Steam's own ID scheme | Artwork not shown, duplicates |
| Binary VDF: numbers written as uint32 LE, bigint as type 0x07 | writeVdf | Signed appids read back correctly | Corrupt shortcuts |
| Reading `shortcuts.vdf` back after writing and comparing the count | `writeShortcuts` | Silent corruption | Undetected damage |
| Keep existing shortcut entries byte-for-byte (merge, never rebuild fields) | `writeShortcuts` | Losing the user's own settings | Users' shortcuts |
| Frame generation strip list, `vblank_mode` kept, quoting kept | `learnOne` | The owner's explicit rule | Shortcuts that differ from his |
| First `/roms/`, `/tmp/.mount_` → AppImage folder, `styled()` path aliases | `learnOne`, `styled` | Wii U, broken Start In, `/media` vs `/run/media` | Launches |
| Notes title prefix `'Cartridge troph'` | trophyService | Matching "Cartridge trophies" and picture notes | Sync breaks |
| Picture note parts under 44,000 chars | trophyService | RomM note column limit (64 KB on MariaDB) | Note writes fail |
| Unlocks only added, earliest time wins | `merged()` | Losing unlocks across devices | Data loss |
| Emulator files are read only | trophies.js | The owner's rule | Trust |
| device:inode de-dup of folders | trophyService `dirsOf` | Same folder listed 4 times | UI noise, double counts |
| `touch-action: none` on html/body and pointer-based drag | styles.css, nav.js | Game Mode touch arriving as mouse | Touch scrolling |
| Start in pad mode; instant scroll while held | nav.js | Rows hidden at launch; selection outrunning scroll | Controller UX |
| LT/RT = tabs, LB/RB = in-page only | App.vue | The owner's explicit rule | His muscle memory |
| Refuse deleting console folders or the ROMs root | `roms:delete` | Deleting a library | Data loss |
| Marks never touch files | `roms:delete` | Deleting user-extracted PS4 games | Data loss |
| `iconToken` for trophy icons in `romimg://` | trophies | Renderer reading arbitrary files | Security |
| `iconOpaque` square-only rule | main.js | Round icons | The owner's look |
| Modal reopen pattern (`resolveOuter`) | FolderPicker, SteamCollections, SteamEmu | Single modal slot | Hung promises |
| Single-instance skipped for `CARTRIDGE_SMOKE`/`CARTRIDGE_MULTI` | main.js | Tests and CI | CI launch check |
| `configVersion` migration | main.js | Old forced software | Old configs |
| Awaiting `clipboard.readText()` | `clip:read` | It returns a Promise in Electron 44 | Paste |
| `sgScore` penalty words and `cleanName` | main.js | Wrong SteamGridDB matches (Skate 3) | Art quality |

## D6. The owner's hardware and setup

Kept general on purpose, because the repo is public.

- **A 1080p handheld running Bazzite.** His main handheld and the main test device, used in Game Mode and Desktop Mode. The screen is 1920x1080, which is why the UI is designed for 1080p at 100%.
- **A Bazzite desktop PC connected to a 4K TV.** It is the 4K test target. Steam runs in Game Mode at 3840x2160.
- **Steam Deck:** unsure whether he owns one. The Deck (1280x800) is a design and test size target, and CI and chat tests ran at 1280x800.
- **RomM:** self-hosted, reached on the LAN and through a Cloudflare Tunnel. That is why Auto mode tries local first, then remote.
  - Whether the tunnel is behind Cloudflare Access: unsure; it was asked early and not clearly answered. Cartridge supports Access service tokens either way.
  - RomM version: 5.2 as of early September 2026 (from an older, separate conversation); unsure if it changed since.
  - Uses password sign-in in Cartridge (unsure; the test config used username and password).
- **ROM layout:** EmuDeck with ES-DE folder names, on external drives. The handheld's roms are on a card mounted at `/run/media/<user>/<sdcard>/Emulation/roms`; the PC's at `/run/media/<user>/<drive>/EmuDeck/Emulation/roms`. Bazzite mounts the same drive at both `/run/media/<user>/...` and `/media/<user>/...`, and home is `/var/home/<user>` with `/home` as a link.
- **Emulators, mixed installs:**
  - through EmuDeck launchers: PCSX2 (`pcsx2-qt.sh`), Dolphin (`dolphin-emu.sh`), Cemu (`cemu.sh`), DuckStation, Xenia, Xemu, Vita3K, RetroArch (Flatpak via EmuDeck)
  - AppImages in `~/Documents/Apps`: RPCS3, shadPS4 via shadPS4QtLauncher, Eden, and xenia_canary
- **Frame generation:** `mako-run` in `~/.local/bin` (MAKO-Decky) and lsfg-vk. Cartridge ignores both on purpose.
- **Steam shortcuts:** a mix of Steam ROM Manager/EmuDeck-generated and hand-made ones (photos in D2 item 17).
- **Saves:** Syncthing. Cartridge must not touch saves.
- **Known device quirk:** his Bazzite machines had "Cannot mount AppImage, please check your FUSE setup" with some AppImages. He said to ignore it; Cartridge runs, so FUSE works for it. If a user hits it, `APPIMAGE_EXTRACT_AND_RUN=1` is the workaround.

## D7. The owner's preferences

**Writing (UI text, release notes, changelog, messages to him)**
- Never use em dashes, anywhere: UI, notes, commits, chat. Use commas, colons, full stops, or "·" in titles.
- Concise, direct, not AI-sounding. He pushes back on cringe or overly formal phrasing.
- Release notes say exactly what changed in that version, in plain words, grouped as `### New`, `### Changed`, `### Fixed` (sometimes `### Notes`). Bold lead-ins, then a sentence. Nested bullets for lists. Describe the user-visible result, then why if useful.
- UI copy: short, friendly, plain; Title Case for settings sidebar items; sentence case elsewhere. Explain settings in one line under each toggle.
- British spelling in feature names ("Customisation", "colour"), mixed elsewhere (unsure if deliberate). Keep "Colour" in Look & Feel.

**UI rules**
- Controller first. Everything reachable with the D-pad, A/B/X/Y, LT/RT for tabs, LB/RB for in-page sections, Start for the Quick Menu, Select for Downloads.
- Visible focus: a white ring or border plus theme glow.
- Button hints in the bottom bar, drawn with the real controller's glyphs.
- Soft UI sounds (can be turned off).
- Animations quick; Reduced motion must work.
- On a 1080p handheld at 100%, and on a 4K TV at 200%, nothing may clip.
- **No UI overhauls unless he asks.** He stated this in the handoff request: ask before changing anything visual beyond what he requested. When he asks for a design change, offer options (he picked "design A" for trophies).

**Working style**
- Plan the architecture and agree on it before big builds ("without building yet let's engineer the big 0.6 update ... is it difficult?"), to save credits.
- When he says "don't build yet" or "just answer", do not change code.
- When he says "I'll take all your suggestions, start building", build everything agreed.
- He often sends phone photos from the device (TV or handheld) with red circles on problems.
- He wants to be told exactly what changed and how it was tested.
- **Be cautious:** test before every release, including the actual downloaded release AppImage, in every launch mode. "please make sure of everything working before you upload anything".
- **Privacy:** nothing private in the repo or releases (no server addresses, usernames, emails, session details). Grep before every commit.
- One GitHub release per version; history in CHANGELOG.md.

## D8. Release process

1. **Version.**
   - Big feature updates bump the minor version and get a title: 0.3.0 "The RetroAchievements Update", 0.4.0 "The All Achievements Update", 0.5.0 "The Customisation Update", 0.6.0 "The Steam Update".
   - The owner named 0.4, 0.5 and 0.6 in his roadmap. The roadmap originally had 0.5 = Steam and 0.6 = Customisation; the order was swapped (unsure why; Customisation was built first right after 0.4).
   - Fix releases: 0.5.5 "Fixes", 0.5.6 (no title). The jump from 0.5.0 to 0.5.5 was a choice made at the time; unsure of the reason.
   - Early small titles: 0.2.3 "the TV update", 0.2.5 "console overhaul".
2. **`package.json`:**
   - `"version": "X.Y.Z"`
   - `build.releaseInfo.releaseName`: `"Cartridge X.Y.Z"` (the "· Title" part goes in the notes heading and the commit message, as in 0.6.0)
   - `releaseNotesFile: RELEASE_NOTES.md`
3. **Notes:**
   - `RELEASE_NOTES.md`: ONLY this version, starting `## Cartridge X.Y.Z · Title`.
   - `CHANGELOG.md`: header `# Changelog`, the line "Every Cartridge release, newest first. Each GitHub release only lists its own changes.", then the new version's notes inserted at the top, unchanged.
4. **README** highlights if a feature changes what the app is.
5. **Before pushing:**
   - Build locally (`npm run dist`).
   - Run the launch check in the 5 environments (F5).
   - Run the UI tests.
   - Privacy grep of the diff: usernames, IPs, domains, emails, local workspace paths, session links.
   - Check for em dashes.
6. **Commit** as the owner's GitHub identity (`abdu2304`, noreply email), with a message like `Cartridge X.Y.Z · Title`.
   - The chat sessions added `Co-Authored-By: Claude ...`. Follow whatever attribution your environment asks for.
   - Push to `main`.
7. **CI:** the Action builds, launch-checks and publishes release `vX.Y.Z` with the notes.
8. **After CI:** download the published AppImage and run the launch check again in every mode. Then tell the owner what changed and how it was tested.

## D9. Current state

- 0.6.0 is released and verified as described.
- Right after the release, the owner asked for this handoff.
- He is moving development to Claude Code working directly in the repo.
- Nothing is in progress. Nothing is uncommitted.
- The owner has not yet reported how 0.6.0 behaves on his devices.
- The first real test of the Steam manager on his machines is pending.

## D10. What's next

- The owner has not named anything after 0.6. The roadmap he gave (0.4 achievements, 0.5 customisation, 0.6 Steam) is complete.
- **Likely next work, in priority order:**
  1. Any problems from his first real use of the Steam manager (0.6.x fixes). The least tested areas are in F6.
  2. The helper backup overwrite (F7), registry-before-helper (F4), B2 (shortcut key gap), B1 (Y on Search with the built-in keyboard).
  3. Move the Steam manager's heavy calls off the main thread, and add apply progress (artwork fetching).
  4. The small cleanups: Achievements.vue duplicate CSS, `.padbtn`, the out-of-date graphics comment, the migration lines.
  5. A `test/` folder with the mock server and Steam fixtures.
- **Ideas mentioned but never built:**
  - checking downloads against RomM's checksums
  - a storage manager (free-space warnings, delete to make room); partly exists as space display
  - layout presets
  - QR pairing
- **Explicitly NOT wanted:**
  - handling saves
  - downloading or launching emulators
  - modifying emulator files
  - UI overhauls he didn't ask for
  - made-up demo content
  - private info in the repo

## D11. Testing checklist (after any change)

**Launch (every release)**
- Desktop Mode from the app menu (GPU).
- Launched from Steam in Desktop Mode (software, overlay env present).
- Game Mode X11 and Wayland env (software, fullscreen).
- Big screen under Steam (GPU).
- The Steam launch script path.
- The CI check passes.
- After release: download the real AppImage and repeat.

**Controller**
- Every tab reachable with LT/RT.
- LB/RB switch sections (Achievements tabs, consoles and collections in grids).
- Held D-pad keeps the selection on screen.
- The end of a row doesn't jump.
- B goes back.
- Start opens the Quick Menu, Select goes to Downloads, Y searches (and on Search with the built-in keyboard, see B1).
- Every modal takes all input and B closes it.

**Touch**
- Swipe rows sideways and pages up and down with momentum.
- Tapping a game doesn't make the page jump.
- No cursor on touch.

**Sizes:** 1280x800, 1920x1080, 3840x2160. Nothing clipped under the top or bottom bars (Home header, last row). The clipping sweep at F5.

**Library:** first sync, resync, NEW badges, Scan server, offline start.

**Downloads:** single file, multi-disc (`.m3u` and the `Game.m3u/` folder), pause (cancel) then resume from `.part`, BIOS, delete (refuses console folders), PS4 mark and unmark.

**Updater:** Settings → Updates on the AppImage, then restart to update.

**Add Cartridge to Steam:** from Desktop Mode, Steam closes and reopens, artwork shows, launching from Steam works.

**Themes:** each background, custom colour, fine-tune colours, OLED, Light effects, Reduced motion, wallpaper, fonts, card options, sounds.

**Trophies**
- Each emulator found or not found or off.
- shadPS4 without a key shows "no trophy key".
- Choose folder, Scan again.
- Pop-up on unlock.
- Sync between two devices, including pictures.
- Change icon, link or unlink on the game page.
- The Home merged row honours "On Home".

**RetroAchievements:** sign in, tab, game page section, Home row.

**Steam manager**
- With a real Steam: overview lists consoles with the right source ("From your shortcuts", EmuDeck, AppImage, Flatpak).
- Preview shows exact Target, Start in and Launch options.
- Apply closes Steam, writes and reopens; the games launch.
- Collections appear.
- Undo restores.
- Remove everything Cartridge added.
- The per-game More menu.
- A PS4 mark asks for a folder.
- Auto add and remove toggles.
- Script mode and `--game`.
- Second launch hands over to the running instance.

---

# PART E · Everything else worth knowing

## E1. RomM API as Cartridge uses it

- **Health:** `GET /api/heartbeat`. It is used to probe the local and remote URLs (`probe()` defaults to 2.5 s for the connection test; Auto routing probes the local URL with 1.5 s; `redirect: 'manual'`, so a Cloudflare Access redirect counts as "not reachable") and to read server info (the scan path fetches it with no timeout).
- **Auth, in `authHeaders()`:**
  - Basic auth with username and password, or `Authorization: Bearer <token>` for API tokens.
  - Optional `CF-Access-Client-Id` and `CF-Access-Client-Secret`.
  - `User-Agent: Cartridge/1.0`.
- **Pairing:** `POST /api/client-tokens/exchange` with the code shown in RomM (Profile → Client API Tokens → Pair). A 404 means the code is invalid or expired.
- **Library:**
  - `/api/platforms` for platforms (`rom_count`, `fs_slug`, `display_name` or `custom_name`, `url_logo`)
  - `/api/roms` (paged) for ROMs
  - `/api/collections` and `/api/collections/smart` for collections
  - `/api/users/me` for the user
  - `/api/platforms/supported` for the full platform list (Console Folders → All supported)
- **Game details:** `GET /api/roms/{id}`, used live on the game page.
- **Downloads:**
  - `/api/roms/{id}/content/{fname}` for the whole game
  - `/api/roms/{fileId}/files/content/{file_name}` per file, which is needed for resuming multi-file games (newer RomM)
  - `/api/firmware?platform_id=` and `/api/firmware/{id}/content/{name}` for BIOS
- **Scan server:**
  - `POST /api/login` with Basic auth for a web session, then socket.io at `/ws/socket.io` (websocket only), emitting `scan` `{ platforms: [], type: 'quick', apis }`.
  - It needs a password login; tokens can't open the socket.
- **Notes (trophy sync):** `GET/POST /api/roms/{romId}/notes` and `PUT /api/roms/{romId}/notes/{noteId}` (Cartridge never deletes notes).
  - The table has a unique constraint on (rom_id, user_id, title), so the title must be unique per game.
  - The trophy note is private and titled `Cartridge trophies`. Its JSON holds the unlock list per device.
  - Picture notes are titled `Cartridge trophy icons <set> <n>`, with `data.cartridge === 'trophy-icons'`.
  - If RomM has no notes API, or the login can't write, Cartridge says so and works locally.
- **Images:** RomM serves `/assets/romm/resources/...` (covers, screenshots, logos), fetched with the same auth headers.

## E2. Other external services

- **SteamGridDB** (`https://www.steamgriddb.com/api/v2`, overridable with `CARTRIDGE_SGDB_BASE` for tests). Needs a free API key (steamgriddb.com → Preferences → API), stored as `config.sgdbKey`. Used for:
  - logos (`/logos/game/{id}`)
  - covers (`/grids/...dimensions=600x900,342x482,660x930`)
  - heroes (`/heroes/...`)
  - wide banners (`/grids/...920x430,460x215`)
  - icons (`/icons/...`)
  - search (`/search/autocomplete/{term}`)
- A 401 or 403 becomes "SteamGridDB rejected the API key" and stops the fetch-all job.
- **RetroAchievements Web API** (`https://retroachievements.org/API/API_*.php` with `y=<web api key>&u=<user>`; overridable with `CARTRIDGE_RA_BASE` and `CARTRIDGE_RA_MEDIA`).
  - Needs the username plus the web API key from Settings → Authentication; the password is never used.
  - It rate limits (429). Results are cached in memory and in `retroachievements.json`, so the tab works offline.
  - `RA_CONSOLES` maps RomM slugs to RA console IDs. Consoles RA doesn't support never show the section.
- **Art Book Next for ES-DE** (`github.com/anthonycaccese/art-book-next-es-de`): white SVG console wordmarks, downloaded on first use and cached in `syslogos/`. It lacks PS5, so `build/syslogos/ps5.png` is bundled.
- **GitHub Releases** for updates: electron-updater with `publish` provider `github`, owner `abdu2304`, repo `cartridge`, and `latest-linux.yml`.
- **Fonts:** Fontsource packages (Outfit is the default display font; Inter, Nunito, Rubik, Space Grotesk and Lexend are options; Roboto for the body), all bundled, no network.
- **Icons:** `@mdi/js`, Material Design Icons as SVG paths (`Icon.vue` takes a name like `mdiSteam`). Check a name exists before using it: `mdiCartridge` does NOT exist.

## E3. Platform limits that shaped the code

**SteamOS, Bazzite and gamescope**
- Game Mode is a gamescope session with Steam in charge. Apps started from Steam get Steam's overlay (`LD_PRELOAD`) and runtime libraries (`LD_LIBRARY_PATH`).
- Game Mode delivers touch as mouse.
- There is often no Secret Service or keyring.
- Steam Input presents a virtual Xbox 360 pad (28de:11ff).
- Steam ends the processes it started when it exits.
- `steam -shutdown` asks Steam to exit. In Game Mode the session restarts Steam by itself (this is the assumption behind the 12 s wait; unverified).

**Steam files**
- `userdata/<accountid>/config/shortcuts.vdf` (binary VDF). Non-Steam appids are `crc32('"exe"' + name) | 0x80000000`. Steam stores them as signed int32.
- Grid art: `<appid>p.png` (cover), `<appid>.png` (wide), `<appid>_hero.png`, `<appid>_logo.png`. The icon field lives in the shortcut itself.
- Collections live in `userdata/<id>/config/cloudstorage/cloud-storage-namespace-1.json`, as a JSON array of `[key, {key, timestamp, value, version, ...}]`. User collections are `user-collections.uc-<id>` with a `value` of `{id, name, added[], removed[]}`. Dynamic collections have `filterSpec` and can't hold chosen games. Steam Cloud can replace this file, which is why Cartridge verifies after a restart.
- Proton choice: `<root>/config/config.vdf`, `CompatToolMapping`.
- Accounts: `config/loginusers.vdf` (`MostRecent`, `Timestamp`, `PersonaName`).
- Flatpak Steam lives under `~/.var/app/com.valvesoftware.Steam/...` and is stopped with `flatpak run com.valvesoftware.Steam -shutdown`.

**AppImage (electron-builder)**
- `AppRun` adds `--no-sandbox` before the arguments when `unshare -Ur true` fails.
- The app runs from a temporary mount `/tmp/.mount_XXXX` that disappears when it exits. That is why Start In paths under it are broken, and why the helper is copied out.
- `APPIMAGE` is set to the real file path.
- Running the AppImage with `ELECTRON_RUN_AS_NODE=1` gives a Node runtime. That is how the helper runs without a system Node (SteamOS has none).
- No FUSE: `APPIMAGE_EXTRACT_AND_RUN=1`.

**Electron 44 and Chromium**
- `clipboard.readText()` returns a Promise.
- `app.commandLine.appendSwitch('no-sandbox')` after start breaks.
- The single-instance lock is Chromium's `SingletonLock` in the userData folder. A hung holder is killed by Chromium after about 20 s when another instance tries to notify it (observed in testing).
- `nativeImage` is used for all image processing: resize, crop, toPNG/toJPEG, bitmap access for trimming and alpha checks.

**ES-DE and EmuDeck**
- ES-DE folder names per console are in `platformMap.js`.
- EmuDeck settings: `~/.config/EmuDeck/settings.sh` (`romsPath`, `emulationPath`, `biosPath`, `toolsPath`). ES-DE's `es_settings.xml` has `ROMDirectory`.
- EmuDeck launchers are in `<Emulation>/tools/launchers/*.sh`.
- The ES-DE "directory as file" convention: a folder named `Game.m3u` containing `Game.m3u`.

**Emulators**
- RPCS3 `games.yml` lists known serials; `%RPCS3_GAMEID%:<serial>` only works for those.
- shadPS4 `-g` takes an `eboot.bin` path or a title ID; the Qt launcher's `-d` means "default emulator version".
- Dolphin `-b -e <file>`, PCSX2 `-batch -fullscreen -nogui <file>`, Cemu `-f -g <file>`, Eden/Yuzu forks `-f -g <file>`.
- Wii U games are folders with `code/*.rpx`, or `.wua`/`.wux` files.
- shadPS4 needs a trophy key in `keys.json` (`TrophyKeySet.ReleaseTrophyKey`), or in older builds `config.toml [Keys] TrophyKey`, to write trophies.

**Owner's past troubleshooting (outside Cartridge) that explains some Steam manager rules**
- RPCS3 and shadPS4 Steam shortcuts failing in Game Mode on Bazzite.
- A shadPS4 AppImage shortcut doing nothing because its Start In pointed into a `/tmp/.mount_` path.
- lsfg-vk not working with shadPS4 `-d -g` direct launches.

These are why Cartridge fixes `/tmp/.mount_` Start In paths and leaves frame generation wrappers out.

## E4. Files Cartridge keeps in `~/.config/Cartridge/` (userData)

| File | What |
|---|---|
| `config.json` | Settings, mode 600 |
| `library.json` | The library mirror |
| `installed.json` | The download manifest (romId → path) |
| `marked.json` | PS4/PS5 marks (romId → `{at, path?}`) |
| `imgcache/` | Image cache |
| `logos.json`, `logos/` | Prepared logos |
| `artwork.json` | Per-game art picks |
| `syslogos/` | Console wordmarks |
| `gameicons2.json` | Square icon cache (v2: square only) |
| `retroachievements.json` | RA cache |
| `trophy-links.json`, `trophy-remote.json`, `trophyicons/` | Trophy links (manual game ↔ trophy set), trophies pulled from RomM, and the icon cache (including `trophyicons/remote/<set>/`). Discovered emulator folders are kept in `config.json` as `trophies.sources[<id>] = { enabled, dirs: [{dir, how}], custom: [] }` |
| `wallpaper.<ext>` | Custom wallpaper |
| `cartridge.log` | App log, rotated at 512 KB to `.old` |
| `steam-launch.sh`, `steam-launch.log` | The Steam launch script and its log |
| `steam-games.json`, `steam-games-removed.json`, `steam-queue.json`, `steam-jobs/`, `steam-backups/`, `steam-apply.log`, `play.sh` | Steam manager (0.6) |
| `running.json` | Single-instance heartbeat (0.6) |

Screenshots go to `~/Pictures/Cartridge`.

## E5. Environment variables Cartridge reads

| Variable | Meaning |
|---|---|
| `CARTRIDGE_SMOKE=1` | Launch check mode (CI) |
| `CARTRIDGE_MULTI=1` | Skip the single-instance lock (tests) |
| `CARTRIDGE_FROM_STEAM=1` | Set by `steam-launch.sh` |
| `CARTRIDGE_BIG=1` | Treat as a big screen (set on the GPU relaunch) |
| `CARTRIDGE_SAFE_GPU=1` | Force software |
| `CARTRIDGE_SGDB_BASE`, `CARTRIDGE_RA_BASE`, `CARTRIDGE_RA_MEDIA` | API overrides for mocks |
| `CARTRIDGE_NO_SYSTEMD_RUN=1` | Spawn the Steam helper directly (tests) |
| `APPIMAGE` | Set by the AppImage runtime |
| `VITE_DEV` | Load `http://localhost:5173` |
| `XDG_CONFIG_HOME`, `XDG_DATA_HOME` | Used by trophy discovery for emulator config and data folders |

## E6. Development notes from the chat sessions

- Dev setup: `npm ci`; `npx vite build` for the UI only; `npm run dist` for the AppImage; run from source with `node_modules/electron/dist/electron . --disable-gpu`.
- Playwright was used with `_electron.launch({ executablePath: node_modules/electron/dist/electron, args: [repo, '--disable-gpu'], env: {HOME, XDG_CONFIG_HOME, CARTRIDGE_SGDB_BASE: mock} })`. The UI exposes `window.cart.call` for driving IPC directly in tests.
- Root in a container must pass `--no-sandbox` to Electron. A real user must not (see A6).
- The UI was designed at 1920x1080 and checked at 1280x800 and 3840x2160.
- The owner's photos come from phones, so colours look different from the real screen. Judge layout, not colour, from them.

---

# PART F · Answers to Claude Code's follow-up questions (after reading 0.6.0)

**F1. `Achievements.vue`: tab styles duplicated inside `@media (max-width: 1100px)`.**
- Not intentional. The only rule that belongs in that media query is `.ach-sub { display: none; }`, which hides the "PS3 · PS4 · Xbox 360 · Vita" subtitle on narrow screens so the two tabs fit.
- The duplicated `.tg-mark`, `.tg-g`, `.tg-word...` rules are a copy-paste leftover from the 0.6 redesign. They are identical to the ones above, so they change nothing.
- Safe to reduce the block to `@media (max-width: 1100px) { .ach-sub { display: none; } }`.
- Check the Achievements tab at 1280x800 afterwards.

**F2. Trophy game page X = Filter, Y = More; RetroAchievements game page X = Refresh, Y = Filter.**
- Not a deliberate rule, just how each page grew:
  - The RA page came first (0.3). RA data is remote, so X = Refresh (same as the RA tab), and Y got Filter.
  - The trophy page got a More menu in 0.6 (Change or Reset icon). Y is "More" everywhere else in the app (the game page uses Y = More), so Filter moved to X.
- Making the RA page match (X = Filter, Y = More or Refresh) would be consistent. But it changes the owner's muscle memory, so ask him first. Do not change it silently.

**F3. `.padbtn` in `styles.css` after the Btn.vue redesign.**
- Unused. A search of `src/` finds `.padbtn` only in its own three CSS lines (105 to 107). No template or script builds the class name.
- Safe to remove. Check the bottom hint bar and the Settings "Button icons" demo afterwards.

**F4. `apply()` records games in `steam-games.json` before the helper finishes.**
- Known (noticed while writing this handoff), not intended as a final design.
- **Why it is ordered that way:**
  - In script mode, `play.sh` is generated from the registry. It must know the new games before Steam restarts and the user presses Play.
  - `removeGame`/`removeAll` need the appids.
  - The helper runs in another process that may outlive Cartridge (Game Mode kills Cartridge when Steam closes), so "after the helper finishes" often happens when Cartridge is no longer running.
- **What protects the user today:**
  - The UI's "in Steam" state (`inSteam`) is always computed from the real `shortcuts.vdf`, not from the registry. A failed apply shows those games as "not in Steam" and "Add N missing games" offers them again.
  - `steam:last` and `steam:report` show the error.
- **What is wrong when it fails:**
  - The "N added by Cartridge" count and "Remove everything Cartridge added" include appids that are not in Steam. Removing them is harmless; the helper just finds nothing.
  - Undo's registry fix-up may keep stale entries.
- **Suggested fix:** on start (and after `steam:last` reports done or error), reconcile the registry with `shortcuts.vdf`. Drop registry appids that are not present, unless a job is still running (`last.status.json` missing or `closing`/`writing`). Keep writing the registry early for `play.sh`.

**F5. `_learnOne`, `_tokenize`, `_buildLaunch`, `_learnAll` exports and tests.**
- Tests existed, but only in the chat workspace (never committed). That workspace is gone after the session.
- **Unit and integration tests for the Steam manager:**
  - `steamfix.py`: builds a fake home with a Steam install and a mixed EmuDeck plus AppImage setup modelled on the owner's real shortcuts, written with Python's `vdf` package.
  - `steamtest.js`: drives the manager with a fake library and prints the learned templates, preview, and apply.
  - `steamtest2.js`: remove, undo, `setTemplate`, `setMode`.
  - All three are pasted in full in `docs/steam-tests.md`. Checks were done by reading the output and with a Python `vdf` script (also in `docs/steam-tests.md`). There were no assertions framework; it is script output reviewed by eye, plus asserts in the Python check.
- **Other harness pieces, not pasted because they are large or need binary assets:**
  - `server.js`: a mock RomM server on port 8080, with a demo library of open-source homebrew games and flags `DEMO`, `ALLSYS`, `TROPHY`, `PS4TEST`, `ICONALL`, `NOTESEED`, `NONOTES`. It implemented heartbeat, platforms, roms, collections, content downloads with Range, firmware, notes (in memory), a SteamGridDB mock under `/sgdb/` (including a round-icon and a "skate: recompiled" ranking case) and a RetroAchievements mock.
  - Fake emulator data under a fake home (`/home/deck`) with RPCS3, shadPS4, Xenia and Vita3K trophy files.
  - Playwright scripts: `tro.js` (trophies end to end), `tro2.js` (two-device sync), `stui.js`/`stui2.js`/`stui3.js` (Steam UI, More menu and `--game`, second-instance handover), `sweep.js` (clipping), plus older ones for keyboard, colours, pads, icons and RA.
  - `/opt/cartest/gm.sh` and `st.sh`: launch checks of the built AppImage as a normal user under a headless weston plus Xvfb, in 5 environments (next answer).
- **Rebuilding this as a real `test/` folder is recommended.** The exports are there for it.

**F6. How the Steam feature was tested, and what is least tested.**
- **Never tested on a real device or with a real Steam client.** All testing was in a Linux container:
  1. A fake Steam tree (`steamfix.py`): `loginusers.vdf`, `config.vdf` with an empty `CompatToolMapping`, and `shortcuts.vdf` with 10 shortcuts modelled on the owner's photos (D2 item 17):
     - PS2 `pcsx2-qt.sh` with `mako-run`
     - PS2 without a wrapper
     - PS3 RPCS3 AppImage with `%RPCS3_GAMEID%:BLUS30405` and a `/tmp/.mount_` Start In
     - PS4 shadPS4QtLauncher with `-d -g CUSA00552` (title ID)
     - GameCube Dolphin with `vblank_mode=0 LSFG_PROCESS=x %command% -b -e`
     - Wii Dolphin with vblank
     - two Wii U Cemu with `roms/wiiu/roms/<game>/code/*.rpx`
     - Switch Eden AppImage with `"-f" "-g"`
     - one unrelated app (firefox)
   - Plus EmuDeck launchers (`pcsx2-qt.sh`, `dolphin-emu.sh`, `cemu.sh`, `duckstation.sh`, `retroarch.sh`, `xenia.sh`, `xemu.sh`), AppImages in `~/Documents/Apps`, RPCS3 `games.yml`, a RetroArch snes9x core, and collections (one normal, one dynamic).
   - A symlinked second mount path tested `/run/media` vs `/media` style mapping.
   - Games with duplicate names across consoles were tested.
  2. **Verified:**
     - learned templates per console, the strip rules, fallbacks (RPCS3 unknown serial, PS4 without an ID, PS3 folder game EBOOT)
     - Wii U rpx, RetroArch core, the "No emulator" skip
     - the apply output checked with Python `vdf`: the 10 original entries byte-identical after write, 13 new, every appid equal to Steam's formula
     - collections JSON (existing one extended, new one created, dynamic untouched)
     - remove, undo (restore plus registry), `setTemplate`, `setMode`
  3. **Electron UI with Playwright against the mock RomM:** Settings → Steam status and emulator list, Add missing, the collections modal, the preview modal, apply, done toast, the emulator editor and Test, the More menu Add/Remove, "Apply now/Later", the queue file, `--game` opening the game, and a second launch handing over.
  4. **The helper through the RELEASED 0.6.0 AppImage** (`APPIMAGE_EXTRACT_AND_RUN=1`, `ELECTRON_RUN_AS_NODE`), with a fake `steam` script on PATH that obeys `-shutdown`: closed, wrote, restarted Steam. `systemd-run` was disabled in this test.
- **Least tested, in order:**
  1. real Steam shutdown and restart timing, especially in Game Mode (gamescope-session restart)
  2. the `systemd-run` path
  3. how Steam treats the edited collections file and Steam Cloud
  4. Proton mapping for `.exe` emulators
  5. Flatpak Steam and multiple accounts
  6. artwork showing in Steam (file names are standard, but not seen in a real client)
  7. script mode (`play.sh`) launching from Steam
  8. the owner's real PS4 setup, which uses a PATH (`-d -g "/media/.../roms/ps4/<game>..."`), not a title ID like the fixture. It should learn as kind `path` or `eboot` and work, but it was not in the fixture
  9. performance on a big real Steam library

**F7. Why `systemd-run` with `KillMode=process`, the 5 s fallback, and the 12 s wait in Game Mode.**
- These were designed ahead of time from how Steam and Game Mode behave. They were NOT reactions to observed failures; none of them has been seen failing or working on a real device.
- **`systemd-run --user`:**
  - When Steam exits it ends what it launched (its reaper tracks its children). Cartridge started from Steam, and any detached child of it, can be killed along with Steam.
  - A transient user service runs outside Steam's process tree and cgroup, so the helper survives Steam closing.
  - The plain `spawn(..., {detached: true})` fallback only starts a new session; unsure whether Steam's reaper still kills it.
- **`-p KillMode=process`:**
  - By default, when a service's main process exits, systemd kills everything left in its cgroup.
  - The helper may START Steam (Desktop Mode) as its child. Without `KillMode=process`, Steam would be killed the moment the helper finishes.
- **The 5 s fallback:**
  - `systemd-run` can succeed (exit 0) while the unit never actually runs the command: a user manager without the needed env, or a bad binary path in the service environment.
  - The helper writes `closing` to its status file immediately. If there is no status file after 5 s, Cartridge assumes the service didn't run and spawns the helper directly.
  - 5 s is a guess: long enough for a normal start (under a second), short enough that the user isn't waiting.
  - **Real bug (found while checking this handoff):** if the service is just slow and both copies run, they share the same job file and `stamp`. `backup()` names backups `<file>.<stamp>`, so the second run OVERWRITES the first run's backup, possibly with the already-changed `shortcuts.vdf`. Undo would then restore the changed file. The shortcut writes themselves are idempotent (merge by appid). Fix: in `steamHelper.backup()`, skip if the backup file already exists, or add a lock file per job so only one copy runs.
- **The 12 s wait in Game Mode (1.5 s elsewhere) before starting Steam again:**
  - In Game Mode the gamescope session restarts Steam by itself after it exits.
  - Starting a second Steam at the same time could fight it, or leave the user in Desktop-style Steam inside Game Mode. So the helper waits, and only starts Steam if it is still not running.
  - 12 s is a guess at "the session has had time to bring Steam back". Unverified.
  - Outside Game Mode nothing restarts Steam, so 1.5 s (just past the write) is enough.
  - The helper only restarts Steam if it was running when the job started, or for an explicit "Restart Steam".
- **The trailing `--no-sandbox` (not asked, but related):** this one WAS observed.
  - With the helper argv `[helper.js, job.json]`, the AppImage's `AppRun` prepends `--no-sandbox` on systems without user namespaces, and Electron in Node mode exits with "bad option: --no-sandbox".
  - Reproduced in the container with the release AppImage. Passing `--no-sandbox` last makes `AppRun` skip adding it; Node treats it as a script argument, which the helper ignores.

**F8. How the single-instance heartbeat came about, and why 20 s and 700 ms.**
- **The report:** in the 0.6 planning discussion the owner said Cartridge sometimes "won't launch until Steam restarts". He gave no photo or log for it.
- **Root cause:** never confirmed. Two likely explanations:
  1. a previous Cartridge process still running without a window (for example after Steam killed the window but not every child, or a hang)
  2. a second instance starting and dying against the first one's Chromium singleton lock
- **The design:**
  - `requestSingleInstanceLock` makes a normal second launch hand over (focus the window, pass `--game`) instead of failing silently.
  - The heartbeat covers the hung case: a responsive instance writes `running.json` every 5 s. A new launch that can't get the lock looks at the heartbeat.
  - **20 s:** 4 missed beats. Well beyond normal jitter, including a busy main thread during a sync, and short enough that a user retrying after a failed launch gets a working app.
  - **700 ms:** after SIGKILL of the old pid, a short pause so the OS releases the process and its lock before `app.relaunch`. Chosen by judgement, not measured.
- **What testing showed** (container, SIGSTOPped instance): Chromium's own singleton logic timed out after about 20 s, killed the hung process and let the new launch become the app. So the heartbeat's kill-and-relaunch branch was not needed in that case.
- The branch remains for cases where Chromium's handover "succeeds" to a process that is alive but broken. Unsure how often that happens in practice.
- Normal handover was tested and works (second launch exits in about 100 ms; the first shows the requested game).
- `CARTRIDGE_SMOKE` and `CARTRIDGE_MULTI` skip all of this so CI and tests can run several instances.

---
