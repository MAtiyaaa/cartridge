# Cartridge 0.9.19 plan

Owner, 2 Oct 2026 (after 0.9.18 shipped): "start building this all into 0.9.19 ... package everything and build then ship 0.9.19". No questions: the owner was clear. If the session runs out of credits, it restarts 5 hours later and carries on from the newest docs/SESSION-LOG.md entry.

Status: built and released as 0.9.19 (3 Oct 2026). Not done: copying the taste and img2threejs skills into .claude/skills (permission refused in the session; the owner adds them). Details in docs/SESSION-LOG.md.

## 1. Start: a new customisable menu (the main item)
- A new top tab, **Start**, next to Home: a grid of tiles the user arranges (inspired by a frontend the owner photographed; their widget look is not wanted, ours follows docs/design.md and the design skills).
- Hold A (or long-press on touch) on a tile: edit mode. A picks up and moves, X cycles the size (shown as "4 by 2"), Y removes, B done. "Add a tile" at the end.
- Widgets: Continue playing (big art, logo, Continue), Clock and date, Storage, This week (play time by day), Consoles, New in your library, Recently played, Latest trophies, Downloads, Favourites or a collection, Recommended, Surprise me, one pinned game.
- Look & Feel: "Open on" picks the menu Cartridge starts on (Home, Start, Library, Consoles...).

## 2. Look and feel
- Top bar with the taste skill (leonxlnx/taste-skill, installed in .claude/skills).
- Install img2threejs skill (owner asked) in .claude/skills.
- Media bar (Home header) larger and more immersive, not much bigger; console icons on Home readable, never squished.
- Backgrounds: drop console scenes as the direction; new style backgrounds at the Ribbons/XMB level of quality (premium, thoughtful). Old console scenes stay selectable only if already picked (or mapped to a style).
- Smooth, weighted animations and transitions everywhere (an evolution, never cheap or weightless).

## 3. Emulators and games
- Vita3K installs in the background like RPCS3 (no window): read Vita3K's source and install the way it does.
- RPCS3 patches must work: re-check against RPCS3's source end to end.
- 403s: none accepted. Make RetroAchievements, GitHub, Sony, GameBanana, PPSSPP, rpcs3.net work.
- PS2 textures: show when a game already has a pack (installed by Cartridge or not).
- Texture pack downloads for other platforms where a source exists.
- Get Emulators: Xbox 360, Saturn and the other missing consoles; asset names checked for Eden, Ryujinx, shadPS4 launcher, Flycast. Dropped (owner): Citron, BigPEmu, PS4 .pkg.
- Emulator updates keep the AppImage's original file name (launch options must not break).
- Switch XCI title IDs.

## 4. RomM on this device
- Server name used for real (container name/hostname), metadata keys as a step after setup, QR to RomM's setup guide.

## 5. Other
- Small cleanups (duplicate CSS in Achievements.vue, unused .padbtn, main.js graphics comment, the two migration lines, steam-games.json written before the helper finishes).
- Trophy code names: learned from every trophy file seen.
- Settings: row-by-row review of empty rows.
- Syncthing: preliminary work (detect, status, folders; read only).
- Speed pass.
- Remind the owner about the v2.3.1 tag.
