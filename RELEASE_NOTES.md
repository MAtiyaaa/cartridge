## Cartridge 0.9.20 · Steps Aside

An Android fix for dual-screen handhelds. Nothing changes on Linux.

### Fixed
- **The second screen is Cartridge's only while Cartridge is in front.** Cartridge's bottom screen stayed up after you left Cartridge, on top of whatever came next there: an app or game Fuse opened on the bottom screen showed Cartridge's second screen instead, Fuse's own second screen was hidden behind it, and a DS emulator started from Cartridge couldn't show its bottom screen. It now steps aside when you leave Cartridge and comes back straight away, on the same page, when you return.
