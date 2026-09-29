## Cartridge 0.9.5 · Smooth Moves

### Fixed
- **Games you have are found, even under another name.** Cartridge now also matches a file to a game by its name without the region and dump tags, or by the game's title, when exactly one file fits. "Assassin's Creed - Bloodlines (USA).cso" now counts as installed.
- **The Home banner is no longer cut in half after leaving a game.** Coming back to a game card could scroll the whole page up under the top bar. That part of the screen can't scroll any more.
- **The animated background moves on Android without touching the screen.** It only showed new frames while something else changed on screen.
- **Covers load on the first start.** Home loads its covers straight away, and a cover that fails because the image server wasn't ready yet is tried again.
- **Scrolling no longer jumps back to the top.** When a list refreshed under the highlighted game, the next press started from the first item; it now carries on from the same game, or the nearest one.
- **The second screen follows the right game.** It could show a game you'd already moved past (updates arrived out of order), and now shows the newest one sooner.
- **The second screen comes back.** A back gesture on it no longer closes it, it reopens when you return to Cartridge, and the Quick Menu has a Second screen switch.
- **Your emulator's real name.** Play and Ready to play show the installed app's own name (like Azahar Plus), and each installed app is listed once.
- **Long console names** stay under their own game card.
- **Home ends at the last row** instead of scrolling on into empty space.

### New
- **Top bar and art as one piece (preview, Android).** The top bar takes a deep shade of the art on screen, the art fades up into it, and it fades into the page with a long, soft edge. Turn it off in Settings → Android → Blend the top bar with the art.
