## Cartridge 0.9.3 J · Sturdier with every RomM version

### Changed
- **RomM versions.** Cartridge reads each game from RomM so that a missing, empty or unexpected field (older servers, newer ones, or a broken entry) never stops a library sync. New tests cover a current RomM, an older one without metadata, and odd values.
- **Emulator for this game** has a test making sure a game's own emulator pick always beats its console's, and falls back to the console's when that emulator is gone.
