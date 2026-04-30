import { supabase } from '../src/supabaseClient';
import type { Note, NoteAttachment, Task } from '../types';
import { offlineStorage } from './offlineStorage';
import type { LocalNote } from './db';

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
}

// Helper to map Supabase DB naming (snake_case) to App naming (camelCase)
export const mapToNote = (data: SupabaseNoteRow): Note => ({
  id: data.id,
  title: data.title || '',
  content: data.content || '',
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  thumbnailUrl: data.thumbnail_url || undefined,
  tags: data.tags || [],
  attachments: data.attachments || [],
  mood: data.mood || undefined,
  tasks: data.tasks || [],
});

const mapToDbNote = (note: Note, userId: string) => ({
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

export const noteService = {
  // Fetch all notes for the authenticated user
  getAll: async (): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // 1. Fetch from Supabase
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;

      const notes = (data || []).map(mapToNote);
      
      // 2. Sync fetch results to local storage (Dexie)
      // Only overwrite if local is NOT pending an update/delete
      for (const note of notes) {
        const local = await offlineStorage.getNoteById(note.id);
        if (!local || local.syncStatus === 'synced') {
           await offlineStorage.saveNote({ ...note, userId: user.id, syncStatus: 'synced' });
        }
      }

      return notes;
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local Dexie:', err);
      // 3. Fallback to local storage if offline
      const localNotes = await offlineStorage.getAllNotes(user.id);
      return localNotes;
    }
  },

  // Get a single note by ID
  getById: async (id: string): Promise<Note | undefined> => {
    // 1. Try local first for instant response
    const localNote = await offlineStorage.getNoteById(id);
    if (localNote) return localNote;

    // 2. Fallback to Supabase
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      const note = mapToNote(data);
      
      // 3. Cache locally
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await offlineStorage.saveNote({ ...note, userId: user.id, syncStatus: 'synced' });
      }
      return note;
    } catch (err) {
      return undefined;
    }
  },

  // Create a new note
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save to Dexie immediately with 'pending_insert'
    await offlineStorage.saveNote({ 
      ...newNote, 
      userId: user.id, 
      syncStatus: 'pending_insert' 
    });

    // 2. Attempt Supabase sync before resolving so immediate follow-up updates
    // cannot race ahead of the insert.
    try {
      const { error } = await supabase.from('notes').insert(mapToDbNote(newNote, user.id));
      if (!error) {
        await offlineStorage.markAsSynced(tempId);
        console.debug('Note synced to Supabase (Create)');
      }
    } catch (err) {
      console.warn('Supabase create sync failed, leaving note pending:', err);
    }

    // 3. Return the local note. If sync failed, Dexie keeps it pending.
    return newNote;
  },

  // Update an existing note
  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Get current and merge
    const current = await offlineStorage.getNoteById(id);
    if (!current) throw new Error('Note not found locally');
    
    const now = new Date().toISOString();
    const updatedNote: LocalNote = { 
      ...current, 
      ...updates, 
      updatedAt: now,
      syncStatus: current.syncStatus === 'pending_insert' ? 'pending_insert' as const : 'pending_update' as const,
    };

    // 2. Save to Dexie immediately
    await offlineStorage.saveNote(updatedNote);

    // 3. Attempt Supabase Sync
    const dbUpdates: Record<string, unknown> = { updated_at: now };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks;

    try {
      if (updatedNote.syncStatus === 'pending_insert') {
        const { error } = await supabase.from('notes').upsert(mapToDbNote(updatedNote, user.id));
        if (!error) {
          await offlineStorage.markAsSynced(id);
          console.debug('Note synced to Supabase (Upsert)');
        }
      } else {
        const { error } = await supabase.from('notes')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user.id);

        if (!error) {
          await offlineStorage.markAsSynced(id);
          console.debug('Note synced to Supabase (Update)');
        }
      }
    } catch (err) {
      console.warn('Supabase update sync failed, leaving note pending:', err);
    }

    return updatedNote;
  },

  // Delete a note
  delete: async (id: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Mark as pending delete in Dexie
    await offlineStorage.deleteNote(id);

    // 2. Attempt Supabase Background Sync
    supabase.from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (!error) {
          offlineStorage.markAsSynced(id);
          console.debug('Note synced to Supabase (Delete)');
        }
      });
  },

  getCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    try {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      console.warn('Supabase getCount failed, falling back to local Dexie:', err);
      // Includes pending-insert notes by design — offline UX shows notes the user wrote.
      const notes = await offlineStorage.getAllNotes(user.id);
      return notes.length;
    }
  },

  getRecent: async (limit: number): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Prioritize local storage for instant "Recent" access
    const notes = await offlineStorage.getAllNotes(user.id);
    return notes.slice(0, limit);
  },

  getMonthlyCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    try {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());

      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      console.warn('Supabase getMonthlyCount failed, falling back to local Dexie:', err);
      // Includes pending-insert notes by design — prevents offline limit bypass.
      const notes = await offlineStorage.getAllNotes(user.id);
      // Use UTC boundaries to match the Supabase path
      return notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= start && noteDate < end;
      }).length;
    }
  }
};
