package com.arabinda.reflections;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(NativeToastPlugin.class);
        registerPlugin(CredentialManagerPlugin.class);
    }
}


