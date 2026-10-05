## Cartridge 0.9.34 · Back in Control

### New
- **Its Games for each console collection** (Settings → Steam → Collections, A on a console): every downloaded game of that console that's in Steam, whether Cartridge added it or you did (Steam ROM Manager, EmuDeck or by hand), shown as in the collection or not. Add Missing puts the rest in, or A on one game adds just that one.
- **Console collections fill themselves:** with "Put new games in their console's collection" on and Steam's interface reachable (as for live changes), games already in Steam go into their console's collection on their own, when Cartridge starts and every 10 minutes. It never makes a second collection next to one of yours that hasn't been reviewed yet, and never restarts Steam on its own.

### Fixed
- **Controller dead after a game started from Cartridge:** in Game Mode, gamescope can keep naming the closed game as the app in front while Cartridge is on screen, and Cartridge kept the controller switched off. A closed game no longer counts. When gamescope doesn't name Cartridge after a game, Steam is asked to go back to its running app, as its Resume does (with Steam's interface reachable). On the desktop, Cartridge's own attempts to take focus back no longer switch the controller off.
- **The controller after a game, in the log:** each change of the app in front is logged, and 20 seconds after a game Cartridge writes whether the controller sent anything, so a report shows exactly where it stops if it ever happens again.
- **Console collections after deleting one:** a game counted as done once Cartridge had put it in any collection of that name, even one you'd since deleted, and only games Cartridge added were looked at. Now Cartridge reads what's really in each Steam collection, for every game of the console.
- **Collections deleted or changed in Steam** are respected when Steam has to restart to take a change (Steam's local changes file is read and kept in step).
- **The Collections list** names the collection games really go into ("PlayStation" while that's the one you have), the same rule used when adding games.
