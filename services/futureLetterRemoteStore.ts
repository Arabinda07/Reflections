import { supabase } from '../src/supabaseClient';
import type { FutureLetter, FutureLetterStatus } from '../types';

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

const VALID_LETTER_STATUSES = new Set<FutureLetterStatus>(['scheduled', 'opened', 'archived']);
const parseLetterStatus = (raw: string): FutureLetterStatus =>
  VALID_LETTER_STATUSES.has(raw as FutureLetterStatus) ? (raw as FutureLetterStatus) : 'scheduled';

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
