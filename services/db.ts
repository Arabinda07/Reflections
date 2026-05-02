import Dexie, { Table } from 'dexie';
import { Note } from '../types';

export interface LocalNote extends Note {
  userId: string;
  syncStatus: 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete';
}

export class AppDatabase extends Dexie {
  notes!: Table<LocalNote>;

  constructor() {
    super('reflections_db');
    this.version(1).stores({
      // We index userId for fast fetching of current user's notes
      // We index syncStatus for the sync engine to find pending changes
      notes: 'id, userId, syncStatus, updatedAt'
    });
    this.version(2).stores({
      notes: 'id, userId, syncStatus, [userId+syncStatus], updatedAt'
    });
  }
}

export const db = new AppDatabase();
