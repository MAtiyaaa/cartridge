## Cartridge 0.9.3 K · One place for trophies, and a calmer look

### New
- **One trophy home.** Achievements opens on All: RetroAchievements and emulator trophies together, the latest unlocks from both in one row, and your games grouped by console with the same card for each. LB/RB still reach RetroAchievements and Trophies & Gamerscore on their own.
- **Recommended for you** on Home, and better **Similar games** on the game page. They use IGDB's similar games when your RomM server has them, but also work without IGDB: series, studio and genres from whatever metadata RomM has, weighted by what you play. Every card says why it's there.
- **Rumble** (Look & Feel → Motion and Sound): None, Low, Medium or High, a light buzz when you move and select.
- **PCSX2 patches.** PS2 games get Patches in the game page's More, from PCSX2's own patch list, saved in PCSX2's settings for that game. As with RPCS3 and shadPS4, Cartridge only turns off patches it turned on. PCSX2 must have the game in its game list.
- **shadPS4 core without the launcher.** PS4's emulator choice now offers "shadPS4 core · without the launcher": the version the Qt launcher has selected, started the way the launcher starts it. It is there to test the black screen some PS4 games show on their first start.
- **PS4 trophy names without opening the game first.** With the trophy key set in shadPS4, Cartridge reads each installed game's trophy list itself (into its own folder, never shadPS4's).
- **Flatpak Steam.** Games added to Flatpak Steam, and Cartridge's own entry, now start your emulators outside Steam's sandbox. Settings → Emulators → Issues offers the one permission Steam needs for it.
- **Xenia's Windows build** (xenia_canary.exe) is found and started through Proton.

### Changed
- **Look & Feel** is five short pages (Theme, Background, Text and Cards, Motion and Sound, Controls), LB/RB to move between them, with rarely used options under Advanced.
- **One sheet for secondary things.** The game page's More, Show and sort in the Library and on Achievements, and a console's More open as one sheet from the bottom, its groups as tabs (LB/RB).
- **Headers** on Home and the game page are bigger and fade into the page with no edge. With a SteamGridDB key they use its sharpest background (4K first), also on the idle screen.
- **Connection** in the top bar is a small icon next to the clock (house for LAN, globe for Tunnel), with colour only when offline.
- **Trophy games known only by a code** (shadPS4 NPWR…, some Xenia games) take their name from your other devices or your library.
- **Controller:** the stick only moves the way you push it most, and no longer double-moves when resting near the edge.
- **RomM version check:** a server older than RomM 3 shows in Settings → Emulators → Issues instead of features failing one by one.
