import Dexie, { Table } from 'dexie';
import { Note, RelationshipImportInboxItem, RelationshipRecord } from '../types';
import type { EncryptedEnvelope } from './cryptoService';

export type LocalNote = Note & {
  userId: string;
  syncStatus: 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete';
};

export type LocalSyncStatus = LocalNote['syncStatus'];

export type LocalRelationship = RelationshipRecord & {
  syncStatus: LocalSyncStatus;
};

export type LocalRelationshipImportInboxItem = RelationshipImportInboxItem & {
  syncStatus: LocalSyncStatus;
};

export interface LocalEncryptedNote {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: LocalSyncStatus;
  encryptedPayload: EncryptedEnvelope;
}

export interface LocalEncryptedRelationship {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: LocalSyncStatus;
  encryptedPayload: EncryptedEnvelope;
}

export interface LocalEncryptedRelationshipImportInboxItem {
  id: string;
  userId: string;
  source: RelationshipImportInboxItem['source'];
  status: RelationshipImportInboxItem['status'];
  sourceFingerprint?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: LocalSyncStatus;
  encryptedPayload: EncryptedEnvelope;
}

export class AppDatabase extends Dexie {
  notes!: Table<LocalEncryptedNote>;
  relationships!: Table<LocalEncryptedRelationship>;
  relationshipImportInbox!: Table<LocalEncryptedRelationshipImportInboxItem>;

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
    this.version(4).stores({
      notes: 'id, userId, syncStatus, [userId+syncStatus], updatedAt',
      relationships: 'id, userId, syncStatus, [userId+syncStatus], updatedAt',
      relationshipImportInbox: 'id, userId, source, status, syncStatus, [userId+syncStatus], updatedAt',
    });
  }
}

export const db = new AppDatabase();
