import { db, LocalNote } from './db';
export interface SyncOperation {
  id?: number;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  data: any;
  timestamp: number;
}
export const offlineStorage = {
  // --- Note Operations ---

  async saveNote(note: LocalNote): Promise<void> {
    await db.notes.put(note);
  },

  async getAllNotes(userId: string): Promise<LocalNote[]> {
    return await db.notes
      .where('userId')
      .equals(userId)
      // Filter out pending deletes so they don't show up in the UI
      .filter(note => note.syncStatus !== 'pending_delete')
      .reverse()
      .sortBy('updatedAt');
  },

  async getNoteById(id: string): Promise<LocalNote | undefined> {
    return await db.notes.get(id);
  },

  async deleteNote(id: string): Promise<void> {
    const note = await db.notes.get(id);
    if (note) {
      // If it was already pending insert (never went to server), just delete it
      if (note.syncStatus === 'pending_insert') {
        await db.notes.delete(id);
      } else {
        // Otherwise, mark as pending delete so sync engine can process it
        await db.notes.update(id, { syncStatus: 'pending_delete', updatedAt: new Date().toISOString() });
      }
    }
  },

  // --- Sync Engine Queries ---

  async getPendingOperations(): Promise<LocalNote[]> {
    return await db.notes
      .where('syncStatus')
      .anyOf(['pending_insert', 'pending_update', 'pending_delete'])
      .toArray();
  },

  async markAsSynced(id: string): Promise<void> {
    const note = await db.notes.get(id);
    if (!note) return;
    
    if (note.syncStatus === 'pending_delete') {
      await db.notes.delete(id);
    } else {
      await db.notes.update(id, { syncStatus: 'synced' });
    }
  },

  async clearUserData(userId: string): Promise<void> {
    await db.notes.where('userId').equals(userId).delete();
  },

  // Legacy compatibility methods (if used by other parts of the app during transition)
  async getQueuedOperations(): Promise<any[]> {
    const pending = await this.getPendingOperations();
    return pending.map(n => ({
      id: 0, // Mock id for legacy interface
      action: n.syncStatus.replace('pending_', '') as 'create' | 'update' | 'delete',
      entityId: n.id,
      data: n,
      timestamp: new Date(n.updatedAt).getTime()
    }));
  },

  async removeFromQueue(id: number): Promise<void> {
    // This was used for the separate sync_queue table. 
    // In the new system, markAsSynced handles this.
    console.warn('removeFromQueue is legacy. Use markAsSynced instead.');
  }
};
