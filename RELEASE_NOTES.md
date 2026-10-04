## Cartridge 0.9.30 · Switch, Read Properly

### New
- **Switch version read from the game, like Eden:** a game's More → Add-ons shows the version your copy runs (the game's own version string, such as "3.0.1"), its update number and its title ID. Cartridge reads them the way Eden does: the title ID and version from the game's content meta, the version string from its control data, using your own prod.keys.
- **Updates installed into Eden count:** an update you installed into Eden (or Citron and the other yuzu forks) is found in its NAND and shown as your version when it's newer than your files.

### Fixed
- **Switch title IDs never read inside the app:** Cartridge's Switch reader used AES-XTS, which Electron doesn't include, so every read failed without a word (the tests passed because they run outside Electron). It now works inside the app, for .nsp, .nsz, .xci and .xcz, and with NSPs that have no ticket (title.keys, and the tickets Eden keeps from installs, are used too).
- **Console cards:** the controller picture's shadow was cut off in a straight line beside and below it, so it looked cut out. It now fades out smoothly.
