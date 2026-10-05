# Handover: everything from 0.9.22 to 0.9.37

To the Claude on the next account, from the Claude on this one.

The previous handover, `docs/HANDOVER-0.9.3-to-0.9.21.md`, covers 0.9.3 to 0.9.21. Read it too: everything in it about the owner, the process and the do-not-break rules still holds unless this document says otherwise. This one picks up at 0.9.22 (3 October 2026) and runs to 0.9.37 (5 October 2026): **16 releases**, PRs #38 to #54. It tells you what changed, why, how, what broke and how it was fixed, how the owner worked with me in this stretch, how I tested without a device, and what is still open.

Read in this order:
1. This document, top to bottom, once.
2. `CLAUDE.md`. Its sections from "0.9.22" to "0.9.37" are my short technical notes per version, with function names. They are the index into the code.
3. `docs/SESSION-LOG.md`, newest entry first: the per-update diary, with the owner's words and what they must test.
4. `CHANGELOG.md` for the exact user-facing wording of each release.

The repo is public. Nothing private is in this document: no usernames, paths from the owner's machines, emails or IPs. Keep it that way.

---

## Part 1. Where things stand right now

- **Latest release:** v0.9.37 "Cartridge 0.9.37 · Set Up for You" (5 Oct 2026). See Part 4 for every release.
- **Branch:** all work on `claude/relaxed-fermat-30pigp`. Each PR merges it into `main`; after each merge the branch is reset to `main` (`git fetch origin main && git checkout -B claude/relaxed-fermat-30pigp origin/main && git push --force-with-lease`). Start from `main`.
- **package.json:** `version` 0.9.37, `versionName` "0.9.37", `build.releaseInfo.releaseName` "Cartridge 0.9.37". Version names equal the number again (no lettered parts since 0.9.15).
- **Tests:** 172 pass (`npm test`, node:test, 27 files in `test/`). CI runs them before every build.
- **Build:** `npm ci --ignore-scripts && npx vite build`.
- **Big change in tooling:** in this stretch the cloud container **could run Electron** (`node_modules/electron/dist/electron`, Electron 44, Chromium 152). I drove the real app with Playwright's `_electron` against a mock RomM. The launch check `CARTRIDGE_SMOKE=1` also ran locally. See Part 3. If your container can't, the old stubbed-browser harness from the previous handover still works.

The owner's last messages to me, and their state:
1. **About sheet focus** (photo): rows showed the global focus ring, clipped at the top. Fixed in 0.9.37: About, Its Games and Linked Folders rows use the plain fill like every other list.
2. **Cemu ("Simo" in dictation) groups empty:** looked into deeply in 0.9.37. The parser was right; the real causes were the game's title ID not being found on Bazzite (Cemu stores `/var/home/...`, Cartridge compared `/home/...`), and 20 of 95 games having packs that list only some regions. Fixed and explained in Part 6.5. **Ask the owner which game they were looking at**, and to open its Add-ons again: the tabs now show counts and a line names packs made for another region.
3. **BIOS and firmware put in place automatically** after RomM downloads and emulator installs, with a Setup and Health overhaul: built in 0.9.37 (Part 6.6). Never run on a device.
4. **Add-on site downloads:** the page now closes and Downloads opens the moment a download starts (0.9.37). The owner had downloaded the same mod four times because nothing visible happened.
5. **Mod installs per emulator:** checked against each emulator's own mod layout (0.9.37). Azahar mods were going into the textures folder; Switch layouts improved. Part 6.5.
6. **Download Latest Patches for RPCS3 and shadPS4:** the owner first said it was missing, then said it was there and they hadn't updated. Nothing to do.
7. **The handover:** this document.

---

## Part 2. The owner: how they worked with me (additions to the previous handover)

Everything in the previous handover's Part 2 still applies. New in this stretch:

### Dictation names (add to the table)

| Dictated | Means |
|---|---|
| "Simo", "CMU", "Semu" | Cemu |
| "scheme icon" | the Steam icon (Steam logo in the progress ring) |
| "RPCSC 3", "RPC SES 3", "RPCS 3" | RPCS3 |
| "Gold Hen" | GoldHEN |
| "Shad PS4", "shared PS4" | shadPS4 |
| "safe data" | save data |
| "system icon" | the console picture (PIcon), not the emulator's icon |
| "L1/R1" | LB/RB (as before) |
| "Recommended for ... trails" | text cut off with "…" |

### How they work now
- **"Ship it all as one update"** and **"read every message back before you ship"**: in 0.9.32 they sent a long list over many messages while I was building and asked for one release. Before shipping, go through every message since the last release and tick each item. They checked afterwards ("did you do these... the scheme icon and the yellow icon").
- **Credits running out:** they asked me to continue in a fresh window ("restart this session at 4:30 a.m. and continue building"). The context was summarised and work went on. Keep `SESSION-LOG.md` and the task list current so a restart loses nothing.
- **They ask "did you do X?" when they suspect a gap.** Answer honestly item by item, including what is only partly done. In 0.9.32 I listed three things that were partial (no "…" anywhere, logos checked on every console, interactive widgets) and they asked for exactly those next. Being upfront earned trust.
- **"Don't build, just answer"** still means no code. When they say "recommend before building" (the Linked Folders placement), ask with options (AskUserQuestion with previews worked well), then build.
- **Repeats are signals.** When they report something "again" (controller after a game, icon glitch, collections), the earlier fix missed the real cause. Go deeper: read the upstream source, reproduce, measure. Every repeat in this stretch had a different root cause than the first fix assumed.
- **They retract things** ("never mind, that was my bad"). Don't build what they've retracted.

### Owner's decisions in this stretch (keep them)
- **Dock** (0.9.28): the top bar became the Dock: bottom, centred, pill style by default. **Black by default for everyone** (0.9.32). Hints off by default. Pages fade out above the Dock instead of ending in a hard line (0.9.32).
- **Selection style** (repeated, 0.9.37): full fill in the focus colour with contrasting text. **No ring around list rows, nothing clipped.** New list-like components must be added to the ring-exemption list in `styles.css` (search `rows: the fill is the focus`).
- **No "…" anywhere** (0.9.32, 0.9.33): text wraps onto a new line instead. Only five single-line controls keep the ellipsis (Keyboard suggestion keys, ControllerTest device id, dev pill, form field values, Start overview tags). Long summaries keep their line clamps.
- **Steam console collections are named maker then console** ("Sony PlayStation 3", "Nintendo Wii", 0.9.27). RomM's plain name stays in use while that collection exists and Cartridge's doesn't.
- **Linked Folders** (0.9.33): a page in Settings → Emulators; a fork's existing saves are set aside as `<folder>.cartridge-kept`, never deleted, and restored on unlink. This is an owner-approved exception to "Cartridge never touches saves" (only on request).
- **Multi-language is scrapped** (0.9.29): never mention more languages coming. The Language step was removed from the welcome.
- **Opens on Start by default** (0.9.23).
- **Start rows roll by themselves** (0.9.28): one row at a time, slowly.
- **Mods sort by Most Downloaded by default** (0.9.32), with Most Liked, Newest, Recently Updated.
- **Texture pack archives Cartridge downloads are deleted after install** (and on failure); a file picked with Install a Download is left where it was. The owner asked; this is the answer.
- **Syncthing saves** (0.9.29): Cartridge only sets Syncthing up on a blank Syncthing (or one it set up), versioning always on, restore and Make Two-Way only on the user's choice. Ryujinx saves are left out of syncing (its save index differs per device). Still owner's to decide: pausing sync while playing, PSN sign-in for PS4 names, optional folders (states, BIOS, keys).
- **GPU Always** is opt-in on handhelds with an automatic revert after 25 s unless kept (0.9.29). The auto rendering rules are unchanged.

### Their devices (only what the code needs)
- ROG Ally X with SteamOS in Game Mode at **1080p**, so the software rendering rule applies there (this explained "choppy on the Ally"). A Bazzite desktop PC, often driven with a controller. A 4K TV.
- Bazzite means home is a symlink (`/home` → `/var/home`). This caused the Cemu title ID bug in 0.9.37: always compare real paths.
- Emulators in `~/Applications` and on an external drive under an EmuDeck `Emulation` folder. Forks: GR2 (Gravity Rush 2, came as a Linux .zip), BB Launcher.
- Decky is installed, so Steam's CEF interface is usually reachable (live changes).

---

## Part 3. Process and tooling

### Release process (unchanged, still the standing rule)
1. `npm test`, `npx vite build`, the launch check (below).
2. Screenshot or measurement pass for whatever changed (below).
3. Grep the diff from `origin/main` for em dashes and private info: `git diff --cached origin/main | grep "^+" | grep -nP "\x{2014}|/home/[a-z]|@gmail|192\.168"` (the first pattern is the em dash, written as its code point).
4. Version bump in package.json (three fields), `RELEASE_NOTES.md` (this version only), top of `CHANGELOG.md`, a `CLAUDE.md` section, a `docs/SESSION-LOG.md` entry.
5. Commit with the trailers, push, wait for the **Test build** workflow to go green on that SHA (`gh api "repos/abdu2304/cartridge/actions/runs?head_sha=<sha>"`), open the PR (GitHub MCP `create_pull_request`), merge with `expectedHeadSha`, wait for `releases/latest` to show the tag with `Cartridge-x86_64.AppImage` and `latest-linux.yml`, reset the branch.
6. Tell the owner what changed, what was checked, and what they must test on the device.

### Running the real app in the container (new in this stretch)
- Electron runs here: `node_modules/electron/dist/electron`. Start a display first: `Xvfb :99 -screen 0 3840x2160x24 &`.
- **Launch check:** `CARTRIDGE_SMOKE=1 HOME=$(mktemp -d) DISPLAY=:99 timeout 60 node_modules/electron/dist/electron . --no-sandbox --disable-gpu` prints `SMOKE OK`.
- **Playwright against the real app:** `require('playwright-core')._electron.launch({ executablePath: <electron>, args: [repo, '--no-sandbox', '--disable-gpu'], env })`. Each script builds a fake home under `/tmp/ch` (config.json with `server.localUrl` pointing at the mock, `setupDone`, `welcomed`, `ui.toured`, `ui.startTips`), a fake Steam (`loginusers.vdf`, `shortcuts.vdf` written with `steamArt.writeVdf`, `cloudstorage/cloud-storage-namespace-1.json`), EmuDeck-style launchers and RetroArch cores as empty files, then launches with `HOME`, `XDG_CONFIG_HOME`, `CARTRIDGE_MULTI=1`, `CARTRIDGE_NO_SYSTEMD_RUN=1`, `CARTRIDGE_HLTB_BASE`, `CARTRIDGE_CEF_PORT`.
- `window.cart.call(ch, arg)` from `page.evaluate` calls any handler directly; `app.evaluate(({ BrowserWindow }) => ...)` runs in main (send events with `webContents.send`).
- **Screenshots:** `webContents.capturePage()` on the **visible** window. A hidden helper window (webFetch's Cloudflare pass) can exist, so pick `getAllWindows().find((w) => w.isVisible())`, not `[0]`. Capturing the hidden one throws `UnknownVizError`.
- **Mock RomM servers** (in the scratchpad, not the repo): one with 166 games on two platforms (SNES, PlayStation), covers as generated BMPs, `/assets/platforms/*.svg` served from a clone of RomM's frontend; one with 40 platforms for logo and card checks. Write them again from RomM's API shapes in `electron/romm.js` and the test files.
- **Console wordmarks** load from art-book-next on raw.githubusercontent, but Electron's own `net.fetch` doesn't use the container's proxy: pre-seed `~/.config/Cartridge/syslogos/<key>.svg` with curl to test with real logos.
- **Things simulated rather than run:**
  - Game Mode: a fake `xprop` on `PATH` printing `GAMESCOPE_FOCUSED_APP(CARDINAL) = <n>` from a file, `SteamGamepadUI=1`, `SteamGameId=<appid<<32|0x02000000>`, a fake `xdg-open`, and a fake game process (`exec -a "fake-emu <rom path>" sleep 60`).
  - Steam's CEF interface: `CARTRIDGE_CEF_PORT` pointing at a small fake (not in repo).
  - Add-on site downloads: a local page and a slow server streaming a zip over 3 s, to prove the download survives the window closing.
- **No `/dev/uinput` here:** no virtual controller can be made. Controller behaviour was studied from Chromium's source (see Part 6.9).

### Reading upstream source (keep doing this)
Every real fix in this stretch came from reading the upstream project. Clone into the scratchpad, never the repo:
- Chromium 152 gamepad code: `raw.githubusercontent.com/chromium/chromium/152.0.7977.130/third_party/blink/renderer/modules/gamepad/navigator_gamepad.cc`, `device/gamepad/gamepad_provider.cc`, `gamepad_service.cc`, `gamepad_pad_state_provider.cc`.
- Eden (GitHub mirror `eden-emulator/mirror`): content_archive.cpp, fssystem_nca_header.h, nca_metadata.h, control_metadata.h, patch_manager.cpp.
- Cemu: `src/Cafe/TitleList/TitleList.cpp` (title_list_cache.xml format), `cemu-project/cemu_graphic_packs` (its build.yml shows the release zip bundles Enhancements, Resolutions, Mods, Workarounds and src/).
- RomM frontend `assets/platforms` (the Sony pictures).
- Syncthing REST docs.

### Network from the container
- Works: git clone from GitHub, raw.githubusercontent.com, GitHub release downloads, `gh api` through the session proxy.
- Blocked: gamebanana.com, Openverse/Wallhaven, git.eden-emu.dev, HenrikoMagnifico, Sony's update servers, metadata.ppsspp.org. Integrations with these were written to their documented APIs and are untested here.

### Electron gotcha learned the hard way
- **Electron's crypto is BoringSSL: no `aes-128-xts`.** Node in `npm test` has it, so tests passed while the app threw. Check a cipher inside Electron: `ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron -e "..."`. `switchNca.js` does XTS over ECB itself.

---

## Part 4. Every release in this stretch

| Version | Title | What |
|---|---|---|
| 0.9.22 | Home Fix | Home vanished after a few moves: `heroArt` name clash in Home.vue |
| 0.9.23 | Make It Yours | Vita3K brick fix and installs, emulator channels/delete, shadPS4 versions, add-ons per emulator, per-game emulator settings, Start pages and widgets, Syncthing page, Game Mode closing fix |
| 0.9.24 | Set Up Your Way | Emulator folders editable, Cartridge Installer, Steam collections review, Syncthing pairing, add-on detail page, top bar placement, From a GitHub link |
| 0.9.25 | Open Emulators | Open an emulator from Cartridge |
| 0.9.26 | The Touch Update | Cartridge scrolls every touch itself |
| 0.9.27 | Collection Names | Maker then console names for Steam collections |
| 0.9.28 | The Dock | Bar at the bottom as the Dock, page overview, picture search, rolling rows, touch rework, Syncthing service |
| 0.9.29 | The Syncthing Update | Saves found and matched, Syncthing main device and join, smoothness on handhelds, GPU Always, Cemu community packs, Steam ring, hold A to expand |
| 0.9.30 | Switch, Read Properly | Switch IDs and versions read like Eden (XTS in Electron), console card shadow |
| 0.9.31 | Sony's Own Marks | RomM's parody marks on Sony pictures replaced at load time |
| 0.9.32 | In the Background | Background jobs, GitHub .zip forks, Syncthing chips, Cemu cheats, Start trophies redesign, new widgets, mods sorting, add-on site downloads, game About, Steam collections rebuilt (PR #49) |
| 0.9.33 | Linked Folders | Fork saves linked, Download Latest Patches for RPCS3/shadPS4, no "…" anywhere, interactive console widgets (PR #50) |
| 0.9.34 | Back in Control | Controller after a game, console collections from Steam's real state, Its Games page (PR #51) |
| 0.9.35 | Steady Pictures | Console pictures stopped glitching during updates, deleted collections forgotten (PR #52) |
| 0.9.36 | Collections, Checked Properly | Issues check reads Steam, SRM names matched (PR #53) |
| 0.9.37 | Set Up for You | BIOS/firmware put in place by itself, Cemu groups fixed, mods per emulator, add-on site download goes to Downloads, row focus (PR #54) |

PRs #38 to #48 cover 0.9.22 to 0.9.31 (one of those releases took two PRs).

---

## Part 5. Map of new code (where to look)

Main process (`electron/`):
- `switchNca.js`: Switch NCA reading from Eden's source (XTS over ECB, key area keys, tickets, CTR sections, PFS0/RomFS, NCZ, CNMT/NACP, NAND updates). Tested with OpenSSL-encrypted NSPs.
- `sonyArt.js`: swaps RomM's parody marks on Sony controller pictures for the real SONY wordmark and PlayStation logo, by path hash, at load time. RomM's art is never in the repo.
- `saves.js`: every emulator's save layout, matching saves to games, `SYNC` folders per console. Read only.
- `syncthing.js`: Syncthing REST (status, server, rescan, browse, saveSync, makeMain, addDevice, acceptFolders, versions/restore, service), `KINDS` of synced files.
- `folderLinks.js`: Linked Folders (find a fork's data folder, link, unlink, kept-aside folders).
- `cemuPacks.js`: Cemu graphic packs (rules.txt, settings.xml entries, presets, community download, `titleIds`, `otherRegions`, `sectionOf`).
- `addonInstall.js` `plan()`: where each file of a mod archive goes, per emulator (see Part 6.5).
- `addonSources.js`: GameBanana (Mod/Index with sort, Subfeed fallback), EmuCoreX, HenrikoMagnifico, featured pages.
- `steamCollections.js`: collection names (`fullName`, `nameFor`), `consoleOf` (now with Steam ROM Manager's "<console> - <emulator>"), `analyse`.
- `steamLive.js`: Steam's CEF interface. New: `listCollections`, `frontRunning`, `renameCollection`.
- `steamManager.js`: new collection logic (`colsNow`, `gamesInSteam`, `consoleCollection`, `fillCollections`, `pruneStale`, `verifyCollections`, `fixCollections`), `scriptRuns`, `forksAll`, `frontRunning`, `cloudRows` (reads `.modified.json`).
- `steamHelper.js` `writeCollections`: respects Steam's `.modified.json`.
- `bios.js`: what each console needs and where emulators read it; `place()`.
- `customEmu.js`: GitHub link installs, archives (`pickArchive`, `programsIn`).
- `main.js` additions: background jobs (`bgJobs`, `asJob`, `JOBS`, `JOB_EVENTS`), `game:about`, `addons:browse` (add-on site window), `links:*`, `patches:download`, `steamFront`, `app:log`, `biosSetup`, `bios:setup`, `bios:status`, `colsAuto`, `steam:consoleCollection`, `steam:fillCollections`.

UI (`src/`):
- `components/GameAbout.vue` (Game More → Options → About), `ConsoleCollection.vue` (Its Games), `LinkedFolders.vue`, `SaveSync.vue`, `SyncCard.vue`, `AddonsSheet.vue` (facts card, sort chips, browse), `PatchesSheet.vue` (Download Latest per emulator, Cemu presets, other-region note), `GameAddons.vue` (tabs per console; Cemu tabs only for groups the game has).
- `views/Start.vue`: widgets including trophies redesign, Game Disc or Cartridge, Game Shelf, page overview, rolling rows. `startTiles.js`, `startLayout.js` (tested).
- `views/Settings.vue`: Emulators pages (Emulators, Game Add-ons, Setup and Health with Issues and **BIOS and Firmware**, Console Folders, Linked Folders), Steam settings (`SteamSettings.vue`, Collections page).
- `nav.js`: touch engine, `gameEnded`/`returned`/`watchReturn`, hold A expand.
- `components/PIcon.vue`: console pictures, measured and fitted once.

---

## Part 6. Every subsystem: what it does now and why

### 6.1 Switch (0.9.24, 0.9.30)
- The owner wanted Switch IDs and versions read "like Eden". The first reader used Node's `aes-128-xts`, which Electron lacks, so it **always threw inside the app** while tests passed. 0.9.30 rewrote it from Eden's source: XTS done over ECB with Nintendo's big-endian sector tweak, key area keys and titlekek from prod.keys (or derived from master keys), tickets inside NSPs or title.keys, CTR sections, PFS0 and RomFS, NCZ bodies (zstd), CNMT for title ID/type/version, NACP for name and version string, Eden's NAND updates.
- Base ID = ID & ~0x1FFF (updates end in 800, DLC in 1xxx).
- `switchVersionOf` reads files first (cached by size and mtime), then the NAND update when newer, file names only as a fallback.
- Owner to test: Add-ons version line for NSP, XCI, NSZ and an update installed in Eden.

### 6.2 Sony pictures (0.9.31)
- RomM's own platform pictures carry parody marks (ROMMY, an R logo, "Rommstation"). `sonyArt.fix(slug, buf)` removes those paths only when all their hashes match (else the file is untouched) and draws the real marks in measured boxes. Applied to cached and fresh copies.

### 6.3 Syncthing and saves (0.9.23 to 0.9.29, 0.9.32)
- Settings → Syncthing tabs: Games, Main Server, This Device (merged when this device is the main server).
- Saves: `saves.js` scans each emulator's save layout and matches saves to games by serial, title ID or name (Eden's game_list names, Ryujinx's IMKV index, PS2 memory card serials). Cartridge never writes a save.
- Save sync: one Syncthing folder per console (`cartridge-saves-<console>`), set up only on a blank Syncthing or Cartridge's own, staggered versioning 30 days. A device joins by device ID; pending Cartridge folders are accepted at this device's paths, receive-only until Make Two-Way.
- 0.9.32: synced files classed as saves, textures, patches, updates or mods (`KINDS`), with two chip rows (console, kind) on the Games tab.
- A systemd user service keeps Syncthing running in Game Mode (the Decky plugin needs root).
- Owner to test: two devices end to end.

### 6.4 Start (0.9.23 to 0.9.33)
- Pages, page overview (L1/R1 in Arrange), rolling rows, picture/GIF search (Wallhaven 4K, Openverse GIFs, 20 per page without an account), HTML widget in a sandboxed iframe.
- 0.9.32 trophies tile: the newest unlock as a card with its game's art, your games' progress, earlier unlocks; no empty space. Week tile filled at 1x1, storage above the edge, steady Recently Played cover size.
- New widgets: Game Disc or Cartridge (`media`) and Game Shelf (`shelf`). 0.9.33 made them react: tap the disc for the next game, tap a spine to slide it out and again to open; a focused disc spins faster (a second spin layer, so it never jumps); games on this device glow.
- Console cards: checked on all 40 consoles with real logos on the Consoles page and on Start at every tile size, 1280x800 and 1920x1080 (0.9.33). The measure script compared bounding boxes of name/logo, maker and count.

### 6.5 Add-ons, mods and patches
- **GameBanana** (0.9.32): sorted with apiv11 `Mod/Index?_aFilters[Generic_Game]=<id>&_sSort=Generic_MostDownloaded|...`, falling back to the Subfeed sorted locally. Downloads and likes shown.
- **Add-on sites** (0.9.32, 0.9.37): "Its Page" and featured packs open in a Cartridge window (`addons:browse`, session `persist:addons`). A .zip/.7z/.rar download there is caught (`will-download`), shown in Downloads, then installed with `source: 'local'`, and the file is deleted after. **0.9.37:** the window closes and Downloads opens as soon as the download starts; the download carries on (proved with a slow server).
- **Install layouts per emulator** (`addonInstall.plan`), checked against each emulator's guide in 0.9.37:
  - PCSX2/DuckStation: `textures/<serial>/replacements`; PCSX2 `.pnach` mods to `patches/`.
  - PPSSPP: the folder holding `textures.ini`.
  - Dolphin: `Load/Textures/<ID>`; graphics mods (metadata.json) to `Load/GraphicMods/<mod>`.
  - Azahar/Citra: textures in `load/textures/<title ID>`; **mods (romfs, exefs, code.ips, exheader.bin) now in `load/mods/<title ID>`** (they were going into textures, where Azahar never loads them).
  - Eden/yuzu family `load/<title ID>/<mod>/{romfs,romfs_ext,exefs,cheats}`; Ryujinx `mods/contents/<id lower>/<mod>/...`. **0.9.37:** Atmosphere `exefs_patches/<name>/*.ips` → `<name>/exefs/`, loose `.ips`/`.pchtxt` → `<mod>/exefs/`, loose `<build ID>.txt` → `<mod>/cheats/`, `romfs_ext` kept.
  - Cemu: graphic packs by their `rules.txt` folder into `graphicPacks/`.
  - Not done: RPCS3 mods (they replace files in the game's own USRDIR) and shadPS4 mods.
- **Cemu graphic packs** (0.9.24 to 0.9.37), read this before touching them:
  - Cemu's window groups packs by the **second part of `path` in rules.txt** (`Game/Graphics/...`, `/Enhancements`, `/Mods`, `/Workarounds`, `/Cheats`), not by folders. `sectionOf()` does the same.
  - The community release zip (cemu_graphic_packs build.yml) bundles Enhancements, Resolutions, Mods, Workarounds and src/ (where Cheats live). `downloadCommunity` fetches it into `graphicPacks/downloadedGraphicPacks` with `version.txt`, like Cemu's own button, falling back to the release page when GitHub's API refuses.
  - A pack is shown only when it lists the game's title ID, because Cemu only loads it then. **In 20 of the 95 games with packs, some groups list only some regions** (Super Mario 3D World's Mods list 2 of 6 IDs). 0.9.37 counts those as "made for another region's copy only" and says so under the list.
  - The game's title ID: from its `meta/meta.xml`, else Cemu's `title_list_cache.xml` by path. **0.9.37 compares real paths** (Bazzite's `/var/home`) and falls back to the title Cemu lists under the game's name. Updates/DLC (`0005000E`/`0005000C`) map to `00050000`.
  - Tabs in Game Add-ons show only the groups the game has, with counts (Graphics always).
  - The log line `cemu packs <name> ids ... packs N` says what matched.
- **Download Latest Patches** (0.9.33): `patches:download` → RPCS3's patch API (as its Download latest patches), shadPS4's and GoldHEN's repositories (as its patch manager), Cemu's community packs. Also refreshed automatically every 7 days.
- **Game About** (0.9.32, focus fixed 0.9.37): console, file, serial or title ID, version, location, Steam, add-ons installed (Cartridge's by name, others counted), patches and cheats on, the game's own emulator settings. A copies a line.

### 6.6 BIOS and firmware (0.9.17, overhauled 0.9.37)
- `bios.js` knows what each console needs and every folder its emulators read (their own folders, RetroArch's system folder, each Emulation root's `bios/`). "In place" means one of those; Cartridge's own BIOS folder doesn't count.
- `downloadBios` (RomM `/api/firmware`) saves files into the BIOS folder (`config.biosPath`, else EmuDeck's `Emulation/bios`, else Cartridge's own).
- **0.9.37 `biosSetup()`** puts everything in place from the BIOS folder(s): copies into every set-up emulator that reads files (never over a file), installs PS3 firmware through `rpcs3 --headless --installfw` and Vita firmware through `Vita3K --firmware` when they don't have it, copies Switch keys and unpacks firmware zips (any zip with .nca files) into the yuzu family's keys and NAND.
- Runs: after every emulator install (`emuget:install`), after Get from RomM (`bios:all`), and a copy-only pass 45 s after start. Previously the BIOS step in the welcome came before the emulators, so nothing was placed and RPCS3/Vita3K firmware failed; now firmware waits (`pending`) and installs once the emulator exists.
- Settings → Emulators → Setup and Health has a **BIOS and Firmware** section: each console in the library that needs one, Ready/Missing/Optional, Put Everything in Place, Get Them from RomM.
- Tested in the app with a fake home (PS1, PS2, Switch keys copied into DuckStation, PCSX2, Eden). Never run with real RPCS3/Vita3K firmware installs. PS4 needs nothing (shadPS4 runs without firmware for most games).

### 6.7 Steam collections (0.9.24 to 0.9.36), the longest saga of this stretch
Read all of it before touching collections.
- **Names:** maker then console (0.9.27). `colName(g)` keeps RomM's plain name while that collection exists and Cartridge's doesn't. A kept name (`steam.collectionNames`) wins.
- **Where collections are read:** Steam keeps local changes, **deletions included**, in `cloud-storage-namespace-1.modified.json` beside the main file, and they win when Steam loads. Before 0.9.32 Cartridge read only the main file, so deleted collections kept showing. `cloudRows` merges both; the helper keeps both in step (0.9.34). With Steam's CEF interface reachable, `steamLive.listCollections` reads Steam itself.
- **The big bug (0.9.34):** Cartridge trusted its own memory (`reg[].collections`) of which collection each game was in, and only looked at games Cartridge added. So after the owner deleted "PlayStation 3" and Cartridge made "Sony PlayStation 3", their games (many from Steam ROM Manager) never went in. Now `fillCollections` compares with Steam's real collections for **every** downloaded game matched to a shortcut (`gamesInSteam`), whoever made it.
- **Its Games page** (`ConsoleCollection.vue`): every game of the console in Steam, in the collection or not, Add Missing.
- **Automatic fill:** with "Put new games in their console's collection" on and Steam reachable, missing games go in at start and every 10 minutes (`colsAuto`). It never makes a collection next to an unreviewed one of yours for that console, and never restarts Steam by itself.
- **0.9.35 `pruneStale`:** collections you deleted are forgotten (kept names and Cartridge's memory), so they are never made again.
- **0.9.36 Issues check:** "N games missing from …" used to list old names (RomM plain names, SRM's "Nintendo DS - melonDS (Standalone)") and its fix would recreate them. Now console collections are checked by the fill's rules (only with console collections on) and any other remembered collection only while it exists. `consoleOf` understands SRM's "<console> - <emulator>" names.
- Collections page (0.9.32 rebuild): one row per console with the collection its games go into, A to use yours / rename / pick another, Refresh, your other collections listed below.
- Owner to test: live (Decky) and helper paths, a deleted collection, the Issues list now.

### 6.8 Emulators (0.9.23 to 0.9.33)
- **Background jobs** (0.9.32): emulator downloads/updates, GitHub installs, shadPS4 versions, PS3 updates, pkg installs, BIOS downloads and the Syncthing install run as jobs listed under Downloads → In the Background; each screen picks its job back up.
- **EmuDeck launchers** count only while what they run exists (`scriptRuns`), so a deleted Vita3K no longer shows as installed (0.9.32).
- **From a GitHub link** (0.9.24, archives 0.9.32): AppImages, or .zip/.tar/.7z releases unpacked into their own folder with the program picked.
- **Open** an emulator from its menu (0.9.25).
- **Linked Folders** (0.9.33): suggestions for each fork found (portable beside the program, or a folder named after it under `~/.local/share` or `~/.config`), New Link for any two folders, kept-aside folders restored on unlink. Flatpak emulators may not see a link outside their sandbox (untested).
- **Console pictures glitching during updates** (0.9.35): see Part 7.

### 6.9 Controller after a game (0.9.24, 0.9.29, 0.9.34), read before touching nav.js focus code
- **Chromium 152 gates gamepad data on page visibility only, not focus** (`navigator_gamepad.cc` `PageVisibilityChanged`; `gamepad_service.cc` pauses the provider when no consumer is active). The earlier focus fixes treated the wrong thing.
- Game Mode: `watchGamescopeFocus` reads `GAMESCOPE_FOCUSED_APP` every 600 ms. **0.9.34 found:** after a game started from Cartridge closes, gamescope can keep naming the closed game while Cartridge is on screen; Cartridge believed it and kept the pad off. Now the app focused while our game ran (`gameFocus.gameApp`) doesn't count as away after it ends, until focus moves or a new launch is seen.
- If gamescope still doesn't name Cartridge 1.5 s after the game ends, Cartridge asks Steam to go back to its running app (`steamLive.frontRunning`, SteamUIStore `NavigateToRunningApp` variants) when Steam's interface is reachable. **Those Steam UI names are guessed** from Decky's libraries; the result is logged.
- Desktop: `returned` (pad works before the window has focus after a game) no longer clears on main's own refocus blurs within 10 s.
- **Diagnostics:** the log has `gamescope focus <app> (away|cartridge)` on every change, and 20 s after a game `[ui] after the game: pads N [...], input changes N, focus, visible, in front, gamescope`. **If the owner reports it again, ask for these lines first.** One cause can't be ruled out from here: Steam itself deciding which app gets the controller after a nested launch.

### 6.10 Touch (0.9.26, 0.9.28)
- Cartridge scrolls every touch itself (the browser never turned touches into scrolling on the device). `feed()` takes moves from pointer, touch and mouse events; `swipeJump` handles swipes whose moves never arrive. Settings → About → Touch check shows how touches arrive.

### 6.11 Smoothness (0.9.29)
- Measured CPU per focus move in a 4x-throttled container. Start's clock clouds animated without the GPU because of a CSS specificity bug (half a core idle). MediaBar, Start rows and focus ring changes. GPU Always opt-in.

### 6.12 The look (0.9.28 to 0.9.37)
- The Dock (Part 2). Pages fade above it (mask on `main.main:not([data-page='start'])`).
- No "…" anywhere (Part 2).
- Row focus: fill only; new row components go on the ring-exemption list in styles.css (0.9.37).
- PIcon measures each picture once and fits it; since 0.9.35 only a real change of picture resets the fit.

---

## Part 7. Things that broke and how they were fixed (learn from these)

1. **Home vanished after a couple of moves (0.9.21 → 0.9.22):** a view's computed named like a store function it never imported. Import store functions under another name when a view has its own.
2. **Switch reader always threw in the app (→ 0.9.30):** Electron's BoringSSL has no XTS. Check ciphers inside Electron.
3. **Console card glyph shadow cut (0.9.30):** the drop-shadow was clipped by the element's own mask box. Padding (`--gp`) gives it room.
4. **Deleted Steam collections still showing (0.9.32):** Steam's `.modified.json` holds deletions.
5. **Vita3K shown after Delete (0.9.32):** EmuDeck's `vita3k.sh` stays after the emulator goes. Launchers count only while their target exists.
6. **Home first card's ring clipped (0.9.32):** `content-visibility: auto` clips to the box.
7. **Steam settings flashing then loading (0.9.32):** the overview was slow; the last one is shown at once now.
8. **Collections: Cartridge's memory treated as truth (0.9.34 to 0.9.36):** three releases to get right. The lesson: **anything Cartridge remembers about Steam must be checked against Steam's real state before acting on it.**
9. **Controller dead after a game (0.9.24, 0.9.29, 0.9.34):** each fix found a different cause. See 6.9.
10. **Console pictures glitching during emulator updates (0.9.35):** pages pass `PIcon` a new `p` object on every redraw; `watch(cands)` saw a new array each time and reset the fit, and the same picture never loads again to be measured. Watch the joined string. Measured 30/30 samples unfitted before, 0/30 after. **Watch out for `watch()` on computed arrays fed by inline objects.**
11. **About/Its Games/Linked Folders rows with a clipped ring (0.9.37):** the global `[data-focus]` ring applies unless a row class is on the exemption list.
12. **Cemu groups empty (0.9.32 → 0.9.37):** symlinked home and region-only packs (6.5). Test against the real community packs, not hand-made fixtures alone.
13. **BIOS never placed after onboarding (→ 0.9.37):** placement only ran at download time, before the emulators existed.
14. **Azahar mods in the textures folder (→ 0.9.37).**
15. **Add-on site download gave no feedback (→ 0.9.37):** the owner downloaded the same mod four times.
16. **Openverse 401 (0.9.29):** more than 20 per page needs an account.
17. **CI only: emuPaths test failed with EACCES (0.9.24):** a test moved folders to `/mnt/...`, fine as root locally, not on CI. Keep tests inside their temp home.

---

## Part 8. Do-not-break additions (on top of CLAUDE.md and the previous handover)

- `cloudRows` / helper `.modified.json` handling; `pruneStale` only from a list that was really read (never wipe kept names on a failed read).
- `fillCollections({ auto: true })` never creates a collection next to an unreviewed one of yours, and never restarts Steam.
- `verifyCollections` never reports from Cartridge's memory alone.
- `PIcon` watch by joined string.
- `nav.js` `returned`, `returnedAt`, `watchReturn`; `watchGamescopeFocus` `gameApp`/`endedAt` rules.
- `folderLinks`: only links Cartridge recorded are removed; kept-aside folders are never deleted.
- `addons:browse` session `persist:addons`; only .zip/.7z/.rar caught; file deleted after install.
- `biosSetup`: never over a file; firmware only when the emulator lacks it; Cartridge's own BIOS folder isn't "in place".
- Owner-approved writes added in this stretch: Linked Folders (on request), BIOS/firmware placement and installs, console collections (only with the toggle on, or on request).
- Row focus: fill only (styles.css exemption list).
- No "…" in new UI.

---

## Part 9. Open items, unverified work and what to ask the owner

**Ask first:**
1. **Cemu:** which game showed empty groups, and does it look right now (tabs with counts, the other-region line)? If still empty, ask for the `cemu packs` log line.
2. **Controller after a game:** still dead? Ask for the `gamescope focus` and `after the game` log lines.
3. **Collections:** do the Issues list and Its Games look right now with their real Steam (Decky on)?
4. **BIOS:** after the next emulator install, did RPCS3/Vita3K firmware install and did Eden see the keys/firmware?

**Never run on a real device (owner to test):**
- Linked Folders with a real fork (and with Flatpak emulators).
- The add-on site window in Game Mode (does it show in front; Back to Cartridge).
- `steamLive.frontRunning` (Steam UI names guessed).
- BIOS/firmware installs through RPCS3 and Vita3K; Switch firmware zips into Eden's NAND.
- Two-device Syncthing save sync, Make Two-Way, Older Versions.
- GPU Always on the Ally.
- Switch version lines for NSP/XCI/NSZ and NAND updates.
- Picture search (Wallhaven/Openverse), GameBanana sorting, HenrikoMagnifico (all blocked here).
- Download Latest Patches against the real services (owner says the buttons exist).
- Steam collection renames live and through the helper.

**Owner decides (not built):**
- Pause Syncthing while playing; PSN sign-in for PS4 names; optional Syncthing folders (states, BIOS, keys).
- RPCS3 and shadPS4 mods (they change game files).
- `docs/plan-multidrive.md` (games on several drives) is a plan only.

**Not reproduced:**
- The clock speeding up after moving the bar (0.9.28).

**Carried over from the previous handover, still open:**
- The stray `v2.3.1` tag (still in the repo; remind the owner).
- The `-release-g` and `-release-i` branches can be deleted.
- ponytail, graphify, rtk, impeccable, awesome-design-md were never installed (the environment blocked it); ask if still wanted.
- shadPS4 PS4 games that only start after opening shadPS4 once.

---

## Part 10. How I'd work in your place

- Start with the owner's last messages and Part 9's "Ask first".
- Keep a task list per update and re-read every message before shipping. Answer "did you do X" item by item, saying plainly what's partial.
- When a bug comes back, assume the first cause was wrong. Reproduce it (the real app runs here), read the upstream source, measure before and after, and write a test that copies the owner's exact case.
- Never trust Cartridge's own records about Steam, emulators or files over what is really there.
- Test against real upstream data (Cemu's packs, RomM's pictures, Chromium's code), not only fixtures you made.
- Keep `CLAUDE.md` and `docs/SESSION-LOG.md` current after every release; this handover was written from them.
- Plain short sentences, no em dashes, British spelling in feature names, Title Case in menus.

Good luck. The owner is building something they love; they test on real hardware every day, so what you ship gets used within hours.

The Claude on this account, 5 October 2026
