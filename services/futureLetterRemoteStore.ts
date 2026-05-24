import { supabase } from '../src/supabaseClient';
import type { FutureLetter, FutureLetterStatus } from '../types';
import { cryptoService, type EncryptedEnvelope, isEncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';

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

const futureLetterAad = (userId: string, id: string) => ({
  table: 'future_letters',
  rowId: id,
  userId,
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

const mapEncryptedFutureLetter = async (data: SupabaseFutureLetterRow): Promise<FutureLetter> => {
  if (!isEncryptedEnvelope(data.encrypted_payload)) return mapFutureLetter(data);
  const payload = await cryptoService.decryptJson<Pick<FutureLetter, 'title' | 'content'>>(
    requireCurrentCryptoSession(),
    futureLetterAad(data.user_id, data.id),
    data.encrypted_payload,
  );
  return {
    ...mapFutureLetter(data),
    title: payload.title || '',
    content: payload.content || '',
  };
};

export const futureLetterRemoteStore = {
  insert: async (userId: string, title: string, content: string, openAt: string): Promise<FutureLetter> => {
    const id = crypto.randomUUID();
    const encryptedPayload = await cryptoService.encryptJson(
      requireCurrentCryptoSession(),
      futureLetterAad(userId, id),
      { title, content },
    );
    const { data, error } = await supabase
      .from('future_letters')
      .insert({
        id,
        user_id: userId,
        title: null,
        content: null,
        open_at: openAt,
        status: 'scheduled',
        encrypted_payload: encryptedPayload,
        encrypted_payload_version: 1,
        encryption_migration_state: 'verified',
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
