## Cartridge 0.9.37 · Set Up for You

### New
- **An interactive tour:** instead of a few cards, the tour now points at the real screen and asks you to do each thing yourself: move to the next tab, open search, close it, jump to Downloads, open the Quick Menu. It moves on once you've done it, with a controller, the keyboard, a mouse or touch, and shows the right button for what's in your hands. Settings → About → Take the Tour runs it again.
- **Keyboard and mouse, properly:** Tab and Shift+Tab step through the screen, Ctrl+Tab and Ctrl+Page Up/Down change tab, 1 to 9 jump straight to a tab, Ctrl+F or / searches from anywhere, Ctrl+J opens Downloads, Alt+Left and the mouse's back button go back, Home and End go to the first and last thing in a list. Right-click a game for Open, Download or Ready to Play, and Favourites. F1 or ? lists every key.
- **Fluid motion:** pop-ups open from the button you pressed and close back towards it, and can change their mind half way. Bottom sheets come up and go down the same way. Presses spring back when you let go, the mouse lifts a game before you pick it, controller scrolling glides as one smooth motion when you press quickly, and a game's cover flies from its card into the game page and back (with the GPU). Without the GPU it stays light: fades only.
- **Background and Elements:** Panels is split in two. Background (Solid, Glass, OLED Black) is the page behind everything; Elements (Plain, Glass, OLED Black) is the cards, panels, buttons and the highlight. With Glass elements the white highlight is frosted glass with light text.
- **Game pictures that aren't stills:** the art behind Home and the game pages drifts and zooms very slowly. With the GPU only, paused behind a game, off with reduced motion.
- **PS5 emulators:** SharpEmu and KytyPS5 in Get Emulators. Cartridge downloads their Linux builds, unpacks them into ~/Applications, makes them runnable, keeps them updated and adds PS5 games to Steam with each one's own launch options. They're only ticked in the installer when your library has PS5 games.
- **PS5 trophies:** games played in KytyPS5 show their trophies, with names and pictures from the game itself, and sync through RomM like the rest.
- **Find and Link Saves** in Linked Folders: one press links every fork that's ready to the emulator it comes from. Games only the fork has saves for are copied to the original first, so nothing goes missing. Linking one at a time still works.
- **Delete mods and texture packs,** including ones you added yourself: everything in a game's add-on folder goes to the Trash, so it can be put back.
- **BIOS and firmware put in place by themselves:** after an emulator is installed and after files come from RomM, Cartridge copies BIOS files into every emulator that reads them from a folder (never over a file), installs PS3 firmware in RPCS3 and Vita firmware in Vita3K when they don't have it, and puts Switch keys and firmware where Eden and its family read them.
- **BIOS and Firmware in Setup and Health** (Settings → Emulators): each console in your library that needs them, Ready or Missing, with Put Everything in Place and Get Them from RomM.

### Changed
- **Trophies synced from other devices show up sooner:** every game on a trophy console is checked every 30 minutes (and when you press Sync), not only the ones the library last knew had notes, so trophies earned elsewhere appear even where that emulator or game isn't installed.
- **The Cartridge Installer installs Flatpak first** when you pick a Flatpak emulator and it's missing (your password is asked once); the AppImages carry on meanwhile.
- **shadPS4 installs ready to play:** the launcher comes with the newest shadPS4 release as its default version, instead of empty.
- **Downloads from add-on sites:** the moment a download starts, the page closes and Downloads opens.
- **Cemu's Add-ons tabs** show only the groups a game has, each with its count.
- **OLED Black, High Contrast and Extra Round** in Title Case.

### Fixed
- **The Cartridge Installer skipping to the next welcome step after you picked a location:** while the Emulation folder was made the drive button lost focus, so the next press landed on Continue. It keeps focus now, and Continue only shows once installing has started.
- **Emulator updates slow to open and not up to date:** what was known shows at once, then every emulator is checked at the same time, and checks are reused for 10 minutes instead of 6 hours. RPCS3's build number now counts (every build is 0.0.38, so a newer one was never seen), and the build RPCS3 says it runs is the one compared.
- **Cemu Enhancements, Mods, Workarounds and Cheats coming up empty** on Bazzite and other systems where home is a link.
- **3DS mods for Azahar and Citra** go in load/mods/<title ID>, where Azahar loads them.
- **Switch mods:** Atmosphere-style exefs_patches, loose .ips and .pchtxt patches, loose cheat files and romfs_ext are arranged the way Eden, yuzu and Ryujinx load them.
- **Focus in About, Its Games and Linked Folders:** rows show the plain fill like every other list, without a ring cut off at the top.
