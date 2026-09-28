## Cartridge 0.7.4 · Security & Resume

### New
- **Sign-in for phones.** Settings → Phone remote → Sign-in for phones sets a username and password. Every phone then has to sign in with them, with no codes or QR shortcuts, so you can put the device behind a Cloudflare tunnel (or any other) safely. Phones get a clean sign-in screen. The password is stored only as a salted hash, five wrong tries lock sign-in for a minute, and changing or turning it off signs out every phone.
- **Phones work through a tunnel.** Open the device's https address on your phone and everything works over it: sign-in, library, downloads, controls and live updates.
- **Downloads pick up where they left off.** Close Cartridge (or restart the device) in the middle of a download and it carries on from the same byte when you open it again, with the rest of the queue and paused games as they were. Unfinished downloads from before this update are found in your console folders and continue too.
- **How long is left for everything.** The Downloads page, the second screen and the phone show the time left for each game and for the whole queue.

### Changed
- **Auto connection is smarter.** Cartridge uses your local address only when RomM actually answers there, otherwise the remote one, and keeps checking every 30 seconds: coming home switches to local, leaving switches to remote.
- **Downloads never fail because the connection dropped.** They wait ("Waiting for the server") and continue by themselves when RomM is reachable again, on whichever address works.
