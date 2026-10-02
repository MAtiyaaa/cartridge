## Cartridge 0.9.12 · The Big Merge

Everything from abdu2304's 0.9.3 (parts A to J), with Android versions of the parts that were desktop only.

### New
- **From abdu2304's 0.9.3:** Settings → Emulators with an Issues list and a dot on the Settings tab; PS3 games from `.pkg` installed in RPCS3 (with their `.rap` licences), Vita games installed in Vita3K, PS3 and PS4 patches from RPCS3's and shadPS4's own lists; more desktop emulators (DeSmuME, Mupen64Plus, Snes9x, Mesen, Play!, Kronos, Xenia Edge, PrimeHack) and RetroDECK; critic score and age rating badges on game pages; the idle screen shows the game's logo and the console's logo; Report a problem in Settings → About; Home rows of 15 with Show all; a progress ring while a game is deleted.
- **Settings → Emulators on Android.** Issues lists what stops games on this device from starting: a console with games but no emulator installed (with a button to get one), a BIOS that's missing or can't be checked, and PS3 or Vita packages still to install in the emulator (it opens the emulator and tells you which file; mark it done after). Below that, each console shows which emulator opens its games, and you can pick one. The Settings tab gets the same dot as on desktop.
- **Report a problem on Android.** The report lists the device, Android and WebView versions, the emulators installed and which one each console uses, with no paths or addresses. Open a GitHub issue opens your browser on this fork's issue page.

### Changed
- **One RomM tab in Settings** (Connection, Library & Sync and Upload together), and Console Folders moved into Settings → Emulators.
- **Refresh Library.** The Quick Menu's first tile asks RomM to look for new files, then pulls new and changed games, in one go.
- **Game page More is shorter:** Steam and emulator options, and details and artwork, are in their own lists. On Android, Emulator for this game and Open in a PC game app are under Steam and emulator.
- **Sturdier with any RomM version.** Missing or odd fields from older or newer servers no longer stop a library sync.
- Problem reports from this fork's builds go to this fork's GitHub issues.

### Fixed
- Settings keeps your section after an action, and a quick right press no longer loses focus. The D-pad stays in the list you are scrolling.
- Desktop: Cartridge quits fully within 3 seconds, and stops background work while a game runs.
