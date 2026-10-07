## Cartridge 0.9.51 · Cartridge Save Sync

### New
- **Cartridge Save Sync.** Your saves kept on your own RomM server and brought to every device you play on. Turn it on in Settings → Saves and Sync. It covers Eden, RPCS3, shadPS4, PCSX2 (whole memory cards), DuckStation, PPSSPP, Vita3K, Dolphin, Cemu, Azahar, Xenia, and RetroArch saves and save states.
- **Cartridge Cloud Sync before a game.** Like Steam Cloud: when you start a game from Cartridge, its saves are checked with RomM first and the newest is brought here. Games started from Steam sync when you come back to Cartridge. After you play, your saves go to RomM, and every 30 minutes anything that changed.
- **Safe by design.** A save is never changed while its emulator is open. When two devices changed the same save, Cartridge asks which to keep and never guesses. The one you don't pick stays in RomM as an older version, and 10 older versions are kept on this device too.
- **Saves in RomM on every game** (More): sync now, or put an older version back.
- **Saves and Sync → Advanced:** choose Cartridge Save Sync, Syncthing or no save sync. A device uses one or the other, never both: while Syncthing syncs your saves, Cartridge Save Sync stays locked until you stop using Syncthing for saves.
- **CIDE, the Cartridge ID Engine.** Everything Cartridge has learned about game IDs and serials (PlayStation serials, Nintendo title IDs, GameCube, Wii and Xbox 360 IDs) in one engine: what each console's ID looks like, where it's read from the game, and which consoles have none. Detection works exactly as before.

### Changed
- **QR pairing** now asks RomM for permission to store saves. If you paired with a QR code before, pair again to use Cartridge Save Sync.

### Fixed
- **Home no longer jumps** when scrolling down after coming back from a game page.
- **Button pictures** in the tour and hints sit centred in the text again.
- **The tour's search step** (press Y) now counts on every page, so the steps after it work.
- **Change Icon** works on Achievements again.
- **Touch in Settings:** tapping a section highlights it in the list, as the controller does.
