package io.github.abdu2304.cartridge;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.UriMatcher;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.util.AtomicFile;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only status for other apps, like the Fuse launcher (docs/FUSE_BRIDGE.md), protocol 3:
 * content://&lt;package&gt;.status/status (one row), /recent (the last 20 downloads, newest first), /queue (the
 * downloads game by game), /games (every downloaded game with its RomM metadata), /uploads (the games Fuse handed
 * over to upload to RomM, newest first) and /image/&lt;romId&gt;/&lt;kind&gt; (that game's cover, logo or screenshot,
 * opened read-only). Other apps need the READ_STATUS permission.
 * Everything comes from the app (CartridgeNativePlugin.publishStatus and publishGames, built by
 * electron/fuseStatus.js) and is kept in SharedPreferences and a file, so this answers while Cartridge isn't running.
 * Nothing about the server, the account or the settings is ever in it, and pictures are only files in the app's storage.
 */
public class CartridgeStatusProvider extends ContentProvider {
    static final int PROTOCOL = 3;
    private static final String PREFS = "fuse-status";
    private static final String KEY = "snapshot";
    // The games list is big (full summaries) and changes rarely: a file of its own, not part of the status that is
    // saved every 500 ms while something downloads
    private static final String GAMES_FILE = "fuse-games.json";
    private static final int STATUS = 1, RECENT = 2, QUEUE = 3, GAMES = 4, IMAGE = 5, UPLOADS = 6, MAX_RECENT = 20;
    static final String[] STATUS_COLUMNS = { "protocol", "version", "connected", "active_downloads", "queued_downloads", "progress", "current_title", "current_platform", "library_changed_at", "updated_at" };
    static final String[] RECENT_COLUMNS = { "rom_id", "title", "platform_slug", "path", "finished_at" };
    static final String[] QUEUE_COLUMNS = { "rom_id", "title", "platform_slug", "state", "received", "total", "position" };
    static final String[] GAMES_COLUMNS = { "rom_id", "path", "title", "platform_slug", "summary", "year", "genres", "developer", "publisher", "rating", "players", "series", "cover", "logo", "screenshot", "updated_at" };
    static final String[] UPLOADS_COLUMNS = { "id", "title", "platform_slug", "state", "sent", "total", "files", "rom_id", "error", "updated_at" };
    static final List<String> IMAGES = Arrays.asList("cover", "logo", "screenshot");

    // Set once the running app has published. Before that the snapshot is from an earlier run: nothing is
    // downloading and the connection is unknown (updated_at still says when it was taken).
    private static volatile boolean live = false;
    // romId -> picture files (cover, logo, screenshot) from the games list, for openFile
    private static Map<Long, String[]> pictures = null;
    private UriMatcher uris;

    private static String authority(Context c) { return c.getPackageName() + ".status"; }

    @Override
    public boolean onCreate() {
        uris = new UriMatcher(UriMatcher.NO_MATCH);
        uris.addURI(authority(getContext()), "status", STATUS);
        uris.addURI(authority(getContext()), "recent", RECENT);
        uris.addURI(authority(getContext()), "queue", QUEUE);
        uris.addURI(authority(getContext()), "games", GAMES);
        uris.addURI(authority(getContext()), "uploads", UPLOADS);
        uris.addURI(authority(getContext()), "image/#/*", IMAGE);
        return true;
    }

    private static JSONObject stored(Context c) {
        try {
            String s = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
            return s == null ? new JSONObject() : new JSONObject(s);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private static void changed(Context c, String path) {
        c.getContentResolver().notifyChange(Uri.parse("content://" + authority(c) + "/" + path), null);
    }

    /** Called by CartridgeNativePlugin.publishStatus with the snapshot from electron/fuseStatus.js. */
    static void publish(Context c, JSONObject s) throws Exception {
        JSONObject was = stored(c);
        // library_changed_at never goes back (a deleted game may have been the newest)
        long at = was.optLong("libraryChangedAt", 0);
        if (at > s.optLong("libraryChangedAt", 0)) s.put("libraryChangedAt", at);
        // the queue's rows change with the queue, or with this run's first snapshot (downloading stops reading as queued)
        boolean queue = !live || !String.valueOf(was.optJSONArray("queue")).equals(String.valueOf(s.optJSONArray("queue")));
        boolean uploads = !live || !String.valueOf(was.optJSONArray("uploads")).equals(String.valueOf(s.optJSONArray("uploads")));
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, s.toString()).apply();
        live = true;
        changed(c, "status");
        changed(c, "recent");
        if (queue) changed(c, "queue");
        if (uploads) changed(c, "uploads");
    }

    // ------------------------------------------------------------ games
    private static File gamesFile(Context c) { return new File(c.getFilesDir(), GAMES_FILE); }

    private static String gamesText(Context c) {
        try {
            return new String(new AtomicFile(gamesFile(c)).readFully(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "[]";
        }
    }

    private static JSONArray gamesList(Context c) {
        try {
            return new JSONArray(gamesText(c));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static Map<Long, String[]> index(JSONArray list) {
        Map<Long, String[]> out = new HashMap<>();
        for (int i = 0; i < list.length(); i++) {
            JSONObject g = list.optJSONObject(i);
            if (g == null || g.optLong("romId", 0) <= 0) continue;
            String[] files = new String[IMAGES.size()];
            for (int k = 0; k < files.length; k++) files[k] = g.isNull(IMAGES.get(k)) ? null : g.optString(IMAGES.get(k), null);
            out.put(g.optLong("romId"), files);
        }
        return out;
    }

    private static synchronized Map<Long, String[]> pictures(Context c) {
        if (pictures == null) pictures = index(gamesList(c));
        return pictures;
    }

    /** Called by CartridgeNativePlugin.publishGames with the games list from electron/fuseStatus.js. */
    static void publishGames(Context c, JSONArray list) throws Exception {
        String text = list.toString();
        synchronized (CartridgeStatusProvider.class) {
            if (text.equals(gamesText(c))) return; // the same list again (the WebView reloaded)
            AtomicFile f = new AtomicFile(gamesFile(c));
            FileOutputStream out = f.startWrite();
            try {
                out.write(text.getBytes(StandardCharsets.UTF_8));
                f.finishWrite(out);
            } catch (IOException e) {
                f.failWrite(out);
                throw e;
            }
            pictures = index(list);
        }
        changed(c, "games");
        changed(c, "image"); // and every /image/<romId>/<kind> below it
    }

    // A picture file the app published for a game: only inside the app's own storage, and only while it is there
    private static File usable(Context c, String p) {
        if (p == null || p.isEmpty()) return null;
        try {
            File f = new File(p).getCanonicalFile();
            String root = c.getFilesDir().getCanonicalPath() + File.separator;
            return f.getPath().startsWith(root) && f.isFile() && f.canRead() ? f : null;
        } catch (IOException e) {
            return null;
        }
    }

    // The file behind content://<package>.status/image/<romId>/<cover|logo|screenshot>
    private static File picture(Context c, Uri uri) {
        List<String> seg = uri.getPathSegments();
        if (seg.size() != 3) return null;
        int kind = IMAGES.indexOf(seg.get(2));
        String[] files;
        try {
            files = pictures(c).get(Long.parseLong(seg.get(1)));
        } catch (NumberFormatException e) {
            return null;
        }
        return kind < 0 || files == null ? null : usable(c, files[kind]);
    }

    // Covers from the image cache have no file extension: the type comes from the first bytes
    private static String sniff(File f) {
        byte[] b = new byte[12];
        int n;
        try (InputStream in = new FileInputStream(f)) {
            n = in.read(b);
        } catch (IOException e) {
            return null;
        }
        if (n >= 4 && (b[0] & 0xff) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (n >= 3 && (b[0] & 0xff) == 0xff && (b[1] & 0xff) == 0xd8 && (b[2] & 0xff) == 0xff) return "image/jpeg";
        if (n >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        if (n >= 4 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') return "image/gif";
        return "application/octet-stream";
    }

    // ------------------------------------------------------------ reading
    private String versionName() {
        try {
            String v = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0).versionName;
            return v == null ? "" : v;
        } catch (Exception e) {
            return "";
        }
    }

    private static Object text(JSONObject o, String k) {
        return o.isNull(k) || o.optString(k, "").isEmpty() ? null : o.optString(k);
    }

    // A list of names as JSON text ("[]" when there are none)
    private static String names(JSONObject o, String k) {
        JSONArray a = o.optJSONArray(k);
        return a == null ? "[]" : a.toString();
    }

    // A cursor with the columns asked for (all by default); a column this version doesn't have is null
    private static MatrixCursor cursor(String[] all, String[] projection, java.util.List<Map<String, Object>> rows) {
        String[] cols = projection == null || projection.length == 0 ? all : projection;
        MatrixCursor c = new MatrixCursor(cols, rows.size());
        for (Map<String, Object> r : rows) {
            Object[] row = new Object[cols.length];
            for (int i = 0; i < cols.length; i++) row[i] = r.get(cols[i]);
            c.addRow(row);
        }
        return c;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        int m = uris.match(uri);
        if (m != STATUS && m != RECENT && m != QUEUE && m != GAMES && m != UPLOADS) return null;
        Context ctx = getContext();
        JSONObject s = m == GAMES ? null : stored(ctx);
        java.util.List<Map<String, Object>> rows = new java.util.ArrayList<>();
        MatrixCursor c;
        if (m == STATUS) {
            boolean running = live;
            int active = s.optInt("activeDownloads", 0), queued = s.optInt("queuedDownloads", 0);
            Map<String, Object> r = new HashMap<>();
            r.put("protocol", PROTOCOL);
            r.put("version", versionName());
            r.put("connected", !running || s.isNull("connected") ? null : (s.optBoolean("connected", false) ? 1 : 0));
            r.put("active_downloads", running ? active : 0);
            r.put("queued_downloads", running ? queued : active + queued);
            r.put("progress", !running || s.isNull("progress") ? null : Math.max(0d, Math.min(1d, s.optDouble("progress", 0))));
            r.put("current_title", running ? text(s, "currentTitle") : null);
            r.put("current_platform", running ? text(s, "currentPlatform") : null);
            r.put("library_changed_at", s.optLong("libraryChangedAt", 0));
            r.put("updated_at", s.optLong("updatedAt", 0));
            rows.add(r);
            c = cursor(STATUS_COLUMNS, projection, rows);
        } else if (m == RECENT) {
            JSONArray list = s.optJSONArray("recent");
            for (int i = 0; list != null && i < list.length() && rows.size() < MAX_RECENT; i++) {
                JSONObject g = list.optJSONObject(i);
                if (g == null || g.optLong("romId", 0) <= 0) continue;
                Map<String, Object> r = new HashMap<>();
                r.put("rom_id", g.optLong("romId"));
                r.put("title", g.optString("title", ""));
                r.put("platform_slug", g.optString("platformSlug", ""));
                r.put("path", g.optString("path", ""));
                r.put("finished_at", g.optLong("finishedAt", 0));
                rows.add(r);
            }
            c = cursor(RECENT_COLUMNS, projection, rows);
        } else if (m == QUEUE) {
            boolean running = live;
            JSONArray list = s.optJSONArray("queue");
            for (int i = 0; list != null && i < list.length(); i++) {
                JSONObject q = list.optJSONObject(i);
                if (q == null || q.optLong("romId", 0) <= 0) continue;
                String state = q.optString("state", "");
                Map<String, Object> r = new HashMap<>();
                r.put("rom_id", q.optLong("romId"));
                r.put("title", q.optString("title", ""));
                r.put("platform_slug", q.optString("platformSlug", ""));
                // Cartridge stopped: what was downloading carries on at the next start
                r.put("state", !running && "downloading".equals(state) ? "queued" : state);
                r.put("received", Math.max(0L, q.optLong("received", 0)));
                r.put("total", q.optLong("total", 0) > 0 ? Long.valueOf(q.optLong("total")) : null);
                r.put("position", rows.size());
                rows.add(r);
            }
            c = cursor(QUEUE_COLUMNS, projection, rows);
        } else if (m == UPLOADS) {
            boolean running = live;
            JSONArray list = s.optJSONArray("uploads");
            for (int i = 0; list != null && i < list.length(); i++) {
                JSONObject u = list.optJSONObject(i);
                if (u == null || u.optString("id", "").isEmpty()) continue;
                String state = u.optString("state", "");
                boolean going = "waiting".equals(state) || "uploading".equals(state) || "scanning".equals(state);
                Map<String, Object> r = new HashMap<>();
                r.put("id", u.optString("id"));
                r.put("title", u.optString("title", ""));
                r.put("platform_slug", u.optString("platformSlug", ""));
                // Cartridge stopped: an upload can't carry on
                r.put("state", !running && going ? "failed" : state);
                r.put("sent", Math.max(0L, u.optLong("sent", 0)));
                r.put("total", u.optLong("total", 0) > 0 ? Long.valueOf(u.optLong("total")) : null);
                r.put("files", Math.max(0, u.optInt("files", 0)));
                r.put("rom_id", u.optLong("romId", 0) > 0 ? Long.valueOf(u.optLong("romId")) : null);
                r.put("error", !running && going ? "Cartridge was closed before the upload finished." : text(u, "error"));
                r.put("updated_at", u.optLong("updatedAt", 0));
                rows.add(r);
            }
            c = cursor(UPLOADS_COLUMNS, projection, rows);
        } else {
            JSONArray list = gamesList(ctx);
            Uri images = Uri.parse("content://" + authority(ctx) + "/image");
            for (int i = 0; i < list.length(); i++) {
                JSONObject g = list.optJSONObject(i);
                if (g == null || g.optLong("romId", 0) <= 0) continue;
                long id = g.optLong("romId");
                Map<String, Object> r = new HashMap<>();
                r.put("rom_id", id);
                r.put("path", g.optString("path", ""));
                r.put("title", g.optString("title", ""));
                r.put("platform_slug", g.optString("platformSlug", ""));
                r.put("summary", text(g, "summary"));
                r.put("year", g.optInt("year", 0) > 0 ? Integer.valueOf(g.optInt("year")) : null);
                r.put("genres", names(g, "genres"));
                r.put("developer", text(g, "developer"));
                r.put("publisher", text(g, "publisher"));
                r.put("rating", g.isNull("rating") ? null : Integer.valueOf(Math.max(0, Math.min(100, g.optInt("rating", 0)))));
                r.put("players", text(g, "players"));
                r.put("series", names(g, "series"));
                // a picture only while its file is there; v changes with the file, so image caches see a new picture
                for (String k : IMAGES) {
                    File f = g.isNull(k) ? null : usable(ctx, g.optString(k, null));
                    r.put(k, f == null ? null : images.buildUpon().appendPath(String.valueOf(id)).appendPath(k)
                        .appendQueryParameter("v", String.valueOf(f.lastModified())).build().toString());
                }
                r.put("updated_at", g.optLong("updatedAt", 0));
                rows.add(r);
            }
            c = cursor(GAMES_COLUMNS, projection, rows);
        }
        c.setNotificationUri(ctx.getContentResolver(), uri);
        return c;
    }

    /** A game's picture, read-only ("r"), for apps holding READ_STATUS (the provider's readPermission). */
    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (uris.match(uri) != IMAGE) throw new FileNotFoundException("Not a picture: " + uri);
        // there is no writePermission, so a write mode gets this far: refuse it here
        if (!"r".equals(mode)) throw new SecurityException("Cartridge's pictures are read-only");
        File f = picture(getContext(), uri);
        if (f == null) throw new FileNotFoundException("No such picture: " + uri);
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public String getType(Uri uri) {
        int m = uris.match(uri);
        if (m == STATUS) return "vnd.android.cursor.item/vnd." + authority(getContext()) + ".status";
        if (m == RECENT) return "vnd.android.cursor.dir/vnd." + authority(getContext()) + ".recent";
        if (m == QUEUE) return "vnd.android.cursor.dir/vnd." + authority(getContext()) + ".queue";
        if (m == GAMES) return "vnd.android.cursor.dir/vnd." + authority(getContext()) + ".games";
        if (m == UPLOADS) return "vnd.android.cursor.dir/vnd." + authority(getContext()) + ".uploads";
        if (m == IMAGE) {
            // getType isn't permission checked: without READ_STATUS it must not tell which games have pictures
            Context c = getContext();
            if (c.checkCallingOrSelfPermission(c.getPackageName() + ".permission.READ_STATUS") != PackageManager.PERMISSION_GRANTED) return "image/*";
            File f = picture(c, uri);
            return f == null ? null : sniff(f);
        }
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException("Cartridge's status is read-only"); }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) { throw new UnsupportedOperationException("Cartridge's status is read-only"); }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { throw new UnsupportedOperationException("Cartridge's status is read-only"); }
}
