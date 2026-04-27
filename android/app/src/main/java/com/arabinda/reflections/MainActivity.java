package com.arabinda.reflections;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(NativeToastPlugin.class);
        registerPlugin(CredentialManagerPlugin.class);
    }
}

@CapacitorPlugin(name = "NativeToast")
class NativeToastPlugin extends Plugin {
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

        int duration = "long".equals(durationValue) ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT;

        activity.runOnUiThread(() -> Toast.makeText(activity, text, duration).show());
        call.resolve();
    }
}
