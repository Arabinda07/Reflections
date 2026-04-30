import { supabase } from '../src/supabaseClient';
import type {
  FutureLetter,
  FutureLetterStatus,
  MoodCheckin,
  ReferralInvite,
  RitualEvent,
  RitualEventType,
} from '../types';
import { getAuthenticatedUser } from './authUtils';

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

export interface SupabaseMoodCheckinRow {
  id: string;
  user_id: string;
  mood: string;
  label: string | null;
  source: string | null;
  created_at: string;
}

export interface SupabaseFutureLetterRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  open_at: string;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface SupabaseRitualEventRow {
  id: string;
  user_id: string;
  event_type: string;
  source_id: string | null;
  created_at: string;
}

export interface SupabaseReferralInviteRow {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  last_shared_at: string | null;
}

const VALID_LETTER_STATUSES = new Set<FutureLetterStatus>(['scheduled', 'opened', 'archived']);
const parseLetterStatus = (raw: string): FutureLetterStatus =>
  VALID_LETTER_STATUSES.has(raw as FutureLetterStatus) ? (raw as FutureLetterStatus) : 'scheduled';

const VALID_RITUAL_EVENT_TYPES = new Set<RitualEventType>([
  'release_completed', 'letter_scheduled', 'letter_opened', 'completion_card_created',
]);
const parseRitualEventType = (raw: string): RitualEventType =>
  VALID_RITUAL_EVENT_TYPES.has(raw as RitualEventType) ? (raw as RitualEventType) : 'release_completed';

const mapMoodCheckin = (data: SupabaseMoodCheckinRow): MoodCheckin => ({
  id: data.id,
  userId: data.user_id,
  mood: data.mood,
  label: data.label || undefined,
  source: data.source || undefined,
  createdAt: data.created_at,
});

const mapFutureLetter = (data: SupabaseFutureLetterRow): FutureLetter => ({
  id: data.id,
  userId: data.user_id,
  title: data.title || '',
  content: data.content || '',
  openAt: data.open_at,
  openedAt: data.opened_at || undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  status: parseLetterStatus(data.status),
});

const mapRitualEvent = (data: SupabaseRitualEventRow): RitualEvent => ({
  id: data.id,
  userId: data.user_id,
  eventType: parseRitualEventType(data.event_type),
  sourceId: data.source_id || undefined,
  createdAt: data.created_at,
});

const mapReferralInvite = (data: SupabaseReferralInviteRow): ReferralInvite => ({
  id: data.id,
  userId: data.user_id,
  code: data.code,
  createdAt: data.created_at,
  lastSharedAt: data.last_shared_at || undefined,
});

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

    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: user.id,
        mood: input.mood,
        label: input.label,
        source: input.source,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMoodCheckin(data);
  },

  list: async (limit = 90): Promise<MoodCheckin[]> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapMoodCheckin);
  },
};

export const ritualEventService = {
  record: async (eventType: RitualEventType, options: { sourceId?: string } = {}): Promise<RitualEvent> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('ritual_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        source_id: options.sourceId,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRitualEvent(data);
  },

  recordReleaseCompleted: async (): Promise<RitualEvent> =>
    ritualEventService.record('release_completed'),

  listSince: async (since: string): Promise<RitualEvent[]> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('ritual_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRitualEvent);
  },
};

export const futureLetterService = {
  create: async (input: FutureLetterInput): Promise<FutureLetter> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('future_letters')
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content,
        open_at: input.openAt,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    const letter = mapFutureLetter(data);
    await ritualEventService.record('letter_scheduled', { sourceId: letter.id });
    return letter;
  },

  list: async (): Promise<FutureLetter[]> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('open_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapFutureLetter);
  },

  open: async (id: string, now = new Date()): Promise<FutureLetter> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    const letter = mapFutureLetter(data);

    if (new Date(letter.openAt) > now) {
      throw new Error('LETTER_LOCKED_UNTIL_OPEN_DATE');
    }

    if (letter.status === 'opened') {
      return letter;
    }

    const openedAt = now.toISOString();
    const { data: updatedData, error: updateError } = await supabase
      .from('future_letters')
      .update({
        opened_at: openedAt,
        status: 'opened',
        updated_at: openedAt,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;
    const openedLetter = mapFutureLetter(updatedData);
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

    const { data: existing, error } = await supabase
      .from('referral_invites')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (existing) return mapReferralInvite(existing);

    const { data, error: insertError } = await supabase
      .from('referral_invites')
      .insert({
        user_id: user.id,
        code: generateReferralCode(user.id),
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return mapReferralInvite(data);
  },

  markInviteShared: async (inviteId: string, sharedAt = new Date()): Promise<ReferralInvite> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('referral_invites')
      .update({ last_shared_at: sharedAt.toISOString() })
      .eq('id', inviteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return mapReferralInvite(data);
  },

  recordAcceptedReferral: async (storage = getBrowserStorage()): Promise<boolean> => {
    const code = referralService.getCapturedReferralCode(storage);
    if (!code || !storage) return false;

    const { data, error } = await supabase
      .rpc('accept_referral_invite', { referral_code: code });

    if (error) throw error;
    referralService.clearCapturedReferralCode(storage);
    return Boolean(data);
  },

  getAcceptedReferralCount: async (): Promise<number> => {
    const user = await getAuthenticatedUser();

    const { count, error } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_user_id', user.id);

    if (error) throw error;
    return count ?? 0;
  },
};
