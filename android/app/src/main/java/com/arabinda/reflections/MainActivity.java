package com.arabinda.reflections;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Protect journal sanctuary notes from multitasking app switcher snapshots
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        registerPlugin(NativeToastPlugin.class);
        registerPlugin(CredentialManagerPlugin.class);
        registerPlugin(LiteRTEmbeddingPlugin.class);
        registerPlugin(NativeSecureStoragePlugin.class);
        registerPlugin(NativeBiometricPlugin.class);
    }
}


