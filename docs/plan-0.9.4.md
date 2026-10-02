# Cartridge 0.9.15 plan (was 0.9.4, merged with 0.9.3 M)

Owner, 2 Oct 2026: everything in 0.9.3 M and the fixes below go together with the 0.9.4 plan into one update, released as **0.9.15** (version, versionName and release title all "0.9.15", so GitHub stays in order). The 0.9.3 parts end with L.

## F. Fixes and owner's list (built first)
1. **shadPS4 (top priority).** Target is the Qt launcher AppImage, Launch options "-d -g <eboot>", Start in as shadPS4's own shortcuts write it. Found: the launcher starts the core in its own working folder (`QDir::currentPath()` in main_window.cpp StartEmulatorExecutable), so Start in decides where the core runs; and Setup's scan found the launcher's core AppImages (versions folder) and preferred them as Target. Fixed: the launcher always wins, cores in the versions folder are never a Target, StartDir written unquoted like shadPS4's.
2. Patches follow the game's own emulator or fork (game pick, else console pick): that copy's patches folder (shadPS4 forks like GR2, RPCS3 and PCSX2 Flatpak vs AppImage).
3. Game page headers blend into the page with no edge (game-specific pages), on real art at 1080p and 4K.
4. Manual shows twice: only in More.
5. Vita3K installs without opening its window, like RPCS3.
6. PS3 patches still say the serial can't be found: find why on the owner's games.
7. Look & Feel "Fetch all logos" becomes "Fetch all metadata" (logos, icons, sharp backgrounds and the rest at once).
8. Home media bar as big as the game page header, with a Look & Feel setting of three sizes, Compact first.
9. Moving between rows (up/down) is too snappy: a short smooth animation, like moving along a row.
10. Emulator choice per console: forks grouped under one "Forks" entry that opens their own page; per game editing on the console page (each game: change emulator, edit Target, Start in and Launch options, remove).
11. Launching a game from Steam while Cartridge is open brings Cartridge up first: games should open directly.
12. Vita games installed in Vita3K before Cartridge count as installed: no reinstall needed to manage them.
13. "on" before device names; Vita3K install and launch (fixed in 0.9.3 L, recheck on the device).
14. RetroAchievements sign-in for emulators (button in Settings → Achievements, lists what it changes first; RetroArch, PCSX2, DuckStation, PPSSPP, Dolphin from their source; password used once, never stored).
15. Console backgrounds (except Ribbons and XMB): mockups first.

## 0. New onboarding (moved from 0.9.3)
A smooth first run on the Ribbons background, A for next, B for back. It replaces the current first-run steps.
1. **Welcome** animation: "Welcome to Cartridge" and one line on what it is.
2. **What should we call you?** Used for a greeting on Home and as the default device name.
3. **Language:** the step is there, English only for now (translations are for 1.0).
4. **Controller check:** press A.
5. **Instant Steam changes:** explain briefly, then Turn on (Cartridge sets Steam's remote debugging switch itself, the same as the Settings → Steam button; Steam restarts once). No Decky install needed.
6. **EmuDeck or RetroDECK:** if either is found, a green check ("Good news, you already have EmuDeck", or RetroDECK). If neither, "Get your emulators":
   - **EmuDeck (Recommended):** Cartridge downloads EmuDeck's official app and opens it; the user picks emulators there and EmuDeck installs them. EmuDeck's app is a desktop window, so in Game Mode Cartridge says to switch to Desktop Mode for this step and picks up where it left off.
   - **RetroDECK:** installed from Flathub in the background with a progress bar (works in Game Mode too), then opened for its own first-run setup.
   - **I'll set up emulators myself:** Continue; the system scan (step 8) finds whatever is installed.
   - Cartridge waits and scans again when the user comes back. Owner-approved exception (confirmed) to "never downloads emulators": Cartridge may download and open EmuDeck's official app, or install RetroDECK from Flathub, only when the user picks it. Cartridge never installs individual emulators itself.
7. **RomM:** "Do you have a RomM server?"
   - **Yes:** sign in (local, remote or tunnel, with the connection test).
   - **No:** a short, friendly "What is RomM", then **Set up RomM on this device** (section 1), **Set it up on another computer** (QR code to RomM's own guide), or **Later**.
8. **Let us scan your system.** One animated step after RomM (so console folders can be matched to RomM's consoles, and a fresh EmuDeck install is included). It replaces sending new users to Emulator setup, and shows results live as they come in:
   - **Emulators found,** per console, with where each came from (EmuDeck, RetroDECK, AppImage, Flatpak, distro package, Steam). The standard emulator for each console is picked by default (C4); another copy or a fork can be picked right there.
   - **Programs Cartridge isn't sure about** get the "Which one?" choice in place: Not an emulator, It's a fork (of which emulator), It's an emulator (C3). A fork chosen here is offered for that console and per game.
   - **Games and console folders:** the ROMs folder (EmuDeck's or RetroDECK's when found) and each console folder matched to RomM's consoles, with a way to fix a wrong match.
   - **Already in Steam:** how many shortcuts were found, and whether to bring your own ones under Cartridge (C7), or leave them.
   - **BIOS** status per console, and anything else that needs attention (it goes to the Issues list, A5).
   - Everything here can be changed later in Settings → Emulators. Skip is always there.
9. **Optional extras,** each with Skip: SteamGridDB key, RetroAchievements sign-in.
10. **Add Cartridge to Steam:** the last step before the main page, since the first run is usually in Desktop Mode. One button (the existing "add Cartridge itself" flow with its artwork); skipped when Cartridge is already in Steam or was started from Steam.
11. **Done,** with a smooth transition into the main page.

**Existing users** (already signed in when they update to 0.9.4):
- Once, after updating: "New: a fresh welcome and system scan. Take a look?" with Take a look / Not now (like the 0.9.1 Emulator setup notice).
- **Settings → About → Run the welcome again** at any time.
- A replay starts from your current settings: steps already done show their green check (RomM signed in, EmuDeck found, instant Steam changes on), and nothing is reset, signed out or removed. Leaving halfway keeps everything as it was.

Full translations stay for 1.0.

## 1. Set up RomM on this device
So people without a RomM server aren't put off. Offered in the onboarding's RomM step (step 7 above) and in Settings → RomM.
- Done in the background, no technical questions: Cartridge checks for Podman and uses it if present (Bazzite has it; recent SteamOS may ship it, to be confirmed). If it's missing, Cartridge fetches a user-level Podman without touching the read-only system (to be researched per system; fail with a clear message rather than a wrong guess).
- RomM's own `docker-compose.yml` is the reference (RomM, MariaDB, Valkey). Only the internal secrets nobody types (database password, RomM's auth key) are generated.
- **Your RomM account is yours:** the onboarding page asks you to choose your own username and password (with a confirm field and a show/hide toggle). That becomes RomM's admin account, and Cartridge signs in with it. Nothing random, and you can use it to sign in to RomM from any other device or browser.
- Other questions asked: the server's name; where RomM keeps its files (custom location, or the same ROMs folder as EmuDeck or RetroDECK when found, with the folder layout RomM expects).
- Progress bar while the images download and the server starts. Starts with the device (a Podman user service), keeps running in Game Mode, survives reboots and RomM updates.
- Optional afterwards: metadata keys (IGDB, ScreenScraper) for covers and details, with Skip.
- **Said once, right after choosing to set up RomM on this device,** before anything starts: "Your RomM server is only reachable while this device is on and online."
- RomM without containers isn't used: RomM only supports its manual setup for development, and it needs a database server, Valkey and system libraries that a read-only system can't install.

## 2. Add-ons: texture packs, patches, cheats and mods
Like ArmSX2's PS2 downloads, for every console that supports them. How ArmSX2 does it: a curated catalogue in its own repository (about 490 PS2 packs, converted to ASTC for phones), each pack tagged with the games it belongs to so it installs itself in the right place, checksum-checked, with packs for your own games listed first; patches and cheats are picked per game and installed together. Cartridge follows the same model, but its catalogue points at the original sources (ArmSX2's ASTC packs are made for phones, not PCs).
- **Catalogue sources, one per kind** (each confirmed before building; only sources with a stable public listing):
  - Patches: PCSX2's official patches repository (pnach per serial), RPCS3's own patch list, Xenia Canary's game-patches, Cemu's graphic packs repository, Dolphin's built-in game patches.
  - Cheats: libretro's cheat database (many consoles), PPSSPP's cheat database, a public Switch cheats database, Dolphin Gecko codes.
  - Texture packs and mods: GameBanana's public API (Switch, 3DS, GameCube, Wii, PS2, PSP and more), plus the PS2 texture pack list ArmSX2's catalogue is built from, pointed at the original PC packs.
  - Cartridge keeps a small index of these in its own cache, matched to games by serial or title ID; nothing is hosted by Cartridge.
- **Per emulator:** patches and cheats go where that emulator reads them (for example PCSX2's `cheats`/`patches` folders, PPSSPP's `PSP/Cheats`, Switch emulators' `load/<title ID>`, Dolphin's game settings), found the same way as texture folders below. Patches moved to 0.9.3 (D7, owner 1 Oct): Cartridge turns on the patches it installs in the emulator's own patch settings.
- **Game page:** an **Add-ons** button in the same row as Play, Re-download, Delete and More, shown only when that game has something (with a small count, and a mark when something is installed). It opens one sheet with tabs, only the tabs that have something: **Manual** (moved here from its own button), **Textures**, **Patches**, **Cheats**, **Mods**. Each item: name, author, size, what it does, Install / Remove; patches and cheats are ticked and installed together.
- **Settings → Emulators → Add-ons** (its own tab inside Emulators):
  - Split per console, each with its logo (PS2, PS3, PS4, Switch...). Only consoles that have add-ons for your games are shown.
  - Inside a console: only your installed games that have add-ons available; games with none aren't listed.
  - Choosing a game opens the same sheet as the game page's Add-ons (install texture packs, patches, cheats, mods).
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
- **Syncthing saves, view only** (moved from 0.9.3 I1, owner 2 Oct): read Syncthing's local status (running, last sync per folder, devices online, conflicts) from its local API; later a per-game "Synced" or "Conflict" badge. Never touches saves.
