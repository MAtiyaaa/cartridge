## Cartridge 0.9.22 · Home Fix

### Fixed
- **Home disappeared** after moving a couple of times (down twice, or right once): the header and every row vanished. Home called the wrong thing to find a game's header picture, which failed the moment a game was highlighted and took the whole page down with it. It came in with 0.9.21's change to SteamGridDB headers.
- **No header pictures on Home:** the same fault stopped Home's header from showing. Headers are SteamGridDB's, as asked in 0.9.21. When SteamGridDB can't be reached, the game's cover shows blurred instead of nothing.
