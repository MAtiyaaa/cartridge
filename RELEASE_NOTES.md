## Cartridge 0.5.5 · Fixes

### Fixed
- **Home could not scroll down right after launch.** Moving down to the next row (like Picks for you) left it half hidden behind the bottom bar until you touched the screen or used a mouse. Cartridge now starts in controller mode properly, so rows scroll into place from the first press.
- **Holding the D-pad now keeps up.** When you held a direction, the selection moved faster than the page scrolled, so it ran off screen. While a direction is held, the page now follows the selection instantly. Single presses still scroll smoothly.
- **The top of the Home header was clipped** on some games (the console name went under the top bar), when a tall logo and a long info line did not fit. The logo now shrinks to fit, and the info line stays on one line.
- **The end of a row no longer jumps to the search box.** Pressing right on the last item of a row now stays on it.

### Changed
- **LB / RB no longer switch the top tabs.** LT / RT switch tabs. The bumpers only switch sections inside a page, like RetroAchievements / Others on the Achievements tab.
