# Cartridge 0.9.16 plan

Owner, 2 Oct 2026: everything left over from 0.9.15 goes into 0.9.16, together with the Add-ons downloads that were already moved here. Not started; build when the owner says so.

## 1. Add-ons downloads (moved from 0.9.15, plan-0.9.4 section 2)
- Texture packs, cheats and mods from public sources (GameBanana, libretro's cheat database, the emulators' own patch lists), each source checked against its real responses before building (they were blocked from the cloud container in 0.9.15; the owner can paste sample responses if they still are).
- Big packs use the download queue, space check and checksums. Only what Cartridge installed is recorded and removable. Emulator settings are never changed.

## 2. Add-ons, the rest of the design
- **Add-ons button** on the game page, in the row with Play, Re-download, Delete and More, shown only when the game has something. One sheet with tabs that have something: Textures, Patches, Cheats, Mods. Patches and Texture packs move into it from More (Manual stays in More, owner 0.9.15).
- **Settings → Emulators → Add-ons:** its own tab, split per console with its logo; inside, only your installed games that have add-ons; picking one opens the same sheet. Also what's installed and its size, where each emulator looks, and a way to fix a folder.
- **More emulators:** Cemu (graphicPacks), Eden, Citron, yuzu (qt-config.ini load directory, key from their source), Ryujinx (mods/contents/<title ID>, confirm in source).
- **Game IDs Cartridge reads itself:** PS1 serial for DuckStation (SYSTEM.CNF on the disc, raw 2352-byte sectors and CHD), Dolphin's game ID from RVZ and WBFS, 3DS title ID from CIA.

## 3. Welcome, unfinished parts
- **Welcome animation** on the first screen ("Welcome to Cartridge"), and a smooth transition from Done into the main page.
- **Picks up where it left off:** the welcome remembers its step, so leaving for Desktop Mode (EmuDeck) or closing halfway comes back to the same step.
- **System scan, the rest of step 8:**
  - Games and console folders: the ROMs folder (EmuDeck's or RetroDECK's when found) and each console folder matched to RomM's consoles, with a way to fix a wrong match.
  - Already in Steam: how many shortcuts were found, and whether to bring your own under Cartridge (C7) or leave them.
  - Anything that needs attention goes to the Issues list.

## 4. RomM on this device, unfinished parts
- **No Podman:** research per system (SteamOS, Bazzite, other distros) whether a user-level Podman can be fetched without touching the read-only system; do it where it can, otherwise keep the clear message.
- **Server name** used where RomM can show it, or dropped if RomM has no such setting.
- **Metadata keys after setup** (IGDB, ScreenScraper) as their own step with Skip, recreating RomM's container with them.
- **"Set it up on another computer":** the QR code points at RomM's actual setup guide page, not the docs home.

## 5. Backgrounds
- **"B for the top five" follows your library:** designed scenes for the five consoles you use most (play time, then installed games), not a fixed five. Needs scenes for more consoles to choose from; the ones without a scene keep the art background.

## 6. To confirm on the owner's device (from 0.9.15)
- shadPS4 after Update on the PS4 console page.
- PS3 patches "serial not found": find the real cause on the owner's games (send a log or a game's folder layout).
- Game page header blend with real art at 1080p and 4K; owner to say which other "game-specific" screens need it.
- "on" before device names, Vita3K install and launch.
