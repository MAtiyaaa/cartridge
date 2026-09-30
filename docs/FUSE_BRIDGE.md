# Fuse bridge

From 0.9.10, other apps can hand over to Cartridge and see what it is doing. It was made for [Fuse](https://github.com/MAtiyaaa/fuse), an open-source game launcher, but any app can use it. This page is the contract, protocol version 3.

Cartridge 0.9.10 speaks protocol 1. Protocol 2 adds the download queue game by game and every downloaded game with its RomM metadata and pictures. Protocol 3 adds uploads: an app hands over a game's files and Cartridge, once the user confirms, uploads them to RomM and reports how it goes. Everything earlier protocols have is unchanged (see Backwards compatibility).

Two parts:

1. **Links.** `cartridge://...` opens a page in Cartridge (Android intents, or a command-line argument on the Linux desktop).
2. **Status.** A read-only snapshot of downloads (in total and game by game), the connection, recent games and the downloaded games with their metadata and pictures (an Android content provider, or a JSON file on the Linux desktop).

Nothing in either part can download, delete, launch a game or change a setting, and nothing exposes the RomM server address, the account, tokens or API keys. The upload link (protocol 3) only shows what would be uploaded: nothing is sent before the user confirms it on that page.

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
| `cartridge://upload?request={file}` | Protocol 3: a game to upload to RomM (see Uploads below), shown for the user to confirm |

Rules:

- The scheme, route, slug and parameter names are case-insensitive. Values are URL-encoded; in the query `+` is a space.
- `from=fuse` marks a link from Fuse (see Back below). `v` is the protocol version the caller speaks (`1` to `3`); it is accepted and ignored for now. Unknown parameters are ignored.
- Anything else (another scheme, an unknown route, a missing or non-numeric id, extra path parts, broken %-encoding, more than 2048 characters) is ignored. Search text is cut to 200 characters.
- `{slug}` is matched against each RomM platform's `slug`, then its `fs_slug` (the folder name). On Android the same console under another name also matches (the aliases in `src/android/emulators.js`, so `genesis` and `megadrive` both find `genesis-slash-megadrive`).
- A game that isn't in the library opens Library, a console that isn't opens Consoles, each with a short note.
- `platform` on `search` is accepted but ignored: Search has no console filter.
- Cartridge waits for its settings, and for game and console links its library (up to 20 seconds), so a link that starts Cartridge works. If Cartridge isn't connected to a RomM server yet, it shows Setup and ignores the link.

### Uploads (protocol 3)

An app hands over a game it has on this device (Fuse: a game's options, "Upload to RomM") as an **upload request**:

```json
{
  "v": 1,
  "from": "fuse",
  "title": "Pepsiman",
  "platform": "psx",
  "files": [
    { "path": "/storage/emulated/0/ROMs/psx/Pepsiman/Pepsiman.m3u", "name": "Pepsiman.m3u", "folder": "", "size": 58 },
    { "path": "/storage/emulated/0/ROMs/psx/Pepsiman/Pepsiman (Disc 1).chd", "name": "Pepsiman (Disc 1).chd", "folder": "", "size": 412000000 },
    { "path": "/storage/emulated/0/ROMs/psx/Pepsiman/dlc/Extra.bin", "name": "Extra.bin", "folder": "dlc", "size": 1024 }
  ]
}
```

- `v` must be `1`. `title` is shown; `platform` is matched like `{slug}` in links. `files`: 1 to 500, each an absolute `path` Cartridge reads with its own file access, and `folder`, where it goes inside the game on RomM: empty for the game itself, or a relative, forward-slashed folder such as `dlc` or `update` (RomM's categories). `..`, absolute folders, backslashes and the same file twice are refused. `name` and `size` are informational: Cartridge uses the file's own name and size.
- The request is at most 256 KB. **Linux desktop:** the app writes it to a `.json` file and passes its absolute path as `request` (`cartridge://upload?request=%2Fhome%2Fyou%2F.cache%2Ffuse%2Fcartridge-upload%2F1.json&from=fuse&v=3`); Cartridge only reads it. **Android:** the link has no `request`; the JSON travels in the intent's string extra `io.github.matiyaaa.fuse.extra.UPLOAD` (`Intent.ACTION_VIEW` with the link, sent to Cartridge's package). Cartridge reads the paths itself, which needs its All files access; files it can't read are listed.
- The page shows the game, the console on RomM, every file grouped as game, DLC, updates and other, and the total size, with anything that stops the upload: a file that is missing or can't be read, or a console RomM doesn't have yet. **Upload** starts it; Back or Cancel drops the request.
- The first file (the one that names the game: a launch file or an `.m3u`) is uploaded into the console's folder with RomM's chunked upload. Cartridge then asks RomM to scan that console (with a password sign-in; other sign-ins wait for RomM to find it, for example when it watches its folders) and looks the game up. The other files go into that game's folder (`rom_id` and `folder` on `/api/roms/upload/start`), which needs RomM 5.3 or newer; with an older RomM a game with several files is refused before anything is sent. A file RomM already has is skipped. One upload runs at a time; the rest wait.
- Progress is on the page and in the status's `uploads` (below). Uploads don't survive Cartridge closing: one that was still going is reported as failed.

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

Both platforms publish the same snapshot. It is rebuilt when downloads, the connection or the library change, at most every 500 ms, and only published when something in it changed. The games list is rebuilt only when the library, the downloaded games or their pictures change, never for download progress.

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `protocol` | `protocol` | int | `2` (`1` in Cartridge 0.9.10). New fields may be added; a new number means new tables or fields, and says so under Backwards compatibility. |
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
| `queue` | `/queue` rows | list | Protocol 2. The downloads game by game (below) |
| `games` | `/games` rows | list | Protocol 2. Every game Cartridge downloaded that is still on disk, with its metadata (below). In the file only: Android has it in its own table. |

Recent games:

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `romId` | `rom_id` | long | RomM's rom id (works with `cartridge://game/{romId}`) |
| `title` | `title` | text | The game's name |
| `platformSlug` | `platform_slug` | text | RomM platform slug |
| `path` | `path` | text | The file or folder the game was saved to |
| `finishedAt` | `finished_at` | long, epoch ms | When the download finished (`0` for downloads older than Cartridge keeping the time) |

### Queue (protocol 2)

The downloads in the order Cartridge's Downloads page shows them: the games downloading now, then the waiting ones in the order they will start, then the history (paused, failed and finished games, newest first). Up to 100 rows, so only old history is ever left out. Updated with the status: when it changes, at most every 500 ms.

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `romId` | `rom_id` | long | RomM's rom id |
| `title` | `title` | text | The game's name |
| `platformSlug` | `platform_slug` | text | RomM platform slug |
| `state` | `state` | text | `downloading`, `queued` (waiting, also while waiting for the server to come back), `paused` (stopped with Pause, continues with Resume), `failed` (stopped with an error, can be retried) or `done` (finished: the files are checked and in place, unpacking included). New states may be added; show an unknown one as it is. |
| `received` | `received` | long | Bytes downloaded so far (all files of the game) |
| `total` | `total` | long / null | The game's size in bytes, `null` while it isn't known |
| `position` | `position` | int | The row's place in this list, from `0` |

### Uploads (protocol 3)

The games handed over with `cartridge://upload` that the user confirmed, newest first, up to 50 (the unfinished ones and the last 20 finished). Updated with the status.

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `id` | `id` | text | Cartridge's id for the upload |
| `title` | `title` | text | The game's name from the request |
| `platformSlug` | `platform_slug` | text | The request's `platform` |
| `state` | `state` | text | `waiting` (another upload runs first), `uploading`, `scanning` (sent; RomM is adding the game), `done`, `failed` or `cancelled`. New states may be added; show an unknown one as it is. |
| `sent` | `sent` | long | Bytes uploaded so far (all files) |
| `total` | `total` | long / null | All files' size in bytes |
| `files` | `files` | int | How many files |
| `romId` | `rom_id` | long / null | The game on RomM once Cartridge found it there |
| `error` | `error` | text / null | Why it failed, in words for the user (never a server address) |
| `updatedAt` | `updated_at` | long, epoch ms | When it last changed |

### Games (protocol 2)

One row per game Cartridge downloaded and still has on disk (its downloads list, the same games as `recent` but all of them and only while the file or folder exists), newest download first. Games Cartridge found on disk but didn't download, and games marked as installed by hand, are not in it.

| Field (file) | Column (Android) | Type | Meaning |
|---|---|---|---|
| `romId` | `rom_id` | long | RomM's rom id (works with `cartridge://game/{romId}`) |
| `path` | `path` | text | The file or folder the game was saved to, as in `recent` |
| `title` | `title` | text | The game's name in RomM |
| `platformSlug` | `platform_slug` | text | RomM platform slug |
| `summary` | `summary` | text / null | RomM's description, in full (up to 8000 characters) |
| `year` | `year` | int / null | Year of the first release (RomM's `first_release_date`, UTC) |
| `genres` | `genres` | list (file), JSON array text (Android) | RomM's genres, up to 12, like `["RPG","Adventure"]`; `[]` when there are none |
| `developer` | `developer` | text / null | The first developer; when RomM doesn't name developers, the first company (as Cartridge's game page shows it) |
| `publisher` | `publisher` | text / null | The first publisher, when RomM has one |
| `rating` | `rating` | int 0-100 / null | RomM's average rating (a 0-10 rating is multiplied by 10) |
| `players` | `players` | text / null | RomM's player count as it has it, like `1-2` |
| `series` | `series` | list (file), JSON array text (Android) | RomM's franchises (`metadatum.franchises`), up to 12; `[]` when there are none |
| `cover` | `cover` | text / null | The cover (Android: a content URI, file: an absolute path; see Pictures) |
| `logo` | `logo` | text / null | The game's logo, same form |
| `screenshot` | `screenshot` | text / null | The first screenshot, same form |
| `updatedAt` | `updated_at` | long, epoch ms | The latest of: the download, a change in this game's metadata, a change of one of its picture files. Re-read the row's pictures when it moves. |

Where the metadata comes from: Cartridge keeps RomM's details for each game it downloads, when the download finishes, at every library sync (at start and every hour by default) and after Edit details. A game downloaded with an older Cartridge shows the library's shorter copy (400 characters of summary, 3 genres, 3 series, no publisher) until the next sync.

### Pictures (protocol 2)

Other apps can't sign in to RomM, so Cartridge hands over picture files it has itself; nothing in a row is a RomM or web address.

- `cover`: the cover Cartridge shows (one picked in Change artwork, else RomM's large cover, else its small one or the web cover RomM links to).
- `logo`: the trimmed logo Cartridge's game page shows, once Cartridge has made it (from the logo you picked, RomM's, or SteamGridDB's); until then the picked or RomM's logo as it is.
- `screenshot`: RomM's first screenshot.
- A picture is `null` when Cartridge doesn't have its file. For downloaded games Cartridge fetches a missing cover, screenshot and logo (only the picked or RomM's) once in the background, one at a time, and publishes the games again as they arrive. A game without that picture in RomM stays `null`.

### Android: content provider

- Authority `io.github.abdu2304.cartridge.status` (`${applicationId}.status`), exported, read-only.
- `content://io.github.abdu2304.cartridge.status/status`: one row. `content://io.github.abdu2304.cartridge.status/recent`: up to 20 rows, newest first. Protocol 2 adds `content://io.github.abdu2304.cartridge.status/queue` (up to 100 rows, in order) and `content://io.github.abdu2304.cartridge.status/games` (one row per downloaded game); protocol 3 adds `content://io.github.abdu2304.cartridge.status/uploads`. Other URIs return `null` from `query` (so do `/queue` and `/games` on Cartridge 0.9.10); insert, update and delete throw `UnsupportedOperationException`.
- Pictures: `content://io.github.abdu2304.cartridge.status/image/{romId}/{cover|logo|screenshot}`, the URIs in the `cover`, `logo` and `screenshot` columns. Open them with `openInputStream` or `openFileDescriptor(uri, "r")`; any other mode throws `SecurityException`, and a picture that isn't there (any more) throws `FileNotFoundException`. The column's URI carries `?v={number}`, which changes when the picture does, so image caches keyed on the URI load the new one; the provider ignores it and the URI works without it. `getType` gives `image/png`, `image/jpeg`, `image/webp` or `image/gif` (read from the file). Same permission as the tables.
- Reading needs `io.github.abdu2304.cartridge.permission.READ_STATUS`, protection level `normal`: declare it with `<uses-permission>` and Android grants it at install, with no prompt. Android grants a permission defined by another app only when that app is already installed, so if Fuse was installed before Cartridge 0.9.10 some Android versions grant it only after Fuse is reinstalled or updated. Treat a `SecurityException` as "no status".
- A projection may name any of the columns; a column this version doesn't have comes back `null`.
- `/status` and `/recent` get `notifyChange` with each new snapshot, `/queue` and `/uploads` when their rows changed, and `/games` and `/image` (which reaches every picture URI below it) when the games list changed, so a `ContentObserver` sees changes.
- The provider answers even when Cartridge isn't running (Android starts its process just for the provider, without the UI). It then reports the last snapshot as it stood when Cartridge stopped: `connected` null, `active_downloads` 0, `queued_downloads` the games that were downloading or queued (they carry on at the next start), `progress` and the current game null, and in `/queue` those games' `state` is `queued`; in `/uploads` an upload that was still going is `failed`. `/games` and the pictures work as usual. Before Cartridge has ever published, the row has zeros and nulls and the tables are empty.

```kotlin
val uri = Uri.parse("content://io.github.abdu2304.cartridge.status/status")
contentResolver.query(uri, null, null, null, null)?.use { c ->
    if (c.moveToFirst()) {
        val active = c.getInt(c.getColumnIndexOrThrow("active_downloads"))
        val changedAt = c.getLong(c.getColumnIndexOrThrow("library_changed_at"))
    }
}

// Protocol 2: the downloaded games and a cover
val games = Uri.parse("content://io.github.abdu2304.cartridge.status/games")
contentResolver.query(games, arrayOf("rom_id", "title", "genres", "cover"), null, null, null)?.use { c ->
    while (c.moveToNext()) {
        val genres = JSONArray(c.getString(c.getColumnIndexOrThrow("genres")))
        val cover = c.getString(c.getColumnIndexOrThrow("cover"))?.let(Uri::parse)
        val bitmap = cover?.let { contentResolver.openInputStream(it)?.use(BitmapFactory::decodeStream) }
    }
}
```

### Linux desktop: status file

`${XDG_STATE_HOME:-$HOME/.local/state}/cartridge/status.json` (`XDG_STATE_HOME` only when it is an absolute path).

- Written as a temp file and renamed over the old one, so a reader never sees half a file. To watch it, watch the folder for the rename (inotify `IN_MOVED_TO`).
- Readable by your user only (mode 600).
- When Cartridge quits it writes a last snapshot the same way the Android provider reports a stopped Cartridge: `connected` null, nothing downloading, the unfinished games counted as queued (and `queued` in `queue`). After a crash the last snapshot stays; `updatedAt` shows its age.
- Only on the Linux desktop build. On Android the embedded backend sends the snapshot to the app, which hands it to the provider.
- Protocol 3: it also has `uploads`; when Cartridge quits, an upload that was still going is written as `failed`.
- Protocol 2: it also has `queue` and `games`. In `games`, `cover`, `logo` and `screenshot` are absolute paths of files in Cartridge's own folder (`~/.config/Cartridge/imgcache/...` and `.../logos/...`), readable by your user. Covers and screenshots from the image cache have no file extension: read the type from the content (PNG, JPEG, WebP or GIF). A file can go away (Settings, Clear cache) before the next snapshot; treat a missing file as no picture.
- With the games in it the file is bigger (roughly 1 to 2 KB a game, mostly the summaries) and is still rewritten with each change while something downloads.

```json
{
  "protocol": 3,
  "version": "0.9.11",
  "connected": true,
  "activeDownloads": 1,
  "queuedDownloads": 1,
  "progress": 0.235,
  "currentTitle": "Chrono Trigger",
  "currentPlatform": "snes",
  "libraryChangedAt": 1790000000000,
  "updatedAt": 1790000123456,
  "recent": [
    { "romId": 1234, "title": "Super Metroid", "platformSlug": "snes", "path": "/home/you/Emulation/roms/snes/Super Metroid (USA).sfc", "finishedAt": 1789999000000 }
  ],
  "queue": [
    { "romId": 1300, "title": "Chrono Trigger", "platformSlug": "snes", "state": "downloading", "received": 1728053, "total": 4194304, "position": 0 },
    { "romId": 1301, "title": "EarthBound", "platformSlug": "snes", "state": "queued", "received": 0, "total": 3145728, "position": 1 },
    { "romId": 1234, "title": "Super Metroid", "platformSlug": "snes", "state": "done", "received": 3145728, "total": 3145728, "position": 2 }
  ],
  "uploads": [
    { "id": "umg2x1", "title": "Pepsiman", "platformSlug": "psx", "state": "uploading", "sent": 104857600, "total": 412001082, "files": 3, "romId": null, "error": null, "updatedAt": 1790000120000 }
  ],
  "games": [
    {
      "romId": 1234,
      "path": "/home/you/Emulation/roms/snes/Super Metroid (USA).sfc",
      "title": "Super Metroid",
      "platformSlug": "snes",
      "summary": "Samus returns to Zebes to recover the last Metroid...",
      "year": 1994,
      "genres": ["Platform", "Adventure"],
      "developer": "Nintendo R&D1",
      "publisher": "Nintendo",
      "rating": 92,
      "players": "1",
      "series": ["Metroid"],
      "cover": "/home/you/.config/Cartridge/imgcache/3f786850e387550fdab836ed7e6dc881de23001b",
      "logo": "/home/you/.config/Cartridge/logos/1234-r.png",
      "screenshot": null,
      "updatedAt": 1789999000000
    }
  ]
}
```

## Security

- Links only change what's on screen, or start a resync. They are checked strictly (ids are digits, slugs are short, total length is capped) and anything unknown is ignored.
- The upload link only shows a page. Cartridge reads the named files, lists them with their sizes and uploads nothing until the user presses Upload there; it never deletes or changes them. A request is checked strictly (absolute paths, folders inside the game, at most 500 files and 256 KB), and on the desktop Cartridge only reads the request file.
- Web pages can't open them: no `BROWSABLE` on Android, no URL handler on Linux.
- The status is read-only: behind a permission on Android, your user only on Linux. It holds game titles, platform slugs, local paths and RomM's metadata of downloaded games, never the server address, username, password, tokens, API keys or settings.
- Pictures are handed over as files Cartridge already has, never as RomM addresses (those would need your sign-in). On Android the provider opens only the picture files it was given for a game, only inside Cartridge's own storage and only for reading.
- The phone remote never receives the status.

## Backwards compatibility

- Without Fuse nothing changes: normal launches, Back and everything else work as before.
- Cartridge 0.9.9 and older have no bridge: `cartridge://home` doesn't resolve, the provider isn't there and there is no status file. Fuse then opens Cartridge the normal way.
- Apps that don't use the bridge are unaffected.
- Later versions may add routes, parameters, fields and columns; clients should ignore what they don't know.
- Protocol 3 only adds: the `upload` link, the `uploads` field in the file and the `/uploads` URI, and `protocol` reads `3`. A client should offer uploads only when `protocol >= 3`; older versions ignore the link.
- Protocol 2 only adds: the `queue` and `games` fields in the file, the `/queue`, `/games` and `/image/...` URIs, and `protocol` reads `2`. Every protocol 1 field, column, URI and meaning is the same, so a client written for 1 keeps working if it accepts `protocol >= 1` (Fuse does) and ignores fields it doesn't know.
- A client that uses the new tables should check `protocol >= 2`, or treat a `null` cursor from `/queue` or `/games` (and missing `queue` and `games` in the file) as "not available": that is Cartridge 0.9.10.

## Where it lives

- `src/android/deeplink.js`: the link parser and console matching (both builds), tests in `test/deeplink.test.js`.
- `src/links.js`: opens the page; the desktop's link listener.
- `src/android/fuse.js`: Android links (`App.getLaunchUrl`, `appUrlOpen`), Back to Fuse, passing the status and the games list to native.
- `electron/fuseUpload.js`: upload requests (`parseRequest`, `readRequest`), the check shown before uploading and the uploads themselves (`createUploads`); tests in `test/fuse-upload.test.js`. `src/views/FuseUpload.vue`: the page. `CartridgeNativePlugin.takeFuseUpload`: the Android request.
- `electron/fuseStatus.js`: the snapshot, the queue and upload rows, the games rows (`metaOf`, `keepMeta`, `gameRows`), the status file; tests in `test/fuse-status.test.js`.
- `electron/main.js`: links on the command line and from a second launch (`app:deeplink`), `fuse:status`, `fuse:games`, status updates on each broadcast; the games' fuller metadata (`fuse-meta.json` in the user data folder, kept at download, sync and Edit details) and their pictures (`bridgeImages`, fetched once by `warm` through the image cache).
- `CartridgeStatusProvider.java` (tables, pictures in `openFile`, the games list in `fuse-games.json` in the app's files folder) and `CartridgeNativePlugin.java` (`publishStatus`, `publishGames`, `returnToCaller`); the link filter, provider and permission in `AndroidManifest.xml`.
