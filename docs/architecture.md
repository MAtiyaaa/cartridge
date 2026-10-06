# How Cartridge is built

A map of the code: the engines Cartridge has grown and the libraries it uses. For the reasons behind odd-looking
code, read `docs/HANDOFF.md` and the two handovers; for day-to-day rules, `CLAUDE.md`.

Cartridge is an Electron app. The main process (`electron/`) does everything that touches the system: files, RomM,
Steam, emulators. The UI (`src/`) is Vue 3 without a router, store library or UI kit. They talk only through
`window.cart.call(channel, arg)` (every handler answers `{ ok, data | error }`) and live events (`broadcast()` in
main, `window.cart.on()` in the UI).

## Engines (our own code)

| Engine | Where | What it does | Docs |
|---|---|---|---|
| CAE, the Cartridge Animation Engine | `src/motion.js` | one frame loop, spring curves for CSS and script, shared-element flights, sliding pills, the governor (idle and in-game quiet) | `docs/cae.md` |
| Glass engine | `src/glassEngine.js` | refraction through generated lens maps, rim light that follows you, step down to frost on slow frames | `docs/glass-engine.md` |
| Game identity | `electron/gameId.js` | which library game a file, save, trophy set or Syncthing folder is: IDs from names and read from the game itself (cached per file version in `game-ids.json`), then the same title, oldest copy on ties | `test/gameId.test.js` |
| Emulator profiles | `electron/emuProfiles.js` | one view per emulator over every table that knows something about it (launch, saves, folders, links, settings, mods, patches, updates, Get Emulators), families for forks | `test/emuProfiles.test.js` pins every emulator's facts |
| CEE (Cartridge Emulator Engine) | `electron/cee.js` | what Cartridge can do with each emulator (install kinds, launch line per kind, consoles, site and download page, update source) and with each console (emulators and cores, or why none) | `test/cee.test.js`: nothing offered that can't launch, every console playable or explained, every emulator linked |
| Start check | `electron/emuStart.js` | runs an emulator that can answer (Vita3K `--version`) once per file version, so a copy that can't start is known before a game is launched, an update falls back to a build that starts, and the reason is said in plain words | used by updates, Get Emulators, Steam candidates |
| Background job scheduler | `electron/scheduler.js` | Cartridge's own periodic work (library sync, Steam collections, BIOS check, picture cache trim) with due checks, retries, one run at a time, and waiting while a game runs | `test/scheduler.test.js` |
| Image pipeline | `electron/main.js` (`sizedImage`, `trimImageCache`), `src/store.js` (`cover`, `img`) | pictures kept at the size they're shown (cards ask for ~360 px, banners for the screen's width), shrunk once and cached, cache capped at 1.5 GB | |
| Performance overlay | `src/components/PerfOverlay.vue`, `perf:sample` | frame rate, slowest frame, CPU and memory on screen (Settings → About) | |
| Focus engine | `src/nav.js` | controller, keyboard, touch and mouse: focus moves, layers and zones, holds, scrolling (springs, momentum, touch drag), rumble, focus that never falls off the page | HANDOFF, CLAUDE.md "Touch" |
| Backgrounds | `src/bgRenderers.js` | Waves and Ribbons, plus Aurora, Contours, Drift and Tide built on the same rules from named Fourier presets (`PRESETS`), pure functions of time | comments in the file |
| Themes | `src/themes.js` | colours, Plain and Glass styles, fonts, card shapes; writes the design tokens | `docs/design.md` |
| Start board | `src/startLayout.js`, `src/views/Start.vue` | the tile grid: packing, settling, arranging, pages | tested in `test/startLayout.test.js` |
| Recommendations | `src/recs.js` | "similar" and "recommended for you", each with a reason | `test/recs.test.js` |
| Steam manager | `electron/steamManager.js`, `steamHelper.js`, `steamLive.js`, `steamCollections.js`, `steamArt.js` | shortcuts, artwork, collections, live changes through Steam's own client, the helper when Steam must be closed | `docs/steam-tests.md`, `test/steam.test.js` |
| Emulator detection | `electron/detect.js`, `emulators.js`, `detectWorker.js` | finds emulators in any install kind (EmuDeck, Flatpak, AppImage, packages, Steam), reads AppImages from inside, checks what Linux an AppImage needs (glibc) | `test/detect.test.js` |
| Emulator updates and installs | `electron/emuUpdates.js`, `emuGet.js`, `customEmu.js`, `github.js` | updates in place, keeping the install kind; falls back to the last build this Linux can run | `test/emuUpdates.test.js` |
| Disc and game readers | `electron/discImage.js`, `switchNca.js`, `patches.js` | ISO, CHD, CSO, GCZ and others; Switch NSP/NCA with keys; game IDs and serials | `test/*.test.js` |
| Trophies | `electron/trophies.js`, `trophyService.js` | reads emulator trophies (read only), syncs them between devices through private RomM notes | `test/trophySync.test.js` |
| Add-ons and patches | `electron/addons*.js`, `cheats.js`, `cemuPacks.js`, `patches.js`, `gameSettings.js` | mods, texture packs, cheats and patches per emulator, per-game settings | tests per file |
| Saves and Syncthing | `electron/saves.js`, `syncthing.js`, `folderLinks.js` | finds saves (read only), sets up save sync through Syncthing, links fork folders on request | tests per file |
| Downloads | `electron/dlWorker.js`, `main.js` | one worker per download, resume, checksums, speed limit | |
| UI audits | `tools/ui-audit/` | focus and contrast checks in every look, the clipping check (text cut by its box, every page and widget), the Plain/Glass separation check (in `npm test`), and screenshots compared with the last release (not shipped) | `tools/ui-audit/README.md` |

## Libraries

Shipped: Vue 3, `@mdi/js` icons, `@fontsource-variable/*` and Roboto fonts (SIL OFL), `qrcode` (pairing),
`pdfjs-dist` (manuals, bundled and loaded on demand), `js-yaml` (emulator configs), `yauzl` (zip),
`socket.io-client` (RomM's live scan progress), electron-updater. Compression formats Node lacks (zstd, LZMA) are
decoded by our own code or Node's built-ins. No animation, UI or state library.

Building and checking: Vite with `@vitejs/plugin-vue`, Electron, electron-builder; Playwright for the UI audits and
app checks (installed separately, not a dependency).

## Where data lives

Everything Cartridge keeps is in `~/.config/Cartridge/` (list in HANDOFF E4). Cartridge never touches saves unless
asked (Linked Folders), never modifies emulator files beyond the settings and patches it is asked to change, and
never downloads or starts an emulator on its own.
