package com.arabinda.reflections;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

/**
 * Native Android Biometric Plugin for Reflections.
 * Provides biometric hardware capability checking (Fingerprint/Face) and
 * launches BiometricPrompt to authenticate the user before unmasking the journal.
 */
@CapacitorPlugin(name = "NativeBiometric")
public class NativeBiometricPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Context context = getContext();
        BiometricManager biometricManager = BiometricManager.from(context);
        int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK;
        int canAuthenticate = biometricManager.canAuthenticate(authenticators);

        JSObject ret = new JSObject();
        boolean isAvailable = false;
        boolean hasEnrolled = false;
        String reason = "";

        switch (canAuthenticate) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                isAvailable = true;
                hasEnrolled = true;
                reason = "Biometrics available and enrolled";
                break;
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                isAvailable = true;
                hasEnrolled = false;
                reason = "No biometrics currently enrolled on device";
                break;
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                isAvailable = false;
                hasEnrolled = false;
                reason = "No biometric hardware present";
                break;
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                isAvailable = false;
                hasEnrolled = false;
                reason = "Biometric hardware is currently unavailable";
                break;
            default:
                isAvailable = false;
                hasEnrolled = false;
                reason = "Biometric authentication not supported";
                break;
        }

        ret.put("isAvailable", isAvailable);
        ret.put("hasEnrolledBiometrics", hasEnrolled);
        ret.put("reason", reason);
        call.resolve(ret);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        FragmentActivity activity = (FragmentActivity) getActivity();
        if (activity == null) {
            call.reject("Activity is unavailable");
            return;
        }

        String title = call.getString("title", "Unlock Reflections");
        String subtitle = call.getString("subtitle", "Verify your identity to access your private sanctuary");
        String negativeButtonText = call.getString("negativeButtonText", "Cancel");

        activity.runOnUiThread(() -> {
            try {
                Executor executor = ContextCompat.getMainExecutor(activity);
                BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        JSObject ret = new JSObject();
                        ret.put("success", false);
                        ret.put("errorCode", errorCode);
                        ret.put("error", errString.toString());
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                    }
                });

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setNegativeButtonText(negativeButtonText)
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                        .build();

                biometricPrompt.authenticate(promptInfo);
            } catch (Exception e) {
                call.reject("Failed to initialize biometric prompt: " + e.getMessage(), e);
            }
        });
    }
}
