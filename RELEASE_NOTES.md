## Cartridge 0.9.27 · In Motion

abdu2304's 0.9.37 to 0.9.43. On Linux, Cartridge works exactly as his 0.9.43 does, with this fork's phone remote and Fuse bridge on top.

### New
- **Fluid motion:** pop-ups open from the button you pressed and close back towards it, bottom sheets come up and go down the same way, presses spring back when you let go, and a game's cover flies from its card into the game page and back. Rows of choices have one pill that glides to what you pick. Scrolling with the controller glides as one smooth motion when you press quickly. It works on Android too; Reduce Motion turns it off.
- **An interactive tour:** it points at the real screen and asks you to do each thing yourself (next tab, search, Downloads, the Quick Menu), with the button for whatever is in your hands. Settings → About → Take the Tour runs it again.
- **New looks:** Light (a soft grey page with near-white cards and a dark highlight), OLED (black cards set apart by a fine edge) and Glass rebuilt after Apple's Liquid Glass: the Dock, buttons, pop-ups and the highlight are glass, your cards stay solid. Background and Elements are separate settings in Look & Feel.
- **Game Shelf, redesigned:** your games stand as cases on a lit shelf with their console's band on top; the one you pick turns to show its cover, name and play time.
- **Keyboard and mouse:** Tab to move, Ctrl+Tab or 1 to 9 for tabs, Ctrl+F or / to search, Alt+Left to go back, right-click a game for its options, F1 lists every key.
- **Linux (from abdu2304):** games on more than one drive (Settings → Storage → Games on Other Drives), PS5 emulators (SharpEmu, KytyPS5) and PS5 trophies, BIOS and firmware put in place by themselves, Find and Link Saves, deleting mods to the Trash, PS4 mods for shadPS4, right stick scrolling.

### Changed
- **Home's header** is one steady height: scrolling quickly through games no longer makes the rows jump, and a long title gets smaller to fit.
- **Light effects move too:** on handhelds and on Android, pop-ups, presses and the cover's flight now animate by position and fade instead of only fading.
- **The sync ring:** a library sync shows as a ring in the status area, like the Steam one, with a tick when done.
- **About** is in a game's More → Game tab, last.
- **The disc widget** turns slowly and evenly, once a minute.
- **GIF search** finds more, from Wikimedia Commons too, and its previews load on every device.

### Fixed
- **Settings sections** open at the top instead of part way down.
- **The More sheet** no longer pops out twice.
- **Picture search** no longer cuts off the ring round the picked result.
- **Linux:** checking which games are installed could fail since 0.9.21 when a game wasn't found by its exact file name (a fork slip, now gone: Linux runs abdu's check again).
- **Linux (from abdu2304):** shadPS4 installing again, emulator updates opening at once and seeing RPCS3's newer builds, Cartridge hanging when a Flatpak emulator was picked without Flatpak, the emulator search finding AppImages in your home first.
