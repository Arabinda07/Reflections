import { supabase } from '../src/supabaseClient';
import type { MoodCheckin } from '../types';

export interface SupabaseMoodCheckinRow {
  id: string;
  user_id: string;
  mood: string;
  label: string | null;
  source: string | null;
  created_at: string;
}

export const mapMoodCheckin = (data: SupabaseMoodCheckinRow): MoodCheckin => ({
  id: data.id,
  userId: data.user_id,
  mood: data.mood,
  label: data.label || undefined,
  source: data.source || undefined,
  createdAt: data.created_at,
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
