## Cartridge 0.9.15 · Sync Fix 2

### Fixed
- **Library sync gets through PS5 (and other big consoles) too.** After 0.9.14, a sync could still stop with "Cannot reach server (ETIMEDOUT)". When Cartridge gives up waiting for a very big page, RomM keeps building it, and while it's busy the next connection can time out or drop. Sync now treats a dropped or timed-out connection like a slow answer: it waits a few seconds for the server to catch up, asks for smaller pages from where it was, and tries up to six times.
- **One console can't stop the whole sync.** If a console still can't be read after that, Cartridge keeps the games it already had for it, carries on with the rest of your library, and tells you which console to refresh again later.
