# Product

<!-- impeccable:product-schema 1 -->
<!-- Written 0.9.52 from the owner's recorded decisions (CLAUDE.md, docs/HANDOFF.md, docs/design-rules.md); nothing here is invented. -->

## Platform

web

## Users
People who keep their own game library on a RomM server and play it on a Linux handheld (Steam Deck, ROG Ally, Legion Go on SteamOS or Bazzite) or a TV, mostly in Steam's Game Mode with a controller, sometimes on a desktop with a mouse or touch. They set things up once, then want to pick a game and play.

## Product Purpose
Cartridge is a controller-first RomM client shipped as one AppImage. It mirrors the RomM library, downloads games, sets up emulators, adds games to Steam, syncs saves, and shows trophies and achievements, so a self-hosted library feels like a console's own.

## Positioning
The one app that joins a person's own RomM server, their emulators and Steam's Game Mode: it detects what is installed instead of assuming a setup, adds games to Steam with the right emulator and arguments, and keeps saves on the person's own server.

## Operating Context
Steam Game Mode on a 1280x800 handheld and a 3840x2160 TV; desktop Linux distros; emulators from EmuDeck, Flatpak, AppImages, distro packages or Steam, in any mix. Home network with the RomM server, sometimes away from it with no tunnel.

## Capabilities and Constraints
- Every screen works with a controller, touch and mouse, at 1280x800, 1920x1080 and 3840x2160, with nothing clipped.
- Never touches saves except Linked Folders and Cartridge Save Sync (on request, with guard rails). Never modifies emulator files.
- Two styles, Plain and Glass, designed separately and never merged.
- Open source and public: nothing private in the repo or releases.

## Brand Commitments
- Name: Cartridge. Brand colour: #EF4B23 (orange). Dark base.
- The owner likes the orange that darkens to the right on a dark ground, with grain (0.9.52); the previous marks (play slot, insert, shelf) were rejected.
- Writing: plain, direct, British spelling, no em dashes.
- RomM's own art and other companies' marks are never shipped in the repo.

## Evidence on Hand
- The real app and its screens (screenshots taken with the owner's library, private details swapped out).
- No testimonials, user counts or press: never invent them.

## Product Principles
- Art first: game art is the colour; the interface stays quiet around it.
- For everyone's setup, not one person's: detect, prefer what the user already uses, explain failures plainly.
- Heavy, calm motion; nothing clips; one accent.

## Accessibility & Inclusion
Readable from a sofa on a TV; reduced motion and reduced transparency honoured; full controller reach.
