import { registerPlugin, Capacitor } from '@capacitor/core';

export interface CredentialResponse {
  type: string;
  assertion: string;
}

export interface CredentialManagerPlugin {
  getVerifiedEmail(): Promise<CredentialResponse>;
}

const CredentialManager = registerPlugin<CredentialManagerPlugin>('CredentialManager');

export const isVerifiedEmailAvailable = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const requestVerifiedEmail = async (): Promise<CredentialResponse | null> => {
  if (!isVerifiedEmailAvailable()) {
    return null;
  }

  try {
    const result = await CredentialManager.getVerifiedEmail();
    return result;
  } catch (error) {
    console.error('Credential Manager error:', error);
    return null;
  }
};
