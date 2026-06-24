import { supabase } from '../src/supabaseClient';
import type { RelationshipRecord } from '../types';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import { getAuthenticatedUserId } from './authUtils';
import { db, type LocalSyncStatus } from './db';
import { buildWeeklyRelationshipSuggestions } from './relationshipSuggestions';
import {
  type SupabaseRelationshipRow,
  defaultRelationshipPayload,
  mapRemoteRelationship,
  decryptLocalRelationship,
  toRemoteRelationshipRow,
  saveRelationshipLocal,
  getLocalRelationships,
  mergeRemoteWithPending,
  flushPendingRelationships,
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
    try {
      await flushPendingRelationships(userId);
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const relationships = await Promise.all(((data || []) as SupabaseRelationshipRow[]).map((row) => mapRemoteRelationship(row, requireCurrentCryptoSession())));
      for (const relationship of relationships) {
        const local = await db.relationships.get(relationship.id);
        if (!local || local.syncStatus === 'synced') {
          await saveRelationshipLocal(userId, relationship, 'synced');
        }
      }
      return mergeRemoteWithPending(relationships, await getLocalRelationships(userId));
    } catch {
      return (await getLocalRelationships(userId))
        .filter((relationship) => relationship.syncStatus !== 'pending_delete')
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    }
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
