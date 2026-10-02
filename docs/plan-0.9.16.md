# Cartridge 0.9.16 plan

Owner, 2 Oct 2026: everything left over from 0.9.15 goes into 0.9.16, together with the Add-ons downloads that were already moved here. Owner said start building (2 Oct 2026, with section 7 added from their device test).

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

## 7. From the owner's device test of 0.9.15 (2 Oct 2026)
1. **Console backgrounds at the quality of XMB Waves and Ribbons.** Owner: Switch, Xbox 360, Wii, GameCube and PS2 still look bad next to Waves and Ribbons. Rebuild them in the same way Waves and Ribbons are made (many fine, silky lines and soft bands, theme of each console), not shapes and glows.
2. **Welcome in a card:** every step sits in one centred card over the background (the card style used elsewhere), the background stays behind it.
3. **Bug: the welcome's "Your system" step doesn't scroll.**
4. **Bug: Vita games installed in Vita3K before Cartridge** still ask to be installed when changing their launch options on the console page.
5. **Moving between rows (up/down) still feels rough.**
6. **Home shelf headers:** a bit bigger (not game page size); bug: they shrink and clip as you go down Home.
7. **Achievements, RA and Trophies tabs:** the latest unlocks as big as on the All tab (rest stays as it is).
8. **PS3 patches:** Uncharted 2 has patches but Cartridge says RPCS3 has none. Get RPCS3's patch file from where RPCS3 itself downloads it, so it shows.
9. **Consoles page:** company logos (Sony, Nintendo, Sega, Microsoft...) instead of the company name text, the same size as the text, from an open source set.
10. **Developer names:** check where they come from (example: Tokyo Jungle shows "Crispy's!").
11. **Bug: PS4 trophies of games not on this device** show NPWR codes instead of game names.

## 8. Owner's second list (2 Oct 2026, all in 0.9.16)
1. **Downloads slower since 0.9.15** (70 MB/s to 7): downloads now run in their own worker thread; Game Mode process scan made non-blocking. (Done, owner to confirm.)
2. **RetroAchievements sign-in not working.**
3. **PS3 and Vita firmware from RomM** didn't do anything: now installed into RPCS3 (`--headless --installfw`) and Vita3K (`--firmware`). (Done.)
4. **Emulator icons** in Settings → Emulators → Texture Packs (and elsewhere) instead of the placeholder box, same size.
5. **Turn textures on from Cartridge** where the emulator allows it (owner asks; changes the emulator's own setting, recorded and reversible).
6. **Patches, cheats and textures for more consoles** (PSP, GameCube, Wii and others that support them).
7. **Achievements All:** console logos instead of console names, at the text's size; RetroAchievements and Trophies tabs the same.
8. **RPCS3 game updates** from the PS3 update list (owner's link, ps3.aldostools.org/updates.html, which reads Sony's own update XML per serial): offered when the ISO or installed version is older; in a new Emulators tab, "Game updates".
9. **Emulators tab split from Steam, overhauled** with pages like Look & Feel (Emulators, Game updates, Texture packs, Patches...). **Update emulators from Cartridge**: check installed versions against their releases.
10. **Controller navigation across the board:** down/up goes to the item directly below (nearest by horizontal position, then the first in that row), never skipping a row; left at the start or right at the end of a row stays in the row; moving between rows goes to the first item of the next row (owner); game page: Ready to play → See all, not a trophy.
11. **Game page More:** Steam and Emulator split into two tabs (Steam: add/remove, add to collection; Emulator: patches, texture packs, file location). New "Options" tab: Hide, Delete, Re-download. Manual moves to Details and Artwork. Header row: Ready to play and More only.
12. **Add to Steam collection** from the game page when it isn't in one.
13. **Steam artwork for games** in the same style as Cartridge's own (icon, grid, hero, logo).
14. **Patches sheet:** focus box clipped by a dark line; plain white focus box.
15. **Game page:** going up to the header row shows the whole header (scroll to top), not partway.
16. **Continue playing:** console as its logo at text size; device ("on Steam Deck") quieter, contrasting on light and dark backgrounds.
17. **Recommended for you:** drop the "Same series" reason line.
