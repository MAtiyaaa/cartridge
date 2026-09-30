# Cartridge 0.9.4 plan (after 0.9.3)

Ideas agreed with the owner for the update after 0.9.3. Not built yet; details are settled before building.

## 1. Set up RomM on this device
So people without a RomM server aren't put off. Offered in the onboarding's RomM step ("No, set one up on this device") and in Settings → RomM.
- Done in the background, no technical questions: Cartridge checks for Podman and uses it if present (Bazzite has it; recent SteamOS may ship it, to be confirmed). If it's missing, Cartridge fetches a user-level Podman without touching the read-only system (to be researched per system; fail with a clear message rather than a wrong guess).
- RomM's own `docker-compose.yml` is the reference (RomM, MariaDB, Valkey). Only the internal secrets nobody types (database password, RomM's auth key) are generated.
- **Your RomM account is yours:** the onboarding page asks you to choose your own username and password (with a confirm field and a show/hide toggle). That becomes RomM's admin account, and Cartridge signs in with it. Nothing random, and you can use it to sign in to RomM from any other device or browser.
- Other questions asked: the server's name; where RomM keeps its files (custom location, or the same ROMs folder as EmuDeck or RetroDECK when found, with the folder layout RomM expects).
- Progress bar while the images download and the server starts. Starts with the device (a Podman user service), keeps running in Game Mode, survives reboots and RomM updates.
- Optional afterwards: metadata keys (IGDB, ScreenScraper) for covers and details, with Skip.
- **Said once, right after choosing to set up RomM on this device,** before anything starts: "Your RomM server is only reachable while this device is on and online."
- RomM without containers isn't used: RomM only supports its manual setup for development, and it needs a database server, Valkey and system libraries that a read-only system can't install.

## 2. Extras: texture packs, patches, cheats and mods
Like ArmSX2's PS2 downloads, for every console that supports them. How ArmSX2 does it: a curated catalogue in its own repository (about 490 PS2 packs, converted to ASTC for phones), each pack tagged with the games it belongs to so it installs itself in the right place, checksum-checked, with packs for your own games listed first; patches and cheats are picked per game and installed together. Cartridge follows the same model, but its catalogue points at the original sources (ArmSX2's ASTC packs are made for phones, not PCs).
- **Catalogue sources, one per kind** (each confirmed before building; only sources with a stable public listing):
  - Patches: PCSX2's official patches repository (pnach per serial), RPCS3's own patch list, Xenia Canary's game-patches, Cemu's graphic packs repository, Dolphin's built-in game patches.
  - Cheats: libretro's cheat database (many consoles), PPSSPP's cheat database, a public Switch cheats database, Dolphin Gecko codes.
  - Texture packs and mods: GameBanana's public API (Switch, 3DS, GameCube, Wii, PS2, PSP and more), plus the PS2 texture pack list ArmSX2's catalogue is built from, pointed at the original PC packs.
  - Cartridge keeps a small index of these in its own cache, matched to games by serial or title ID; nothing is hosted by Cartridge.
- **Per emulator:** patches and cheats go where that emulator reads them (for example PCSX2's `cheats`/`patches` folders, PPSSPP's `PSP/Cheats`, Switch emulators' `load/<title ID>`, Dolphin's game settings), found the same way as texture folders below. Where an emulator only takes patches through its own window (RPCS3's patch manager), Cartridge shows what's available and how to turn it on there, rather than editing RPCS3's files.
- **Game page:** an **Extras** button in the same row as Play, Re-download, Delete and More, shown only when that game has something (with a small count, and a mark when something is installed). It opens one sheet with tabs, only the tabs that have something: **Manual** (moved here from its own button), **Textures**, **Patches**, **Cheats**, **Mods**. Each item: name, author, size, what it does, Install / Remove; patches and cheats are ticked and installed together.
- **Settings → Emulators → Game Add-ons** (its own tab inside Emulators; not called Extras there):
  - Split per console, each with its logo (PS2, PS3, PS4, Switch...). Only consoles that have add-ons for your games are shown.
  - Inside a console: only your installed games that have add-ons available; games with none aren't listed.
  - Choosing a game opens the same sheet as the game page's Extras (install texture packs, patches, cheats, mods).
  - Also here: what's installed and its size, where each emulator looks, and a way to fix a folder.
- **Where to install, read from each emulator's own settings file** (checked in their source code; a folder the user changed is followed, and the emulator's own default is used only when the setting is empty). Found in the settings file of each install (native, Flatpak under `~/.var/app/...`, EmuDeck's, or a portable folder next to the program):
  - PCSX2: `PCSX2.ini` `[Folders] Textures` (default `textures`, relative to PCSX2's data folder), then `<serial>/replacements`.
  - DuckStation: `settings.ini` `[Folders] Textures` (default `textures`), then per game.
  - Dolphin: `Dolphin.ini` `[General] LoadPath` (empty means the `Load` folder in Dolphin's user folder), then `Textures/<game ID>`.
  - PPSSPP: the memory stick folder, moved with `memstick_dir.txt`, then `PSP/TEXTURES/<game ID>`.
  - Azahar and Citra: `load/textures/<title ID>` in the user folder (a portable `user` folder next to the program wins).
  - Cemu: `graphicPacks` in its user data folder.
  - Eden, Citron, yuzu: `qt-config.ini` load directory, then `<title ID>` (key to confirm in their source when building). Ryujinx: its data folder's `mods/contents/<title ID>` (to confirm).
  - If a settings file can't be read or points nowhere, Cartridge says so and lets the user pick the folder; it never guesses.
- **Turning packs on is the user's job, and Cartridge says exactly how** after installing, for that emulator (Cartridge never changes emulator settings):
  - PCSX2: Graphics → Texture Replacement → Load Textures (`[EmuCore/GS] LoadTextureReplacements`).
  - DuckStation: Enhancements → Texture Replacement → Enable Texture Replacements.
  - Dolphin: Graphics → Advanced → Load Custom Textures.
  - Azahar and Citra: Graphics → Use Custom Textures.
  - Cemu: tick the pack in Graphic Packs.
  - PPSSPP: on by default (Replace textures).
  - Cartridge reads the setting and shows "Custom textures are off in PCSX2" with those steps when it's off, and a check when it's on.
- **Sources** (to be researched and confirmed before building): GameBanana's public API (texture packs and mods for Switch, 3DS, GameCube, Wii, PS2, PSP and more), the emulators' official patch lists (PCSX2 and RPCS3 patches, Xenia Canary's game-patches), and other hosts only where they have a stable, public way to list files.
- **Agreed rule:** installing writes only into the emulator's texture or mod folder (the one exception to "never modifies emulator files" here); only packs Cartridge installed are recorded (like the 0.9.3 installs) and only those can be removed. Emulator settings are never changed.
- Big packs (several GB) use the download queue, space check and checksums like games.

## Later (1.0)
- Full translations (the language step is ready in 0.9.3's onboarding).
