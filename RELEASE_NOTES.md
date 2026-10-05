## Cartridge 0.9.43 · Steady Home

### Fixed
- **Home shaking when you scroll through games quickly:** the header grew to fit each game's text, so a game with a long title or summary pushed every row down for a moment before its logo shrank to fit, and the rows jumped back up. The header is one fixed height now, the same height it had for most games, and the rows below never move.
- **Long game titles in words (no logo) fit the header:** instead of making the header taller, a long title's type gets smaller until the console name, title, details and summary all fit.
- **Emulator search missing your home folder:** the search went through system folders like /opt before your home folder, so a big /opt could use up its time limit and AppImages in your own folders went unfound. Home is searched first now.
