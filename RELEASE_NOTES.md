## Cartridge 0.9.37 · Set Up for You

### New
- **BIOS and firmware put in place by themselves:** after an emulator is installed and after files come from RomM, Cartridge copies BIOS files into every emulator that reads them from a folder (PCSX2, DuckStation, RetroArch and the rest, never over a file), installs PS3 firmware in RPCS3 and Vita firmware in Vita3K when they don't have it, and puts Switch keys and firmware where Eden and its family read them. In the welcome the BIOS comes before the emulators, so the firmware now waits and installs as soon as RPCS3 or Vita3K is there, instead of failing.
- **BIOS and Firmware in Setup and Health** (Settings → Emulators): each console in your library that needs them, Ready or Missing, with Put Everything in Place and Get Them from RomM.

### Changed
- **Downloads from add-on sites:** the moment a download starts, the page closes and Downloads opens, where the file shows downloading and then installing.
- **Cemu's Add-ons tabs** show only the groups a game has, each with its count, and say when more packs exist for another region's copy only (Cemu won't load those for yours).

### Fixed
- **Cemu Enhancements, Mods, Workarounds and Cheats coming up empty:** on Bazzite (and other systems where home is a link) Cemu keeps the real path of a game, so Cartridge couldn't find the game's title ID. Real paths are compared now, and the name Cemu lists for the game is used when the path doesn't match. Checked against the real community graphic packs.
- **3DS mods for Azahar and Citra** went into the textures folder, where Azahar doesn't load them. They go in load/mods/<title ID> now; texture packs stay in load/textures.
- **Switch mods:** Atmosphere-style exefs_patches, loose .ips and .pchtxt patches, loose cheat files and romfs_ext are arranged the way Eden, yuzu and Ryujinx load them.
- **Focus in About, Its Games and Linked Folders:** rows show the plain fill like every other list, without a ring cut off at the top.
