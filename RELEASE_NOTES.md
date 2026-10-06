## Cartridge 0.9.48 · Under the Hood

### New
- **Quiet while you play.** The hourly library sync, the Steam console collections check and the BIOS check now wait while a game is running and run once it has ended. Downloads keep going.
- **Performance Overlay.** Settings → About → Performance Overlay shows the frame rate, the slowest frame, CPU and memory in a corner of the screen, so you can see how Cartridge runs on your device. Nothing is sent anywhere.
- **Pictures at the size they're shown.** Game covers on cards are loaded at about the size of the card, and full-screen banners at your screen's width, instead of the size they were made. A big SteamGridDB cover is shrunk once and kept, so cards use less memory and scroll more smoothly on a handheld. The picture store stays under 1.5 GB; the oldest pictures make room and come back when they're needed.

### Changed
- **One answer to "which game is this?".** Saves, trophies and Syncthing now work out which library game something belongs to in one place, with the same IDs and the same order: an ID first (from the file name or read from the game itself), then the same title, oldest copy on ties. Trophies can now also find a game by the serial inside a downloaded game (PS3's PARAM.SFO and so on), not only by its file name. More consoles' saves can be matched by IDs read from the game: PlayStation 2, GameCube and Wii, 3DS.
- **Background work in one place.** Cartridge's own periodic jobs share one scheduler with retries, so a job never runs twice at once and a restart doesn't run everything again at once.

### Fixed
- **In Plain, the collection badge and the welcome's keyboard were see-through.** They're solid in Plain now; still frosted in Glass. Found by the new Plain and Glass check.
