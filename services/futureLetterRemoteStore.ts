import { supabase } from '../src/supabaseClient';
import type { FutureLetter, FutureLetterStatus } from '../types';
import type { EncryptedEnvelope } from './cryptoService';
import { decryptEnvelope, encryptedColumns, rowAad } from './encryptedPayload';

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
  encrypted_payload?: EncryptedEnvelope | null;
}

const VALID_LETTER_STATUSES = new Set<FutureLetterStatus>(['scheduled', 'opened', 'archived']);
const parseLetterStatus = (raw: string): FutureLetterStatus =>
  VALID_LETTER_STATUSES.has(raw as FutureLetterStatus) ? (raw as FutureLetterStatus) : 'scheduled';

const futureLetterAad = rowAad('future_letters');

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

const mapEncryptedFutureLetter = async (data: SupabaseFutureLetterRow): Promise<FutureLetter> => {
  const payload = await decryptEnvelope<Pick<FutureLetter, 'title' | 'content'>>(
    data.encrypted_payload,
    futureLetterAad(data.user_id, data.id),
  );
  if (!payload) return mapFutureLetter(data);
  return {
    ...mapFutureLetter(data),
    title: payload.title || '',
    content: payload.content || '',
  };
};

export const futureLetterRemoteStore = {
  insert: async (userId: string, title: string, content: string, openAt: string): Promise<FutureLetter> => {
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('future_letters')
      .insert({
        id,
        user_id: userId,
        title: null,
        content: null,
        open_at: openAt,
        status: 'scheduled',
        ...(await encryptedColumns({ title, content }, futureLetterAad(userId, id))),
      })
      .select()
      .single();

    if (error) throw error;
    return mapEncryptedFutureLetter(data);
  },

  list: async (userId: string): Promise<FutureLetter[]> => {
    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('user_id', userId)
      .order('open_at', { ascending: true });

    if (error) throw error;
    return Promise.all(((data || []) as SupabaseFutureLetterRow[]).map(mapEncryptedFutureLetter));
  },

  fetchById: async (userId: string, id: string): Promise<FutureLetter> => {
    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return mapEncryptedFutureLetter(data);
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
    return mapEncryptedFutureLetter(data);
  },
};
