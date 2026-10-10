package com.arabinda.reflections;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CredentialManager")
public class CredentialManagerPlugin extends Plugin {
    @PluginMethod
    public void getVerifiedEmail(PluginCall call) {
        // Safe fallback implementation for Android Credential Manager
        call.reject("Credential manager service not configured");
    }
}
