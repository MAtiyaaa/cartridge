## Cartridge 0.9.0 · Setup

### New
- **Emulator setup.** On first launch, and any time from Settings → Steam → Emulator setup, Cartridge looks for your emulators wherever they are: EmuDeck, Flatpaks, installed programs (including Snap, Nix and Homebrew), Steam's RetroArch, your app menu, Steam ROM Manager's saved setup if you have one, and AppImages in any folder under your home, even renamed ones. It tells which emulator an AppImage is from what's inside it, not its name, so a file called "switch emulator" in Documents is still found and recognised. Each console shows which emulator its Steam shortcuts use, lets you pick another or Browse to any file, and flags anything that would stop a game starting: a missing RetroArch core, a missing BIOS, a Flatpak emulator without access to your games folder (with the command to fix it), or an AppImage that isn't allowed to run. Where it can't be sure, it asks.
- **An emulator for one game.** A game's More menu has **Emulator for this game**, for the one game that runs better somewhere else. Its Steam shortcut updates to match.
- **Shortcut health.** Settings → Steam → Shortcut health lists Steam shortcuts that would fail: an emulator that moved (an update that renamed the AppImage, say), a game that's gone, a missing core. Fix points them at where the emulator is now, in place with Steam running, so play time and collections stay. When an emulator Cartridge's shortcuts use goes missing, Cartridge notices on start and offers to fix it.
- **Check downloaded games.** Settings → Storage compares every game on this device with RomM's record of it, and re-downloads damaged ones when you say so.
- **Manuals.** Games with a manual in RomM have a **Manual** button. Read it with the controller: up and down scroll, LB and RB turn pages, X zooms.
- **BIOS from RomM.** When a console's BIOS is missing and your RomM server has it, Emulator setup offers to save it to your BIOS folder.
- **Console collections in Steam** (Settings → Steam). Games Cartridge adds also go into a Steam collection named after their console. Your Cartridge collections are never copied into Steam.
- **A short tour** of the controls after setup.
- **Copy setup report** (Emulator setup → More) for bug reports, with your name, paths, addresses and server taken out.

### Changed
- **A new look.** Solid, dark and quiet around your game art: bigger art on Home and game pages, one type scale, one set of corners and one accent colour across every screen, and a white highlight wherever you are. New logo and colours, including Cartridge's own artwork in Steam. If you picked your own theme, font or background, they stay; ones left at the old defaults move to the new look. The old themes, fonts, glass panels and backgrounds are all still in Look & Feel.

### Fixed
- Cartridge no longer copies a shortcut's setup for new games when that shortcut's emulator is gone.
