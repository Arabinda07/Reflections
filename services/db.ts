import Dexie, { Table } from 'dexie';
import { Note } from '../types';
import type { EncryptedEnvelope } from './cryptoService';

export type LocalNote = Note & {
  userId: string;
  syncStatus: 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete';
};

export interface LocalEncryptedNote {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: LocalNote['syncStatus'];
  encryptedPayload: EncryptedEnvelope;
}

export class AppDatabase extends Dexie {
  notes!: Table<LocalEncryptedNote>;

  constructor() {
    super('reflections_db');
    this.version(1).stores({
      notes: 'id, userId, syncStatus, updatedAt'
    });
    this.version(2).stores({
      notes: 'id, userId, syncStatus, [userId+syncStatus], updatedAt'
    });
    this.version(3).stores({
      notes: 'id, userId, syncStatus, [userId+syncStatus], updatedAt'
    });
  }
}

export const db = new AppDatabase();
