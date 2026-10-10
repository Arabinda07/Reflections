import { Capacitor, registerPlugin } from '@capacitor/core';

export interface BiometricAvailability {
  isAvailable: boolean;
  hasEnrolledBiometrics: boolean;
  reason?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: number;
}

interface NativeBiometricPlugin {
  isAvailable(): Promise<BiometricAvailability>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    negativeButtonText?: string;
  }): Promise<BiometricAuthResult>;
}

const NativeBiometric = registerPlugin<NativeBiometricPlugin>('NativeBiometric');

export const nativeBiometric = {
  async isAvailable(): Promise<BiometricAvailability> {
    if (!Capacitor.isNativePlatform()) {
      return {
        isAvailable: false,
        hasEnrolledBiometrics: false,
        reason: 'Biometrics only supported on native mobile',
      };
    }

    try {
      return await NativeBiometric.isAvailable();
    } catch (error) {
      console.warn('[nativeBiometric] Capability check failed:', error);
      return {
        isAvailable: false,
        hasEnrolledBiometrics: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async authenticate(options?: {
    title?: string;
    subtitle?: string;
    negativeButtonText?: string;
  }): Promise<BiometricAuthResult> {
    if (!Capacitor.isNativePlatform()) {
      return { success: true };
    }

    try {
      return await NativeBiometric.authenticate({
        title: options?.title ?? 'Unlock Reflections',
        subtitle: options?.subtitle ?? 'Verify your fingerprint or face to open your journal sanctuary',
        negativeButtonText: options?.negativeButtonText ?? 'Cancel',
      });
    } catch (error) {
      console.warn('[nativeBiometric] Biometric authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  },
};
