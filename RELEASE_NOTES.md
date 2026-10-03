## Cartridge 0.9.19 · Start

### New
- **Start: a menu you arrange yourself.** A new tab of tiles: Continue playing (LB/RB through your recent games), Clock, Storage, This week (play time by day), Consoles, New in your library, Recently played, Latest trophies, Downloads, Favourites, Recommended for you, Surprise me, and any game or console you pin.
  - Hold A on a tile (or press and hold with a finger or the mouse) to arrange. A picks a tile up and the D-pad moves it, X changes its size ("4 by 2"), Y removes it, B is done. With touch or a mouse, drag tiles where you want them.
  - **Pin to Start** is in a game's More menu.
  - Look & Feel → Top Bar → **Open on** picks the menu Cartridge starts on.
- **Backgrounds are styles now.** The console scenes are gone. In their place, built the way Ribbons is:
  - **Aurora:** curtains of light.
  - **Contours:** slow height lines, like a map.
  - **Drift:** soft lights floating by.
  - **Tide:** a sea of points rising and falling.
  - If you had a console scene picked, you now see that console's games panning.
- **Vita games install in the background,** like RPCS3, without opening Vita3K. Unencrypted .vpk, .zip and folder dumps are unpacked by Cartridge the way Vita3K's own installer does it (game, update and DLC folders). NoNpDrm dumps still need Vita3K to decrypt them, so Vita3K runs with no window.
- **Texture packs already in place show a green check,** with whether Cartridge installed them or they were added outside Cartridge.
- **Get Emulators:** Xbox 360 (Xenia Edge), Saturn, arcade (MAME, Supermodel), ScummVM and ares.
- **Switch .xci files** (and .nsp files without a ticket) have their title ID read from the game itself, using the keys your Switch emulator already has, for mod folders.
- **Syncthing, first look** (Settings → Storage → Sync): Cartridge finds your Syncthing and shows what it shares and with whom, and which folders look like emulator saves. It changes nothing.

### Changed
- **Top bar redesigned:**
  - each tab is its icon, and the current one opens out with its name over a short line;
  - search folds into a button until you use it;
  - status is one tidy group.
- **Pages move with you:** a tab slides in from its side, a deeper page settles in, back eases out. Reduced motion keeps a plain fade.
- **Home's media bar is larger,** and each new picture settles in once.
- **Emulator downloads and updates:**
  - releases are read from each emulator's own sources: GitHub, plus Eden's and Ryujinx's own servers;
  - shadPS4's launcher comes as a .zip and is unpacked;
  - an emulator falls back to its Flatpak when there's no AppImage;
  - downloaded AppImages get one lasting name (like `DuckStation.AppImage`) and updates never rename them, so launch options keep working.
- **GameBanana** also finds games whose RomM names are written "Title, The".
- **RomM on this device:**
  - the server name you pick becomes the server's own host name;
  - adding IGDB and ScreenScraper keys is a step straight after setup.
- **Trophy names** are remembered for PS3 and Vita games too, so a code never shows where a name was known.

### Fixed
- **RPCS3 patches showed none.** RPCS3's patch list can name a key twice, which RPCS3 accepts but Cartridge's reader rejected, throwing the whole list away. Cartridge now reads it as forgivingly as RPCS3 does.
- **Vita3K installs:** "no Qt platform plugin could be initialized".
- **403 errors:** when a site answers with a browser check, Cartridge passes it once in a hidden window, as a browser would, then retries. Sony's "403" for a game with no update list now means no updates.
- **Steam games from a failed apply** no longer count as added: they're dropped from Cartridge's list at start.
