## Cartridge 0.9.3 · Android Hotfix

Includes abdu2304's 0.9.2 (white highlights by default, clearer selection, the D-pad stays inside the part of the screen you're in).

### Fixed
- **Console logos on Android.** Only PS5, PSP and Wii showed a logo: the others are drawn from files that give no size, which older Android WebViews draw at zero size. Cartridge now adds the size, so every console's logo shows, including ones already downloaded.
- **Console pictures appear straight away.** On the Consoles screen, the controller pictures only showed once you moved onto a card.
- **Manuals open on Android.** They failed with "Promise.withResolvers is not a function" on WebViews older than Chrome 119. The Android app now uses the PDF reader build made for older browsers.
- **Play in PPSSPP and other emulators.** The game is now handed over with permission to read it, instead of a storage link the emulator could only open if you had added that folder in it ("file doesn't exist"). Disc sheets (.cue, .gdi, .m3u) still need their folder added in the emulator, since their tracks sit next to them.
- **Your own emulator build is used.** Forks and beta builds under other names (an Azahar beta, yuzu forks, NetherSX2 and so on) are found too. When more than one emulator could run a console, the first Play asks which one you use and remembers it.
- **Settings with a controller.** The list on the left now scrolls to what you're on, so About can be reached and seen with the D-pad.
- **The background no longer restarts when you tap.** It used to pause while you touched or moved and then jump ahead. On Android it now keeps moving smoothly, and where it still pauses (the Deck without a GPU) it carries on from where it stopped.
- **Game page banner.** A small screenshot stretched across the top looked blocky on Android. It's now softened, so the logo and cover stand out.

### Changed
- **The second screen's game view:** the game's logo leads, the box art peeks in from the right edge, the name is a small hint under the logo, then the story with Show more, and Open and Download.
