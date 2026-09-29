# Cartridge 0.9.1 notes

Fixes for after 0.9.0, not built yet. The owner tests 0.9.0 at home first; anything found there is added here, then 0.9.1 is built from this list.

## Launch arguments (the main one)
Detection only helps if Steam starts each emulator with the right arguments. 0.9.0 uses the arguments from EmuDeck's Steam ROM Manager parsers and SRM's presets (`electron/emulators.js`). Gaps:

1. **Check every emulator's current command-line options against its source code.** For each emulator in `EMU`, confirm from its own source (not memory):
   - fullscreen;
   - start a game directly and skip its own menu or game list;
   - quit when the game closes, where it offers that.

   Fix any that changed. Where a source repository can't be reached from the session, say so rather than guess.
2. **Arguments by version.** Where an emulator changed its flags between versions (PCSX2's old versions against today's is the likely one), add "from version X, use these arguments" to `EMU`. Pick with the version Setup already reads: AppStream or `X-AppImage-Version` inside the AppImage, `flatpak info`, or the file name. If the version is unknown, use the current flags.
3. **Nothing tests a launch automatically.** Cartridge never launches emulators, so "Test with one game" (Emulator setup) stays the check. Make it clearer: after adding the test game, say which game to start in Steam and what to do if it doesn't start (Shortcut health, pick another emulator, or set your own arguments).
4. **Emulators not in the database.** Today they get arguments from "which one does it behave like". Also offer typing your own arguments with `{ROM}` straight from Emulator setup, not only from the console page.

## Still open from 0.9
- RetroDECK launching (detected and warned about today, not used).
- Flatpak Steam starting emulators on the host (detected and warned about today).
- AppImages packed with zstd or DwarFS: check on real files. DwarFS falls back to the file name.

## From testing at home
(add here)
