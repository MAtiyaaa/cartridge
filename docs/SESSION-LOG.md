# Session log

A running record for whichever Claude session works on Cartridge next, on any account. Newest entry first. Each entry says what was done, what the owner decided in chat (with reasons), what is half done, what the owner must test on a device, and what's next. Read the newest entry first, then `CLAUDE.md`, then the plan for the version being built.

The branch for 0.9.3 work is `claude/relaxed-fermat-30pigp`. Pull it before starting (`git pull`): another account may have pushed to it.

---

## 1 Oct 2026 · Second account, first session

**Context.** The owner is working from a second Claude account for about a week, then going back to the first. Nothing carries between accounts except the repo, so this log is the handover. Every update made here gets an entry. Before switching back, a "Start here" summary goes at the top.

**What was done**
- Read the whole project: back end, every view and component, tests, CI, HANDOFF, all plans, design system, recent changelog.
- Added the owner's new 0.9.3 items to `docs/plan-0.9.3.md`: A10 (shadPS4 shortcuts, with the owner's finding and the leads below), A14 (lag on the ROG Ally), B4 (delete animation), B5 (Home rows stop at 15 with a Show all card), D6 (RPCS3 game updates), D7 (patches that stick, Discuss).
- Fixed the `CLAUDE.md` line that pointed at the old 0.9.2 notes.

**Decided in chat**
- The 0.9.3 plan on this branch is the right one (`main` still has the old 11-line version; the branch is not merged).
- Work continues on this branch. Building 0.9.3 has not started; the owner says when.

**Found while reading (not fixed yet, to confirm when building)**
- A4/A13 (Settings jumps to Connection, quick right press loses focus): the left list switches the page on focus (`@focus="sec = s.id"` in `Settings.vue`). When the focused button disappears (Fetch all logos becomes Stop) or you come back from a sub-screen, focus falls to the first list item, which is Connection. The page's fade (`mode="out-in"`) likely explains the lost focus on a quick right press.
- A5: the start-up pop-ups are `steamReport()` (`steam.js`) and `checkMoved()` (`App.vue`).
- A7: Remove from Steam asks "Apply now", then the preview asks again.
- A11: the three Text options differ by a few shades only (`TEXTS` in `themes.js`).
- A12: `.g-actions` wraps.
- A14: `backgroundThrottling: false` on the window, and the 8 ms controller poll never stops.
- A10: Cartridge deliberately replaces a `/tmp/.mount_` Start in with the AppImage's folder; shadPS4 may choose its user folder from the working folder. Check the source.
- Not in the plan: the game page's Re-download still deletes first, then downloads (only Library check keeps the old copy until the new one passes).
- HANDOFF's "the Steam manager never ran against a real Steam" is out of date (0.7.12 came from real use). HANDOFF update is J14.

**Waiting on the owner**
- D7: patches in 0.9.3 or 0.9.4, and whether Cartridge may turn on patches it installed.
- The plugins the owner asked to install (ponytail, caveman, graphify, rtk, taste-skill, impeccable, img2threejs, and awesome-design-md issue 90) were not installed: the environment's safety check blocked cloning third-party code into the repo. Needs the owner's go-ahead in the permission settings, or a different way.
- The stray `v2.3.1` tag: ask again when 0.9.3 is being built.

**Next**
- The owner says when to start building 0.9.3, starting with section A.
