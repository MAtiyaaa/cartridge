package io.github.abdu2304.cartridge;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

/**
 * Read-only status for other apps, like the Fuse launcher (docs/FUSE_BRIDGE.md):
 * content://&lt;package&gt;.status/status (one row) and /recent (the last 20 downloads, newest first).
 * Other apps need the READ_STATUS permission. The snapshot comes from the app (CartridgeNativePlugin.publishStatus,
 * built by electron/fuseStatus.js) and is kept in SharedPreferences, so this answers while Cartridge isn't running.
 * Nothing about the server, the account or the settings is ever in it.
 */
public class CartridgeStatusProvider extends ContentProvider {
    static final int PROTOCOL = 1;
    private static final String PREFS = "fuse-status";
    private static final String KEY = "snapshot";
    private static final int STATUS = 1, RECENT = 2, MAX_RECENT = 20;
    static final String[] STATUS_COLUMNS = { "protocol", "version", "connected", "active_downloads", "queued_downloads", "progress", "current_title", "current_platform", "library_changed_at", "updated_at" };
    static final String[] RECENT_COLUMNS = { "rom_id", "title", "platform_slug", "path", "finished_at" };

    // Set once the running app has published. Before that the snapshot is from an earlier run: nothing is
    // downloading and the connection is unknown (updated_at still says when it was taken).
    private static volatile boolean live = false;
    private UriMatcher uris;

    private static String authority(Context c) { return c.getPackageName() + ".status"; }

    @Override
    public boolean onCreate() {
        uris = new UriMatcher(UriMatcher.NO_MATCH);
        uris.addURI(authority(getContext()), "status", STATUS);
        uris.addURI(authority(getContext()), "recent", RECENT);
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

    /** Called by CartridgeNativePlugin.publishStatus with the snapshot from electron/fuseStatus.js. */
    static void publish(Context c, JSONObject s) throws Exception {
        // library_changed_at never goes back (a deleted game may have been the newest)
        long was = stored(c).optLong("libraryChangedAt", 0);
        if (was > s.optLong("libraryChangedAt", 0)) s.put("libraryChangedAt", was);
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, s.toString()).apply();
        live = true;
        Uri base = Uri.parse("content://" + authority(c));
        c.getContentResolver().notifyChange(Uri.withAppendedPath(base, "status"), null);
        c.getContentResolver().notifyChange(Uri.withAppendedPath(base, "recent"), null);
    }

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
        if (m != STATUS && m != RECENT) return null;
        JSONObject s = stored(getContext());
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
        } else {
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
        }
        c.setNotificationUri(getContext().getContentResolver(), uri);
        return c;
    }

    @Override
    public String getType(Uri uri) {
        int m = uris.match(uri);
        if (m == STATUS) return "vnd.android.cursor.item/vnd." + authority(getContext()) + ".status";
        if (m == RECENT) return "vnd.android.cursor.dir/vnd." + authority(getContext()) + ".recent";
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException("Cartridge's status is read-only"); }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) { throw new UnsupportedOperationException("Cartridge's status is read-only"); }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { throw new UnsupportedOperationException("Cartridge's status is read-only"); }
}
