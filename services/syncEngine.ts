import type { Note } from '../types';
import { offlineStorage } from './offlineStorage';
import { noteRemoteStore } from './noteRemoteStore';
import type { LocalNote } from './db';

/**
 * The SyncEngine guarantees eventual consistency between Dexie (offlineStorage)
 * and Supabase (noteRemoteStore).
 * 
 * It exposes pure enqueue methods. The caller does not need to handle try/catches
 * for network failures. The sync engine will process the local queue in the background.
 */

const isFlushing = new Map<string, boolean>();
const isFlushQueued = new Map<string, boolean>();

export const syncEngine = {
  /**
   * Saves a note locally as 'pending_insert' and immediately attempts a background flush.
   */
  enqueueInsert: async (userId: string, note: Note): Promise<void> => {
    await offlineStorage.saveNote({ ...note, userId, syncStatus: 'pending_insert' });
    syncEngine.flush(userId).catch((err) => {
      console.warn('[SyncEngine] Insert flush failed, will retry later:', err);
    });
  },

  /**
   * Saves a note locally as 'pending_update' (or keeps 'pending_insert') and attempts a flush.
   */
  enqueueUpdate: async (userId: string, id: string, updates: Partial<Note>): Promise<LocalNote> => {
    const current = await offlineStorage.getNoteById(id, userId);
    if (!current) throw new Error('Note not found locally');

    const updatedNote: LocalNote = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: current.syncStatus === 'pending_insert' ? 'pending_insert' : 'pending_update',
    };

    await offlineStorage.saveNote(updatedNote);
    syncEngine.flush(userId).catch((err) => {
      console.warn('[SyncEngine] Update flush failed, will retry later:', err);
    });

    return updatedNote;
  },

  /**
   * Marks a note as 'pending_delete' locally and attempts a flush.
   */
  enqueueDelete: async (userId: string, id: string): Promise<void> => {
    await offlineStorage.deleteNote(id, userId);
    syncEngine.flush(userId).catch((err) => {
      console.warn('[SyncEngine] Delete flush failed, will retry later:', err);
    });
  },

  /**
   * Iterates through pending operations in Dexie and pushes them to Supabase.
   */
  flush: async (userId: string): Promise<void> => {
    if (isFlushing.get(userId)) {
      isFlushQueued.set(userId, true);
      return;
    }
    isFlushing.set(userId, true);

    try {
      do {
        isFlushQueued.set(userId, false);
        const pendingOps = await offlineStorage.getPendingOperations(userId);
        if (pendingOps.length === 0) break;

        for (const op of pendingOps) {
          try {
            if (op.syncStatus === 'pending_insert') {
              await noteRemoteStore.insert(userId, op);
              await offlineStorage.markAsSynced(op.id);
              console.debug(`[SyncEngine] Synced insert for note ${op.id}`);
            } else if (op.syncStatus === 'pending_update') {
              await noteRemoteStore.upsert(userId, op);
              await offlineStorage.markAsSynced(op.id);
              console.debug(`[SyncEngine] Synced update for note ${op.id}`);
            } else if (op.syncStatus === 'pending_delete') {
              await noteRemoteStore.remove(userId, op.id);
              await offlineStorage.markAsSynced(op.id);
              console.debug(`[SyncEngine] Synced delete for note ${op.id}`);
            }
          } catch (err) {
            console.warn(`[SyncEngine] Failed to sync op ${op.id}, pausing flush:`, err);
            return; // Exit entirely to maintain order, wait for next network trigger
          }
        }
      } while (isFlushQueued.get(userId));
    } finally {
      isFlushing.set(userId, false);
    }
  },
};
