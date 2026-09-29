## Cartridge 0.9.1 · Handheld Fixes

### Fixed
- **Settings fit on handheld screens.** On shorter screens like the AYN Thor, the bottom of every Settings page was cut off, so About never showed fully. The side menu and the page now each scroll within the screen.
- **Console cards and the game preview on Android.** Some Android versions ignore a colour effect the new look relies on, so console cards came out flat grey and the game preview on Home had no dark shade behind the text, making it hard to read. Both now have a fallback and look right everywhere.
- **Console logos missing on the Consoles screen.** If a logo download failed once (a slow or dropped connection), Cartridge treated that console as having no logo for a week. It now only gives up when the logo really doesn't exist, and tries again otherwise. Consoles affected before are checked again.
- **Fetch all logos did nothing** for games whose logo lookup had failed recently. It now tries them again, and says when a SteamGridDB key is needed.
- **Smoother on Android.** The animated background now uses the lighter mode on Android (the one the Deck uses in Game Mode): it draws at a lower resolution and frame rate and pauses while you move around. You can still pick Full in Look & Feel.

### Changed
- **The second screen matches the new look:** solid dark panels, a flat accent button, white highlights and the new type, without the old glows and gradients. The phone remote's Controls tab follows it too.
