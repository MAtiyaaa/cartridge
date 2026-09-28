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
- Work on the session's branch, never directly on `main`. The owner reviews and merges.
- **Never change `version` in `package.json` unless the owner asks for a release.** A version change on `main` builds and publishes a release to every user automatically.
- Check every change builds: `npm ci --ignore-scripts && npx vite build` (the cloud container can't download Electron, so the full `npm run dist` may not work here).
- There are no automated tests in the repo. Say plainly what was checked and what the owner must test on a device (controller, Game Mode, Steam, TV size).
- Keep changes minimal and match the surrounding code: dense, short comments that explain why.
- Before committing, grep the diff for private info (usernames, IPs, domains, emails, local paths). The repo is public.

## The owner's rules
- Never use em dashes anywhere: UI text, notes, commits, messages. Use commas, colons, full stops, or "·" in titles.
- Plain, direct, not AI-sounding writing. British spelling in feature names ("Colour", "Customisation").
- **No UI overhauls or visual changes beyond what was asked.** Ask first. When a design change is wanted, offer options.
- The design skills in `.claude/skills/` (animate, apple-design, emil-design-eng and the rest) are used only when the owner asks for them.
- When the owner says "don't build yet" or "just answer", don't change code.
- Test that it launches before anything is released. Release notes say exactly what changed.
- Nothing private in the repo or releases.
- Cartridge never touches saves, never downloads or launches emulators itself, and never modifies emulator files.

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
- Touch: `touch-action: none` plus the pointer-based drag in `nav.js`. The app starts in pad mode; instant scroll while a direction is held.
- Delete refuses the ROMs root and console folders; a mark never touches files.
- Single modal slot: nested dialogs save `store.modal.resolve` and reopen themselves (see FolderPicker, SteamCollections, SteamEmu).
- Square-only game icons (`iconOpaque`), `sgScore` match ranking.

## Known issues at 0.6.0 (details: HANDOFF Part B, "Other bugs" list, and F4/F7)
- The Steam manager has never run against a real Steam client. Treat real-device reports about it as expected beta issues. The least tested parts are listed in HANDOFF F6.
- Steam helper backup can be overwritten if two helper copies run (F7). Fix before relying on Undo.
- `steam-games.json` is written before the helper finishes (F4).
- `steamArt.addToSteam` can reuse a shortcut key when Steam's numbering has gaps (B2).
- Y on the Search page doesn't open the built-in keyboard (B1).
- Small cleanups: duplicate CSS in `Achievements.vue`, unused `.padbtn` rules, the out-of-date graphics comment at the top of `main.js`, the two migration lines.

## Releases (full steps: HANDOFF D8)
Only when the owner asks. Bump `version` and `build.releaseInfo.releaseName` ("Cartridge X.Y.Z") in `package.json`, put only this version's notes in `RELEASE_NOTES.md` (heading `## Cartridge X.Y.Z · Title`), add them to the top of `CHANGELOG.md`, grouped as New / Changed / Fixed with bold lead-ins. CI builds, launch-checks and publishes.
