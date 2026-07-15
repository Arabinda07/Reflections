import { supabase } from '../src/supabaseClient';
import type { Note, NoteAttachment, Task, MoodValue } from '../types';
import type { CryptoSession, EncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import { decryptEnvelope, encryptedColumns, rowAad } from './encryptedPayload';
import { getCurrentUserMode } from './userModeStore';

export interface SupabaseNoteRow {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  attachments: NoteAttachment[] | null;
  mood: string | null;
  tasks: Task[] | null;
  encrypted_payload?: EncryptedEnvelope | null;
}

/**
 * Maps a Supabase note row (snake_case) to the app-level Note model (camelCase).
 */
export const mapToNote = (data: SupabaseNoteRow): Note => ({
  id: data.id,
  title: data.title || '',
  content: data.content || '',
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  thumbnailUrl: data.thumbnail_url || undefined,
  tags: data.tags || [],
  attachments: data.attachments || [],
  mood: (data.mood as MoodValue) || undefined,
  tasks: data.tasks || [],
});

/**
 * Maps an app-level Note to a Supabase-ready row object.
 */
export const mapToDbNote = (note: Note, userId: string) => ({
  id: note.id,
  user_id: userId,
  title: note.title,
  content: note.content,
  thumbnail_url: note.thumbnailUrl,
  tags: note.tags || [],
  attachments: note.attachments || [],
  tasks: note.tasks || [],
  mood: note.mood,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
});

const noteAad = rowAad('notes');

const encryptedNotePayload = (note: Note) => ({
  title: note.title,
  content: note.content,
  thumbnailUrl: note.thumbnailUrl,
  tags: note.tags || [],
  attachments: note.attachments || [],
  tasks: note.tasks || [],
  mood: note.mood,
});

const mapEncryptedPayloadToNote = async (
  data: SupabaseNoteRow,
  userId: string,
  session: CryptoSession,
): Promise<Note> => {
  const payload = await decryptEnvelope<ReturnType<typeof encryptedNotePayload>>(
    data.encrypted_payload,
    noteAad(userId, data.id),
    session,
  );

  if (!payload) {
    return mapToNote(data);
  }

  return {
    id: data.id,
    title: payload.title || '',
    content: payload.content || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    thumbnailUrl: payload.thumbnailUrl,
    tags: payload.tags || [],
    attachments: payload.attachments || [],
    mood: (payload.mood as MoodValue) || undefined,
    tasks: payload.tasks || [],
  };
};

export const mapToEncryptedDbNote = async (
  note: Note,
  userId: string,
  session: CryptoSession = requireCurrentCryptoSession(),
) => ({
  id: note.id,
  user_id: userId,
  title: null,
  content: null,
  thumbnail_url: null,
  tags: [],
  attachments: [],
  tasks: [],
  mood: null,
  ...(await encryptedColumns(encryptedNotePayload(note), noteAad(userId, note.id), session)),
  created_at: note.createdAt,
  updated_at: note.updatedAt,
});

const mapRemoteNote = (userId: string, data: SupabaseNoteRow) => {
  if (getCurrentUserMode() === 'reflective') {
    return mapToNote(data);
  }
  return mapEncryptedPayloadToNote(data, userId, requireCurrentCryptoSession());
};

/**
 * Pure Supabase CRUD for notes.
 * No offline storage, no auth checks inlined.
 * Auth is passed in as a `userId` parameter.
 */
export const noteRemoteStore = {
  fetchAll: async (userId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return Promise.all(((data || []) as SupabaseNoteRow[]).map((row) => mapRemoteNote(userId, row)));
  },

  fetchById: async (userId: string, noteId: string): Promise<Note | null> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return mapRemoteNote(userId, data as SupabaseNoteRow);
  },

  insert: async (userId: string, note: Note): Promise<void> => {
    const payload = getCurrentUserMode() === 'reflective' 
      ? mapToDbNote(note, userId) 
      : await mapToEncryptedDbNote(note, userId);
    const { error } = await supabase.from('notes').insert(payload);
    if (error) throw error;
  },

  upsert: async (userId: string, note: Note): Promise<void> => {
    const payload = getCurrentUserMode() === 'reflective' 
      ? mapToDbNote(note, userId) 
      : await mapToEncryptedDbNote(note, userId);
    const { error } = await supabase.from('notes').upsert(payload);
    if (error) throw error;
  },

  update: async (
    userId: string,
    noteId: string,
    updates: Record<string, unknown>,
  ): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  remove: async (userId: string, noteId: string): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  count: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
  },

  monthlyCount: async (userId: string): Promise<number> => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (error) throw error;
    return count ?? 0;
  },
};
