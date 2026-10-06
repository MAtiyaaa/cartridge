## Cartridge 0.9.46 · Every Setting

### New
- **Game Settings lists every setting.** Besides the main picks, a new All Settings tab lists every setting in the emulator's own settings file that its per-game file can change, grouped by section: shadPS4, RPCS3, PCSX2, DuckStation, Dolphin and PPSSPP. Settings that take a typed value are there too (shadPS4's extra DMEM in Advanced, for example): on/off settings are a pick, numbers and text have Type a Number or Type a Value, with the emulator's current value filled in.

### Fixed
- **Game Settings went to the Steam tab after typing a value** (Window Width, for example). It now comes back on the tab and row you were on.
- **Holding A on a row whose text already fits needed B twice to leave.** Hold A now only opens a row when it has more to show; otherwise nothing changes and one B goes back.
- **Show File Location's message ran off its box.** Long paths in messages now wrap inside it.
- **shadPS4 Game Settings showed "Default" without its value:** shadPS4's own settings (config.json) are now read, so each row says what shadPS4 uses now.
