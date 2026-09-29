## Cartridge 0.9.6 · Emulator Expansion

### New
- **The ARM emulators.** Play now starts games in ARMSX1 (PS1), ARMSX2 (PS2, including the debug build), ARMSX3 (PS3), EmuCoreX (PS2), EmuCoreC (PS3), aX360e, XenDroid and Xenra (Xbox 360), hakuX (Xbox), BachataS4 (PS4), Citra MMJ (3DS), SkyEmu (Game Boy, GBC, GBA, DS), NooDS (also GBA) and MAME4droid (arcade). Their launch methods are the ones the big frontends use.
- **PS Vita, PS4 and Xbox consoles.** Vita3K and EmuCoreV start a Vita game from its title ID when the game's name carries it (like `[PCSB00245]`), BachataS4 a PS4 game from its CUSA ID. ARMSX3 can start from either the file or the title ID.
- **Emulators that can't be told which game:** RPCSX, shadPS4 and Xenia are found by name and Play opens them, with a note to pick the game inside. The same happens for Vita3K, EmuCoreV or BachataS4 when a game has no title ID in its name. Ready to play says "opens the app" for these.
- **Firmware and BIOS checks** for PS3, Vita and Xbox, with the same "I have it" confirmation.
- **A new app icon.** The launcher icon, round icon and splash use the current Cartridge mark on a dark tile, replacing the old purple one.

### Fixed
- **Genres on the second screen.** Highlighting a genre now shows it (its name, game count, covers and Open), and Open takes you to that genre. Series and Cartridge's own lists are labelled as what they are instead of "Collection".
- **Pictures on Collections, Series and Genres.** The tiles used lazily loaded images at fractional sizes, which some Android WebViews never started loading. They now load straight away with fixed sizes, and try again if the image server wasn't ready. The covers on the second screen no longer rely on a newer layout feature either.
