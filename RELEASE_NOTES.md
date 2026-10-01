## Cartridge 0.9.11 · The Bridge Expansion

Fuse and other launchers can now do much more with Cartridge: see every game it downloaded with RomM's details and pictures, follow its downloads game by game, and hand it games to upload to your RomM server. The details for launcher developers are in `docs/FUSE_BRIDGE.md` (bridge protocol 3; apps made for the 0.9.10 bridge keep working).

### New
- **Fuse can show your downloaded games with their details.** Launchers like Fuse now see every game Cartridge downloaded with RomM's description (in full), year, genres, developer, publisher, rating, players and series, plus its cover, logo and screenshot. Cartridge hands the pictures over itself, so Fuse never needs your RomM sign-in; a missing picture of a downloaded game is fetched once in the background.
- **Downloads game by game for other apps.** Fuse can list what is downloading, waiting, paused, failed or done, with each game's progress.
- **Upload games to RomM from Fuse.** In Fuse, a game's options have "Upload to RomM", and the Cartridge tab has "Upload a game". Cartridge opens with what it would send: the game's files (every disc, and DLC and updates in their own folders), the console on your server and the size. Nothing is sent until you press Upload. The first file becomes the game on RomM; Cartridge asks RomM to add it (with a password sign-in) and puts the other files in its folder, which needs RomM 5.3 or newer. Progress shows on the page, in Android's notification and in Fuse.
