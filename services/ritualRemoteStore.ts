import { supabase } from '../src/supabaseClient';
import type { RitualEvent, RitualEventType } from '../types';

export interface SupabaseRitualEventRow {
  id: string;
  user_id: string;
  event_type: string;
  source_id: string | null;
  created_at: string;
}

const VALID_RITUAL_EVENT_TYPES = new Set<RitualEventType>([
  'release_completed', 'letter_scheduled', 'letter_opened', 'completion_card_created',
]);
const parseRitualEventType = (raw: string): RitualEventType =>
  VALID_RITUAL_EVENT_TYPES.has(raw as RitualEventType) ? (raw as RitualEventType) : 'release_completed';

export const mapRitualEvent = (data: SupabaseRitualEventRow): RitualEvent => ({
  id: data.id,
  userId: data.user_id,
  eventType: parseRitualEventType(data.event_type),
  sourceId: data.source_id || undefined,
  createdAt: data.created_at,
});

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
