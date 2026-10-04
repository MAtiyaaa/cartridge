# Plan: 0.9.29 · The Syncthing Update (not built)

Owner, 4 Oct 2026, after 0.9.28:
- "For the next update I plan on a much deeper Syncthing integration to really take this to the next level, where it will find and link the saves found on the device and know what saves this game is for."
- "The user should say, if they have no Syncthing server, whether they'd like to make this their main Syncthing device in order to sync saves. The main focus of the next update will be on Syncthing saves."
- "If a user just started Syncthing on their device it can find the save data for their games and register them onto the menu. Later we will discuss how it is pushed. This is only for users who set up a blank Syncthing server for the first time via Cartridge. Make this clear in the onboarding so it doesn't break any files for existing Syncthing setups."
- "Cartridge becomes the one place for anything emulation."
- Also in this update: scrap multi-language (don't mention it will come, remove the language step from the onboarding), add the built-in list of trophy codes to game names, and the Switch title IDs read the way Eden reads them.
- "Don't build anything yet. Study the open source documentation for Eden and Syncthing."

Nothing here is built. Sections marked **Owner decides** need an answer before building.

---

## 1. What was studied, and what it means for the design

### Syncthing (syncthing/docs, read in full for the parts below)
- **Symlinks are synced as links, never followed** (FAQ, "What things are synced"). The Cartridge Installer's `Emulation/saves/<emu>` folders are symlinks (0.9.24, `esdeLinks.js`), so sharing `Emulation/saves` in Syncthing would sync the links, not the saves. **Design consequence:** one Syncthing folder per emulator save folder, pointing at the real folder. No moving, no links.
- **Folder IDs are shared; paths are per device.** A folder with ID `cartridge-saves-eden` can be `~/.local/share/eden/nand/user/save` on the Deck and the Flatpak's path on a desktop. This is what lets every device keep its emulator's own layout.
- **Config REST API** (`/rest/config/folders`, `/devices`, `/defaults/folder`, `/defaults/ignores`, PATCH per folder, `/rest/config/restart-required`): granular changes without touching anything else in the config.
- **Pending devices and folders** (`/rest/cluster/pending/devices`, `/pending/folders`): a new device that tries to connect, or a folder another device offers, shows up here. Cartridge can recognise its own `cartridge-saves-*` IDs and accept them at the right local path, instead of Syncthing's `autoAcceptFolders`, which would put them in the default folder.
- **Introducer** (users/introducer.rst): the main device marked as introducer on the others, so a new device learns every other device automatically. Never two introducers pointing at each other.
- **Folder types** (users/foldertypes.rst): send and receive (normal), send only (with Override), receive only (with Revert). Useful for a first join: receive only until the user confirms.
- **Versioning** (users/versioning.rst): trash can, simple, staggered, external. Applies to changes received from other devices, kept in `.stversions`. `GET/POST /rest/folder/versions` lists and restores old versions. **Design consequence:** staggered versioning on every save folder, so a bad sync can always be undone, and a "Restore an older save" screen per game.
- **Conflicts** (users/syncing.rst): both sides changed, so the older one becomes `<name>.sync-conflict-<date>-<time>-<device>.<ext>`. `maxConflicts` per folder.
- **Ignores** (users/ignoring.rst, `/rest/db/ignores`): `.stignore` with `(?d)`, `(?i)`, `#include`. Used to keep shader caches, logs and huge files out of save folders.
- **Pause and resume a folder** (PATCH `paused`), **scan now** (`/rest/db/scan`), **status and completion** (`/rest/db/status`, `/rest/db/completion`), **events** (`/rest/events`: FolderSummary, ItemFinished, LocalChangeDetected, RemoteChangeDetected, PendingDevicesChanged, PendingFoldersChanged, DeviceConnected).
- **Running its own instance:** `syncthing --home=<dir> --no-browser --gui-address=127.0.0.1:<port> --gui-apikey=<key>`, `syncthing generate --home=<dir>` makes keys and a config, and `STNODEFAULTFOLDER=1` skips the default Sync folder.

### Eden (eden-emulator mirror, `src/core/file_sys`, `src/core/loader`, `src/common/fs`, `src/qt_common/game_list`, `src/frontend_common`)
- **Folders** (`common/fs/path_util.cpp`, `fs_paths.h`):
  - Data: `$XDG_DATA_HOME/eden`, or a `user/` folder beside the program (portable).
  - Cache: `$XDG_CACHE_HOME/eden`.
  - Config: `$XDG_CONFIG_HOME/eden`.
  - Older yuzu, citron, sudachi and suyu folders are read as legacy paths.
  - Keys are in `<data>/keys`, NAND in `<data>/nand`, and play time in `<data>/play_time/playtime.bin`.
- **Saves** (`file_sys/savedata_factory.cpp`):
  - Current layout: `nand/user/save/0000000000000000/<user ID, 32 hex>/<title ID, 16 hex>/`.
  - Newer layout, used when it exists: `nand/user/save/account/<user UUID>/<title ID>/0` (or `device/<title ID>/0`).
  - **A save folder is named by the game's title ID**, so knowing which game a save belongs to is exact.
- **Game list cache** (`qt_common/game_list/worker.cpp`): `<cache>/game_list/<TITLE ID>.appname.txt` holds the game's name, next to its icon and `pv.txt` (versions). Cartridge can read title ID to name from here without any keys.
- **Title IDs from any format** (`file_sys/submission_package.cpp`, `card_image.cpp`, `content_archive.cpp`):
  - It loads `prod.keys` and the tickets inside the NSP.
  - It finds the `.cnmt.nca` (Meta) NCAs and reads the CNMT inside, which gives the title ID and type.
  - The program ID is the NCA's title ID with the last three hex digits cleared (`& ~0xFFF`).
  - XCI and XCZ files go through the root HFS0, then the secure partition, then the same NCAs.

---

## 2. Main idea: Cartridge as the save hub

Every save on the device is found, matched to its game, and shown in Cartridge. Syncing them between devices is Syncthing's job, set up and watched by Cartridge.

### 2.1 Find saves on this device (works for everyone, read only)
A new `electron/saves.js`: per emulator, where its saves live, how to tell which game each one belongs to, and when it last changed. It builds on `esdeLinks.DATA` and `emuPaths` (custom folders), for each install kind (EmuDeck, Flatpak, AppImage, RetroDECK, portable).

| Emulator | Save folder | Which game |
|---|---|---|
| Eden, Citron, yuzu family | `nand/user/save/0000000000000000/<user>/<TITLE ID>` (and `account/` layout) | Title ID folder name, exact |
| Ryujinx | `bis/user/save/<save ID>` | Save ID to title ID through its save index (read Ryujinx's source first) |
| RPCS3 | `dev_hdd0/home/<user>/savedata/<SERIAL><suffix>/PARAM.SFO` | Serial (first 9 characters) and the SFO's TITLE |
| shadPS4 | `user/savedata/<user>/<CUSA>/` | CUSA title ID |
| Vita3K | `ux0/user/00/savedata/<TITLE ID>` | Title ID |
| PPSSPP | `PSP/SAVEDATA/<GAME ID><suffix>/PARAM.SFO` | Game ID and the SFO |
| PCSX2 | `memcards/*.ps2` (shared cards) or folder memory cards | Parse the card's directory (PS2 card filesystem) for `BASLUS-xxxxx` style folders; folder cards are per game |
| DuckStation | `memcards/<title or serial>_1.mcd` | File name (per-game cards are its default) |
| Dolphin | `GC/<region>/Card A` (GCI folder or .raw), `Wii/title/00010000/<ID4 hex>/data` | GCI file names hold the game ID; Wii folder is the ID |
| Cemu | `mlc01/usr/save/00050000/<title ID low>/user` | Title ID |
| Azahar | `sdmc/Nintendo 3DS/<id0>/<id1>/title/00040000/<title ID low>/data` | Title ID |
| Xenia | `content/<profile>/<TITLE ID>/00000001` | Title ID |
| xemu | one HDD image | Whole console only, never per game |
| RetroArch | `saves/` (`.srm`, by ROM file name), states | ROM file name |
| melonDS, mGBA | `.sav` beside the ROM (default) | ROM file name |
| Flycast | VMU files | Shared, whole emulator |

Matching to RomM games uses what Cartridge already has: serials (`ps3Serial`, `psxSerial`, `gcWiiId`, `ciaTitleId`, Vita title IDs), Switch title IDs (section 5), and names as the last resort. Each save gets `{ emu, game romId or null, path, size, changed, kind: save|state }`.

**On screen:**
- **The game's page:** a Saves row (on this device, last changed, synced or not), opening a Saves sheet with versions to restore when Syncthing keeps them.
- **Settings → Syncthing → Saves:** every save, grouped by console like Game Add-ons. Unmatched ones are listed with "Link to a game".
- **Start:** an optional "Saves" widget (last synced, any conflicts).

Read only. This part alone is safe for every user, with or without Syncthing.

### 2.2 Three Syncthing situations, kept apart
Detected at start and in the onboarding: is Syncthing installed and running, and does its config hold anything (folders other than the default, devices)?

1. **You already use Syncthing.** Cartridge keeps today's behaviour: reads status and folders, matches games, and adds a folder only when asked (0.9.24 `addFolder`). It never changes existing folders, devices or ignores. The saves list shows which saves are already inside a synced folder.
2. **No Syncthing yet, or a blank one** (no devices and no folders besides the default): "Make This Device Your Main Syncthing Device." Cartridge sets it up and manages the save folders (2.3).
3. **Another device of yours is already the main one** (set up by Cartridge): "Join Your Main Device." Pair, then Cartridge accepts the save folders at this device's own emulator paths (2.4).

The onboarding says plainly which one applies and what will be changed. If an existing setup is detected, the "Main device" option is not offered (**Owner decides:** offer it behind a warning instead?).

### 2.3 Main device setup (blank Syncthing only)
- **Installing Syncthing:** Cartridge's own copy (`syncthing generate --home ~/.local/share/cartridge-syncthing` with `STNODEFAULTFOLDER=1`), or SyncThingy's when the user picks the Flatpak. The 0.9.28 user service keeps it running in Game Mode.
- **The GUI** listens on 127.0.0.1 only, with a generated API key that Cartridge stores.
- **Folders:** one per emulator that has saves on this device:
  - ID `cartridge-saves-<emu>`, label "<Emulator> Saves".
  - Path is the real save folder (2.1), never a link.
  - Staggered versioning, `maxConflicts` 10, the file watcher on.
  - Ignores for caches and logs, per emulator.
- **Optional extra folders**, off by default: save states, BIOS and keys, texture packs, emulator settings. **Owner decides:** which are offered. Keys and BIOS between your own devices is common, but they are large or sensitive.
- **Its device ID and a QR code** are shown so other devices can pair.

### 2.4 Joining from another device
- **Pairing:** the new device's Cartridge shows its device ID and QR code, and the main device's Cartridge sees it in `pending/devices` ("Steam Deck wants to join. Add it?"). Either side can start it.
- **Introducer:** the main device is set as the introducer on the new one.
- **Accepting folders:** offered `cartridge-saves-*` folders come through `pending/folders`. Cartridge adds each one at the local emulator's save path, as receive only first. Before anything arrives it shows what it would bring in, per game ("3 Switch saves, 1 is newer here").
- **Going two-way:** after the user confirms, the folder becomes send and receive. Local saves that only exist here go up; the same save on both sides becomes a conflict copy, which Cartridge lists so the user can pick.

### 2.5 "How it is pushed" (owner: to discuss later)
Options to discuss, not decided:
- **A. Always on:** Syncthing syncs whenever both devices are online.
- **B. Paused while playing:** Cartridge pauses that emulator's folder when a game starts (it already knows through Steam and `gameFocus`), then resumes and scans when the game closes. This avoids replacing a save the emulator has open.
- **C. Check before playing:** "This save is older than the one on Steam Deck, waiting for it" before launching. Uses `db/status` and remote need.
- **D. Manual "Sync Now"** on the game page or in the Quick Menu.

Recommendation: B plus C. A alone risks a save being replaced while the emulator writes it.

### 2.6 Safety rules for this feature
- **Owner decides:** the rule "Cartridge never touches saves" needs a stated exception. Cartridge itself still never writes, moves or deletes a save. It sets up Syncthing, and Syncthing changes saves when they change on another device. Versioning is always on for Cartridge's folders, so every replaced save is kept. Cartridge writes a save file only when the user picks "Restore this version" or "Keep this one" on a conflict.
- Never write to a Syncthing config Cartridge didn't create, except the explicit "Add Folder" asked for by the user (as 0.9.24).
- Never share a folder that contains the ROMs or the whole emulator folder; save folders only, from the table.
- xemu's HDD image and shared cards (PCSX2 `.ps2`, Dolphin `.raw`, Flycast VMUs) sync only while the emulator is closed (option B), and the UI says it's one file for all games.
- Tests: fake homes for each emulator's save layout (matching), a fake Syncthing REST server for setup, join and pending flows (like `test/syncthing.test.js`).

---

## 3. Ideas to build out the ecosystem (owner picks)
1. **Save health on the game page:** "Synced with Steam Deck 2 min ago", a conflict badge, and versions to restore.
2. **Pick up where you left off:** Start's Continue tile says which device last played and whether its save has arrived.
3. **The Dock sync pill:** a small sync state next to the connection pill (syncing, up to date, conflict).
4. **RomM saves as a second option:** RomM has per-game save and state uploads. For users without Syncthing, Cartridge could back up the save to RomM after a game closes (**owner decides**, it touches the RomM server).
5. **One device list:** Syncthing devices, RomM devices (play sessions) and trophy devices shown as one "Your Devices" page, with names kept the same everywhere.
6. **Emulator settings and controller profiles synced** (optional folder per emulator config, off by default).
7. **BIOS, firmware and keys synced** between your own devices (optional, off by default, with a clear warning).
8. **Texture packs synced** (already matched in 0.9.28; a folder per emulator's texture folder).

---

## 4. Built-in trophy codes to game names
The aim is that no game shows "Unnamed PS4 game" or a bare code.

**What exists:**
- **Xbox 360**, title ID to name:
  - [xenia-manager/x360db](https://github.com/xenia-manager/x360db): `games.json`, about 5,900 titles with names, box art, developer and release date. No licence file.
  - [niemasd/GameDB-XBOX360](https://github.com/niemasd/GameDB-XBOX360): GPL-3.
  - [wiredopposite/Xbox360-Game-Database](https://github.com/wiredopposite/Xbox360-Game-Database): no licence file.
  - Cartridge is MIT, so none of these can be copied into the repo. **Plan:** fetch x360db's `games.json` at runtime (like other outside sources, 30-day cache in the user's folder) and look up Xenia codes.
- **PS3:** RPCS3's trophy folders carry the game name already (TROPCONF), so codes are rare there. Serial to name from RPCS3's own compatibility list when needed.
- **PS4 and Vita (NPWR codes):**
  - No openly licensed list was found, only forum posts (NextGenUpdate lists of about 1,000 codes) that can't be used.
  - The reliable source is Sony's own trophy API ([psn-api docs](https://psn-api.achievements.app/api-docs/title-trophies), [andshrew/PlayStation-Trophies](https://github.com/andshrew/PlayStation-Trophies/blob/master/docs/APIv2.md)): `npCommunicationIds/<NPWR>/trophyGroups` returns the title name. It needs a PSN sign-in.
  - **Plan, in order:**
    1. What this device learnt (titles.json, 0.9.16).
    2. What your other devices wrote to RomM (0.9.28).
    3. A Cartridge-made list in the repo (`data/trophy-titles.json`). It is built only from names Cartridge reads from game files and that the owner chooses to add, never copied from the forum lists.
    4. Optional "Sign in to PlayStation Network" in Settings → Achievements, to name the rest. The sign-in is used only for this lookup, and like the emulator sign-in the password is never stored.
  - **Owner decides:** is the PSN sign-in wanted?

---

## 5. Switch title IDs, read the way Eden reads them
Cartridge's `switchTitleId` (`electron/addons.js`) already decrypts NCA headers. To match Eden:
1. **Find `prod.keys` everywhere Eden does:**
   - `<data>/eden/keys` and the portable `user/keys` beside the program.
   - The legacy yuzu, citron, sudachi and suyu folders.
   - Eden's custom data folder from its config.
   - EmuDeck's and RetroDECK's keys folders.
   - Ryujinx's `system/`.
2. **Read the `.cnmt.nca` first**, like `submission_package.cpp`: the CNMT gives title ID and type. The program ID is the title ID `& ~0xFFF`; updates (`…800`) and DLC map to the base game.
3. **Read every NCA,** not the first 40.
4. **Folder games:** look inside for `.nsp/.nsz/.xci/.xcz`, else the loose NCAs.
5. **Without keys:**
   - Eden's game list cache (`~/.cache/eden/game_list/<TITLE ID>.appname.txt`) gives title ID and name, which Cartridge matches to RomM by name.
   - Then RomM's metadata.
   - Then the file name.
6. **Tests** with small fake NSP/XCI files built in the test (made-up header key).

---

## 6. Multi-language: scrapped for now
- Remove the Language step from the onboarding (`Welcome.vue`: the `'lang'` step and "More languages are coming in Cartridge 1.0.").
- No mention anywhere that more languages are coming. Old plan documents keep their history.

---

## 7. Order of work, when the owner says build
1. `saves.js` discovery and matching, with tests per emulator (read only), plus the game page Saves row and Settings → Syncthing → Saves.
2. Situation detection, and the onboarding Syncthing step rewritten for the three situations (2.2), with the warning text for existing setups. Language step removed.
3. Main device setup (2.3) with versioning and ignores, against a fake REST server in tests.
4. Join flow (2.4): pairing, QR, pending folders accepted at local paths, receive only first.
5. Versions and conflicts screens.
6. Push behaviour (2.5) once the owner decides.
7. Trophy names (4) and Switch title IDs (5).
8. Notes, CLAUDE.md, launch check, release.

**Owner must test on devices:** two devices (Deck plus desktop), a blank Syncthing on one, joining from the other. Then the same with an existing Syncthing setup, confirming nothing in it changed. Use at least Eden, RPCS3, PCSX2 and RetroArch saves.
