import { supabase } from '../src/supabaseClient';
import { Note, NoteAttachment } from '../types';
import { storageService } from './storageService';

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
});

const NOTE_LIMIT = 3;

export const noteService = {
  // Fetch all notes for the authenticated user
  getAll: async (): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Supabase DB Error (getAll notes):', error.message, error);
      throw error;
    }
    return (data || []).map(mapToNote);
  },

  // Get the total count of notes for the current user
  getCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase DB Error (getCount notes):', error.message, error);
      throw error;
    }
    return count || 0;
  },

  // Get a single note by ID
  getById: async (id: string): Promise<Note | undefined> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return mapToNote(data);
  },

  // Search notes by title or content
  search: async (query: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToNote);
  },

  // Create a new note
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // SaaS Limit Check
    const currentCount = await noteService.getCount();
    if (currentCount >= NOTE_LIMIT) {
      throw new Error('FREE_LIMIT_REACHED');
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        thumbnail_url: note.thumbnailUrl,
        tags: note.tags || [],
        attachments: note.attachments || [], // Expecting JSONB in DB
        mood: note.mood
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase DB Error (create note):', error.message, error);
      throw error;
    }
    return mapToNote(data);
  },

  // Update an existing note
  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    // Map app fields to DB fields
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;

    const { data, error } = await supabase
      .from('notes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase DB Error (update note):', error.message, error);
      throw error;
    }
    return mapToNote(data);
  },

  // Delete a note and its associated files
  delete: async (id: string): Promise<void> => {
    // 1. Get note to find files to delete
    const note = await noteService.getById(id);
    
    if (note) {
      const pathsToDelete: string[] = [];
      
      // Add thumbnail if it's a storage path
      if (note.thumbnailUrl && !note.thumbnailUrl.startsWith('http')) {
        pathsToDelete.push(note.thumbnailUrl);
      }

      // Add attachment paths
      if (note.attachments && note.attachments.length > 0) {
        note.attachments.forEach(att => pathsToDelete.push(att.path));
      }

      // Delete files from storage
      if (pathsToDelete.length > 0) {
        await storageService.deleteFiles(pathsToDelete);
      }
    }

    // 2. Delete from DB
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};