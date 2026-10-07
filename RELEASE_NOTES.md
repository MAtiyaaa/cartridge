## Cartridge 0.9.52 · Mods, Offline and a New Welcome

### New
- **A new welcome.** A new opening: the Cartridge mark draws itself, fills and lights up, and the name rises. The setup is in a clearer order: RomM first, your name with your look, controls only when your own controller is found, Cartridge in Steam on the Steam step, and a progress bar along the top.
- **Made for Game Mode.** The very first time Cartridge opens on a desktop, it offers to add itself to Steam, waits for Steam to restart, says "See you in Game Mode" and closes, so you set it up with your controller. Set Up Here Instead carries on at once. It is never shown again.
- **Mods from more places.** GameBanana, EmuCoreX texture packs, Nexus Mods (add your own key in Settings → Look & Feel → Metadata) and ROM hacks (Beta) in one sheet. The right stick, or the chips, switch between them.
- **The mod rule book.** Cartridge knows where each emulator keeps mods (PCSX2, DuckStation, PPSSPP, Dolphin, Azahar, Cemu, Eden and its forks, Ryujinx, shadPS4), what a mod must contain and what has to be switched on. Each emulator shows what it takes. Mods are only offered for emulators Cartridge knows how to install into, and anything that doesn't match is refused instead of being unpacked somewhere.
- **ROM hacks (Beta).** IPS, UPS and BPS patches: with RetroArch the patch sits beside the game and RetroArch applies it as the game loads, so nothing is changed; for other emulators a patched copy is made beside your game.
- **Away from your server.** When RomM can't be reached (a server at home with no tunnel), your saves stay on this device and go up the moment Cartridge can reach RomM again. Keep playing as normal. If another device played the same game meanwhile, you choose which save to keep.
- **Your library offline.** Every game's cover is kept small on this device (about 25 KB each), so the whole library still looks right away from your server. Downloads say plainly that the server can't be reached.

### Changed
- **GIF search for Start's picture widget** now searches Tenor first: about 50 relevant GIFs a search, with safe search on. More brings another batch.
- **Every animation** now uses the Cartridge Animation Engine's timings: one set of fades, springs and moves across the whole app.
- **Steam shortcuts** are built with the Cartridge ID Engine. They come out exactly as before (checked against hundreds of saved cases).
- **Turned down and removed from plans:** Ryujinx saves, PlayStation Network sign-in, pausing Syncthing, more languages and PS3 mods.

### Fixed
- **PS3 firmware installs** were reported as failed although they worked (RPCS3 ends without a clean exit). Cartridge now reads RPCS3's own log, and closes it once done.
- **Start picture tiles** have a soft shade behind their label so it stays readable.
