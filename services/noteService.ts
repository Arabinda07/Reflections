import { supabase } from '../src/supabaseClient';
import { Note, NoteAttachment } from '../types';
import { storageService } from './storageService';
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

const NOTE_LIMIT = 30;

export const noteService = {
  // Fetch all notes for the authenticated user
  getAll: async (): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;

      const notes = (data || []).map(mapToNote);
      
      // Update local storage in the background
      notes.forEach(note => {
        offlineStorage.saveNote({ ...note, user_id: user.id });
      });

      return notes;
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local:', err);
      // Fallback to local storage if offline
      const localNotes = await offlineStorage.getAllNotes(user.id);
      return localNotes;
    }
  },

  // Fetch the most recent N notes with content for context
  getRecent: async (limit: number): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, mood, updated_at, tags')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase DB Error (getRecent notes):', error.message, error);
      throw error;
    }
    return (data || []).map(mapToNote);
  },

  // Get the total count of notes for the current user
  getCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Supabase DB Error (getCount notes):', error.message, error);
      throw error;
    }
    return count || 0;
  },

  // Get the monthly count of notes for the current user
  getMonthlyCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());
    
    if (error) {
      console.error('Supabase DB Error (getMonthlyCount notes):', error.message, error);
      throw error;
    }
    return count || 0;
  },

  // Get a single note by ID
  getById: async (id: string): Promise<Note | undefined> => {
    // Try local first for speed
    const localNote = await offlineStorage.getNoteById(id);
    if (localNote) return localNote;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) return undefined;
    const note = mapToNote(data);
    
    // Save locally
    await offlineStorage.saveNote({ ...note, user_id: user.id });
    
    return note;
  },

  // Search notes by title or content
  search: async (query: string): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToNote);
  },

  // Create a new note
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // SaaS Limit Check (Only if online, otherwise skip for now)
    try {
      const currentCount = await noteService.getMonthlyCount();
      if (currentCount >= NOTE_LIMIT) {
        throw new Error('FREE_LIMIT_REACHED');
      }
    } catch (e) {
      // If we can't check count (offline), we let it pass for now and it will fail on sync if over
    }

    const tempId = crypto.randomUUID();
    const newNote: Note = {
      ...note,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save locally first
    await offlineStorage.saveNote({ ...newNote, user_id: user.id });

    // 2. Try Supabase
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          id: tempId, // Use the same ID to prevent duplicates
          user_id: user.id,
          title: note.title,
          content: note.content,
          thumbnail_url: note.thumbnailUrl,
          tags: note.tags || [],
          attachments: note.attachments || [],
          tasks: note.tasks || [],
          mood: note.mood
        })
        .select()
        .single();

      if (error) throw error;
      return mapToNote(data);
    } catch (err) {
      console.warn('Failed to create on Supabase, queued for sync:', err);
      // 3. Queue for sync if failed
      await offlineStorage.addToQueue({
        action: 'create',
        entityId: tempId,
        data: newNote,
        timestamp: Date.now()
      });
      return newNote;
    }
  },

  // Update an existing note
  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Get current and merge
    const current = await noteService.getById(id);
    if (!current) throw new Error('Note not found');
    const updatedNote = { ...current, ...updates, updatedAt: new Date().toISOString() };

    // 2. Save locally first
    await offlineStorage.saveNote({ ...updatedNote, user_id: user.id });

    // 3. Try Supabase
    try {
      const dbUpdates: any = {
        updated_at: updatedNote.updatedAt,
      };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
      if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
      if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks;

      const { data, error } = await supabase
        .from('notes')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return mapToNote(data);
    } catch (err) {
      console.warn('Failed to update on Supabase, queued for sync:', err);
      // 4. Queue for sync if failed
      await offlineStorage.addToQueue({
        action: 'update',
        entityId: id,
        data: updates,
        timestamp: Date.now()
      });
      return updatedNote;
    }
  },

  // Delete a note and its associated files
  delete: async (id: string): Promise<void> => {
    // 1. Delete locally first
    await offlineStorage.deleteNote(id);

    // 2. Try Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Note: We don't delete storage files immediately to avoid potential sync issues
      // if the deletion fails. This could be handled by a cleanup job later.
    } catch (err) {
      console.warn('Failed to delete on Supabase, queued for sync:', err);
      // 3. Queue for sync if failed
      await offlineStorage.addToQueue({
        action: 'delete',
        entityId: id,
        data: null,
        timestamp: Date.now()
      });
    }
  }
};