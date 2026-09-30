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
- Honest limits shown in the UI: the server is only reachable while this device is on.
- RomM without containers isn't used: RomM only supports its manual setup for development, and it needs a database server, Valkey and system libraries that a read-only system can't install.

## 2. Texture packs and patches on the game page
Like ArmSX2's PS2 downloads, for every console that supports them.
- **Game page:** an "Extras" row lists texture packs and patches found for that game (by serial or title ID, which Cartridge already reads for several consoles), with size, author and Install / Remove.
- **Settings → Texture packs:** what's installed per emulator, sizes, where each emulator looks, and a way to fix a folder.
- **Where to install, read from each emulator's own settings** (never assumed; a changed folder is followed): PCSX2 `[Folders] Textures`, DuckStation `[Folders] Textures`, Dolphin's Load folder, Eden, Citron, yuzu, Ryujinx mod folders (`load/<title ID>`), Azahar and Citra `load/textures/<title ID>`, PPSSPP `PSP/TEXTURES/<game ID>`, Cemu graphic packs, Xenia patches. RPCS3 has no texture replacement; its patches come from RPCS3's own patch list.
- **Sources** (to be researched and confirmed before building): GameBanana's public API (texture packs and mods for Switch, 3DS, GameCube, Wii, PS2, PSP and more), the emulators' official patch lists (PCSX2 and RPCS3 patches, Xenia Canary's game-patches), and other hosts only where they have a stable, public way to list files.
- **Rules to agree:** installing writes into an emulator's texture or mod folder, which bends "never modifies emulator files". Proposal: allowed only for those folders, only for packs Cartridge installed (recorded like D3 in the 0.9.3 plan), and removal only of what Cartridge put there. Emulator settings are never changed; where an emulator needs "load custom textures" turned on, Cartridge says how.
- Big packs (several GB) use the download queue, space check and checksums like games.

## Later (1.0)
- Full translations (the language step is ready in 0.9.3's onboarding).
