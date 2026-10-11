## Cartridge 0.9.31 · Quick and Clear

abdu2304's 0.9.54 to 0.9.64. On Linux, Cartridge works exactly as his 0.9.64 does, with this fork's phone remote and Fuse bridge on top.

### New
- **Pure Black.** Look & Feel → Theme → Advanced has a Pure Black button for Highlights, Buttons and Progress Bars.
- **Dots on Console Spotlight,** as on Continue Playing, and L1/R1 steps through the console's games.
- **Game names suggested as you type** in search, also when you type with another keyboard than Cartridge's own.
- **Linux (from abdu2304):**
  - **Game Settings for every installed game,** read from each emulator's own source: Eden, Ryujinx, Azahar, Cemu, Vita3K, Xenia Canary, Flycast, MAME, Supermodel and RetroArch (with 62 cores' options), and fuller lists for RPCS3, PCSX2, DuckStation and shadPS4. Settings follow the emulator version you have.
  - **The save locator:** saves are found where each emulator's own settings say, Where Your Saves Are lists every place, and Search for Saves looks through your drives. A page for each game's saves, with its history and backups.
  - **Save Sync between devices** now meets on one RomM entry per game, across forks (Eden, Citron, yuzu) and between devices that matched the game differently.
  - **Choose which files to download** when a game is several separate files in RomM.
  - **Xenia Canary patches** in Game Add-ons, and Xbox 360 title IDs read from the game.
  - **Forks belong to their emulator,** link to their GitHub project, keep earlier versions side by side, search GitHub by name, and get a link sent from your phone.
  - **Install progress** for PS3 and Vita packages, **Update All** for emulators, **Repair** for RPCS3's settings file.

### Changed
- **Dark Glass is smoked black glass,** with crisp edges instead of a milky grey film. Light Glass, Plain and OLED Plain are unchanged.
- **Focus and chosen look as they did before:** focused cards have their ring, buttons and rows their fill, chosen things a thin ring in your highlight colour.
- **Snappier motion.** Pages, going back, opening a game and pop-ups start at full speed and settle sooner; Start's page turns are quick again.
- **The background keeps moving** while you're in Cartridge, and stops only while a game or another app is in front.
- **Light and OLED set your colours:** Light makes Highlights, Buttons and Progress Bars black, OLED white.
- **Cards stand out in Light,** with softer shadows that aren't cut at the bottom of rows.
- **Media Bar sizes** are Compact, Medium and a bigger Large (Android still starts on Compact).
- **One row of tabs** in the game page's More, scrolling, with the chosen tab always in view.
- **Background menu:** Your Theme Colours, Their Own Colours and Other. A console or game picture background you already use keeps working.
- **Settings → Library** opens on Games and Storage, RomM Server second.
- **Ready to Play** looks like the Download button, with a green tick.

### Fixed
- **Media Bar Size** works again.
- **Recently Played on Start** crossfades to the next game once its picture has loaded, instead of cutting or going see-through.
- **Search clears** when you go to another tab.
- **Moving down in a pop-up** no longer jumps to Close when the next item is still out of view.
- **Long folder paths** on the game page wrap instead of running together.
- **Pale text in Light** on trophy and RetroAchievements game pages.
- **Linux (from abdu2304):** no freeze a few seconds after start (Flatpak), none every half hour (Save Sync) or every minute (trophy watcher); pictures are shrunk off the main thread, so the controller and every button answer quicker; RPCS3 game settings are saved where RPCS3 reads them on Linux; .wua games' title IDs; Vita3K installs without its window opening.
