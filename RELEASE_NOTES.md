## Cartridge 0.9.18 · Smooth Sync

### Fixed
- **Syncing no longer freezes Cartridge.** Sync asked RomM for every file inside every game. Extracted PS4 and PS5 games have thousands each, so a sync downloaded hundreds of megabytes and Cartridge's backend spent its time reading them instead of answering the screens: taps in Settings did nothing, the second screen stuttered and logos didn't come. Sync now asks for the games without their file lists (RomM 4 says whether each game is one file, one file in a folder, or many). A test library with 230 extracted PS4 games went from 55 MB to under 0.1 MB. Older RomM servers still send file lists, and that still works.
- **PS4 and PS5 game pages open quickly**, on both screens. A game's page asked for all its files too; it now keeps at most 300 (the base game, updates and DLC) and shows the real file count.
- **Moving around Home is smooth again on Android.** The sharp backgrounds from SteamGridDB were 4K images that Cartridge decoded and re-encoded itself, which held everything up for seconds each time you moved to another game. Android now takes the 1080p version as it comes.
- **Logos load for the game you're looking at first,** two at a time, instead of waiting behind every logo asked for while scrolling. On Android they're also made smaller (640 wide), so each takes less work.
- **Home shows your games again on Android.** The media bar now defaults to Compact there (Large left room for barely one row). You can still pick Spacious or Large in Look & Feel.
- **The welcome's controller check accepts B too,** so pads that send B for the button marked A (and Android's button layouts) don't go back a step.
