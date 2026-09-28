## Cartridge 0.6.3 · Second Screen Polish

### Changed
- **The second screen looks like the first.** It is rebuilt from the same pieces as the top screen:
  - **Games:** a banner with the game's artwork and logo, the cover art on top, then the same details line as the Home header, Open and Download, and the description with Show more.
  - **Consoles:** a banner in the console's own colours with its logo, how many games are on your server and on this device, and its ROM folder.
  - **Collections and Favourites:** a banner of their covers, the name and how many games they hold.
  - **Downloads:** cover, name, live progress and speed, with cancel and retry.
  - The top screen's tabs, buttons and panels.
- **The second screen's background stays still.** It uses the same theme, colours, background style and wallpaper as the top screen, without the animation.

### Fixed
- **Game art loads reliably and fast on both screens.** Images now load over several connections at once without depending on special addresses, and each one fades in once it is ready instead of popping in or showing as broken.
