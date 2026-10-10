package com.arabinda.reflections;

import android.app.Activity;
import android.widget.Toast;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeToast")
public class NativeToastPlugin extends Plugin {
    @PluginMethod
    public void show(PluginCall call) {
        String text = call.getString("text", "").trim();
        String durationValue = call.getString("duration", "short");

        if (text.isEmpty()) {
            call.resolve();
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }

        int duration = "long".equalsIgnoreCase(durationValue) ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT;

        activity.runOnUiThread(() -> Toast.makeText(activity, text, duration).show());
        call.resolve();
    }
}
