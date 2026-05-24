import type { CryptoSession } from './cryptoService';

let currentSession: CryptoSession | null = null;

export const setCurrentCryptoSession = (session: CryptoSession | null) => {
  currentSession = session;
};

export const getCurrentCryptoSession = () => currentSession;

export const requireCurrentCryptoSession = () => {
  if (!currentSession) {
    throw new Error('Private data is locked. Unlock encryption before reading or writing private content.');
  }
  return currentSession;
};
