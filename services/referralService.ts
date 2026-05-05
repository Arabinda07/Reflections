import type { ReferralInvite } from '../types';
import { getAuthenticatedUser } from './authUtils';
import { referralRemoteStore } from './referralRemoteStore';

interface ReferralStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const REFERRAL_CODE_STORAGE_KEY = 'reflections.referral_code';

const getBrowserStorage = (): ReferralStorage | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
};

const normalizeReferralCode = (code: string | null) => {
  if (!code) return null;
  const normalized = code.trim().slice(0, 80);
  return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : null;
};

const generateReferralCode = (userId: string) => {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return `${userId.slice(0, 6)}-${randomId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
};

export const buildReferralLink = (
  code: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
) => {
  const normalizedCode = normalizeReferralCode(code) || code.trim();
  const safePath = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${origin}${safePath}#/signup?ref=${encodeURIComponent(normalizedCode)}`;
};

export const referralService = {
  captureReferralCode: (search: string, storage = getBrowserStorage()): string | null => {
    if (!storage) return null;
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const code = normalizeReferralCode(params.get('ref') || params.get('invite'));
    if (!code) return null;

    storage.setItem(REFERRAL_CODE_STORAGE_KEY, code);
    return code;
  },

  getCapturedReferralCode: (storage = getBrowserStorage()): string | null => {
    if (!storage) return null;
    return normalizeReferralCode(storage.getItem(REFERRAL_CODE_STORAGE_KEY));
  },

  clearCapturedReferralCode: (storage = getBrowserStorage()): void => {
    storage?.removeItem(REFERRAL_CODE_STORAGE_KEY);
  },

  getOrCreateInvite: async (): Promise<ReferralInvite> => {
    const user = await getAuthenticatedUser();
    const existing = await referralRemoteStore.fetchByUserId(user.id);
    if (existing) return existing;

    return referralRemoteStore.insert(user.id, generateReferralCode(user.id));
  },

  markInviteShared: async (inviteId: string, sharedAt = new Date()): Promise<ReferralInvite> => {
    const user = await getAuthenticatedUser();
    return referralRemoteStore.updateLastSharedAt(user.id, inviteId, sharedAt.toISOString());
  },

  recordAcceptedReferral: async (storage = getBrowserStorage()): Promise<boolean> => {
    const code = referralService.getCapturedReferralCode(storage);
    if (!code || !storage) return false;

    const success = await referralRemoteStore.acceptInvite(code);
    if (success) {
      referralService.clearCapturedReferralCode(storage);
    }
    return success;
  },

  getAcceptedReferralCount: async (): Promise<number> => {
    const user = await getAuthenticatedUser();
    return referralRemoteStore.getAcceptedCount(user.id);
  },
};
