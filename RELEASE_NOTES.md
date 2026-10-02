## Cartridge 0.9.16 · Snappy Again

### Fixed
- **Taps and presses take effect right away again after a big sync.** Cartridge kept the name of every file inside every game. For extracted games (PS4, PS5, Switch folders with thousands of files each) that made the library tens of megabytes, and the app went through all of it every time anything changed, so on Android a tap could take a minute to do anything. The screen no longer gets the file lists at all (game pages ask RomM for a game's files when you open it), and Cartridge keeps at most 40 file names per game. A library of 230 PS4 games went from 28 MB to under 0.1 MB. Libraries already on your device are trimmed when Cartridge starts.
