import { supabase } from '../src/supabaseClient';
import type { MoodCheckin } from '../types';
import { cryptoService, type EncryptedEnvelope, isEncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';

export interface SupabaseMoodCheckinRow {
  id: string;
  user_id: string;
  mood: string;
  label: string | null;
  source: string | null;
  created_at: string;
  encrypted_payload?: EncryptedEnvelope | null;
}

const moodAad = (userId: string, id: string) => ({
  table: 'mood_checkins',
  rowId: id,
  userId,
});

export const mapMoodCheckin = (data: SupabaseMoodCheckinRow): MoodCheckin => ({
  id: data.id,
  userId: data.user_id,
  mood: data.mood,
  label: data.label || undefined,
  source: data.source || undefined,
  createdAt: data.created_at,
});

const mapEncryptedMoodCheckin = async (data: SupabaseMoodCheckinRow): Promise<MoodCheckin> => {
  if (!isEncryptedEnvelope(data.encrypted_payload)) return mapMoodCheckin(data);
  const payload = await cryptoService.decryptJson<Pick<MoodCheckin, 'mood' | 'label' | 'source'>>(
    requireCurrentCryptoSession(),
    moodAad(data.user_id, data.id),
    data.encrypted_payload,
  );
  return {
    id: data.id,
    userId: data.user_id,
    mood: payload.mood,
    label: payload.label,
    source: payload.source,
    createdAt: data.created_at,
  };
};

export const moodRemoteStore = {
  insert: async (userId: string, mood: string, label?: string, source?: string): Promise<MoodCheckin> => {
    const id = crypto.randomUUID();
    const encryptedPayload = await cryptoService.encryptJson(
      requireCurrentCryptoSession(),
      moodAad(userId, id),
      { mood, label, source },
    );
    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({
        id,
        user_id: userId,
        mood: null,
        label: null,
        source: null,
        encrypted_payload: encryptedPayload,
        encrypted_payload_version: 1,
        encryption_migration_state: 'verified',
      })
      .select()
      .single();

    if (error) throw error;
    return mapEncryptedMoodCheckin(data);
  },

  list: async (userId: string, limit = 90): Promise<MoodCheckin[]> => {
    const { data, error } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Promise.all(((data || []) as SupabaseMoodCheckinRow[]).map(mapEncryptedMoodCheckin));
  },
};
