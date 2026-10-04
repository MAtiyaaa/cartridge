## Cartridge 0.9.28 · The Dock

### New
- **Rows of games move along by themselves:** Recently Played, New in Your Library, Favourites, Recommended and a console's games on Start show their next game every 20 seconds or so, one row at a time, with the art fading across and the covers gliding along. A row you step through with L1/R1 waits a while before moving again, and nothing moves while you arrange, in a pop-up or with reduced motion.
- **Go to Game Page** is the first option in More on a game's achievements or trophies (RetroAchievements, trophies and gamerscore). A trophy list not linked to a library game asks which game it is first; an achievements list not found in your library searches for it.
- **The Dock:** the bar of tabs now sits at the bottom, centred, as a floating pill, with its own strip so pages are never cut off under it. Move it to the top or left, align it, and pick Glass, White, Black or Accent in Look & Feel → Text and Cards → Dock.
- **Button hints are hidden** unless you turn them on (Look & Feel → Text and Cards → Button hints). They still show while you arrange Start.
- **Start's page overview shows your real pages:** each tile's cover, the clock, your pictures and widget names. The page you pick up lifts with a "Moving" badge and the others slide out of its way. Open it with L1/R1 while arranging.
- **Start tips:** a short tour of Start the first time you open it.
- **New widgets:** Console Spotlight (one console's games taking turns with their art) and An Emulator (its version and update status; A opens it).
- **Picture widget searches:** find a 4K wallpaper (Wallhaven, safe for work) or a GIF (Openverse, openly licensed) right in Cartridge.
- **Add a Widget in tabs:** Games, Consoles, At a Glance, Pictures and Fun.
- **Frame generation from a game's menu:** More → Steam → Frame Generation, and always in its Game Settings, saying why when it can't apply.
- **Cemu packs with choices:** packs like a resolution pack show their options under them, and the one you pick is saved in Cemu.
- **Emulators from a GitHub link update** from their own project's releases.
- **Syncthing in Game Mode:** keep it running in both modes (Settings → Syncthing → Keep Running in Game Mode, and turned on after installing it in the welcome).

### Changed
- **Big widgets fill their space:** the trophies widget leads with the newest unlock as a card, tall library and console tiles show a row of covers, and the storage widget shows each console's small icon, with names only where they fit.
- **Add-ons on the Downloads page:** Install takes you there, and the pack shows with its game's cover and logo while it downloads and unpacks.
- **Emulators settings reordered:** Emulators, Game Add-ons, Setup and Health, Console Folders. It opens on Setup and Health when something needs attention.
- **Smoother on handhelds:** without the GPU the animated background holds still, the blur behind game art is lighter, and Home's lower rows aren't drawn until you get near them.
- **Title Case** for every widget name and heading on Start.

### Fixed
- **PS3 and PS4 games had no Add-ons on their page** after patches moved into Add-ons in 0.9.24. Game More → Emulator → Add-ons is back for them and shows only what the console has: shadPS4 Patches and GoldHEN for PS4, Patches and Game Updates for PS3.
- **The PlayStation 4 Steam page** ran its shadPS4 option into the games list on handhelds; it sits inside the emulator panel now.
- **Unnamed PS4 games:** a PS4 game that isn't installed on this device (only its trophy code, like NPWR06616_00) now takes its name and library game from the device that has it installed, through the trophy notes it already writes to RomM. The name is remembered on this device afterwards.
- **Touch:** swipes now scroll even on systems that send no movement between the finger going down and up, or send it under another pointer. Before, only Start's page swipe worked there.
- **Pages slid sideways** when a card near the edge was highlighted, which cut off Home and clipped rows on game pages and in achievements.
- **Home's header ran off the top** of the screen with the Dock at the bottom.
- **Dreamcast's logo** was cut off under game cards.
- **Console chips in Game Add-ons** were clipped when selected; they use the normal highlight now.
- **Recently Played** sat its name right on the game's logo.
- **Cartridge opened on Home** for a moment before Start.
- **Onboarding:** Back from the Cartridge Installer trapped you in it; each step now starts on its main button instead of Back.
- **Syncthing Games** only found a few games: the main server's folders are read too, each folder gets its own limit, and texture folders named by game ID (GameCube, Wii, 3DS) are matched.
- **Game Settings** showed nothing for some games; it now says why.
