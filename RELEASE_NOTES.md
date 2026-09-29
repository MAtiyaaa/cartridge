## Cartridge 0.9.4 · Handheld Polish

### Fixed
- **Games you already have are found.** Cartridge used to look only for the exact file name in the console's folder. It now also finds the game in another case, under another format of the same game (a .cso for RomM's .iso, .rvz for .iso), one folder down (like `psp/ISO`), and in any of the folder names that console can use. Unfinished downloads (.part) are never counted.
- **Home on Android: the story is readable.** Bright art sat right behind the text. The art now has a proper shade on the left, fades into the page (in any theme colour) instead of ending in a dark box, and a small screenshot is softened instead of stretched blocky.
- **Home after leaving a game.** The top of the Home banner was cut off when you came back from a game. It now fits again once the logo loads.
- **Game page on a 720p handheld.** Play and Download are on screen straight away: a shorter banner, with HowLongToBeat moved below the buttons.

### Changed
- **The second screen's game view.** Open and Download stay pinned just above the tabs at the bottom and are never covered. The box art stands straight next to the logo. Scrolling moves the art slower than the page and eases the logo and box art back.
