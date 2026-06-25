import { supabase } from '../src/supabaseClient';
import type { RelationshipRecord } from '../types';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import { getAuthenticatedUserId } from './authUtils';
import { db, type LocalSyncStatus } from './db';
import { buildWeeklyRelationshipSuggestions } from './relationshipSuggestions';
import {
  defaultRelationshipPayload,
  decryptLocalRelationship,
  toRemoteRelationshipRow,
  saveRelationshipLocal,
  loadRelationships,
} from './relationshipStore';

export const relationshipService = {
  async hasPendingSync(): Promise<boolean> {
    const userId = await getAuthenticatedUserId();
    const statuses: LocalSyncStatus[] = ['pending_insert', 'pending_update', 'pending_delete'];
    const [relationship, importItem] = await Promise.all([
      db.relationships.where('[userId+syncStatus]').anyOf(statuses.map((status) => [userId, status])).first(),
      db.relationshipImportInbox.where('[userId+syncStatus]').anyOf(statuses.map((status) => [userId, status])).first(),
    ]);
    return Boolean(relationship || importItem);
  },

  async getAll(): Promise<RelationshipRecord[]> {
    const userId = await getAuthenticatedUserId();
    return loadRelationships(userId);
  },

  async getById(id: string): Promise<RelationshipRecord | undefined> {
    const userId = await getAuthenticatedUserId();
    const cached = await decryptLocalRelationship(await db.relationships.get(id), requireCurrentCryptoSession());
    if (cached?.userId === userId && cached.syncStatus !== 'pending_delete') return cached;
    const relationships = await relationshipService.getAll();
    return relationships.find((relationship) => relationship.id === id);
  },

  async create(input: Partial<RelationshipRecord> & { name: string }): Promise<RelationshipRecord> {
    const userId = await getAuthenticatedUserId();
    const now = new Date().toISOString();
    const relationship: RelationshipRecord = {
      ...defaultRelationshipPayload(input.name),
      ...input,
      id: input.id || crypto.randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
    };

    await saveRelationshipLocal(userId, relationship, 'pending_insert');
    try {
      const { error } = await supabase.from('relationships').insert(await toRemoteRelationshipRow(relationship, userId));
      if (error) throw error;
      await db.relationships.update(relationship.id, { syncStatus: 'synced' });
    } catch {
      // Relationship remains pending locally until a later edit/import refresh.
    }

    return relationship;
  },

  async update(id: string, updates: Partial<RelationshipRecord>): Promise<RelationshipRecord> {
    const userId = await getAuthenticatedUserId();
    const existing = await relationshipService.getById(id);
    if (!existing) throw new Error('Relationship not found.');
    const relationship = { ...existing, ...updates, id, userId, updatedAt: new Date().toISOString() };
    const cached = await db.relationships.get(id);
    await saveRelationshipLocal(userId, relationship, cached?.syncStatus === 'pending_insert' ? 'pending_insert' : 'pending_update');
    try {
      const { error } = await supabase.from('relationships').upsert(await toRemoteRelationshipRow(relationship, userId));
      if (error) throw error;
      await db.relationships.update(id, { syncStatus: 'synced' });
    } catch {
      // Relationship remains pending locally until a later edit/import refresh.
    }
    return relationship;
  },

  async markTended(id: string): Promise<RelationshipRecord> {
    return relationshipService.update(id, { lastTendedAt: new Date().toISOString() });
  },

  buildWeeklySuggestions: buildWeeklyRelationshipSuggestions,
};
