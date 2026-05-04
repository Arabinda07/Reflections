import type {
  FutureLetter,
  MoodCheckin,
  ReferralInvite,
  RitualEvent,
  RitualEventType,
} from '../types';
import { getAuthenticatedUser } from './authUtils';
import {
  futureLetterRemoteStore,
  moodRemoteStore,
  referralRemoteStore,
  ritualRemoteStore,
} from './engagementRemoteStore';

interface MoodCheckinInput {
  mood: string;
  label?: string;
  source?: string;
}

interface FutureLetterInput {
  title: string;
  content: string;
  openAt: string;
}

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

const formatOpenDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

export type FutureLetterOpenState = {
  letter: FutureLetter;
  state: 'locked' | 'openable' | 'opened';
  actionLabel: string;
};

export const getFutureLetterOpenState = (
  letter: FutureLetter,
  now = new Date(),
): FutureLetterOpenState => {
  if (letter.status === 'opened') {
    return {
      letter,
      state: 'opened',
      actionLabel: 'Read again',
    };
  }

  const openDate = new Date(letter.openAt);
  if (openDate > now) {
    return {
      letter,
      state: 'locked',
      actionLabel: `Locked until ${formatOpenDate(openDate)}`,
    };
  }

  return {
    letter,
    state: 'openable',
    actionLabel: 'Open letter',
  };
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

export const moodCheckinService = {
  create: async (input: MoodCheckinInput): Promise<MoodCheckin> => {
    const user = await getAuthenticatedUser();
    return moodRemoteStore.insert(user.id, input.mood, input.label, input.source);
  },

  list: async (limit = 90): Promise<MoodCheckin[]> => {
    const user = await getAuthenticatedUser();
    return moodRemoteStore.list(user.id, limit);
  },
};

export const ritualEventService = {
  record: async (eventType: RitualEventType, options: { sourceId?: string } = {}): Promise<RitualEvent> => {
    const user = await getAuthenticatedUser();
    return ritualRemoteStore.insert(user.id, eventType, options.sourceId);
  },

  recordReleaseCompleted: async (): Promise<RitualEvent> =>
    ritualEventService.record('release_completed'),

  listSince: async (since: string): Promise<RitualEvent[]> => {
    const user = await getAuthenticatedUser();
    return ritualRemoteStore.listSince(user.id, since);
  },
};

export const futureLetterService = {
  create: async (input: FutureLetterInput): Promise<FutureLetter> => {
    const user = await getAuthenticatedUser();
    const letter = await futureLetterRemoteStore.insert(user.id, input.title, input.content, input.openAt);
    await ritualEventService.record('letter_scheduled', { sourceId: letter.id });
    return letter;
  },

  list: async (): Promise<FutureLetter[]> => {
    const user = await getAuthenticatedUser();
    return futureLetterRemoteStore.list(user.id);
  },

  open: async (id: string, now = new Date()): Promise<FutureLetter> => {
    const user = await getAuthenticatedUser();
    const letter = await futureLetterRemoteStore.fetchById(user.id, id);

    if (new Date(letter.openAt) > now) {
      throw new Error('LETTER_LOCKED_UNTIL_OPEN_DATE');
    }

    if (letter.status === 'opened') {
      return letter;
    }

    const openedAt = now.toISOString();
    const openedLetter = await futureLetterRemoteStore.updateStatus(user.id, id, 'opened', openedAt);
    await ritualEventService.record('letter_opened', { sourceId: id });
    return openedLetter;
  },
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
