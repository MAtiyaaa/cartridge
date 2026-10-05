# Plan: games on more than one drive (not built)

Owner, 0.9.24: "don't integrate it yet, just think how you'll do it, how you will add the additional paths in the emulators in the background, and which emulators don't or can't support this."

Nothing here is in the app yet. This is the plan for when it's wanted.

## What the user gets

- Settings → Storage lists every games folder: the internal one and one per drive (SD card, external SSD). Add Folder, Remove Folder, Make Default.
- Each download can go to any of them. The default comes from a rule:
  - the drive with the most free space,
  - a drive picked for that console ("PS3 games on the SSD"),
  - or always ask.
- The Storage manager's Move action moves a game from one drive to another. Steam shortcuts and emulator lists follow it.
- A drive that is unplugged doesn't make its games vanish. They show as "On SD card (not inserted)", and Play says so instead of failing.

## Cartridge's side

1. **Config.** `romsRoot` becomes `romsRoots: [{ path, label, default }]`. A config migration keeps today's `romsRoot` as the first entry.
   - Code that reads `romsRoot` asks a `rootFor(rom)` helper instead.
   - `rootFor(rom)` looks for the game across every root and returns the first one where it's found.
2. **Installed detection.** `computeInstalled()` scans each root's console folders. It has to know which drive each root is on (`fs.statSync().dev`), so an unplugged drive's games are kept as "not inserted" and not dropped.
3. **Downloads.** `store.download` picks a root:
   - Rule first.
   - Then `roomFor` on that root's drive.
   - Then the next root with room.
   - `dlWorker` already takes a full destination path, so nothing changes there.
4. **Move between drives.** It's a copy, then a size and hash check (the same `checkFile` as downloads), then the old copy is deleted, like `redownload()`'s `.cartridge-old` dance. Then:
   - Steam: `steamManager.refreshGame(romId)` rewrites the shortcut in place. Live mode uses `updateShortcut`, so the appid stays the same.
   - The emulator's own game list is updated (next section).
5. **Flatpak access.** A sandboxed emulator only sees the folders it was granted. For each root and each Flatpak emulator in use, `flatpakCanSee` is checked, and the existing `flatpak override --user --filesystem=<root>` fix is offered. It's the same Issues entry as today, once per root.
   - Paths must be the real ones, never the `/home` → `/var/home` symlink (CLAUDE.md).
   - SD cards mount under `/run/media/<user>/<label>`, which is already real.
6. **Steam shortcuts.** These already launch with the game's full path. A game on any drive starts the same way, so this needs no change beyond `refreshGame` after a move.

## Adding the extra folders to emulators, in the background

Steam starts each game with its full path, so **every emulator can play games from any drive already**. The extra folders only matter for each emulator's own game list (when someone opens the emulator itself), and for content the emulator installs into its own storage.

Cartridge would add each new root's console folder to the emulator's game list. The writing would go through `electron/emuPaths.js`, which 0.9.24 added for the per-emulator Folders page and which already reads and writes these files. It would follow the same rules:

- only while the emulator is closed (`EMU_PATCH`-style check),
- a `.cartridge-bak` of the first original,
- only add, never remove a folder the user added,
- record what Cartridge added (`emu-folders.json`), so Remove Folder takes out only Cartridge's.

| Emulator | Game list folders | Where | Notes |
|---|---|---|---|
| PCSX2 | many | `PCSX2.ini` `[GameList] RecursivePaths` | append a line |
| DuckStation | many | `settings.ini` `[GameList] RecursivePaths` | append a line |
| Dolphin | many | `Dolphin.ini` `[General] ISOPaths` count + `ISOPath<N>` | bump the count |
| Cemu | many | `settings.xml` `<GamePaths><Entry>` | add an Entry |
| Eden, Citron, yuzu family | many | `qt-config.ini` `Paths\gamedirs\<n>\path` + `size` | Qt array; bump `size` |
| Ryujinx | many | `Config.json` `game_dirs` | JSON array |
| Azahar / Citra | many | `qt-config.ini` `Paths\gamedirs\…` | same Qt array as yuzu |
| shadPS4 | many | `config.toml` `[GUI] installDirs` | TOML array of tables |
| RetroArch | n/a | playlists | Cartridge doesn't manage RetroArch playlists; launch by path works |
| PPSSPP | one browse folder | `ppsspp.ini` `[General] CurrentDirectory` | not a list; launch by path works; leave it alone |
| xemu, Xenia, MAME, Flycast, melonDS, mGBA | none | launched by path | nothing to add |

### What can't be split across drives

These emulators keep *installed* content in one storage folder. Games launched from a file are fine on any drive, but installed content all lives in one place:

- **RPCS3**: installed games (PSN `.pkg` and updates) and DLC go into `dev_hdd0`, a single folder (`games.yml` only lists disc games).
  - `dev_hdd0` can be moved to another drive as a whole (Folders page, 0.9.24), but it can't be split.
  - Disc games (folders or ISOs) work from any drive.
- **Vita3K**: everything installed lives in its one `ux0` (pref-path). Same rule: it can move as a whole, but can't be split.
- **Cemu**: updates and DLC go into one `mlc01`. Game files can be anywhere.
- **Eden, yuzu family, Ryujinx**: updates and DLC are installed into one NAND (or `bis` for Ryujinx). Base games can be anywhere.
- **Azahar**: installed CIA titles go into one `sdmc`/NAND.
- **shadPS4**: game folders can be anywhere (`installDirs`), but the update and DLC folder (`addonInstallDir`) is one path.
- **xemu, Xenia**: one HDD image or content folder for saves and installed content.

Cartridge's answer for these: the Storage page shows the emulator's storage folder as its own entry ("RPCS3 installed games · 84 GB · on Internal") with Move. A move goes through the Folders page's existing path change (copy, check, switch the emulator's setting, keep the old copy until the user deletes it). It's never split.

## Order of work, when it's wanted

1. `romsRoots` + `rootFor` + migration, with tests (fake homes with two roots, one unplugged).
2. Installed detection and Storage page per root.
3. Download target rule.
4. Move between drives (copy, check, Steam refresh).
5. Emulator game-list folders through `emuPaths.js`, with tests per format, starting with the Qt-array ones (yuzu family, Azahar) since those are easiest to get wrong.
6. Flatpak access per root in Issues.

Owner tests on device:
- an SD card unplugged and plugged back in,
- a Flatpak emulator with games on the SD card,
- moving a PS3 game while Steam is in Game Mode.
