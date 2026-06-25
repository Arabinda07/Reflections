import type { Table } from 'dexie';
import { supabase } from '../src/supabaseClient';
import type { RelationshipImportInboxItem, RelationshipRecord } from '../types';
import { cryptoService, type CryptoSession, type EncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import { decryptEnvelope, encryptedColumns, rowAad } from './encryptedPayload';
import {
  db,
  type LocalEncryptedRelationship,
  type LocalEncryptedRelationshipImportInboxItem,
  type LocalRelationship,
  type LocalRelationshipImportInboxItem,
  type LocalSyncStatus,
} from './db';

/**
 * Data layer for the RelationshipOS feature: Supabase row mapping, zero-knowledge
 * encrypt/decrypt, Dexie local cache, and pending-change sync for both relationships
 * and the import inbox. The orchestration / public API lives in `relationshipService.ts`,
 * which imports from here. This module must NOT import `relationshipService` (one-way).
 */

export interface SupabaseRelationshipRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  encrypted_payload?: EncryptedEnvelope | null;
}

export interface SupabaseImportInboxRow {
  id: string;
  user_id: string;
  source: RelationshipImportInboxItem['source'];
  status: RelationshipImportInboxItem['status'];
  created_at: string;
  updated_at: string;
  encrypted_payload?: EncryptedEnvelope | null;
}

export type RelationshipPayload = Omit<RelationshipRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type ImportPayload = Omit<RelationshipImportInboxItem, 'id' | 'userId' | 'source' | 'status' | 'createdAt' | 'updatedAt'>;

const relationshipAad = rowAad('relationships');

const importInboxAad = rowAad('relationship_import_inbox');

const localRelationshipAad = (relationship: Pick<RelationshipRecord, 'id' | 'userId'>) =>
  rowAad('dexie.relationships')(relationship.userId, relationship.id);

const localImportAad = (item: Pick<RelationshipImportInboxItem, 'id' | 'userId'>) =>
  rowAad('dexie.relationship_import_inbox')(item.userId, item.id);

export const defaultRelationshipPayload = (name: string): RelationshipPayload => ({
  name,
  tier: 'none',
  stage: 'discover',
  closeness: 3,
  energy: 3,
  opportunity: 3,
  tags: [],
  interactions: [],
  hooks: [],
  nextCare: [],
  connections: [],
  valueLedger: [],
});

const payloadFromRelationship = (relationship: RelationshipRecord): RelationshipPayload => ({
  name: relationship.name,
  photoUrl: relationship.photoUrl,
  email: relationship.email,
  phone: relationship.phone,
  linkedinUrl: relationship.linkedinUrl,
  company: relationship.company,
  role: relationship.role,
  location: relationship.location,
  howWeMet: relationship.howWeMet,
  caresAbout: relationship.caresAbout,
  notes: relationship.notes,
  tier: relationship.tier,
  stage: relationship.stage,
  closeness: relationship.closeness,
  energy: relationship.energy,
  opportunity: relationship.opportunity,
  tags: relationship.tags || [],
  interactions: relationship.interactions || [],
  hooks: relationship.hooks || [],
  nextCare: relationship.nextCare || [],
  connections: relationship.connections || [],
  valueLedger: relationship.valueLedger || [],
  lastTendedAt: relationship.lastTendedAt,
});

const relationshipFromPayload = (
  row: SupabaseRelationshipRow,
  payload: RelationshipPayload,
): RelationshipRecord => ({
  id: row.id,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...payload,
  name: payload.name || 'Untitled relationship',
  stage: payload.stage || 'discover',
  tier: payload.tier || 'none',
  closeness: payload.closeness || 3,
  energy: payload.energy || 3,
  opportunity: payload.opportunity || 3,
  tags: payload.tags || [],
  interactions: payload.interactions || [],
  hooks: payload.hooks || [],
  nextCare: payload.nextCare || [],
  connections: payload.connections || [],
  valueLedger: payload.valueLedger || [],
  lastTendedAt: payload.lastTendedAt,
});

export const mapRemoteRelationship = async (
  row: SupabaseRelationshipRow,
  session: CryptoSession,
): Promise<RelationshipRecord> => {
  const payload = await decryptEnvelope<RelationshipPayload>(
    row.encrypted_payload,
    relationshipAad(row.user_id, row.id),
    session,
  );
  if (!payload) {
    throw new Error('Relationship payload is not encrypted.');
  }
  return relationshipFromPayload(row, payload);
};

export const mapRemoteImportItem = async (
  row: SupabaseImportInboxRow,
  session: CryptoSession,
): Promise<RelationshipImportInboxItem> => {
  const payload = await decryptEnvelope<ImportPayload>(
    row.encrypted_payload,
    importInboxAad(row.user_id, row.id),
    session,
  );
  if (!payload) {
    throw new Error('Relationship import payload is not encrypted.');
  }

  return {
    id: row.id,
    userId: row.user_id,
    source: row.source,
    status: row.status,
    sourceFingerprint: payload.sourceFingerprint,
    name: payload.name || 'Imported person',
    googleResourceName: payload.googleResourceName,
    photoUrl: payload.photoUrl,
    email: payload.email,
    phone: payload.phone,
    company: payload.company,
    role: payload.role,
    suggestedMergeRelationshipId: payload.suggestedMergeRelationshipId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const encryptLocalRelationship = async (
  relationship: LocalRelationship,
  session: CryptoSession,
) => ({
  id: relationship.id,
  userId: relationship.userId,
  createdAt: relationship.createdAt,
  updatedAt: relationship.updatedAt,
  syncStatus: relationship.syncStatus,
  encryptedPayload: await cryptoService.encryptJson(session, localRelationshipAad(relationship), payloadFromRelationship(relationship)),
});

export const decryptLocalRelationship = async (
  relationship: LocalEncryptedRelationship | undefined,
  session: CryptoSession,
): Promise<LocalRelationship | undefined> => {
  if (!relationship) return undefined;
  const payload = await decryptEnvelope<RelationshipPayload>(
    relationship.encryptedPayload,
    localRelationshipAad(relationship),
    session,
  );
  if (!payload) return undefined;
  return {
    ...relationshipFromPayload({
      id: relationship.id,
      user_id: relationship.userId,
      created_at: relationship.createdAt,
      updated_at: relationship.updatedAt,
      encrypted_payload: relationship.encryptedPayload,
    }, payload),
    syncStatus: relationship.syncStatus,
  };
};

const encryptLocalImport = async (
  item: LocalRelationshipImportInboxItem,
  session: CryptoSession,
) => ({
  id: item.id,
  userId: item.userId,
  source: item.source,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  syncStatus: item.syncStatus,
  encryptedPayload: await cryptoService.encryptJson(session, localImportAad(item), {
    name: item.name,
    sourceFingerprint: item.sourceFingerprint,
    googleResourceName: item.googleResourceName,
    photoUrl: item.photoUrl,
    email: item.email,
    phone: item.phone,
    company: item.company,
    role: item.role,
    suggestedMergeRelationshipId: item.suggestedMergeRelationshipId,
  }),
});

const decryptLocalImport = async (
  item: LocalEncryptedRelationshipImportInboxItem | undefined,
  session: CryptoSession,
): Promise<LocalRelationshipImportInboxItem | undefined> => {
  if (!item) return undefined;
  const payload = await decryptEnvelope<ImportPayload>(
    item.encryptedPayload,
    localImportAad(item),
    session,
  );
  if (!payload) return undefined;
  return {
    id: item.id,
    userId: item.userId,
    source: item.source,
    status: item.status,
    name: payload.name || 'Imported person',
    sourceFingerprint: payload.sourceFingerprint,
    googleResourceName: payload.googleResourceName,
    photoUrl: payload.photoUrl,
    email: payload.email,
    phone: payload.phone,
    company: payload.company,
    role: payload.role,
    suggestedMergeRelationshipId: payload.suggestedMergeRelationshipId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    syncStatus: item.syncStatus,
  };
};

export const toRemoteRelationshipRow = async (relationship: RelationshipRecord, userId: string) => ({
  id: relationship.id,
  user_id: userId,
  created_at: relationship.createdAt,
  updated_at: relationship.updatedAt,
  ...(await encryptedColumns(payloadFromRelationship(relationship), relationshipAad(userId, relationship.id))),
});

export const toRemoteImportRow = async (item: RelationshipImportInboxItem, userId: string) => ({
  id: item.id,
  user_id: userId,
  source: item.source,
  status: item.status,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
  ...(await encryptedColumns(
    {
      name: item.name,
      sourceFingerprint: item.sourceFingerprint,
      googleResourceName: item.googleResourceName,
      photoUrl: item.photoUrl,
      email: item.email,
      phone: item.phone,
      company: item.company,
      role: item.role,
      suggestedMergeRelationshipId: item.suggestedMergeRelationshipId,
    },
    importInboxAad(userId, item.id),
  )),
});

export const hasExistingImportFingerprint = (
  sourceFingerprint: string | undefined,
  inbox: RelationshipImportInboxItem[],
) =>
  Boolean(
    sourceFingerprint &&
    inbox.some((item) => item.sourceFingerprint === sourceFingerprint),
  );

export const saveRelationshipLocal = async (
  userId: string,
  relationship: RelationshipRecord,
  syncStatus: LocalSyncStatus,
) => {
  await db.relationships.put(await encryptLocalRelationship({ ...relationship, userId, syncStatus }, requireCurrentCryptoSession()));
};

export const saveImportLocal = async (
  userId: string,
  item: RelationshipImportInboxItem,
  syncStatus: LocalSyncStatus,
) => {
  await db.relationshipImportInbox.put(await encryptLocalImport({ ...item, userId, syncStatus }, requireCurrentCryptoSession()));
};

export const markImportStatus = async (
  item: RelationshipImportInboxItem,
  status: RelationshipImportInboxItem['status'],
) => {
  const updatedItem = { ...item, status, updatedAt: new Date().toISOString() };
  await saveImportLocal(item.userId, updatedItem, 'pending_update');
  const { error } = await supabase
    .from('relationship_import_inbox')
    .update({ status, updated_at: updatedItem.updatedAt })
    .eq('id', item.id)
    .eq('user_id', item.userId);
  if (!error) await db.relationshipImportInbox.update(item.id, { syncStatus: 'synced' });
};

export const mergeRemoteWithPending = <T extends { id: string; syncStatus?: LocalSyncStatus }>(
  remote: T[],
  local: T[],
) => {
  const pending = local.filter((item) => item.syncStatus && item.syncStatus !== 'synced');
  const pendingIds = new Set(pending.map((item) => item.id));
  return [
    ...pending.filter((item) => item.syncStatus !== 'pending_delete'),
    ...remote.filter((item) => !pendingIds.has(item.id)),
  ];
};

// ── Generic local-mirror + sync, parametrized per entity ───────────────────
// Relationships and the import inbox share the same Dexie-mirror + pending-flush
// machinery; only the table, ordering, and field-mappers differ. One mirror
// config captures those, so the cache read, flush loop, and local read live once.
const PENDING_STATUSES: LocalSyncStatus[] = ['pending_insert', 'pending_update', 'pending_delete'];

type MirrorRow = { id: string; userId: string; syncStatus: LocalSyncStatus };
type MirrorModel = { id: string; userId: string; updatedAt: string; syncStatus?: LocalSyncStatus };

interface EntityMirror<TRemote extends { id: string; user_id: string }, TModel extends MirrorModel> {
  dexieTable: Table<MirrorRow>;
  remoteTable: string;
  orderColumn: string;
  decryptLocal: (row: MirrorRow | undefined, session: CryptoSession) => Promise<TModel | undefined>;
  mapRemoteRow: (row: TRemote, session: CryptoSession) => Promise<TModel>;
  toRemoteRow: (item: TModel, userId: string) => Promise<Record<string, unknown>>;
  saveLocal: (userId: string, item: TModel, syncStatus: LocalSyncStatus) => Promise<void>;
}

const getLocalEntity = async <TRemote extends { id: string; user_id: string }, TModel extends MirrorModel>(
  mirror: EntityMirror<TRemote, TModel>,
  userId: string,
): Promise<TModel[]> => {
  const cached = await mirror.dexieTable.where('userId').equals(userId).toArray();
  const decrypted = await Promise.all(cached.map((row) => mirror.decryptLocal(row, requireCurrentCryptoSession())));
  return decrypted.filter((item) => Boolean(item)) as TModel[];
};

const flushPendingEntity = async <TRemote extends { id: string; user_id: string }, TModel extends MirrorModel>(
  mirror: EntityMirror<TRemote, TModel>,
  userId: string,
): Promise<void> => {
  const pending = await mirror.dexieTable
    .where('[userId+syncStatus]')
    .anyOf(PENDING_STATUSES.map((status) => [userId, status]))
    .toArray();

  for (const cached of pending) {
    const item = await mirror.decryptLocal(cached, requireCurrentCryptoSession());
    if (!item) continue;

    if (item.syncStatus === 'pending_delete') {
      const { error } = await supabase.from(mirror.remoteTable).delete().eq('id', item.id).eq('user_id', userId);
      if (error) throw error;
      await mirror.dexieTable.delete(item.id);
      continue;
    }

    const { error } = await supabase.from(mirror.remoteTable).upsert(await mirror.toRemoteRow(item, userId));
    if (error) throw error;
    await mirror.dexieTable.update(item.id, { syncStatus: 'synced' });
  }
};

// flush -> fetch remote -> map -> refresh local cache for synced rows -> merge
// with pending local edits; on any failure fall back to the local cache.
const loadCachedEntities = async <TRemote extends { id: string; user_id: string }, TModel extends MirrorModel>(
  mirror: EntityMirror<TRemote, TModel>,
  userId: string,
): Promise<TModel[]> => {
  try {
    await flushPendingEntity(mirror, userId);
    const { data, error } = await supabase
      .from(mirror.remoteTable)
      .select('*')
      .eq('user_id', userId)
      .order(mirror.orderColumn, { ascending: false });
    if (error) throw error;
    const items = await Promise.all(((data || []) as TRemote[]).map((row) => mirror.mapRemoteRow(row, requireCurrentCryptoSession())));
    for (const item of items) {
      const local = await mirror.dexieTable.get(item.id);
      if (!local || local.syncStatus === 'synced') {
        await mirror.saveLocal(userId, item, 'synced');
      }
    }
    return mergeRemoteWithPending(items, await getLocalEntity(mirror, userId));
  } catch {
    return (await getLocalEntity(mirror, userId))
      .filter((item) => item.syncStatus !== 'pending_delete')
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }
};

const relationshipMirror: EntityMirror<SupabaseRelationshipRow, RelationshipRecord> = {
  dexieTable: db.relationships as unknown as Table<MirrorRow>,
  remoteTable: 'relationships',
  orderColumn: 'updated_at',
  decryptLocal: decryptLocalRelationship as EntityMirror<SupabaseRelationshipRow, RelationshipRecord>['decryptLocal'],
  mapRemoteRow: mapRemoteRelationship,
  toRemoteRow: toRemoteRelationshipRow,
  saveLocal: saveRelationshipLocal,
};

const importMirror: EntityMirror<SupabaseImportInboxRow, RelationshipImportInboxItem> = {
  dexieTable: db.relationshipImportInbox as unknown as Table<MirrorRow>,
  remoteTable: 'relationship_import_inbox',
  orderColumn: 'created_at',
  decryptLocal: decryptLocalImport as EntityMirror<SupabaseImportInboxRow, RelationshipImportInboxItem>['decryptLocal'],
  mapRemoteRow: mapRemoteImportItem,
  toRemoteRow: toRemoteImportRow,
  saveLocal: saveImportLocal,
};

// Thin per-entity wrappers keep the public surface stable for existing imports.
export const getLocalRelationships = (userId: string) => getLocalEntity(relationshipMirror, userId);
export const getLocalImports = (userId: string) => getLocalEntity(importMirror, userId);
export const flushPendingRelationships = (userId: string) => flushPendingEntity(relationshipMirror, userId);
export const flushPendingImports = (userId: string) => flushPendingEntity(importMirror, userId);
export const loadRelationships = (userId: string) => loadCachedEntities(relationshipMirror, userId);
export const loadImports = (userId: string) => loadCachedEntities(importMirror, userId);
