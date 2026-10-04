## Cartridge 0.9.24 · Set Up Your Way

### New
- **Cartridge Installer:** Settings → Emulators → Cartridge Installer, and in the welcome. Pick a drive, tick the emulators you want (the first for each console is ticked for you), then watch each install with its own bar. Cartridge makes an Emulation folder laid out like ES-DE and EmuDeck (roms, bios, saves, storage), puts AppImages in ~/Applications where EmuDeck keeps them, and links each emulator's saves and textures into the Emulation folder. Links only: nothing is moved, and nothing already there is replaced. When EmuDeck is already set up, its folders are used.
- **Steam collections:** Settings → Steam → Collections (LB/RB). Cartridge reads the collections you already have and finds the ones for a console by their words (PS2, PlayStation 2, GameCube, Mega Drive and more). Rename each to Cartridge's name ("Sony PlayStation 2") or keep yours. Either way, new games go into the collection you already have. "Add downloaded games to their console's collection" waits until you've reviewed them once.
- **Sync Your Saves in the welcome:** connect to your main Syncthing server, or check this device and install Syncthing (SyncThingy from Flathub, for your user, no password), then pick the folder it shares: your Emulation saves, ~/Sync, or any folder.
- **Emulator folders:** each emulator's menu has Folders. See, open and change where it keeps games, installed content (DLC, updates), saves and textures, written to the emulator's own settings. Works for PCSX2, DuckStation, Dolphin, Eden and the yuzu family, Azahar, Ryujinx, Cemu, RPCS3, shadPS4 and Vita3K.
- **Cemu graphic packs:** Wii U games have Graphics, Enhancements, Mods and Workarounds tabs in Game Add-ons, switched in Cemu's own settings.
- **Add-on details:** A on any mod, texture pack or patch shows all its text, pictures, size, maker and files, with Install at the bottom. Size and maker also show in the list.
- **HenrikoMagnifico's texture packs** for GameCube, Wii and 3DS show on the games they're made for, read live from his site.
- **Add-on downloads** and their unpacking show on the Downloads page.
- **shadPS4: which version ran a game.** The game page shows the version and game from shadPS4's last log.
- **More shadPS4 game settings**, from shadPS4's own code, in Graphics, Advanced and System tabs. Every Game Settings page has tabs (L1/R1).
- **Frame generation per game** in Game Settings. Changing frame generation updates the Steam shortcuts at once.
- **Start:** L1/R1 step through the games on Recently Played and other game rows, and through trophies. New console widgets (a console's games, a console's numbers). Pin a Game opens on Recently Played, then consoles, each listing its games A to Z. In Arrange, LT/RT opens an overview of your pages to reorder them, and the top bar stays put. Turning a page gives a small rumble.
- **Top bar placement:** Look & Feel → Text and Cards. Put the bar at the top, bottom or left, aligned or centred, plain, a floating glass pill or round buttons. Pages slide in from the bar's side.
- **Look & Feel → Metadata:** SteamGridDB key, and Fetch All, or only logos, backgrounds, or covers and screenshots.
- **What's New** in Settings → Updates opens every version's notes.
- **Licences and Acknowledgements** in About: the libraries Cartridge uses, the projects and emulators it works with, and the data it reads, each credited.
- **Onboarding ends on Start** with a short tour of it, and uses EmuDeck's folders when EmuDeck is there.

### Changed
- **Start looks right at any size:** console pictures are never cut off, console cards are close to square with the console's logo, the PS3 trophies and storage widgets fill big tiles, the week's play time is a proper chart, and the page dots sit in their own row below the tiles without an RS button. Cards have a little weight under them, the shine varies from card to card, and the Add a Tile slot is quieter.
- **All cards** sit on the page with a soft shadow instead of floating.
- **Smoother on weaker devices:** when Cartridge draws without the GPU, animations only fade and do less work.
- **Game Add-ons** shows one console at a time, with console chips at the top. The game page's Emulator tab no longer has a separate Patches row: patches are in Add-ons.
- **Auto add to Steam** now applies by itself after a download when Steam can be changed live.
- **Search:** the keyboard grows out of the search box.
- **Idle screen:** bigger game and console logos.
- **Syncthing:** files are labelled with the game and kind (saves or textures), L1/R1 moves between its tabs, and its logo is white in Settings and readable when selected.
- **No internet:** a plain "No internet connection" message instead of raw errors.
- **On-screen keyboard:** press LT twice for Caps.
- **Long pop-up menus:** right on the D-pad jumps to the buttons at the bottom.
- The Nintendo Switch picture is bigger.

### Fixed
- **Controls stopped working after returning from a game** in Game Mode. Cartridge now takes focus back when it's in front again.
- **Touch:** in Game Mode, Auto now treats the screen as touch, so the cursor no longer shows over buttons and scrolling is smooth.
- **Syncthing "refused the key":** Cartridge tries every Syncthing settings file on the device, and a key you paste, until Syncthing accepts one.
- **Emulator icons flickered** while updating.
- **An emulator deleted and installed again** now says where it went and points your Steam shortcuts at the new copy.
- **Downloads of emulators are checked** before they replace anything, so a broken download can't break a working emulator.
- **Switch title IDs** are found from Eden's rules: from the game file, its update or DLC IDs, or the file name.
- **A and B hints in the welcome** sit in the middle of their buttons.
