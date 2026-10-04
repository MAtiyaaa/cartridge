## Cartridge 0.9.23 · Holding Still

An Android fix. Nothing changes on Linux.

### Fixed
- **The screen no longer keeps zooming in and out on Android.** Since 0.9.21 the whole interface grew and shrank over and over on handhelds like the AYN Thor. Cartridge zoomed out because the screen looked smaller than 1280x800, which made it look big enough again, so it zoomed back in, and so on. Android now keeps its own sizing, as before 0.9.21. Look & Feel → Interface size still works.
