## Cartridge 0.9.3 · Emulators

### New
- **Settings → Emulators.** One place for Emulator setup, Shortcut health and Console Folders, with an **Issues** list at the top: games missing from Steam collections, shortcuts that would fail, setups pointing at an emulator that's gone, missing BIOS. Each has its fix. A dot on the Settings tab means something is waiting. The pop-ups at start-up are gone.
- **Forks.** When Cartridge can't tell what an AppImage is, "Which One?" asks: Not an Emulator, It's a Fork (pick which emulator it comes from and name it) or It's an Emulator. B goes back a step. A copy that was found can also be marked as a fork. Forks show by their own name (for example "BB Launcher · fork of shadPS4") and are only used when you pick them. GR2, BB Launcher, PrimeHack and Slippi are recognised by name.
- **RetroDECK.** If you use RetroDECK and not EmuDeck, it's offered for each console and starts games with the emulator RetroDECK has set.
- **Take over your own shortcuts.** On a console's page in Settings → Steam, More can bring games you added to Steam yourself under Cartridge, so every game of that console starts the same way. With Steam's live connection play time and collections stay.
- **Home rows** show 15 games and a **Show all** card that opens the whole row.
- **Deleting a game** shows a progress ring on its card and on the Delete button.

### Changed
- **Which emulator is used.** Each console uses one emulator found on your device: EmuDeck's first, then RetroDECK (without EmuDeck), then AppImages, Flatpaks and installed programs. How your own Steam shortcuts start games is offered as another choice. Steam ROM Manager setups are no longer listed; the emulators they use still are.
- **Real names.** A Citra or Lime3DS install is no longer called Azahar, and Sudachi, suyu, torzu and Ryubing show by their own names.
- **Lists A to Z.** Consoles and emulators are sorted alphabetically. In Emulator setup, finished consoles move to the bottom with a check mark.
- The current top tab is a full white box. Text options Standard, High contrast and Soft are clearly different. The game page buttons stay on one row.
- With Steam's live connection, adding or removing games no longer asks "Apply now or later".
- "Cartridge itself" in Settings is now "Cartridge".

### Fixed
- **shadPS4 games that only started sometimes.** Cartridge started shadPS4 next to its AppImage, where a stray `user` folder gave it different settings. Shortcuts now start where shadPS4 keeps its normal data. Existing PS4 shortcuts show **Update** on their console page.
- **Lag and Cartridge staying open after quitting.** Cartridge no longer works in the background while a game runs (controller reading slows down, the animated background stops) and quits fully within 3 seconds, from its own Quit and from Steam's Exit game.
- **Remove from Steam** no longer has to be chosen twice.
- **Settings** stays on the section you were on after an action or after leaving a sub-screen, and a quick right press no longer loses focus.
- **Library:** scrolling up no longer stops on the filters bar early.
- Shortcuts pointing inside an AppImage's temporary folder (`/tmp/.mount_...`) are no longer learned from and show in Shortcut health.
