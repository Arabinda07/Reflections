import { supabase } from '../src/supabaseClient';
import { Capacitor } from '@capacitor/core';
import type { RelationshipImportInboxItem, RelationshipRecord } from '../types';
import { cryptoService, type CryptoSession, type EncryptedEnvelope, isEncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import { getAuthenticatedUserId } from './authUtils';
import {
  db,
  type LocalEncryptedRelationship,
  type LocalEncryptedRelationshipImportInboxItem,
  type LocalRelationship,
  type LocalRelationshipImportInboxItem,
  type LocalSyncStatus,
} from './db';
import { buildWeeklyRelationshipSuggestions } from './relationshipSuggestions';
import {
  deriveRelationshipImportFingerprint,
  buildNonDestructiveMerge,
  fetchAllGoogleConnections,
  findRelationshipMergeSuggestion,
  googlePersonToRelationshipImport,
} from './relationshipImportPlanning';

export { deriveRelationshipImportFingerprint } from './relationshipImportPlanning';

const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly email profile';

interface SupabaseRelationshipRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  encrypted_payload?: EncryptedEnvelope | null;
}

interface SupabaseImportInboxRow {
  id: string;
  user_id: string;
  source: RelationshipImportInboxItem['source'];
  status: RelationshipImportInboxItem['status'];
  source_fingerprint?: string | null;
  created_at: string;
  updated_at: string;
  encrypted_payload?: EncryptedEnvelope | null;
}

type RelationshipPayload = Omit<RelationshipRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
type ImportPayload = Omit<RelationshipImportInboxItem, 'id' | 'userId' | 'source' | 'status' | 'createdAt' | 'updatedAt'>;

const relationshipAad = (userId: string, id: string) => ({
  table: 'relationships',
  rowId: id,
  userId,
});

const importInboxAad = (userId: string, id: string) => ({
  table: 'relationship_import_inbox',
  rowId: id,
  userId,
});

const localRelationshipAad = (relationship: Pick<RelationshipRecord, 'id' | 'userId'>) => ({
  table: 'dexie.relationships',
  rowId: relationship.id,
  userId: relationship.userId,
});

const localImportAad = (item: Pick<RelationshipImportInboxItem, 'id' | 'userId'>) => ({
  table: 'dexie.relationship_import_inbox',
  rowId: item.id,
  userId: item.userId,
});

const defaultRelationshipPayload = (name: string): RelationshipPayload => ({
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

const mapRemoteRelationship = async (
  row: SupabaseRelationshipRow,
  session: CryptoSession,
): Promise<RelationshipRecord> => {
  if (!isEncryptedEnvelope(row.encrypted_payload)) {
    throw new Error('Relationship payload is not encrypted.');
  }

  const payload = await cryptoService.decryptJson<RelationshipPayload>(
    session,
    relationshipAad(row.user_id, row.id),
    row.encrypted_payload,
  );
  return relationshipFromPayload(row, payload);
};

const mapRemoteImportItem = async (
  row: SupabaseImportInboxRow,
  session: CryptoSession,
): Promise<RelationshipImportInboxItem> => {
  if (!isEncryptedEnvelope(row.encrypted_payload)) {
    throw new Error('Relationship import payload is not encrypted.');
  }
  const payload = await cryptoService.decryptJson<ImportPayload>(
    session,
    importInboxAad(row.user_id, row.id),
    row.encrypted_payload,
  );

  return {
    id: row.id,
    userId: row.user_id,
    source: row.source,
    status: row.status,
    sourceFingerprint: row.source_fingerprint || payload.sourceFingerprint,
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

const decryptLocalRelationship = async (
  relationship: LocalEncryptedRelationship | undefined,
  session: CryptoSession,
): Promise<LocalRelationship | undefined> => {
  if (!relationship || !isEncryptedEnvelope(relationship.encryptedPayload)) return undefined;
  const payload = await cryptoService.decryptJson<RelationshipPayload>(
    session,
    localRelationshipAad(relationship),
    relationship.encryptedPayload,
  );
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
  sourceFingerprint: item.sourceFingerprint,
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
  if (!item || !isEncryptedEnvelope(item.encryptedPayload)) return undefined;
  const payload = await cryptoService.decryptJson<ImportPayload>(
    session,
    localImportAad(item),
    item.encryptedPayload,
  );
  return {
    id: item.id,
    userId: item.userId,
    source: item.source,
    status: item.status,
    name: payload.name || 'Imported person',
    sourceFingerprint: item.sourceFingerprint || payload.sourceFingerprint,
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

const toRemoteRelationshipRow = async (relationship: RelationshipRecord, userId: string) => ({
  id: relationship.id,
  user_id: userId,
  created_at: relationship.createdAt,
  updated_at: relationship.updatedAt,
  encrypted_payload: await cryptoService.encryptJson(
    requireCurrentCryptoSession(),
    relationshipAad(userId, relationship.id),
    payloadFromRelationship(relationship),
  ),
  encrypted_payload_version: 1,
  encryption_migration_state: 'verified',
});

const toRemoteImportRow = async (item: RelationshipImportInboxItem, userId: string) => ({
  id: item.id,
  user_id: userId,
  source: item.source,
  status: item.status,
  source_fingerprint: item.sourceFingerprint,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
  encrypted_payload: await cryptoService.encryptJson(
    requireCurrentCryptoSession(),
    importInboxAad(userId, item.id),
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
  ),
  encrypted_payload_version: 1,
  encryption_migration_state: 'verified',
});

const hasExistingImportFingerprint = (
  sourceFingerprint: string | undefined,
  inbox: RelationshipImportInboxItem[],
) =>
  Boolean(
    sourceFingerprint &&
    inbox.some((item) => item.sourceFingerprint === sourceFingerprint),
  );

const saveRelationshipLocal = async (
  userId: string,
  relationship: RelationshipRecord,
  syncStatus: LocalSyncStatus,
) => {
  await db.relationships.put(await encryptLocalRelationship({ ...relationship, userId, syncStatus }, requireCurrentCryptoSession()));
};

const saveImportLocal = async (
  userId: string,
  item: RelationshipImportInboxItem,
  syncStatus: LocalSyncStatus,
) => {
  await db.relationshipImportInbox.put(await encryptLocalImport({ ...item, userId, syncStatus }, requireCurrentCryptoSession()));
};

const markImportStatus = async (
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

const getLocalRelationships = async (userId: string) => {
  const cached = await db.relationships.where('userId').equals(userId).toArray();
  const decrypted = await Promise.all(
    cached.map((relationship) => decryptLocalRelationship(relationship, requireCurrentCryptoSession())),
  );
  return decrypted.filter((relationship): relationship is LocalRelationship => Boolean(relationship));
};

const getLocalImports = async (userId: string) => {
  const cached = await db.relationshipImportInbox.where('userId').equals(userId).toArray();
  const decrypted = await Promise.all(
    cached.map((item) => decryptLocalImport(item, requireCurrentCryptoSession())),
  );
  return decrypted.filter((item): item is LocalRelationshipImportInboxItem => Boolean(item));
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

const flushPendingRelationships = async (userId: string) => {
  const pending = await db.relationships
    .where('[userId+syncStatus]')
    .anyOf([
      [userId, 'pending_insert'],
      [userId, 'pending_update'],
      [userId, 'pending_delete'],
    ])
    .toArray();

  for (const cached of pending) {
    const relationship = await decryptLocalRelationship(cached, requireCurrentCryptoSession());
    if (!relationship) continue;

    if (relationship.syncStatus === 'pending_delete') {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationship.id)
        .eq('user_id', userId);
      if (error) throw error;
      await db.relationships.delete(relationship.id);
      continue;
    }

    const { error } = await supabase
      .from('relationships')
      .upsert(await toRemoteRelationshipRow(relationship, userId));
    if (error) throw error;
    await db.relationships.update(relationship.id, { syncStatus: 'synced' });
  }
};

const flushPendingImports = async (userId: string) => {
  const pending = await db.relationshipImportInbox
    .where('[userId+syncStatus]')
    .anyOf([
      [userId, 'pending_insert'],
      [userId, 'pending_update'],
      [userId, 'pending_delete'],
    ])
    .toArray();

  for (const cached of pending) {
    const item = await decryptLocalImport(cached, requireCurrentCryptoSession());
    if (!item) continue;

    if (item.syncStatus === 'pending_delete') {
      const { error } = await supabase
        .from('relationship_import_inbox')
        .delete()
        .eq('id', item.id)
        .eq('user_id', userId);
      if (error) throw error;
      await db.relationshipImportInbox.delete(item.id);
      continue;
    }

    const { error } = await supabase
      .from('relationship_import_inbox')
      .upsert(await toRemoteImportRow(item, userId));
    if (error) throw error;
    await db.relationshipImportInbox.update(item.id, { syncStatus: 'synced' });
  }
};

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

  async getImportInbox(): Promise<RelationshipImportInboxItem[]> {
    const userId = await getAuthenticatedUserId();
    try {
      await flushPendingImports(userId);
      const { data, error } = await supabase
        .from('relationship_import_inbox')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const items = await Promise.all(((data || []) as SupabaseImportInboxRow[]).map((row) => mapRemoteImportItem(row, requireCurrentCryptoSession())));
      for (const item of items) {
        const local = await db.relationshipImportInbox.get(item.id);
        if (!local || local.syncStatus === 'synced') {
          await saveImportLocal(userId, item, 'synced');
        }
      }
      return mergeRemoteWithPending(items, await getLocalImports(userId));
    } catch {
      return (await getLocalImports(userId))
        .filter((item) => item.syncStatus !== 'pending_delete')
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    }
  },

  async archiveImportItem(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const item = (await relationshipService.getImportInbox()).find((candidate) => candidate.id === id);
    if (!item || item.userId !== userId) throw new Error('Import item not found.');
    await markImportStatus(item, 'archived');
  },

  async acceptImportItem(id: string, fields: Partial<RelationshipRecord>): Promise<RelationshipRecord> {
    const userId = await getAuthenticatedUserId();
    const item = (await relationshipService.getImportInbox()).find((candidate) => candidate.id === id);
    if (!item) throw new Error('Import item not found.');
    const relationship = await relationshipService.create({
      name: fields.name || item.name,
      photoUrl: item.photoUrl,
      email: item.email,
      phone: item.phone,
      company: item.company,
      role: item.role,
      ...fields,
    });
    await markImportStatus(item, 'accepted');
    return relationship;
  },

  async mergeImportItem(
    id: string,
    relationshipId: string,
    additions: Pick<Partial<RelationshipRecord>, 'tags' | 'hooks'> = {},
  ): Promise<RelationshipRecord> {
    const [item, relationship] = await Promise.all([
      relationshipService.getImportInbox().then((items) => items.find((candidate) => candidate.id === id)),
      relationshipService.getById(relationshipId),
    ]);
    if (!item || !relationship) throw new Error('Merge target not found.');

    const updated = await relationshipService.update(
      relationship.id,
      buildNonDestructiveMerge(relationship, item, additions),
    );
    await markImportStatus(item, 'merged');
    return updated;
  },

  async markTended(id: string): Promise<RelationshipRecord> {
    return relationshipService.update(id, { lastTendedAt: new Date().toISOString() });
  },

  canImportGoogleContacts(): boolean {
    return !Capacitor.isNativePlatform();
  },

  async startGoogleContactsOAuth(): Promise<void> {
    if (!relationshipService.canImportGoogleContacts()) {
      throw new Error('Google Contacts import is available on the web app.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: GOOGLE_CONTACTS_SCOPE,
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/relationships?tab=import')}`,
      },
    });
    if (error) throw error;
  },

  async importGoogleContacts(): Promise<{ imported: number; needsReconnect: boolean; unavailableOnDevice: boolean }> {
    if (!relationshipService.canImportGoogleContacts()) {
      return { imported: 0, needsReconnect: false, unavailableOnDevice: true };
    }
    const userId = await getAuthenticatedUserId();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.provider_token;
    if (!token) return { imported: 0, needsReconnect: true, unavailableOnDevice: false };

    const googleResult = await fetchAllGoogleConnections(token);
    if (googleResult.needsReconnect) {
      return { imported: 0, needsReconnect: true, unavailableOnDevice: false };
    }

    const [relationships, existingInbox] = await Promise.all([
      relationshipService.getAll(),
      relationshipService.getImportInbox(),
    ]);
    const now = new Date().toISOString();
    const candidates = googleResult.connections
      .map(googlePersonToRelationshipImport)
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    let imported = 0;
    const seenFingerprints = new Set(
      existingInbox
        .map((item) => item.sourceFingerprint)
        .filter((fingerprint): fingerprint is string => Boolean(fingerprint)),
    );
    for (const candidate of candidates) {
      const sourceFingerprint = await deriveRelationshipImportFingerprint('google_contacts', candidate);
      if (!sourceFingerprint) continue;
      if (seenFingerprints.has(sourceFingerprint) || hasExistingImportFingerprint(sourceFingerprint, existingInbox)) continue;

      const id = crypto.randomUUID();
      const item: RelationshipImportInboxItem = {
        ...candidate,
        id,
        userId,
        source: 'google_contacts',
        status: 'pending',
        sourceFingerprint,
        suggestedMergeRelationshipId: findRelationshipMergeSuggestion(candidate, relationships),
        createdAt: now,
        updatedAt: now,
      };
      await saveImportLocal(userId, item, 'pending_insert');
      const { error } = await supabase.from('relationship_import_inbox').insert(await toRemoteImportRow(item, userId));
      if (!error) {
        await db.relationshipImportInbox.update(id, { syncStatus: 'synced' });
      } else if ((error as { code?: string }).code === '23505') {
        await db.relationshipImportInbox.delete(id);
        continue;
      }
      seenFingerprints.add(sourceFingerprint);
      imported += 1;
    }

    await supabase.from('relationship_import_runs').insert({
      user_id: userId,
      source: 'google_contacts',
      imported_count: imported,
      status: 'completed',
    });

    return { imported, needsReconnect: false, unavailableOnDevice: false };
  },

  buildWeeklySuggestions: buildWeeklyRelationshipSuggestions,
};
