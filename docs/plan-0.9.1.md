# Cartridge 0.9.1 notes

Agreed list, built in 0.9.1. Items 6, 11, 13 and 14 moved to 0.9.2 (docs/plan-0.9.2.md).

## Launch arguments
1. Refresh the emulator database (`electron/emulators.js`) from the latest EmuDeck SRM parsers and Steam ROM Manager presets: those are tested on real Steam. Check an emulator's own source only where neither covers it (new forks) or the two disagree. Keep the special cases (shadPS4 Qt launcher `-d -g` and `eboot.bin`, xemu, Xenia, RPCS3, Vita3K, MAME, ares).
2. Arguments by version where an emulator changed its flags (PCSX2 old against new is the likely one), picked from the version Setup already reads (AppStream or `X-AppImage-Version`, `flatpak info`, file name). Unknown version: current flags.
3. Clearer "Test with one game": pick a game that isn't in Steam yet, say which one to start, and what to do if it doesn't start.
4. Type your own launch options (with `{ROM}`) straight from Emulator setup, for emulators Cartridge doesn't know.

## Fixes to 0.9.0
5. Setup doesn't freeze the screen: reading inside AppImages and programs (xz unpacking, the strings search) moves to a background worker.
7. Re-downloading a damaged game downloads the new copy first, then replaces the old one.
8. "Emulator for this game" updates only that game's shortcut, not the whole console.
9. Existing users get a one-time "New: Emulator setup" prompt.
10. A button (after you confirm) to give a Flatpak emulator access to your games folder. The copyable command stays.

## Housekeeping
12. CLAUDE.md: the tests line; CI runs `npm test` before the build.

## Left out (owner's call)
RetroDECK launching and Flatpak Steam launching stay as they are in 0.9.0 (detected, with a warning).

## From testing at home
(add here)
