## Cartridge 0.9.3 D · Vita games

### New
- **Install in Vita3K.** Vita games that come as `.pkg`, `.vpk` or `.zip` get an **Install in Vita3K** button on their game page once downloaded. Nothing installs until you press it.
  - A `.pkg` installs without opening Vita3K. It needs its zRIF key: Cartridge reads it from a text file that came with the game, or asks you for it.
  - A `.vpk` or `.zip` opens Vita3K, which starts the game once it's installed. Close Vita3K to finish.
- Steam shortcuts start these games by title ID, as before, and work as soon as the install is done.
- After installing, Cartridge offers to delete the downloaded file, which isn't needed to play any more.
- **Safe delete.** Delete can also remove a game Cartridge installed in Vita3K, after a clear confirmation and the same checks as for RPCS3. Only that game's folder goes; saves, DLC and licences stay.

- **Licences.** A Vita game installed without a licence now says so, instead of looking ready and then not starting.

### Changed
- **Game page More is shorter.** Favourites, Play status, Add to a collection, Timeline and Hide stay at the top. Steam, emulator and file options are under **Steam and emulator**; artwork, details and theme are under **Details and artwork**. B goes back to the first list.

### Fixed
- **PS3 games from packages: "Failed to decrypt content".** PSN games need their licence file (`.rap`) next to the `.pkg`, and RPCS3 only finds it under the exact name `<content ID>.rap`. Cartridge now finds the `.rap` itself, in the download or in RomM, and hands it to RPCS3 under that name whatever it's called. Without it, nothing is installed and Cartridge says "RAP file not found". The install screen says this before you start. Games already installed without one get a **Get licence (.rap)** button on their game page, which finds it the same way.
- **PS3 games from packages and Steam.** Before they're installed, they show on the PS3 console page as needing to be installed in RPCS3 first, instead of getting a shortcut that can't start. Once installed, a shortcut Cartridge already made is updated to start the game from RPCS3. If **Add automatically** is on, a new shortcut is added; otherwise the game shows on the console page ready to add.
