package io.github.abdu2304.cartridge;

import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.webkit.WebSettings;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {
    private boolean immersive = true;
    // Current state of analog inputs turned into digital actions (sticks, hats, analog triggers)
    private final Map<String, Boolean> axisState = new HashMap<>();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CartridgeNativePlugin.class);
        super.onCreate(savedInstanceState);
        WebSettings s = getBridge().getWebView().getSettings();
        // The UI is laid out for a 1280px wide canvas; the page sets its viewport and the WebView scales it to the screen
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        applyImmersive();
    }

    public void setImmersive(boolean on) {
        immersive = on;
        runOnUiThread(this::applyImmersive);
    }

    private void applyImmersive() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), !immersive);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (immersive) {
            c.hide(WindowInsetsCompat.Type.systemBars());
            c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } else {
            c.show(WindowInsetsCompat.Type.systemBars());
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersive();
    }

    private CartridgeNativePlugin plugin() {
        if (getBridge() == null) return null;
        PluginHandle h = getBridge().getPlugin("CartridgeNative");
        return h == null ? null : (CartridgeNativePlugin) h.getInstance();
    }

    private static boolean fromController(int source) {
        return (source & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
            || (source & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK
            || (source & InputDevice.SOURCE_DPAD) == InputDevice.SOURCE_DPAD;
    }

    // Same action names as src/nav.js
    private static String actionFor(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_BUTTON_A: case KeyEvent.KEYCODE_DPAD_CENTER: return "accept";
            case KeyEvent.KEYCODE_BUTTON_B: return "back";
            case KeyEvent.KEYCODE_BUTTON_X: return "x";
            case KeyEvent.KEYCODE_BUTTON_Y: return "y";
            case KeyEvent.KEYCODE_BUTTON_L1: return "lb";
            case KeyEvent.KEYCODE_BUTTON_R1: return "rb";
            case KeyEvent.KEYCODE_BUTTON_L2: return "lt";
            case KeyEvent.KEYCODE_BUTTON_R2: return "rt";
            case KeyEvent.KEYCODE_BUTTON_SELECT: return "select";
            case KeyEvent.KEYCODE_BUTTON_START: return "start";
            case KeyEvent.KEYCODE_DPAD_UP: return "up";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "down";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "left";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "right";
            default: return null;
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        CartridgeNativePlugin p = plugin();
        String action = actionFor(e.getKeyCode());
        if (p != null && action != null && fromController(e.getSource())) {
            // Held buttons repeat in JS, so Android's own key repeats are dropped
            if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0) p.pad(action, true);
            else if (e.getAction() == KeyEvent.ACTION_UP) p.pad(action, false);
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    private void axis(CartridgeNativePlugin p, String action, boolean down) {
        Boolean was = axisState.get(action);
        if (was != null && was == down) return;
        axisState.put(action, down);
        p.pad(action, down);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent e) {
        CartridgeNativePlugin p = plugin();
        if (p != null && e.getAction() == MotionEvent.ACTION_MOVE && fromController(e.getSource())) {
            float x = e.getAxisValue(MotionEvent.AXIS_X), y = e.getAxisValue(MotionEvent.AXIS_Y);
            float hx = e.getAxisValue(MotionEvent.AXIS_HAT_X), hy = e.getAxisValue(MotionEvent.AXIS_HAT_Y);
            float lt = Math.max(e.getAxisValue(MotionEvent.AXIS_LTRIGGER), e.getAxisValue(MotionEvent.AXIS_BRAKE));
            float rt = Math.max(e.getAxisValue(MotionEvent.AXIS_RTRIGGER), e.getAxisValue(MotionEvent.AXIS_GAS));
            axis(p, "left", x < -0.55f || hx < -0.5f);
            axis(p, "right", x > 0.55f || hx > 0.5f);
            axis(p, "up", y < -0.55f || hy < -0.5f);
            axis(p, "down", y > 0.55f || hy > 0.5f);
            axis(p, "lt", lt > 0.5f);
            axis(p, "rt", rt > 0.5f);
            return true;
        }
        return super.dispatchGenericMotionEvent(e);
    }
}
