import { supabase } from '../src/supabaseClient';
import { Note, NoteAttachment } from '../types';
import { offlineStorage } from './offlineStorage';

// Helper to map Supabase DB naming (snake_case) to App naming (camelCase)
const mapToNote = (data: any): Note => ({
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

const NOTE_LIMIT = 50; // Increased limit for resilience

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

    // 2. Attempt Supabase Background Sync
    // We don't 'await' this for the UI, but we catch errors to leave it 'pending'
    supabase.from('notes').insert({
      id: tempId,
      user_id: user.id,
      title: note.title,
      content: note.content,
      thumbnail_url: note.thumbnailUrl,
      tags: note.tags || [],
      attachments: note.attachments || [],
      tasks: note.tasks || [],
      mood: note.mood,
      created_at: now,
      updated_at: now
    }).then(({ error }) => {
      if (!error) {
        offlineStorage.markAsSynced(tempId);
        console.log('Note synced to Supabase (Create)');
      }
    });

    // 3. Resolve immediately
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
    const updatedNote = { 
      ...current, 
      ...updates, 
      updatedAt: now,
      syncStatus: current.syncStatus === 'pending_insert' ? 'pending_insert' : 'pending_update'
    } as any;

    // 2. Save to Dexie immediately
    await offlineStorage.saveNote(updatedNote);

    // 3. Attempt Supabase Background Sync
    const dbUpdates: any = { updated_at: now };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks;

    supabase.from('notes')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (!error) {
          offlineStorage.markAsSynced(id);
          console.log('Note synced to Supabase (Update)');
        }
      });

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
          console.log('Note synced to Supabase (Delete)');
        }
      });
  },

  getCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const notes = await offlineStorage.getAllNotes(user.id);
    return notes.length;
  }
};