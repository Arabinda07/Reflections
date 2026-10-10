package com.arabinda.reflections;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Hardware-Backed Keystore Plugin for Reflections.
 * Uses Android Keystore with MasterKey (AES256_GCM) and EncryptedSharedPreferences
 * to store cryptographic material and sensitive tokens directly within the hardware-backed enclave.
 */
@CapacitorPlugin(name = "NativeSecureStorage")
public class NativeSecureStoragePlugin extends Plugin {
    private static final String PREF_FILE = "reflections_hardware_keystore_prefs";
    private SharedPreferences sharedPreferences;

    private synchronized SharedPreferences getPrefs() throws Exception {
        if (sharedPreferences == null) {
            Context context = getContext();
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            sharedPreferences = EncryptedSharedPreferences.create(
                    context,
                    PREF_FILE,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        }
        return sharedPreferences;
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");

        if (key == null || value == null) {
            call.reject("Key and value must not be null");
            return;
        }

        try {
            getPrefs().edit().putString(key, value).apply();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to securely store key: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Key must not be null");
            return;
        }

        try {
            String value = getPrefs().getString(key, null);
            JSObject ret = new JSObject();
            ret.put("value", value);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to retrieve key from secure storage: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Key must not be null");
            return;
        }

        try {
            getPrefs().edit().remove(key).apply();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to remove key from secure storage: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        try {
            getPrefs().edit().clear().apply();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to clear secure storage: " + e.getMessage(), e);
        }
    }
}
