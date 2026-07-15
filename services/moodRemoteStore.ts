import { supabase } from '../src/supabaseClient';
import type { MoodCheckin } from '../types';
import type { EncryptedEnvelope } from './cryptoService';
import { decryptEnvelope, encryptedColumns, rowAad } from './encryptedPayload';
import { getCurrentUserMode } from './userModeStore';

export interface SupabaseMoodCheckinRow {
  id: string;
  user_id: string;
  mood: string;
  label: string | null;
  source: string | null;
  created_at: string;
  encrypted_payload?: EncryptedEnvelope | null;
}

const moodAad = rowAad('mood_checkins');

export const mapMoodCheckin = (data: SupabaseMoodCheckinRow): MoodCheckin => ({
  id: data.id,
  userId: data.user_id,
  mood: data.mood,
  label: data.label || undefined,
  source: data.source || undefined,
  createdAt: data.created_at,
});

const mapEncryptedMoodCheckin = async (data: SupabaseMoodCheckinRow): Promise<MoodCheckin> => {
  const payload = await decryptEnvelope<Pick<MoodCheckin, 'mood' | 'label' | 'source'>>(
    data.encrypted_payload,
    moodAad(data.user_id, data.id),
  );
  if (!payload) return mapMoodCheckin(data);
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
    const dbRow =
      getCurrentUserMode() === 'reflective'
        ? { id, user_id: userId, mood, label: label ?? null, source: source ?? null }
        : {
            id,
            user_id: userId,
            mood: null,
            label: null,
            source: null,
            ...(await encryptedColumns({ mood, label, source }, moodAad(userId, id))),
          };

    const { data, error } = await supabase
      .from('mood_checkins')
      .insert(dbRow)
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
