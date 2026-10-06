## Cartridge 0.9.49 · Every Corner

### New
- **Vita3K that really starts.** Cartridge now runs Vita3K once (asking only for its version, no window) to check it can start on your system, instead of only checking its files are there. A copy that can't start (EmuDeck's Qt 6 build on a system with a different Qt, a build for a newer system than yours) is marked Repair, an update that wouldn't start is replaced by the last build that does, and when a game closes straight away Cartridge tells you why in plain words (for example: the game isn't installed in Vita3K yet).
- **Every emulator, known properly.** Cartridge keeps one list of what it can do with each emulator and each console: how it can be installed, how it's started, its website and download page, where its updates come from. A test checks that nothing offered in Get Emulators can't be started and that every console either has a way to play or says why not. Supermodel (Sega Model 3) now starts its games, Citron gets updates, and PPSSPP's folders can be moved like the others. Get Emulators has Open Its Website and Open Its Download Page.
- **Find a Setting.** Press Y in Settings (or pick Find a Setting) and type what you're looking for.
- **Always Ask where games go.** Settings → Library → Games and Storage can ask which drive each download goes to.
- **RomM on this device uses your games folders.** Set up RomM on this device now offers the games folders you already have (pick one or several), so the games already in them show in RomM. Nothing in them is moved. If two folders have the same console, RomM shows the first one you picked and Cartridge tells you. When RomM is already linked, the page says so in green and offers Set Up Anyway.
- **A new Quick Menu.** Start opens a floating panel with the time, where you're connected, your library and downloads at a glance, switches for Sounds, the Performance Overlay, Screenshot and Fullscreen, then the actions.
- **A new colour picker.** Custom Colour shows a small Cartridge in your colour while you choose, with Hue, Vividness and Brightness sliders that work with the D-pad, touch and mouse, and suggested colours.
- **Saves in the welcome.** The saves step lets you choose Cartridge Save Sync (your saves through your own RomM; coming soon, Cartridge turns it on when it's ready) or Syncthing.
- **Start pages.** The page overview has an Add Page card after your last page, and moving a page to another row fades it there.

### Changed
- **Settings, sorted.** Settings has clearer sections: Library, Emulators, Steam, Achievements, Saves and Sync, Look & Feel, Controls (with the controller test), Downloads and Updates, Help and About. Each starts with a line saying what's in it.
- **Achievements on one page.** Your latest unlocks and every game you've played, in a grid or a stack, sorted the way you like. Game names are text, so they always read.
- **Unnamed PS4 games get their names everywhere.** When one of your devices knows a PS4 game's name, it's saved with your trophies in RomM, so every other device shows the name too.
- **The hello slides out of the Dock.** Good morning (or afternoon, or evening) now slides out beside the Cartridge logo, letter by letter, and tucks back in.
- **Games folders by drive.** Your games folders are named after the drive they're on (Main Drive, or the SD card's name), every folder is listed, and Auto-detect shows each folder's drive, consoles and games.
- **SONY is back on the PlayStation 3 card,** as on PS1, PS2 and PSP. Console logo sizes are now written down and checked, so they stay as they are.
- **A green tick** marks what's chosen in menus.

### Fixed
- **New games went to the SD card when you picked This Device.** "This Device" was the name of your main games folder, wherever it was; on a Deck whose main folder is on the microSD, that was the card. Folders are named by their drive now.
- **Trophy notes failed with error 500.** RomM allows one note per title on a game, and Cartridge wrote several games' trophies under the same title on one game. Each now has its own.
- **The background made people feel sick after a while.** The game art behind pages slowly zoomed, and when idle the background stepped at 8 frames a second. The art stays still now (the header picture only drifts a little sideways), and when you're idle the background slows to a smooth stop instead.
- **Glass showed sharp strips** along the top and left of the keyboard, sheets and the Dock. Fixed in dark and Light.
- **Light Glass buttons looked like black frosted glass.** The main button is bright glass now and focus is a clean dark.
- **The tour's A stopped working** after Continue took you to another page. Its button keeps focus now. The tour's button glyphs are centred and its spotlight stays on screen.
- **Tapping Settings' list did nothing** on a touch screen. Fixed.
- **Missing from Steam's search** opened before the list. Fixed.
- **Home:** a line at the top of the header with the Dock at the bottom, a flicker when coming back to Home, and a stutter going back from a game are gone.
- **Start:** stray "add" bars in page overview pictures, no focus ring while arranging on OLED, and Light tile shadows cut off.
- **Get Emulators:** the D-pad now moves down a column of cards instead of jumping across.
- **Focused achievement cards** had dark text on a dark card in Plain and OLED.
- **Text cut off** in places a new check found; it now runs before every release.
