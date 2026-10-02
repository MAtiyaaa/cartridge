## Cartridge 0.9.14 · Sync Fix

### Fixed
- **Library sync no longer stops at big consoles.** Syncing asked RomM for 500 games at a time with all their files and gave up after 30 seconds. Consoles whose games are folders with thousands of files (PS4, and often PS3 and Switch) took RomM longer than that to answer, so the sync stopped there with "timed out", most often over a tunnel. Cartridge now waits up to two minutes for these pages, and if RomM still can't answer in time it asks for smaller pages and carries on from where it was. The sync shows "big games, going slower" while it does.
- A slow answer from your server is no longer asked for twice before giving up.
