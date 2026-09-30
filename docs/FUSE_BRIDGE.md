# Fuse bridge

From 0.9.10, other apps can hand over to Cartridge and see what it is doing. It was made for [Fuse](https://github.com/MAtiyaaa/fuse), an open-source game launcher, but any app can use it. This page is the contract, protocol version 1.

Two parts:

1. **Links.** `cartridge://...` opens a page in Cartridge (Android intents, or a command-line argument on the Linux desktop).
2. **Status.** A read-only snapshot of downloads, the connection and recent games (an Android content provider, or a JSON file on the Linux desktop).

Nothing in either part can download, delete, launch a game or change a setting, and nothing exposes the RomM server address, the account, tokens or API keys.

## Links

`cartridge://<route>[/<value>][?from=fuse&v=1]`

| Link | Opens |
|---|---|
| `cartridge://home` | Home |
| `cartridge://library` | Library |
| `cartridge://consoles` | Consoles |
| `cartridge://downloads` | Downloads |
| `cartridge://settings` | Settings |
| `cartridge://sync` | Starts a resync (like Quick Menu → Resync), then shows Home |
| `cartridge://platform/{slug}` | That console's page |
| `cartridge://game/{romId}` | That game's page (`romId` is RomM's rom id) |
| `cartridge://search?q={text}&platform={slug}` | Search with the text filled in |
| `cartridge://bios/{slug}` | That console's page, which has the BIOS button (RomM's BIOS files for it) |

Rules:

- The scheme, route, slug and parameter names are case-insensitive. Values are URL-encoded; in the query `+` is a space.
- `from=fuse` marks a link from Fuse (see Back below). `v=1` is the protocol version; it is accepted and ignored for now. Unknown parameters are ignored.
- Anything else (another scheme, an unknown route, a missing or non-numeric id, extra path parts, broken %-encoding, more than 2048 characters) is ignored. Search text is cut to 200 characters.
- `{slug}` is matched against each RomM platform's `slug`, then its `fs_slug` (the folder name). On Android the same console under another name also matches (the aliases in `src/android/emulators.js`, so `genesis` and `megadrive` both find `genesis-slash-megadrive`).
- A game that isn't in the library opens Library, a console that isn't opens Consoles, each with a short note.
- `platform` on `search` is accepted but ignored: Search has no console filter.
- Cartridge waits for its settings, and for game and console links its library (up to 20 seconds), so a link that starts Cartridge works. If Cartridge isn't connected to a RomM server yet, it shows Setup and ignores the link.

### Back returns to Fuse (Android)

A link with `from=fuse` opens its page with no history behind it. Pressing Back there (B, the back gesture or the Back hint), with no dialog or Quick Menu open, moves Cartridge behind (`moveTaskToBack`), so Fuse is on screen again. Downloads keep going in the background (the download notification's foreground service).

This lasts for that visit: moving between tabs keeps it, and it ends when Cartridge leaves the screen (Home button, starting an emulator, going back to Fuse). After that, Back on the first page does nothing, as it always has. Links without `from=fuse` keep the history, so Back returns to where you were.

On the desktop there is no return: Fuse is shown again when Cartridge is closed or minimised. A `from=fuse` link still starts a fresh history there.

### Android

`MainActivity` takes `ACTION_VIEW` with category `DEFAULT` and scheme `cartridge`. It is not `BROWSABLE`, so browsers and web pages can't open these links.

```kotlin
startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("cartridge://platform/snes?from=fuse&v=1")))
```

Detecting the bridge: `packageManager.resolveActivity(Intent(Intent.ACTION_VIEW, Uri.parse("cartridge://home")), 0)` is not null from 0.9.10 on. On Android 11 and later the calling app needs a `<queries>` entry to see Cartridge, for example:

```xml
<queries>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="cartridge" />
    </intent>
    <provider android:authorities="io.github.abdu2304.cartridge.status" />
</queries>
```

### Linux desktop

Pass the link as an argument (quoted, because of `?` and `&`):

```sh
./Cartridge-x86_64.AppImage 'cartridge://downloads?from=fuse&v=1'
```

If Cartridge is already running, the new launch hands the link to it and exits, and the running window comes to the front. Cartridge does not register itself as the system's `cartridge://` handler (no `x-scheme-handler` in its desktop entry), so browsers and `xdg-open` can't open these links either.

## Status

Both platforms publish the same snapshot. It is rebuilt when downloads, the connection or the library change, at most every 500 ms, and only published when something in it changed.

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `protocol` | `protocol` | int | `1`. New fields may be added; a breaking change gets a new number. |
| `version` | `version` | text | Cartridge's version (Android: the APK's versionName) |
| `connected` | `connected` | bool / int 0-1 / null | Connected as the top bar shows it: `true` for LAN or Tunnel, `false` for Offline or no server set up, `null` when not known (not checked yet, or Cartridge isn't running) |
| `activeDownloads` | `active_downloads` | int | Games downloading now |
| `queuedDownloads` | `queued_downloads` | int | Games waiting in the queue (paused, failed and finished ones don't count) |
| `progress` | `progress` | real 0-1 / null | Bytes received over all downloading and queued games, 3 decimals; `null` when nothing is queued or no sizes are known |
| `currentTitle` | `current_title` | text / null | The game downloading now, or the next one in the queue |
| `currentPlatform` | `current_platform` | text / null | Its RomM platform slug |
| `libraryChangedAt` | `library_changed_at` | long, epoch ms | The latest of: last library sync, last finished download, last game deleted in Cartridge. Never goes back. Every sync counts, even one that found nothing new (Cartridge syncs at start and every hour by default). |
| `updatedAt` | `updated_at` | long, epoch ms | When this snapshot was made. Only changes with the content, so it is not a heartbeat. |
| `recent` | `/recent` rows | list | Up to 20 games Cartridge downloaded and still has, newest first (below) |

Recent games:

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `romId` | `rom_id` | long | RomM's rom id (works with `cartridge://game/{romId}`) |
| `title` | `title` | text | The game's name |
| `platformSlug` | `platform_slug` | text | RomM platform slug |
| `path` | `path` | text | The file or folder the game was saved to |
| `finishedAt` | `finished_at` | long, epoch ms | When the download finished (`0` for downloads older than Cartridge keeping the time) |

### Android: content provider

- Authority `io.github.abdu2304.cartridge.status` (`${applicationId}.status`), exported, read-only.
- `content://io.github.abdu2304.cartridge.status/status`: one row. `content://io.github.abdu2304.cartridge.status/recent`: up to 20 rows, newest first. Other URIs return `null`; insert, update and delete throw `UnsupportedOperationException`.
- Reading needs `io.github.abdu2304.cartridge.permission.READ_STATUS`, protection level `normal`: declare it with `<uses-permission>` and Android grants it at install, with no prompt. Android grants a permission defined by another app only when that app is already installed, so if Fuse was installed before Cartridge 0.9.10 some Android versions grant it only after Fuse is reinstalled or updated. Treat a `SecurityException` as "no status".
- A projection may name any of the columns; a column this version doesn't have comes back `null`.
- Both URIs get `notifyChange` with each new snapshot, so a `ContentObserver` sees changes.
- The provider answers even when Cartridge isn't running (Android starts its process just for the provider, without the UI). It then reports the last snapshot as it stood when Cartridge stopped: `connected` null, `active_downloads` 0, `queued_downloads` the games that were downloading or queued (they carry on at the next start), `progress` and the current game null. Before Cartridge has ever published, the row has zeros and nulls.

```kotlin
val uri = Uri.parse("content://io.github.abdu2304.cartridge.status/status")
contentResolver.query(uri, null, null, null, null)?.use { c ->
    if (c.moveToFirst()) {
        val active = c.getInt(c.getColumnIndexOrThrow("active_downloads"))
        val changedAt = c.getLong(c.getColumnIndexOrThrow("library_changed_at"))
    }
}
```

### Linux desktop: status file

`${XDG_STATE_HOME:-$HOME/.local/state}/cartridge/status.json` (`XDG_STATE_HOME` only when it is an absolute path).

- Written as a temp file and renamed over the old one, so a reader never sees half a file. To watch it, watch the folder for the rename (inotify `IN_MOVED_TO`).
- Readable by your user only (mode 600).
- When Cartridge quits it writes a last snapshot the same way the Android provider reports a stopped Cartridge: `connected` null, nothing downloading, the unfinished games counted as queued. After a crash the last snapshot stays; `updatedAt` shows its age.
- Only on the Linux desktop build. On Android the embedded backend sends the snapshot to the app, which hands it to the provider.

```json
{
  "protocol": 1,
  "version": "0.9.10",
  "connected": true,
  "activeDownloads": 1,
  "queuedDownloads": 2,
  "progress": 0.412,
  "currentTitle": "Chrono Trigger",
  "currentPlatform": "snes",
  "libraryChangedAt": 1790000000000,
  "updatedAt": 1790000123456,
  "recent": [
    { "romId": 1234, "title": "Super Metroid", "platformSlug": "snes", "path": "/home/you/Emulation/roms/snes/Super Metroid (USA).sfc", "finishedAt": 1789999000000 }
  ]
}
```

## Security

- Links only change what's on screen, or start a resync. They are checked strictly (ids are digits, slugs are short, total length is capped) and anything unknown is ignored.
- Web pages can't open them: no `BROWSABLE` on Android, no URL handler on Linux.
- The status is read-only: behind a permission on Android, your user only on Linux. It holds game titles, platform slugs and local paths of downloaded games, never the server address, username, password, tokens, API keys or settings.
- The phone remote never receives the status.

## Backwards compatibility

- Without Fuse nothing changes: normal launches, Back and everything else work as before.
- Cartridge 0.9.9 and older have no bridge: `cartridge://home` doesn't resolve, the provider isn't there and there is no status file. Fuse then opens Cartridge the normal way.
- Apps that don't use the bridge are unaffected.
- Later versions may add routes, parameters and fields within protocol 1; clients should ignore what they don't know.

## Where it lives

- `src/android/deeplink.js`: the link parser and console matching (both builds), tests in `test/deeplink.test.js`.
- `src/links.js`: opens the page; the desktop's link listener.
- `src/android/fuse.js`: Android links (`App.getLaunchUrl`, `appUrlOpen`), Back to Fuse, passing the status to native.
- `electron/fuseStatus.js`: the snapshot, the status file; tests in `test/fuse-status.test.js`.
- `electron/main.js`: links on the command line and from a second launch (`app:deeplink`), `fuse:status`, status updates on each broadcast.
- `CartridgeStatusProvider.java` and `CartridgeNativePlugin.java` (`publishStatus`, `returnToCaller`); the link filter, provider and permission in `AndroidManifest.xml`.
