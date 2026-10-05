# Plan after 0.9.38: mods for PS3, Nexus Mods, two Cartridge devices

Written in the 0.9.38 session (owner's items 10 and 16). Nothing here is built yet, except where it says so.

## 1. Mods for PS4 (built in 0.9.38)
- shadPS4 reads `<game folder>-mods` as a read-only layer over the game, above `-UPDATE`/`-patch`
  (`src/core/file_sys/fs.cpp` `probe_overlay(host_folder, "-mods")`; `emulator.cpp` logs "Files found in game mods folder").
- So Cartridge puts a mod there in the game's own layout (`addonInstall.plan` kind `shadps4`, matched by the game
  folder's top folders, `sce_sys` and `eboot.bin` never). The game's files are never touched; Remove deletes only
  what Cartridge wrote; Delete everything sends the `-mods` folder to the Trash.
- Source: GameBanana's mods for the game (same as other consoles), or a file downloaded from any page.
- To check on a device: a Bloodborne or similar mod from GameBanana, then shadPS4's log line above.

## 2. Mods for PS3 (RPCS3): not built, needs the owner's call
- RPCS3 has no overlay folder. Mods replace files in the game itself: `dev_hdd0/game/<SERIAL>/USRDIR/...` for
  installed games, or `PS3_GAME/USRDIR/...` in a folder game.
- Safe way: before writing, copy each file the mod replaces into `<USRDIR>/.cartridge-mod-backup/<mod key>/`, record
  it in `addons-installed.json`, and on Remove put the originals back. Refuse when two mods replace the same file.
- Risks: game updates (`dev_hdd0/game/<SERIAL>` patches) can overwrite modded files; mods made for another game
  version can crash. Show the game's version (`ps3Version`) beside each mod, as Switch does.
- Patches (`patch.yml`, already in Game Add-ons) cover most "60 fps" style mods without touching files.

## 3. Nexus Mods: not built
- Its API (api.nexusmods.com v1) needs each user's own API key (from their Nexus account page). Direct download
  links need a Premium account; free accounts must click "Slow download" on the website (an `nxm://` link).
- Possible: Settings → Achievements style sign-in row "Nexus Mods API key"; Game Add-ons lists Nexus mods by game
  domain; Premium users download in Cartridge, others open the page (the 0.9.32 page window already catches the
  download and installs it).
- Game domains are per game, and most console games aren't on Nexus. Worth it only
  for the few console games Nexus has. Owner to decide.

## 4. Two Cartridge devices (owner's item 10, preliminary)
- Both devices already share RomM: the library, collections, notes (trophies), play sessions (`/api/play-sessions`,
  each device by `config.rommDevice`). That is the link: no new server needed.
- Finding each other: `/api/devices` lists every device signed in to the same RomM account. A device can show
  "Also on: Steam Deck, Living room PC" with each one's last play time.
- Syncthing: `syncthing.js` reads the local Syncthing (read only). Pairing two devices needs each one's device ID:
  Cartridge could post its Syncthing device ID into its RomM device record (a note or the device name field), and
  the other device offers "Share saves with <device>" which adds that ID and the save folders through Syncthing's
  REST API (`/rest/config/devices`, `/rest/config/folders`) with the API key from its config.xml.
- Cartridge still never touches saves: it only tells Syncthing which folders to share. Folder IDs per emulator
  (the same on both devices) so a game's saves meet: `cartridge-<emulator>-saves`.
- Open question for the owner: Syncthing on both, or RomM's own save sync (RomM 4 has saves/states upload) instead.
