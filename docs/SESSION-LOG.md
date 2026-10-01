# Session log

A running record for whichever Claude session works on Cartridge next, on any account. Newest entry first. Each entry says what was done, what the owner decided in chat (with reasons), what is half done, what the owner must test on a device, and what's next. Read the newest entry first, then `CLAUDE.md`, then the plan for the version being built.

The branch for 0.9.3 work is `claude/relaxed-fermat-30pigp`. Pull it before starting (`git pull`): another account may have pushed to it.

---

## 2 Oct 2026 · Morning summary of the night run (read this first)

**Released overnight**, each after npm test, vite build, screenshots and a green branch test build (PRs #22 to #28):
- **0.9.3 D** Vita games through Vita3K; PS3 `.rap` licences found in the download or RomM, no install without; package games wait for the install before Steam; shorter grouped More menu.
- **0.9.3 E** PS3 patches (RPCS3's own list, saved in RPCS3's patch settings).
- **0.9.3 F** PS4 patches (shadPS4's own patch files).
- **0.9.3 G** Refresh Library, title case, plain Trophies tab, Hide and Hidden Games, RetroAchievements filter and sort.
- **0.9.3 H** One RomM tab in Settings, Report a problem, full device names, shadPS4 trophy key guide.
- **0.9.3 I** Score and age rating badges, logos on the idle screen.
- **0.9.3 J** RomM data read defensively (contract test), per-game emulator test, CLAUDE.md 0.9.3 summary.

**Needs the owner**
- Pick options for the Discuss items: `docs/options-0.9.3.md` (E2, F1, F6, G4, H1, I1).
- shadPS4 first-launch: the direct core test or the `shad_log.txt` tail (see the evening entry).
- Device tests: Install in RPCS3 with a `.rap` from RomM, Get licence on Tokyo Jungle, Vita installs, Patches on a PS3 and a PS4 game, Report a problem QR, Refresh Library.
- The stray release branches `claude/relaxed-fermat-30pigp-release-g` and `-release-i` can be deleted (each holds an exact tested commit that was merged).

**Not done** (reasons in the entries below): PCSX2 patches, E1, E6, F2, F3, F5, K1, K2, J6, J11, HANDOFF.md rewrite, H2's start-up RomM version check.

---

## 2 Oct 2026 (night run) · 0.9.3 J (plan H2, J13, CLAUDE.md)

- **H2** `electron/romm.js`: `slimRom`, `userOf`, `logoPath`, `hltbHours` moved out of main.js and hardened (`arr`/`str`/`obj` guards). `test/romm.test.js`: a RomM 4 game, an old server's bare game, null and odd values. Not done from H2: a RomM version check at start that turns features off cleanly.
- **J13** `test/detect.test.js`: emulator for one game beats the console pick and falls back when gone (`_templateFor`, `_templateForGame` exported for tests).
- **CLAUDE.md**: a 0.9.3 section summarising everything shipped in parts A to I.
- 43 tests pass. K1 (Xenia Windows build through Wine, BigPEmu) not done: BigPEmu is closed source, so its launch options can't be confirmed from source (the rule for new emulators).

---

## 2 Oct 2026 (night run) · 0.9.3 H released, 0.9.3 I (plan F8, F4) and the Discuss options

- **H** merged (PR #26).
- **Options for every Discuss item** (E2 trophies overhaul, F1 console backgrounds, F6 connection pills, G4 clutter, H1 recommendations, I1 Syncthing) are in `docs/options-0.9.3.md`, with a recommendation each. Nothing built for them: the owner picks first.
- **F8** Game.vue info box: `score` (igdb_metadata.aggregated_rating, else metadatum.average_rating, shown on 100, coloured) and `age` (igdb_metadata.age_ratings[].rating_cover_url image, else a text badge, PEGI white or ESRB black); the text "Rating" row hides when the badge shows. Field names are read defensively: verify against a real RomM response.
- **F4** IdleScreen.vue: `GameLogo` and `ConsoleMark` in the caption (text when there is no logo).
- Checked: `npm test` 39 pass, `vite build`, screenshots (info box badges at 1920x1080, idle screen at both sizes).
- Not started tonight (need research or the owner): PCSX2 patches, E1, E6 (decrypting trophy00.trp), F2, F3, F5 (company logos need artwork), H2, K1, K2, J6, J11, J13, J14.

---

## 2 Oct 2026 (night run) · 0.9.3 G released, 0.9.3 H (plan G1, K3, F7, E7)

- **G** merged (PR #25) from `claude/relaxed-fermat-30pigp-release-g`, a branch holding exactly the commit G's test build passed on (newer local commits were not in that build). That branch can be deleted.
- **G1** Settings: Connection, Library & Sync and RomM are one `romm` section (`OLD_SEC` maps old `conn`/`sync`/`folders` values).
- **K3** `src/components/ReportProblem.vue` in About: `setup:report` (already scrubbed), Copy, GitHub new-issue link with the report (cut at 6000 chars), QR code (first 1200 chars).
- **F7** GameCard: `extra` (device name, play time) on its own wrapping line (`.card .sub.extra`).
- **E7** TrophyPanel: `shadNoKey` from the sources' `note === 'nokey'`, a short guide.
- Checked: `npm test` 39 pass, `vite build`, screenshots (RomM tab, Report a problem with QR, Recently played) at 1280x800 and 1920x1080.

---

## 2 Oct 2026 (night run) · 0.9.3 F released, 0.9.3 G (plan G2, G3, E3, E4, E5)

- **F** merged (PR #24) after a green test build; E's release passed.
- **PCSX2 patches: not built yet.** PCSX2's CRC is a 32-bit XOR of the game's ELF (`Elfheader.cpp` GetCRC), but most PS2 games are CHD, and PCSX2's own patch database lives in `patches.zip` inside its install (AppImage). Needs: reading the ELF from CHD/ISO (or PCSX2's game list cache), and reading `patches.zip`; switching on is per game in `gamesettings/<SERIAL>_<CRC>.ini` `[Patches] Enable = <name>`. Researched, not started.
- **G3** Quick Menu: one Refresh Library (`library:refresh` in main.js: scan when allowed, then sync; `refreshLibrary` in store.js).
- **G2** title case: Quick Menu items, Settings headings Top Bar, Undo & Clean Up, Storage Manager, Check Downloaded Games.
- **E3** Achievements tab switch: plain "Trophies & Gamerscore", marks both 20 px; the duplicated CSS in Achievements.vue (a known cleanup) removed.
- **E4** "Hide"/"Unhide" on a trophy game; Settings → Achievements → Hidden Games (`loadHidden`, names from `trophies:overview`).
- **E5** RetroAchievements tab: console filter and sort for Recently played (`played` computed in RaPanel.vue).
- Checked: `npm test` 39 pass, `vite build`, screenshots of the Achievements tab and Settings → Achievements at 1280x800 and 1920x1080.

---

## 2 Oct 2026 (night run) · 0.9.3 E released, 0.9.3 F (PS4 patches)

- **E** merged (PR #23) after a green test build; D's release passed.
- **F: shadPS4 patches** (read from the Qt launcher's `common/memory_patcher.cpp` and `qt_gui/cheats_patches.cpp`): `shadDirs` (`$XDG_DATA_HOME/shadPS4` or `~/.local/share/shadPS4`, with `patches/`), `ps4Version` (APP_VER from `<game>-UPDATE`, `<game>-patch`, else the game's `sce_sys/param.sfo`), `shadList` (each repository's `files.json` maps XML files to serials; `<Metadata>` with AppVer equal to the game's, or `mask` = any version), `shadSet` (only the `isEnabled` attribute of the matching tags changes, the rest of the file stays byte for byte; one-time `.cartridge-backup` next to it). main.js: `ps4PatchState`, `EMU_PATCH` table (rpcs3, shadps4) behind `patches:list`/`patches:apply`; `patchMine` keeps one record per emulator. Game page: Patches for PS3 and PS4 games.
- Tests: shadPS4 list by version and mask, only isEnabled changes, never turns off the user's. 39 pass.
- **PCSX2 next**: its patches are `.pnach` files named by the game's CRC (computed by PCSX2 from the game's ELF), switched on per game in `gamesettings/<SERIAL>_<CRC>.ini` `[Patches] Enable = <name>`. Needs reading the ISO's SYSTEM.CNF and ELF to get the CRC: read PCSX2's source for exactly how before building.

---

## 2 Oct 2026 (night run) · 0.9.3 D released, 0.9.3 E (PS3 patches)

- **0.9.3 D** merged (PR #22) at the start of the night run; its test build had passed.
- **E: RPCS3 patches** (`electron/patches.js`, read from RPCS3's `Utilities/bin_patch.cpp`): `rpcs3Dirs` (`~/.config/rpcs3` or the Flatpak's; `patches/` holds patch.yml, imported_patch.yml, `<serial>_patch.yml`; switches in `config/patch_config.yml`, older RPCS3 next to `patches/`), `parseSfo`, `ps3Version` (APP_VER, an installed update in dev_hdd0 wins), `rpcs3List(dir, serial, version, mine)` (matches Games > title > serial > [versions or All]), `rpcs3Set` (hash > description > title > serial > version > `Enabled: true`; turning off only what is in Cartridge's record; prunes empty maps; backup `patch_config.yml.cartridge-backup` once). YAML is read and written with js-yaml's FAILSAFE schema so `01.00` stays text (now a direct dependency). Record of what Cartridge turned on: `patches.json` (`patchMine.rpcs3`).
- `main.js`: `patchState`, `ps3Serial`, handlers `patches:list`, `patches:apply`. UI: `src/components/PatchesSheet.vue` (modal `patches`: ticks, Apply, "On in RPCS3" rows can't be turned off), game page More → Steam and emulator → Patches (PS3 games on this device).
- Tests: `test/patches.test.js` (SFO, version from an update, list by version, on/off keeps the user's entries, never turns off the user's). 37 pass.
- Next: shadPS4 and PCSX2 patches (F), each from its own source.

---

## 1 Oct 2026 (evening) · Decisions before the night run

- **PS4 .pkg (D4): dropped** by the owner. Don't build it.
- **shadPS4**: `-i` (no IPC) before `-d` did NOT help: still a black screen for a while, then it closes. So the IPC handshake is not the cause. Next step, asked of the owner: start the shadPS4 core directly (the version the Qt launcher selected, `versionSelected` in the launcher's settings under `~/.local/share/shadPS4QtLauncher`) with `-g "<eboot.bin>" -f true`, and send the tail of `~/.local/share/shadPS4/log/shad_log.txt` after a failed launch. Don't change PS4 shortcuts in code until there is a log or that test result.
- **Night run**: the owner is in Dubai (UTC+4) and runs out of credits until 1:30 a.m. there (21:30 UTC). A scheduled wake at 21:31 UTC continues the work unattended: first make sure 0.9.3 D (commit after 02f8039) is merged and released, then build patches (D7: RPCS3 first, then shadPS4, PCSX2), releasing each finished, tested part as the next letter (0.9.3 E, F...) by the usual rule (test build green, then PR and merge). Log every part here.

---

## 1 Oct 2026 · 0.9.3 D, with fixes from the owner's first PS3 package test

**Owner reported** (photo): an installed PS3 package game (NPUA80523) failed to boot from Steam with "Failed to decrypt content", and the game didn't appear on the PS3 console page in Steam settings (had to add it from the game page). Asked that D (Vita) be checked for the same before release; D's automatic merge was cancelled until then.

**Cause and fix**
- Licence: PSN packages (PKG metadata DRM type 1 or 2) need `<content ID>.rap` in RPCS3's `dev_hdd0/home/<user>/exdata`. RPCS3 copies a .rap under the file's own name, so a missing or differently named .rap means "Failed to decrypt content". `pkgInfo` reads the DRM type; `licencePlan` picks the licence (download under its right name, the only loose .rap renamed, one you picked, or already in RPCS3); `stageLicences` copies renamed ones into a temp folder under the right name before RPCS3 installs them. The install record keeps `needs` (content IDs). `installedLicences` (main.js) says what an installed game still lacks (`npdOf` reads the content ID from EBOOT.BIN's NPD header for games installed before this). UI: asks for the .rap before installing (or install without), "Add licence (.rap)" button and More item (`pkg:addLicence`, 16-byte .rap only).
- Steam: `gameRef` returns `missing` for a PS3 game with packages that isn't installed yet, so the console page shows it blocked with the reason and plans skip it; the automatic add at download is held back for these (`it.notice === 'pkg'`); `afterInstall` updates the game's own shortcut (`refreshGame(romId, { force: true })`) or adds it when Add automatically is on. Not 100% sure this was the owner's console page case: re-check on device.
- Vita (same check for D): Vita games were already blocked until installed; added `vitaLicenced` (work.bin in the game or a .rif in ux0/license) and a clear message when an install has no licence.
- Tests: licence plan cases, NPD header, Steam waits for install, Vita licence. 32 pass.

**Then the owner asked** (photo of the long More menu): group More into sub menus; and .rap files live in RomM: never ask, find the .rap and install it with the .pkg, refuse with "RAP file not found" when it isn't anywhere, and say before installing that a .rap is needed. Done: `rapsFromRomm` (the game's own RomM files, then RomM entries named after the content ID or title ID; downloaded to a temp folder), `installPkg` throws "RAP file not found" when still missing, `pkg:addLicence` finds it the same way (no picker), button "Get licence (.rap)". More is now 7 items: favourites, play status, collection, timeline, Steam and emulator (list), Details and artwork (list), hide; B in a list returns to the first one (loop around `choose`).

**shadPS4**: owner described the failure: black screen about 30 s, then it closes; works once after launching from shadPS4's own window. The core waits for the launcher's START over IPC with no time limit (`ipc.cpp` WaitForStart), so the leading theory is the headless launcher not sending it. Asked the owner to try `-i` (launcher's no-IPC switch) before `-d` in Steam launch options. Not changed in code yet.

**PS4 .pkg (D4)**: recommended leaving it out (needs fake-PKG keys in a public MIT repo); waiting on the owner.

---

## 1 Oct 2026 · 0.9.3 D (Vita games through Vita3K)

**Owner said**: shadPS4 PS4 games still don't start the first time (after 0.9.3). Asked them for: whether they pressed Update on the PS4 console page, what a failed launch looks like, and `ls` of `~/Documents/Apps`, `~/.local/share/shadPS4`, `~/.local/share/shadPS4QtLauncher` plus the tail of `shad_log.txt`. Read the Qt launcher again (`src/main.cpp`, `qt_gui/main_window.cpp`, `ipc/ipc_client.cpp`): `-d` reads `vm_versionSelected` from the launcher's settings in its launcher dir (`<cwd>/launcher` if present, else `~/.local/share/shadPS4QtLauncher`); the core is started with the launcher's working folder and IPC (`SHADPS4_ENABLE_IPC`, `#IPC_END` then `RUN`/`START`); a RESTART request restarts it from the core's own folder. No cause proven yet: waiting on the owner's answers. Note: if the `user` folder next to the AppImage is the only shadPS4 data, `startOf` leaves Start in unchanged.

**Built**
- `pkgInstall.js`: `vitaPrefs` (config.yml pref-path, defaults, EmuDeck storage), `vitaContent` (Vita .pkg by header platform 2, else .vpk/.zip title ID from `sce_sys/param.sfo` via yauzl; zRIF from a small text file, `KO5i...`), `installVita` (Vita3K main.cpp: `--pkg <f> --zrif <k>` installs headless and quits; a .vpk/.zip installs then opens and boots, so Cartridge waits for it to close). `safeToRemove` is now per emulator (`RULES`: RPCS3 dev_hdd0/game + PARAM.SFO, Vita3K ux0/app + sce_sys/param.sfo). Vita3K's `--deleted-id` is never used (it deletes savedata).
- `main.js`: `installPkg` hands Vita games to `installVitaGame`; `pkg:check` is async and says `emu`, `emuName`, `needsZrif`, `opens`; `emuRoots(emu)`; delete and `pkg:dropDownload` work for both emulators. `steamManager`: `emuCommand(key, re)`, `vita3kCommand`, recorded Vita games start by title ID.
- UI: Game page says Install in Vita3K, asks for a zRIF when none came with the game, "Close Vita3K to finish" while it is open.
- Tests: Vita title ID from a .vpk (a small stored zip built in the test), zRIF from a text file, install through a stand-in Vita3K, delete refusals including savedata. 28 pass.

**Release**: version 0.9.6, "0.9.3 D".

**Owner to test**: a Vita .vpk and a .pkg (with and without a zRIF text file), Install in Vita3K in Game Mode, play from Steam, delete both ways.

**Next**: shadPS4 once the owner answers; D4 PS4 .pkg; D7 patches.

---

## 1 Oct 2026 · 0.9.3 C (PS3 packages through RPCS3)

**Owner's decisions in chat**: skip Redream, Mednafen and torzu. 0.9.3 B was released before this.

**Built**
- `electron/pkgInstall.js`: `pkgInfo` reads the PKG header the way RPCS3 does (Crypto/unpkg.h: magic, platform, metadata content type and patch flag, content ID; the install folder is content ID chars 7 to 15). `packagesIn` orders licences, game, DLC, then updates by name. `rpcs3Hdds` finds dev_hdd0 like trophies.js (vfs.yml, config folder, EmuDeck storage). `install` runs `<rpcs3> --headless --installpkg <file>` per file (rpcs3.cpp: headless installs with no window and always exits 0) with Cartridge's AppImage variables removed, then reads back which game folder appeared. `safeToRemove` holds every D3 check.
- `main.js`: `installs.json` (`installs`, `installRecord` for steamManager), `installPkg`, handlers `pkg:check`, `pkg:install`, `pkg:cancel`, `pkg:dropDownload` (deletes the download, the manifest then points into RPCS3 with `installedIn: 'rpcs3'`), `roms:delete` takes `alsoEmu` and routes RPCS3 copies through `safeToRemove`, Library check skips games living in RPCS3. Finished downloads holding PS3 packages get `notice: 'pkg'`.
- `steamManager.js`: `rpcs3Command()` (the PS3 setup's RPCS3 and what goes before its options), `gameRef` starts recorded games with `%RPCS3_GAMEID%:<serial>`.
- UI: Game page Install in RPCS3 (progress, cancel), offer to delete the package, More "Install again in RPCS3", Delete asks download only or download and RPCS3 copy. Downloads and the finish toast point to it.
- Tests: `test/pkg.test.js` (header, order, install through a stand-in RPCS3, vfs.yml, every delete refusal), serial launch in `test/steam.test.js`. 25 pass.

**Release**: version 0.9.5, "0.9.3 C".

**Owner to test**: a PS3 game from RomM as .pkg (with a .rap if it needs one, and an update if you have one): Install in RPCS3 in Game Mode, then play it from Steam; delete the package when offered; Delete from the game page afterwards.

**Next**: D2 Vita through Vita3K, D4 PS4 .pkg, D7 patches.

---

## 1 Oct 2026 · 0.9.3 B (more emulators)

**Built** (`emulators.js`, each launch line read from the emulator's own argument parser, cloned into the scratchpad, not the repo):
- DeSmuME `desmume "<game>"` (commandline.cpp: one positional; fullscreen is a setting), Flatpak `org.desmume.DeSmuME`.
- Mupen64Plus `mupen64plus --fullscreen "<game>"` (ui-console main.c: game is the last argument).
- Snes9x `snes9x-gtk "<game>"` (gtk_s9x.cpp), Flatpak `com.snes9x.Snes9x`.
- Mesen 2 `Mesen --fullscreen "<game>"` (CommandLineHelper.cs), AppImage `Mesen.AppImage`, every system it emulates.
- Play! `--fullscreen --disc "<game>"` (ui_qt/main.cpp), Flatpak `org.purei.Play`, AppImage `Play!-<hash>-x86_64.AppImage`.
- Kronos `kronos -a -f -i "<game>"` (port/qt/Arguments.cpp).
- PrimeHack: Dolphin's `-b -e` (its CommandLineParse.cpp is Dolphin's), `vblank_mode=0`; EmuDeck's `primehack.sh` wraps Flatpak `io.github.shiiion.primehack`. New `forkOf` in `EMU`: such an emulator goes to the forks list (never the default).
- Xenia Edge (has207/xenia-edge, the native build EmuDeck installs as `~/Applications/Xenia.AppImage` behind `xenia-emu.sh`): `--fullscreen=true "<game>"` (xenia_main.cc positional `target`, cvar `fullscreen`). The old `xenia` entry (Canary under Proton, `xenia.sh`, `Z:` path) is unchanged.
- **Not added** (rule: launch options confirmed from source or not at all): Redream (closed source; SRM's `-b -e` preset looks copied from Dolphin), Mednafen (mednafen.github.io blocked here), torzu (its hosts blocked here). Try again from a session that can reach them.
- Test: one launch line per emulator in `test/detect.test.js` (19 pass).

**Release**: version 0.9.4, `versionName` "0.9.3 B", release "Cartridge 0.9.3 B".

**Owner to test**: any of these you have installed shows in Settings → Emulators for its console, and a game added to Steam with it starts.

**Next**: 0.9.3 C, section D (installing PS3/Vita/PS4 packages, RPCS3 updates) and D7 patches.

---

## 1 Oct 2026 · Release naming for the rest of 0.9.3

**Owner's decision in chat**: release each finished part of 0.9.3 straight to `main`, named "0.9.3 B", "0.9.3 C"... until the 0.9.3 plan is done, so their copy updates each time.

**Done**: updates only install a higher number, so the number keeps going up (0.9.3 B is version 0.9.4, C is 0.9.5...) and the name is separate: `versionName` in `package.json` is what Settings → About, the Quick Menu and update messages show (`versionName()`/`nameOf()` in `main.js`; an update's name comes from its release title "Cartridge 0.9.3 B"). RomM, RetroAchievements and the log still get the number. Test builds set `versionName` to their test version. Rule written into `CLAUDE.md` → Releases. The 0.9.4 plan keeps its name; its number will be whatever comes next.

**D7 patches**: owner chose option 1: patches come into 0.9.3, and Cartridge may turn on the patches it installed in each emulator's own patch settings (nothing else). Plan D7 and the 0.9.4 plan updated.

**Owner asked about**: Cartridge staying running in SteamOS after closing. That is A14, fixed in 0.9.3 (see the stage 1 entry); needs checking on the Ally.

---

## 1 Oct 2026 · 0.9.3 released (sections A, B4, B5, C)

**Owner's decision in chat**: release now as 0.9.3 on `main` (overrides "nothing to main until tested"); problems get fixed by whichever account picks them up. Each later section should update 0.9.3 again.

**Done**: version 0.9.3, release name "Cartridge 0.9.3", notes "Cartridge 0.9.3 · Emulators" in `RELEASE_NOTES.md` and `CHANGELOG.md`. Test build 3 of the same code passed tests and the launch check before merging.

**Open question for the owner**: installed copies only update when the version number goes up (electron-updater compares versions, and electron-builder won't re-upload to a published release), so "update 0.9.3 again" can't reach people who already have 0.9.3. Each later section needs its own number (0.9.4, 0.9.5…, with the 0.9.4 plan renamed), or the release could be replaced for new downloads only. Ask before the next section ships.

---

## 1 Oct 2026 · 0.9.3 stage 2 (section C)

**Owner's decisions in chat**: "start building the next best thing", so section C after stage 1. Nothing goes to `main` or releases until the owner has tried a test build.

**Built**
- **C3 + A8 forks.** "Which One?" on an AppImage Cartridge couldn't name (Settings → Emulators → Emulator setup) is now three steps: Not an Emulator, It's a Fork (pick which emulator, then its name, the file name by default), It's an Emulator (the full list A to Z). B on a later step goes back a step. A console's menu also has "One of these is a fork…" for a copy that was found as the emulator itself. Saved in `config.steam.forks[path] = { of, name }` (`markFork`, `setup:fork`). Known forks are recognised by name: `FORKS` in `emulators.js` (shadPS4 GR2, BB Launcher, PrimeHack, Slippi). A fork starts with its emulator's launch options, is listed by its own name last ("BB Launcher · fork of shadPS4"), and is never the default.
- **C4 + C5 order.** A console's default is the first non-fork candidate: EmuDeck, then RetroDECK (only when there's no EmuDeck), then AppImage, Flatpak, installed program. The way your own Steam shortcuts start games is a second choice, used by default only when nothing else is found (`templateFor`).
- **RetroDECK** (read from its `run_game.sh`): `flatpak run net.retrodeck.retrodeck -s <console> "<game>"`, RetroDECK picks its own emulator for that console. Not offered for consoles whose games are folders (RetroDECK reads a folder as `Game/Game`). Labelled "RetroDECK" everywhere.
- **C6.** Steam ROM Manager setups are no longer a choice; the emulators they point at are still found, and they still count in the setup report.
- **C7 Take over.** Console page (Settings → Steam → a console) More: "Take over your own shortcuts (N)" for games in Steam that Cartridge didn't add. With the live connection they're changed in place (same appid, play time and collections kept) and registered as Cartridge's (`takenOver: true`); otherwise removed and added again. Asks first; existing shortcuts are still kept exactly until you pick it.
- **C2.** Emulator setup lists consoles that need something first and Ready ones (with a check mark) at the bottom.
- **C8** Steam settings text now describes the order above, about the user's own system. **C9** "Cartridge itself" is "Cartridge".
- **C10 real names.** What is installed is shown by its own name: a Citra or Lime3DS install isn't called Azahar, Sudachi/suyu/torzu aren't yuzu, Ryubing isn't Ryujinx (`REAL_NAMES`, `realName`).

**Checked here**: `npm test` (18 pass: new tests for forks, real names, RetroDECK and SRM), `vite build`, screenshots with fake data at 1280x800 and 1920x1080 (Emulator setup, Which One?, B going back a step).

**Owner to test on a device**
- Name an unknown AppImage as a fork (for example BB Launcher as shadPS4): it shows as "BB Launcher · fork of shadPS4" in the PS4 list, and PS4 games still default to shadPS4.
- Take over on a console with games you added yourself, with and without the live connection; check play time stays (live) and the games start.
- If you have RetroDECK (without EmuDeck): pick RetroDECK for a console and start a game from Steam.

**Not done yet / next**
- C10's new emulators (DeSmuME, Redream, Mednafen, mupen64plus, Snes9x, Mesen, Play!, Kronos, torzu standalone entry, PrimeHack and Slippi as full entries, Xenia Edge): each needs its launch options read from its own source first, with a launch-line test.
- Then D, E, F (Discuss items: options shown first), G, H, K, J.

---

## 1 Oct 2026 · 0.9.3 stage 1 (section A, B4, B5, test builds)

**Owner's decisions in chat**
- Start building 0.9.3; Claude decides the design details, using the design references the owner picked. Nothing goes to `main` or releases until the owner has tried it.
- Plugins: install ponytail, graphify, rtk, taste-skill, impeccable, img2threejs and the awesome-design-md references; not caveman. All were cloned and read (nothing harmful; rtk's checksum matched), but writing them into `.claude/` was blocked by the environment's safety check (it treats `.claude/` as Claude's own settings). Waiting for the owner to allow edits to `.claude/` in the permissions, or to add them from their own computer. One change planned for rtk: its hook auto-approves the commands it rewrites; ours would only rewrite.

**Built**
- **A10 update (owner's photos of shadPS4's own shortcuts, 1 Oct).** Target and Launch options (`-d -g "<game>/eboot.bin"`) match what Cartridge writes; only Start in differs. shadPS4's own shortcuts get Start in `/tmp/.mount_<random>/usr/bin` because the launcher saves the folder it is running from (`QCoreApplication::applicationFilePath()` in `create_steam_shortcut.cpp`), which for an AppImage is its temporary mount; that folder is gone once the launcher closes. So the rule is now unconditional: shadPS4 never starts next to its AppImage, unless a `user` folder there is the only shadPS4 data.
- **A10 shadPS4 (the main one).** Read in the source: shadPS4 (`common/path_util.cpp`) and its Qt launcher use a folder named `user` in the folder they start in, else `~/.local/share/shadPS4`; the launcher starts the emulator in its own working folder (`QDir::currentPath()`), and its own Steam shortcuts start inside the AppImage's mount, where there is never a `user` folder. Cartridge started it next to the AppImage, so a stray `user` folder there gave a different set of settings, keys, chosen version and patches. Now `startOf()` in `steamManager.js` picks a Start in with no `user` folder (the launcher's data folder, shadPS4's, or home), unless that portable folder is the only shadPS4 data. The start folder is part of shadPS4 shortcuts' signature, so existing ones show **Update** on their console page. Tests: `test/steam.test.js`.
- **A14 lag and quitting.** The window can slow down in the background again (`backgroundThrottling` back to Chromium's default); the controller is read every 8 ms only while Cartridge is in front (250 ms otherwise); the animated background stops drawing when Cartridge isn't in front. Quit (and SIGTERM/SIGINT/SIGHUP, which Steam's Exit game sends) stops trophy polling, downloads, uploads and the library check, then exits within 3 s whatever is pending.
- **A5 + C1.** New Settings → **Emulators** (replaces Console Folders in the list): an Issues list (`issues:list` in `main.js`: games missing from Steam collections, shortcuts that would fail, setups pointing at a missing emulator, missing BIOS), Emulator setup and Shortcut health (moved here from Settings → Steam), then Console Folders. No more pop-ups at start; a yellow dot on the Settings tab when something is waiting.
- **A7.** Shortcuts removed live are hidden until Steam saves its file (`steam-live-removed.json`, `shortcutsOf()`), so a game no longer shows "Remove from Steam" again. With live changes on, adding or removing doesn't ask "Apply now or later".
- **A4/A13.** Settings focuses the current section's list item (not the first), the old page leaves at once, and when a focused button disappears the D-pad stays in the part of the screen it was in (`lastZone` in `nav.js`).
- **A3.** Up and down stay inside a scrolling list while it has more that way (`nav.js`), so the toolbar above the Library grid isn't reached early.
- **A1** current top tab is a full white box. **A9** consoles and emulator lists A to Z (the one from your shortcuts first; which emulator is used by default is unchanged). **A11** High contrast and Soft text are clearly different. **A12** game page buttons on one row (icon only under 1100 px wide).
- **A6.** Shortcuts or setups pointing inside `/tmp/.mount_...` are never learned from and show in Shortcut health and Issues.
- **B4.** Deleting a game deletes file by file (`removeWithProgress`, links never followed) and shows a progress ring on its card and the Delete button (`Ring.vue`).
- **B5.** Home rows show 15; a **Show all** card opens the whole row in the Library view in the row's own order ("As on Home"); collections, genres and consoles rows open their tabs.
- **Test builds.** `.github/workflows/test-build.yml`: every push to `claude/...` builds the AppImage as version `<next>-test.<run>` (for example 0.9.3-test.4), runs the tests and the launch check, and attaches it to the run. Nothing is published; `release.yml` is untouched.

**Checked here**: `npm test` (15 pass), `vite build`, syntax of every back-end file, and screenshots with fake data at 1280x800 and 1920x1080 (Home with Show all, the Show all page, Settings → Emulators). Not checked here: anything needing a device, Steam, or a controller.

**Owner to test on a device** (with the test AppImage)
- A10: re-add or Update a PS4 game, start it from Steam several times in a row in Game Mode. Also tell Claude whether `~/Documents/Apps/user` (a folder named `user` next to the shadPS4 AppImage) exists: that is the cause this fix assumes.
- A14: on the Ally, CPU while a game runs with Cartridge open, and `ps -ef | grep -i cartridge` a few seconds after Quit and after Steam's Exit game.
- A2: does the first LT/RT press work right after launch?
- The rest: tabs, Settings focus, Library scrolling up, Remove from Steam, deleting a big game, Home rows at 1280x800 and on the TV.

**Not done yet / next**
- A2 needs a device first. A8 comes with C3 (forks).
- Next stage: the rest of C (forks, standard emulator per console, launch option order, more emulators), then D, E, F (Discuss items: options shown first), G, H, K, J.

---

## 1 Oct 2026 · Second account, first session

**Context.** The owner is working from a second Claude account for about a week, then going back to the first. Nothing carries between accounts except the repo, so this log is the handover. Every update made here gets an entry. Before switching back, a "Start here" summary goes at the top.

**What was done**
- Read the whole project: back end, every view and component, tests, CI, HANDOFF, all plans, design system, recent changelog.
- Added the owner's new 0.9.3 items to `docs/plan-0.9.3.md`: A10 (shadPS4 shortcuts, with the owner's finding and the leads below), A14 (lag on the ROG Ally), B4 (delete animation), B5 (Home rows stop at 15 with a Show all card), D6 (RPCS3 game updates), D7 (patches that stick, Discuss).
- Fixed the `CLAUDE.md` line that pointed at the old 0.9.2 notes.

**Decided in chat**
- The 0.9.3 plan on this branch is the right one (`main` still has the old 11-line version; the branch is not merged).
- Work continues on this branch. Building 0.9.3 has not started; the owner says when.

**Found while reading (not fixed yet, to confirm when building)**
- A4/A13 (Settings jumps to Connection, quick right press loses focus): the left list switches the page on focus (`@focus="sec = s.id"` in `Settings.vue`). When the focused button disappears (Fetch all logos becomes Stop) or you come back from a sub-screen, focus falls to the first list item, which is Connection. The page's fade (`mode="out-in"`) likely explains the lost focus on a quick right press.
- A5: the start-up pop-ups are `steamReport()` (`steam.js`) and `checkMoved()` (`App.vue`).
- A7: Remove from Steam asks "Apply now", then the preview asks again.
- A11: the three Text options differ by a few shades only (`TEXTS` in `themes.js`).
- A12: `.g-actions` wraps.
- A14: `backgroundThrottling: false` on the window, and the 8 ms controller poll never stops.
- A10: Cartridge deliberately replaces a `/tmp/.mount_` Start in with the AppImage's folder; shadPS4 may choose its user folder from the working folder. Check the source.
- Not in the plan: the game page's Re-download still deletes first, then downloads (only Library check keeps the old copy until the new one passes).
- HANDOFF's "the Steam manager never ran against a real Steam" is out of date (0.7.12 came from real use). HANDOFF update is J14.

**Waiting on the owner**
- D7: patches in 0.9.3 or 0.9.4, and whether Cartridge may turn on patches it installed.
- The plugins the owner asked to install (ponytail, caveman, graphify, rtk, taste-skill, impeccable, img2threejs, and awesome-design-md issue 90) were not installed: the environment's safety check blocked cloning third-party code into the repo. Needs the owner's go-ahead in the permission settings, or a different way.
- The stray `v2.3.1` tag: ask again when 0.9.3 is being built.

**Next**
- The owner says when to start building 0.9.3, starting with section A.
