import type { Note } from '../types';
import { offlineStorage } from './offlineStorage';
import { getAuthenticatedUserId } from './authUtils';
import { noteRemoteStore, mapToNote, mapToDbNote } from './noteRemoteStore';
import type { LocalNote } from './db';
import { syncEngine } from './syncEngine';

// Re-export for callers that import mapping utilities from noteService
export { mapToNote, type SupabaseNoteRow } from './noteRemoteStore';

/**
 * Note service — orchestrates remote (Supabase) and local (Dexie) storage.
 *
 * Auth is resolved once per operation via `getAuthenticatedUserId()`.
 * Remote CRUD is delegated to `noteRemoteStore`.
 * Offline cache and sync-status flags are managed through `offlineStorage`.
 */
export const noteService = {
  // Fetch all notes for the authenticated user
  getAll: async (): Promise<Note[]> => {
    const userId = await getAuthenticatedUserId();

    try {
      // 1. Fetch from Supabase via remote store
      const notes = await noteRemoteStore.fetchAll(userId);

      // 2. Sync fetch results to local storage (Dexie)
      // Only overwrite if local is NOT pending an update/delete
      for (const note of notes) {
        const local = await offlineStorage.getNoteById(note.id, userId);
        if (!local || local.syncStatus === 'synced') {
          await offlineStorage.saveNote({ ...note, userId, syncStatus: 'synced' });
        }
      }

      return notes;
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local Dexie:', err);
      // 3. Fallback to local storage if offline
      return offlineStorage.getAllNotes(userId);
    }
  },

  // Get a single note by ID
  getById: async (id: string): Promise<Note | undefined> => {
    const userId = await getAuthenticatedUserId();

    // 1. Try local first for instant response
    const localNote = await offlineStorage.getNoteById(id, userId);
    if (localNote) return localNote;

    // 2. Fallback to Supabase
    try {
      const note = await noteRemoteStore.fetchById(userId, id);
      if (!note) return undefined;

      // 3. Cache locally
      await offlineStorage.saveNote({ ...note, userId, syncStatus: 'synced' });
      return note;
    } catch {
      return undefined;
    }
  },

  // Create a new note
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const userId = await getAuthenticatedUserId();

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    await syncEngine.enqueueInsert(userId, newNote);
    return newNote;
  },

  // Update an existing note
  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    const userId = await getAuthenticatedUserId();
    return await syncEngine.enqueueUpdate(userId, id, updates);
  },

  // Delete a note
  delete: async (id: string): Promise<void> => {
    const userId = await getAuthenticatedUserId();
    await syncEngine.enqueueDelete(userId, id);
  },

  getCount: async (): Promise<number> => {
    const userId = await getAuthenticatedUserId();

    try {
      return await noteRemoteStore.count(userId);
    } catch (err) {
      console.warn('Supabase getCount failed, falling back to local Dexie:', err);
      // Includes pending-insert notes by design — offline UX shows notes the user wrote.
      const notes = await offlineStorage.getAllNotes(userId);
      return notes.length;
    }
  },

  getRecent: async (limit: number): Promise<Note[]> => {
    const userId = await getAuthenticatedUserId();

    // Prioritize local storage for instant "Recent" access
    const notes = await offlineStorage.getAllNotes(userId);
    return notes.slice(0, limit);
  },

  getMonthlyCount: async (): Promise<number> => {
    const userId = await getAuthenticatedUserId();

    try {
      return await noteRemoteStore.monthlyCount(userId);
    } catch (err) {
      console.warn('Supabase getMonthlyCount failed, falling back to local Dexie:', err);
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      // Includes pending-insert notes by design — prevents offline limit bypass.
      const notes = await offlineStorage.getAllNotes(userId);
      return notes.filter((note) => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= start && noteDate < end;
      }).length;
    }
  },
};
