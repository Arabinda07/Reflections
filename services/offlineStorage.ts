import { db, LocalNote } from './db';

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
};

