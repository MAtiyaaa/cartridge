package io.github.abdu2304.cartridge;

import android.Manifest;
import android.app.Presentation;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.hardware.display.DisplayManager;
import android.hardware.input.InputManager;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.provider.DocumentsContract;
import android.os.Looper;
import android.provider.Settings;
import android.view.Display;
import android.view.InputDevice;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Native side of the Android build: dual screen, storage access, background downloads, APK updates, controller input. */
@CapacitorPlugin(name = "CartridgeNative")
public class CartridgeNativePlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private DisplayManager displays;
    private Companion companion;
    private String companionUrl;
    private File updateApk;

    private final DisplayManager.DisplayListener displayListener = new DisplayManager.DisplayListener() {
        @Override public void onDisplayAdded(int id) { changed(); }
        @Override public void onDisplayRemoved(int id) { if (companion != null && companion.getDisplay().getDisplayId() == id) hide(); changed(); }
        @Override public void onDisplayChanged(int id) {}
        private void changed() { notifyListeners("displays", describe()); }
    };

    private InputManager inputs;
    private final InputManager.InputDeviceListener inputListener = new InputManager.InputDeviceListener() {
        @Override public void onInputDeviceAdded(int id) { notifyListeners("controllers", new JSObject()); }
        @Override public void onInputDeviceRemoved(int id) { notifyListeners("controllers", new JSObject()); }
        @Override public void onInputDeviceChanged(int id) {}
    };

    @Override
    public void load() {
        displays = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        displays.registerDisplayListener(displayListener, main);
        inputs = (InputManager) getContext().getSystemService(Context.INPUT_SERVICE);
        inputs.registerInputDeviceListener(inputListener, main);
    }

    // ------------------------------------------------------------ phone remote
    private WifiManager.MulticastLock multicast;

    /** This device's IPv4 address on the current network (Node can't always read it on Android). */
    // Battery details for the Quick Menu: level, charging and how, temperature, voltage, health, the current
    // draw, and (Android 9+) the time to full. The WebView's battery API only has level and charging.
    @PluginMethod
    public void battery(PluginCall call) {
        JSObject o = new JSObject();
        try {
            Intent b = getContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            if (b != null) {
                int level = b.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = b.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
                o.put("level", level >= 0 && scale > 0 ? Math.round(level * 100f / scale) : -1);
                int st = b.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                o.put("status", st == BatteryManager.BATTERY_STATUS_CHARGING ? "charging" : st == BatteryManager.BATTERY_STATUS_FULL ? "full" : st == BatteryManager.BATTERY_STATUS_NOT_CHARGING ? "idle" : "discharging");
                int pl = b.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0);
                o.put("plugged", pl == BatteryManager.BATTERY_PLUGGED_AC ? "ac" : pl == BatteryManager.BATTERY_PLUGGED_USB ? "usb" : pl == BatteryManager.BATTERY_PLUGGED_WIRELESS ? "wireless" : "");
                o.put("tempTenths", b.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0));
                o.put("voltageMv", b.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0));
                int h = b.getIntExtra(BatteryManager.EXTRA_HEALTH, 0);
                o.put("health", h == BatteryManager.BATTERY_HEALTH_GOOD ? "good" : h == BatteryManager.BATTERY_HEALTH_OVERHEAT ? "overheating" : h == BatteryManager.BATTERY_HEALTH_DEAD ? "worn out" : h == BatteryManager.BATTERY_HEALTH_COLD ? "cold" : h == BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE ? "over voltage" : "");
            }
            BatteryManager bm = (BatteryManager) getContext().getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                o.put("currentUa", bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)); // microamps, sign varies by device
                if (Build.VERSION.SDK_INT >= 28) o.put("toFullMs", bm.computeChargeTimeRemaining());
            }
        } catch (Exception ignored) {}
        call.resolve(o);
    }

    // Fuse's play sessions, from its read-only play provider (docs/FUSE_BRIDGE.md, Play sessions from Fuse), so
    // Start's last played and play time count games played from Fuse too. Off the main thread: the provider may
    // have to start Fuse's process. Fuse missing, too old, or not allowing Cartridge yet: available false, no rows.
    @PluginMethod
    public void fusePlay(PluginCall call) {
        long since = call.getLong("since", 0L);
        new Thread(() -> {
            JSObject o = new JSObject();
            JSArray rows = new JSArray();
            boolean ok = false;
            Uri uri = Uri.parse("content://io.github.matiyaaa.fuse.play/sessions").buildUpon().appendQueryParameter("since", String.valueOf(since)).build();
            try (android.database.Cursor c = getContext().getContentResolver().query(uri, null, null, null, null)) {
                if (c != null) {
                    ok = true;
                    String[] cols = c.getColumnNames();
                    while (c.moveToNext() && rows.length() < 2000) {
                        JSObject r = new JSObject();
                        for (int i = 0; i < cols.length; i++) {
                            int t = c.getType(i);
                            if (t == android.database.Cursor.FIELD_TYPE_INTEGER) r.put(cols[i], c.getLong(i));
                            else if (t == android.database.Cursor.FIELD_TYPE_STRING) r.put(cols[i], c.getString(i));
                        }
                        rows.put(r);
                    }
                }
            } catch (Exception ignored) {} // SecurityException: not allowed yet
            o.put("available", ok);
            o.put("rows", rows);
            call.resolve(o);
        }).start();
    }

    @PluginMethod
    public void wifiAddress(PluginCall call) {
        String ip = "";
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            LinkProperties lp = n == null ? null : cm.getLinkProperties(n);
            if (lp != null) for (LinkAddress a : lp.getLinkAddresses()) {
                if (a.getAddress() instanceof java.net.Inet4Address && !a.getAddress().isLoopbackAddress()) { ip = a.getAddress().getHostAddress(); break; }
            }
        } catch (Exception ignored) {}
        JSObject o = new JSObject();
        o.put("address", ip);
        call.resolve(o);
    }

    /** Android drops broadcast/multicast packets unless an app holds this lock (device discovery). */
    @PluginMethod
    public void setDiscovery(PluginCall call) {
        boolean on = call.getBoolean("on", false);
        try {
            if (on && multicast == null) {
                WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                multicast = wm.createMulticastLock("cartridge-remote");
                multicast.setReferenceCounted(false);
                multicast.acquire();
            } else if (!on && multicast != null) {
                multicast.release();
                multicast = null;
            }
        } catch (Exception ignored) {}
        call.resolve();
    }

    /** Names of connected controllers (built-in and Bluetooth), used to guess Nintendo vs Xbox button layout. */
    @PluginMethod
    public void controllers(PluginCall call) {
        JSArray names = new JSArray();
        for (int id : InputDevice.getDeviceIds()) {
            InputDevice d = InputDevice.getDevice(id);
            if (d == null || d.isVirtual()) continue;
            int s = d.getSources();
            if ((s & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD || (s & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK) names.put(d.getName());
        }
        JSObject o = new JSObject();
        o.put("names", names);
        call.resolve(o);
    }

    // The second screen is Cartridge's only while Cartridge is in front. A Presentation stays on top of that
    // screen when its activity stops, so left up it covered whatever came next: an app Fuse opened on the
    // bottom screen, Fuse's own second screen, a DS emulator's bottom screen. It steps aside on stop (kept
    // loaded, paused) and comes back on start, before app.js refreshes it on resume.
    private boolean away;

    @Override
    protected void handleOnStop() {
        super.handleOnStop();
        away = true;
        if (companion != null && companion.isShowing()) companion.away();
    }

    @Override
    protected void handleOnStart() {
        super.handleOnStart();
        away = false;
        if (companion != null) companion.back();
    }

    @Override
    protected void handleOnDestroy() {
        displays.unregisterDisplayListener(displayListener);
        inputs.unregisterInputDeviceListener(inputListener);
        hide();
    }

    /** Called by MainActivity for every controller button / stick change. */
    void pad(String action, boolean down) {
        JSObject o = new JSObject();
        o.put("action", action);
        o.put("down", down);
        notifyListeners("pad", o);
    }

    // ------------------------------------------------------------ dual screen
    /** A second built-in or connected screen (the AYN Thor's bottom screen), if there is one. */
    private Display secondary() {
        Display[] list = displays.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);
        if (list.length == 0) list = displays.getDisplays();
        int mine = getActivity().getWindowManager().getDefaultDisplay().getDisplayId();
        for (Display d : list) {
            if (d.getDisplayId() != mine && d.getState() != Display.STATE_OFF) return d;
        }
        return null;
    }

    private JSObject describe() {
        JSObject o = new JSObject();
        Display d = secondary();
        if (d != null) {
            JSObject s = new JSObject();
            android.graphics.Point size = new android.graphics.Point();
            d.getRealSize(size);
            s.put("id", d.getDisplayId());
            s.put("name", d.getName());
            s.put("width", size.x);
            s.put("height", size.y);
            o.put("secondary", s);
        } else {
            o.put("secondary", null);
        }
        o.put("count", displays.getDisplays().length);
        return o;
    }

    @PluginMethod
    public void displays(PluginCall call) { call.resolve(describe()); }

    @PluginMethod
    public void showCompanion(PluginCall call) {
        String url = call.getString("url");
        main.post(() -> {
            try {
                // Away (a display change while another app is in front): it opens when Cartridge is back
                if (away) { call.resolve(); return; }
                Display d = secondary();
                if (d == null) { call.reject("No second screen"); return; }
                if (companion != null && companion.isShowing() && companion.getDisplay().getDisplayId() == d.getDisplayId() && url.equals(companionUrl)) { call.resolve(); return; }
                hide();
                companionUrl = url;
                final Companion c = new Companion(getActivity(), d, url);
                companion = c;
                // closed by the system (or anything else): forget it, so the next show opens it again
                c.setOnDismissListener((x) -> { if (companion == c) { companion = null; companionUrl = null; } });
                c.show();
                call.resolve();
            } catch (Exception e) {
                companion = null;
                call.reject("Could not open the second screen: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void hideCompanion(PluginCall call) { main.post(() -> { hide(); call.resolve(); }); }

    private void hide() {
        if (companion != null) { try { companion.dismiss(); } catch (Exception ignored) {} }
        companion = null;
        companionUrl = null;
    }

    /** Presentation hosting its own WebView, pointed at the companion page served by the Node backend. */
    static class Companion extends Presentation {
        private final String url;
        private WebView web;
        // A back gesture on the second screen used to close it for good; it stays until Cartridge hides it
        Companion(Context ctx, Display display, String url) { super(ctx, display); this.url = url; setCancelable(false); }

        @Override
        protected void onCreate(Bundle b) {
            super.onCreate(b);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            web = new WebView(getContext());
            web.setBackgroundColor(Color.parseColor("#06070b"));
            WebSettings s = web.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            // The companion page asks for a 600px wide canvas; scale it to the bottom screen
            s.setUseWideViewPort(true);
            s.setLoadWithOverviewMode(true);
            s.setMediaPlaybackRequiresUserGesture(false);
            web.setWebViewClient(new WebViewClient());
            setContentView(web, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            web.loadUrl(url);
        }

        /** Off the screen without closing: the page stays loaded and paused until {@link #back()}. */
        void away() {
            if (!isShowing()) return;
            hidden = true;
            if (web != null) web.onPause();
            hide();
        }

        void back() {
            if (!hidden) return;
            hidden = false;
            if (web != null) web.onResume();
            show();
        }

        private boolean hidden;

        @Override
        public void onDetachedFromWindow() {
            if (web != null) { web.destroy(); web = null; }
            super.onDetachedFromWindow();
        }
    }

    // ------------------------------------------------------------ storage
    private boolean storageGranted() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) return Environment.isExternalStorageManager();
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void storageStatus(PluginCall call) {
        JSObject o = new JSObject();
        o.put("granted", storageGranted());
        call.resolve(o);
    }

    @PluginMethod
    public void requestStorage(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Intent i = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(i);
            } catch (Exception e) {
                getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION));
            }
        } else {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE }, 41);
        }
        call.resolve();
    }

    // ------------------------------------------------------------ window
    @PluginMethod
    public void setImmersive(PluginCall call) {
        ((MainActivity) getActivity()).setImmersive(call.getBoolean("on", true));
        call.resolve();
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(call.getString("url")));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    // Apps that run PC (Windows) games on Android. Their game lists are private to each app, so
    // Cartridge can only open them for you (Settings → Android → Steam & PC game apps).
    private static final java.util.regex.Pattern PC_APPS = java.util.regex.Pattern.compile("gamenative|gamehub|winlator", java.util.regex.Pattern.CASE_INSENSITIVE);

    @PluginMethod
    public void launchers(PluginCall call) {
        boolean all = call.getBoolean("all", false);
        JSArray out = new JSArray();
        try {
            PackageManager pm = getContext().getPackageManager();
            Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
            java.util.HashSet<String> seen = new java.util.HashSet<>();
            for (ResolveInfo r : pm.queryIntentActivities(i, 0)) {
                String pkg = r.activityInfo.packageName;
                String label = String.valueOf(r.loadLabel(pm));
                // all: every launchable app (emulator forks are matched by name in src/android/play.js)
                if (seen.contains(pkg) || !(all || PC_APPS.matcher(pkg).find() || PC_APPS.matcher(label).find())) continue;
                seen.add(pkg);
                JSObject o = new JSObject();
                o.put("pkg", pkg);
                o.put("label", label);
                if (all) { try { String v = pm.getPackageInfo(pkg, 0).versionName; o.put("version", v == null ? "" : v); } catch (Exception ignored) {} }
                out.put(o);
            }
        } catch (Exception ignored) {}
        JSObject res = new JSObject();
        res.put("apps", out);
        call.resolve(res);
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        try {
            Intent i = getContext().getPackageManager().getLaunchIntentForPackage(call.getString("pkg", ""));
            if (i == null) { call.reject("That app isn't installed"); return; }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }


    // ------------------------------------------------------------ emulators
    /** Which of these packages are installed (Android 11+ only shows the ones listed in the manifest's queries). */
    @PluginMethod
    public void packages(PluginCall call) {
        JSArray out = new JSArray();
        try {
            PackageManager pm = getContext().getPackageManager();
            JSArray list = call.getArray("list");
            for (int n = 0; list != null && n < list.length(); n++) {
                String pkg = list.getString(n);
                try {
                    android.content.pm.PackageInfo p = pm.getPackageInfo(pkg, 0);
                    JSObject o = new JSObject();
                    o.put("pkg", pkg);
                    o.put("version", p.versionName == null ? "" : p.versionName);
                    o.put("label", String.valueOf(pm.getApplicationLabel(p.applicationInfo)));
                    out.put(o);
                } catch (PackageManager.NameNotFoundException ignored) {}
            }
        } catch (Exception ignored) {}
        JSObject res = new JSObject();
        res.put("apps", out);
        call.resolve(res);
    }

    /** This device's name, for "Installed on ...". */
    @PluginMethod
    public void device(PluginCall call) {
        JSObject o = new JSObject();
        o.put("manufacturer", Build.MANUFACTURER);
        o.put("model", Build.MODEL);
        o.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(o);
    }

    /** A file on shared storage as the documents URI most emulators expect (what ES-DE hands them too). */
    private String safUri(File f) {
        String p = f.getAbsolutePath();
        try { p = f.getCanonicalPath(); } catch (Exception ignored) {}
        String ext = Environment.getExternalStorageDirectory().getAbsolutePath();
        String docId;
        if (p.equals(ext) || p.startsWith(ext + "/")) docId = "primary:" + (p.length() > ext.length() ? p.substring(ext.length() + 1) : "");
        else if (p.startsWith("/storage/")) {
            String rest = p.substring(9);
            int s = rest.indexOf('/');
            docId = s < 0 ? rest + ":" : rest.substring(0, s) + ":" + rest.substring(s + 1);
        } else docId = "primary:" + p;
        return DocumentsContract.buildDocumentUri("com.android.externalstorage.documents", docId).toString();
    }

    /** Fills {ROM}, {SAF}, {PROVIDER} and {EXT} in an intent value. shared[0] is set when a provider URI was used. */
    private String expand(String s, File f, Uri[] shared) {
        if (s == null) return "";
        if (s.contains("{ROM}")) s = s.replace("{ROM}", f.getAbsolutePath());
        if (s.contains("{EXT}")) s = s.replace("{EXT}", Environment.getExternalStorageDirectory().getAbsolutePath());
        if (s.contains("{URI}")) {
            // A disc sheet points at track files next to it, which a single shared file can't reach:
            // those go as a documents URI (the emulator needs that folder added in its own settings)
            if (f.getName().toLowerCase().matches(".*\\.(cue|gdi|m3u|ccd|toc|mds)$")) s = s.replace("{URI}", safUri(f));
            else s = s.replace("{URI}", "{PROVIDER}");
        }
        if (s.contains("{SAF}")) s = s.replace("{SAF}", safUri(f));
        if (s.contains("{PROVIDER}")) {
            String uri;
            try {
                if (shared[0] == null) shared[0] = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
                uri = shared[0].toString();
            } catch (Exception e) { uri = safUri(f); }
            s = s.replace("{PROVIDER}", uri);
        }
        return s;
    }

    /** Opens a game in an emulator with the intent the emulator documents (built in src/android/emulators.js). */
    @PluginMethod
    public void launchGame(PluginCall call) {
        String pkg = call.getString("pkg", ""), path = call.getString("path", "");
        if (pkg.isEmpty() || path.isEmpty()) { call.reject("Nothing to open"); return; }
        File file = new File(path);
        if (!file.exists()) { call.reject("That game isn't on this device any more"); return; }
        try {
            Uri[] shared = new Uri[1];
            Intent i = new Intent();
            String action = call.getString("action", "");
            if (!action.isEmpty()) i.setAction(action);
            String act = call.getString("activity", "");
            if (act.isEmpty()) {
                Intent l = getContext().getPackageManager().getLaunchIntentForPackage(pkg);
                if (l == null) { call.reject("That emulator isn't installed"); return; }
                i.setComponent(l.getComponent());
            } else {
                String cls = act.startsWith(".") ? pkg + act : act;
                boolean has;
                try { getContext().getPackageManager().getActivityInfo(new android.content.ComponentName(pkg, cls), 0); has = true; } catch (PackageManager.NameNotFoundException e) { has = false; }
                if (has) i.setClassName(pkg, cls);
                else {
                    // A fork or beta that renamed its activity: let Android pick the one in that app that takes this intent
                    i.setPackage(pkg);
                    if (action.isEmpty()) i.setAction(Intent.ACTION_VIEW);
                }
            }
            String cat = call.getString("category", "");
            if (!cat.isEmpty()) i.addCategory(cat);
            String data = call.getString("data", "");
            if (!data.isEmpty()) i.setData(Uri.parse(expand(data, file, shared)));
            JSObject extras = call.getObject("extras");
            if (extras != null) {
                java.util.Iterator<String> keys = extras.keys();
                while (keys.hasNext()) { String k = keys.next(); i.putExtra(k, expand(extras.optString(k, ""), file, shared)); }
            }
            JSObject arrays = call.getObject("arrays");
            if (arrays != null) {
                java.util.Iterator<String> keys = arrays.keys();
                while (keys.hasNext()) {
                    String k = keys.next();
                    org.json.JSONArray src = arrays.getJSONArray(k);
                    String[] out = new String[src.length()];
                    for (int n = 0; n < out.length; n++) out[n] = expand(src.getString(n), file, shared);
                    i.putExtra(k, out);
                }
            }
            JSObject bools = call.getObject("bools");
            if (bools != null) {
                java.util.Iterator<String> keys = bools.keys();
                while (keys.hasNext()) { String k = keys.next(); i.putExtra(k, bools.optBoolean(k, false)); }
            }
            int flags = Intent.FLAG_ACTIVITY_NEW_TASK;
            JSArray fl = call.getArray("flags");
            for (int n = 0; fl != null && n < fl.length(); n++) {
                String x = fl.getString(n);
                if ("clearTask".equals(x)) flags |= Intent.FLAG_ACTIVITY_CLEAR_TASK;
                if ("clearTop".equals(x)) flags |= Intent.FLAG_ACTIVITY_CLEAR_TOP;
            }
            if (shared[0] != null) {
                flags |= Intent.FLAG_GRANT_READ_URI_PERMISSION;
                try { getContext().grantUriPermission(pkg, shared[0], Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (Exception ignored) {}
            }
            i.addFlags(flags);
            try { getActivity().startActivity(i); }
            catch (android.content.ActivityNotFoundException e) {
                // Nothing in that app took the intent as sent: open its main screen with the same game attached
                Intent l = getContext().getPackageManager().getLaunchIntentForPackage(pkg);
                if (l == null || i.getComponent() != null) throw e;
                l.setData(i.getData());
                if (i.getExtras() != null) l.putExtras(i.getExtras());
                l.addFlags(flags);
                getActivity().startActivity(l);
            }
            call.resolve();
        } catch (android.content.ActivityNotFoundException e) {
            call.reject("Android could not find that emulator. Is it installed?");
        } catch (SecurityException e) {
            call.reject("This version of the emulator can't be started by another app. Update it, or pick another emulator for this game.");
        } catch (Exception e) {
            call.reject("Could not open the game: " + e.getMessage());
        }
    }

    @PluginMethod
    public void quit(PluginCall call) {
        call.resolve();
        main.post(() -> {
            hide();
            getContext().stopService(new Intent(getContext(), DownloadService.class));
            getActivity().finishAndRemoveTask();
            main.postDelayed(() -> System.exit(0), 300);
        });
    }

    // ------------------------------------------------------------ Fuse bridge (docs/FUSE_BRIDGE.md)
    /** Back on the first page after Fuse opened Cartridge: Fuse comes back to the front. The task only
     *  moves behind, so downloads keep going (DownloadService). */
    @PluginMethod
    public void returnToCaller(PluginCall call) {
        main.post(() -> { try { getActivity().moveTaskToBack(true); } catch (Exception ignored) {} });
        call.resolve();
    }

    /** The status other apps read through CartridgeStatusProvider (built by electron/fuseStatus.js). */
    @PluginMethod
    public void publishStatus(PluginCall call) {
        try {
            CartridgeStatusProvider.publish(getContext(), call.getData());
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not save the status: " + e.getMessage());
        }
    }

    /** The downloaded games other apps read through CartridgeStatusProvider's /games (built by electron/fuseStatus.js). */
    @PluginMethod
    public void publishGames(PluginCall call) {
        JSONArray games = call.getData().optJSONArray("games");
        if (games == null) { call.reject("No games list"); return; }
        try {
            CartridgeStatusProvider.publishGames(getContext(), games);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not save the games: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------ uploads from Fuse
    // The upload request Fuse sends with cartridge://upload (docs/FUSE_BRIDGE.md): JSON naming a game's files by
    // path, which Cartridge reads with its own file access. Kept until the page takes it; nothing is uploaded before
    // the user confirms there.
    private static final String EXTRA_UPLOAD = "io.github.matiyaaa.fuse.extra.UPLOAD";
    private static final int MAX_UPLOAD_REQUEST = 256 * 1024;
    private String fuseUpload = null;

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        keepUpload(intent);
    }

    private synchronized void keepUpload(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return;
        Uri data = intent.getData();
        if (data == null || !"cartridge".equalsIgnoreCase(data.getScheme()) || !"upload".equalsIgnoreCase(data.getHost())) return;
        try {
            String json = intent.getStringExtra(EXTRA_UPLOAD);
            intent.removeExtra(EXTRA_UPLOAD); // taken once
            if (json != null && json.length() <= MAX_UPLOAD_REQUEST) fuseUpload = json;
        } catch (RuntimeException e) {
            // extras another app sent that don't unparcel
        }
    }

    /** The upload request of the last cartridge://upload link, once; { json: null } when there is none. */
    @PluginMethod
    public void takeFuseUpload(PluginCall call) {
        String json;
        synchronized (this) {
            if (fuseUpload == null && getActivity() != null) keepUpload(getActivity().getIntent());
            json = fuseUpload;
            fuseUpload = null;
        }
        JSObject r = new JSObject();
        r.put("json", json);
        call.resolve(r);
    }

    // ------------------------------------------------------------ background downloads
    @PluginMethod
    public void setBusy(PluginCall call) {
        boolean busy = call.getBoolean("busy", false);
        Intent i = new Intent(getContext(), DownloadService.class);
        if (!busy) {
            getContext().stopService(i);
            call.resolve();
            return;
        }
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 42);
        }
        i.putExtra("title", call.getString("title", "Downloading"));
        i.putExtra("percent", call.getInt("percent", 0));
        try {
            ContextCompat.startForegroundService(getContext(), i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    // ------------------------------------------------------------ updates
    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        String url = call.getString("url");
        call.setKeepAlive(true);
        new Thread(() -> {
            try {
                File dir = new File(getContext().getCacheDir(), "updates");
                dir.mkdirs();
                File out = new File(dir, "Cartridge.apk");
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(20000);
                c.setReadTimeout(30000);
                long total = c.getContentLengthLong(), done = 0;
                int last = -1;
                try (InputStream in = c.getInputStream(); OutputStream os = new FileOutputStream(out)) {
                    byte[] buf = new byte[1 << 16];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        done += n;
                        int pct = total > 0 ? (int) (done * 100 / total) : 0;
                        if (pct != last) {
                            last = pct;
                            JSObject p = new JSObject();
                            p.put("percent", pct);
                            notifyListeners("updateProgress", p);
                        }
                    }
                }
                updateApk = out;
                call.resolve();
            } catch (Exception e) {
                call.reject("Update download failed: " + e.getMessage());
            } finally {
                call.setKeepAlive(false);
            }
        }).start();
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        if (updateApk == null || !updateApk.exists()) { call.reject("No update downloaded"); return; }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName())));
            call.reject("Allow Cartridge to install updates, then press Update again");
            return;
        }
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", updateApk);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(i);
        call.resolve();
    }
}
