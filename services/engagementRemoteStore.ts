import { supabase } from '../src/supabaseClient';
import type {
  FutureLetter,
  FutureLetterStatus,
  MoodCheckin,
  ReferralInvite,
  RitualEvent,
  RitualEventType,
} from '../types';

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

export const mapMoodCheckin = (data: SupabaseMoodCheckinRow): MoodCheckin => ({
  id: data.id,
  userId: data.user_id,
  mood: data.mood,
  label: data.label || undefined,
  source: data.source || undefined,
  createdAt: data.created_at,
});

export const mapFutureLetter = (data: SupabaseFutureLetterRow): FutureLetter => ({
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

export const mapRitualEvent = (data: SupabaseRitualEventRow): RitualEvent => ({
  id: data.id,
  userId: data.user_id,
  eventType: parseRitualEventType(data.event_type),
  sourceId: data.source_id || undefined,
  createdAt: data.created_at,
});

export const mapReferralInvite = (data: SupabaseReferralInviteRow): ReferralInvite => ({
  id: data.id,
  userId: data.user_id,
  code: data.code,
  createdAt: data.created_at,
  lastSharedAt: data.last_shared_at || undefined,
});

export const moodRemoteStore = {
  insert: async (userId: string, mood: string, label?: string, source?: string): Promise<MoodCheckin> => {
    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: userId,
        mood,
        label,
        source,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMoodCheckin(data);
  },

  list: async (userId: string, limit = 90): Promise<MoodCheckin[]> => {
    const { data, error } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapMoodCheckin);
  },
};

export const ritualRemoteStore = {
  insert: async (userId: string, eventType: RitualEventType, sourceId?: string): Promise<RitualEvent> => {
    const { data, error } = await supabase
      .from('ritual_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        source_id: sourceId,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRitualEvent(data);
  },

  listSince: async (userId: string, since: string): Promise<RitualEvent[]> => {
    const { data, error } = await supabase
      .from('ritual_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRitualEvent);
  },
};

export const futureLetterRemoteStore = {
  insert: async (userId: string, title: string, content: string, openAt: string): Promise<FutureLetter> => {
    const { data, error } = await supabase
      .from('future_letters')
      .insert({
        user_id: userId,
        title,
        content,
        open_at: openAt,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return mapFutureLetter(data);
  },

  list: async (userId: string): Promise<FutureLetter[]> => {
    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('user_id', userId)
      .order('open_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapFutureLetter);
  },

  fetchById: async (userId: string, id: string): Promise<FutureLetter> => {
    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return mapFutureLetter(data);
  },

  updateStatus: async (userId: string, id: string, status: string, openedAt: string): Promise<FutureLetter> => {
    const { data, error } = await supabase
      .from('future_letters')
      .update({
        opened_at: openedAt,
        status,
        updated_at: openedAt,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapFutureLetter(data);
  },
};

export const referralRemoteStore = {
  fetchByUserId: async (userId: string): Promise<ReferralInvite | null> => {
    const { data, error } = await supabase
      .from('referral_invites')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapReferralInvite(data) : null;
  },

  insert: async (userId: string, code: string): Promise<ReferralInvite> => {
    const { data, error } = await supabase
      .from('referral_invites')
      .insert({
        user_id: userId,
        code,
      })
      .select()
      .single();

    if (error) throw error;
    return mapReferralInvite(data);
  },

  updateLastSharedAt: async (userId: string, inviteId: string, sharedAt: string): Promise<ReferralInvite> => {
    const { data, error } = await supabase
      .from('referral_invites')
      .update({ last_shared_at: sharedAt })
      .eq('id', inviteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapReferralInvite(data);
  },

  acceptInvite: async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('accept_referral_invite', { referral_code: code });

    if (error) throw error;
    return Boolean(data);
  },

  getAcceptedCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_user_id', userId);

    if (error) throw error;
    return count ?? 0;
  },
};
