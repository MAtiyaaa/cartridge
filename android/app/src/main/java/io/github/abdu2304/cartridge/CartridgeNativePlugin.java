package io.github.abdu2304.cartridge;

import android.Manifest;
import android.app.Presentation;
import android.content.Context;
import android.content.Intent;
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
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
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
                Display d = secondary();
                if (d == null) { call.reject("No second screen"); return; }
                if (companion != null && companion.getDisplay().getDisplayId() == d.getDisplayId() && url.equals(companionUrl)) { call.resolve(); return; }
                hide();
                companionUrl = url;
                companion = new Companion(getActivity(), d, url);
                companion.show();
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
        Companion(Context ctx, Display display, String url) { super(ctx, display); this.url = url; }

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
        JSArray out = new JSArray();
        try {
            PackageManager pm = getContext().getPackageManager();
            Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
            java.util.HashSet<String> seen = new java.util.HashSet<>();
            for (ResolveInfo r : pm.queryIntentActivities(i, 0)) {
                String pkg = r.activityInfo.packageName;
                String label = String.valueOf(r.loadLabel(pm));
                if (seen.contains(pkg) || !(PC_APPS.matcher(pkg).find() || PC_APPS.matcher(label).find())) continue;
                seen.add(pkg);
                JSObject o = new JSObject();
                o.put("pkg", pkg);
                o.put("label", label);
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
