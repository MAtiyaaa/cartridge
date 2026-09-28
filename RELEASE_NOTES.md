## Cartridge 0.6.1

### New
- **Downloads are checked against RomM.** When a game finishes downloading, Cartridge compares every file with the size and checksum RomM keeps for it. A damaged file is deleted and the download shows "Damaged download", so **Retry** gets a fresh copy.
  - Zip, 7z, rar and CHD files get the size check only, because RomM checksums what is inside them, not the file itself.
  - Consoles RomM doesn't checksum (like PS4 and Switch) get the size check only.
  - If a retry brings exactly the same file again, the file on your server is fine and RomM's checksum is out of date. Cartridge keeps the game and tells you a rescan in RomM would fix it.
- **Storage manager (Settings → Storage), like Steam's.**
  - Each drive with a bar showing what Cartridge's games use, what everything else uses, and what is free.
  - Every downloaded game on that drive with its real size on disk, sorted by size, name or when you added it.
  - Pick any number of games with A and delete them in one go. They stay on your RomM server.
- **Warning before a download that won't fit.** If a game doesn't fit on its drive (counting what is still downloading there), Cartridge says so first and offers **Free up space**, **Download anyway** or **Cancel**.
- **Look & Feel presets.** Save your current look under a name (up to 5) and switch between them in one press: colour, background, fonts, cards, motion and sounds. Interface size and controller settings stay as they are. Each preset can be updated, renamed or deleted.
- **Pair with a QR code.** In Setup → Pairing code, **Pair with a QR code instead** shows a QR code. Scan it with your phone, approve Cartridge in RomM, and Cartridge signs in by itself. Needs a RomM version with device pairing; older versions keep the typed pairing code.

### Fixed
- **Y on the Search page now opens the on-screen keyboard** when the built-in keyboard is on (Game Mode).
- **Adding Cartridge itself to Steam could replace another shortcut** when Steam's list had a gap in its numbering. It now always takes a free spot.
- **Undo in Settings → Steam could restore the wrong file** in a rare case where the Steam step ran twice. Each change now runs exactly once, and a backup is never replaced.
- **Adding games to Steam showed no progress** while artwork was being fetched, which could look stuck with many games. The top bar now shows "Steam artwork 3/12", then "Waiting for Steam…".
