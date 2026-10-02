# 0.9.3 · Options for the Discuss items

Written during the night run of 2 Oct 2026 so the owner can pick in the morning. Nothing here is built. Each item has two or three options and a recommendation; say a letter (for example "F1: B") or mix them.

## E2 · Trophies overhaul
- **A. One trophy home.** Merge RetroAchievements and Trophies & Gamerscore into one Achievements page: a single "latest unlocks" row from both, then games grouped by console, each card showing progress the same way whatever its source. LB/RB filter by source.
- **B. Showcase.** Keep the two tabs, add a profile header (total trophies, platinums, gamerscore, RetroAchievements points), "Closest to completion" and "Rarest unlocks" rows, and a full-screen pop-up when a platinum or mastery happens.
- **C. Per-game focus.** Keep the lists as they are; rebuild the game's trophy page with big art, grouped trophies (unlocked, locked, hidden), filters and the date of each unlock on a timeline.
- **Recommendation: A, plus C's game page later.** One place, one look, and the least to learn.

## F1 · Console backgrounds (rebuilt, except Ribbons and XMB)
- **A. Art first.** Each console background is a slow, dark, blurred pan over that console's own game art from your library (covers and backgrounds from RomM and SteamGridDB), with the console's colour as a soft light. Always looks like your games; almost free to draw.
- **B. Designed scenes.** Hand-built, premium animated scenes per console (for example: the PS2's blue light tunnel, the GameCube's cube floating in a void, the Wii's channel grid in motion), drawn with WebGL at full resolution, slow and calm.
- **C. Hardware shots.** A large, softly lit render of the console itself (shape drawn from its silhouette), slowly turning, over a dark gradient in its colours.
- **Recommendation: A by default, B for the five most used consoles.** A is never cheap looking because it is your real art; B is where the "premium" feel comes from, and it is a lot of work per console, so it should be the ones you use most. Mockups of each before building.

## F6 · LAN and Tunnel pills
- **A. Quiet.** No pill: a small icon (house for LAN, globe for Tunnel, a crossed cloud when offline) next to the clock, the same white as the text. Colour only when offline.
- **B. Glass pill.** The same pill shape, frosted dark glass, a thin coloured edge and a small icon; the label in normal weight.
- **C. Status line.** The connection shown as a thin coloured line under the top bar, full width, with the label only when focused.
- **Recommendation: A.** Most premium apps show connection only when something is wrong.

## G4 · Clutter across the app
The direction in the plan (one main action per screen, nothing empty or disabled, one shared sheet for secondary things, fewer Settings tabs with Advanced groups). The game page More menu was already grouped in 0.9.3 D, and Settings lost two tabs in H.
- **A. Settings first.** Look & Feel split into Theme, Background, Text and Cards, Motion and Sound, each a short page, with rarely used options under Advanced; empty or not available rows hidden everywhere in Settings.
- **B. One sheet pattern.** Replace the menus for the game page More, Library filters, trophy filters and the console page with one bottom sheet that has tabs, so every secondary screen works the same way.
- **C. Both, in that order.**
- **Recommendation: C.** A is quick and visible; B is bigger and also sets up 0.9.4's Add-ons.

## H1 · Recommendations and similar games
- **A. From RomM's metadata.** Score each game by shared genres, series, developer and IGDB's similar games list (already synced as `similar`), weighted by what you play most (play time) and finish. Works offline, no account.
- **B. From play history only.** "Because you played X": games of the same series or developer as your most played, newest first.
- **C. A and B together,** with a short reason on each card ("Same series as …", "Because you play racing games").
- **Recommendation: C.** The reasons make the rows feel trustworthy.

## I1 · Syncthing saves, view only
- **A. Status card.** Settings → Storage shows Syncthing's local status (running or not, last sync per folder, devices online, conflicts count), read from its local API with the key it stores in its own config. Never touches saves.
- **B. Per-game badge.** As A, plus a small "Synced 5 min ago" or "Conflict" badge on game pages whose save folder Syncthing shares.
- **C. Not now.** Leave it for 0.9.4 with the save features.
- **Recommendation: A now, B later.**
