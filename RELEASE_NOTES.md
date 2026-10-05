## Cartridge 0.9.32 · In the Background

### New
- **Background jobs:** emulator downloads and updates, emulators from a GitHub link, shadPS4 versions, PS3 game updates, game installs, BIOS downloads and the Syncthing install keep going when you leave their screen. They are listed under In the Background on the Downloads page, and each screen shows the job again when you come back to it.
- **Downloads from add-on websites:** an add-on's page (Its Page, or a featured pack) now opens in a Cartridge window instead of your browser. Click a download there and Cartridge catches the file, shows it in Downloads and installs it for that game, the same way as Install a Download. Escape or Back to Cartridge closes the page.
- **Mods sorted your way:** GameBanana mods are sorted by Most Downloaded (the default), Most Liked, Newest or Recently Updated, and each one shows its downloads and likes.
- **About for every game:** Game More → Options → About shows its console, file, serial or title ID, version, where it is, and what is installed or turned on for it: texture packs, mods, patches and cheats, and its own emulator settings. A on a line copies it.
- **Cemu graphic packs:** Cheats are a group of their own (Mega Cheats with every option), next to Enhancements, Mods and Workarounds. Each pack shows its name, its options show before it's turned on, and Download Latest Community Graphic Packs fetches the newest set.
- **Start widgets:** Game Disc or Cartridge (a console's game as its disc or cartridge) and Game Shelf (a console's games as spines on a shelf).
- **GitHub releases as .zip or .tar:** an emulator from a GitHub link that comes as an archive (the GR2 fork, for one) is unpacked into its own folder, and you pick the program when there is more than one.

### Changed
- **Steam collections, rebuilt:** one row per console with the Steam collection its games go into. A uses one of yours, renames it to Cartridge's name or picks another of your collections. Refresh reads Steam again, and Steam itself is read when it's reachable. Your other collections are listed below, left as they are.
- **Latest Trophies tile:** the newest unlock is a card with its game's art, then your games' progress and earlier unlocks, with no empty space. The first trophy is bigger at medium size.
- **Start tiles:** names and lines wrap onto a new line instead of being cut off with "…". The week tile is filled at 1x1, the storage tile sits clear of the bottom edge, and Recently Played covers keep one size from game to game.
- **Syncthing games:** two rows of chips, one for the console and one for the kind of file (saves, textures, patches, updates, mods), and the header text uses the full width.
- **Mods header:** the emulator, its folder, your copy and custom textures sit in one tidy card under the emulator name.
- **The Dock is black by default** for everyone, and pages fade out above it instead of ending in a hard line.
- **Steam settings** show in one go, and at once on later visits.

### Fixed
- **Vita3K still shown as installed after Delete:** an EmuDeck launcher only counts while its emulator is still there.
- **Home rows:** the first card's focus ring is no longer cut off on the left.
- **Collections deleted in Steam** no longer show in Cartridge (Steam keeps recent changes in a second file, which is now read too).
- **The Steam logo in the progress ring** is upright.
- **The lit dot next to Settings** is gone.
- **Console cards:** the console name and the maker's logo no longer run into each other.
