import { Capacitor } from '@capacitor/core';
import { supabase } from '../src/supabaseClient';
import type { RelationshipImportInboxItem } from '../types';
import { getAuthenticatedUserId } from './authUtils';
import { db } from './db';
import {
  deriveRelationshipImportFingerprint,
  fetchAllGoogleConnections,
  findRelationshipMergeSuggestion,
  googlePersonToRelationshipImport,
} from './relationshipImportPlanning';
import { relationshipService } from './relationshipService';
import { relationshipImportService } from './relationshipImportService';
import { hasExistingImportFingerprint, saveImportLocal, toRemoteImportRow } from './relationshipStore';

const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly email profile';

/**
 * Google Contacts import slice of RelationshipOS: one-time read-only OAuth + inbox seeding.
 * Depends one-way on `relationshipService` (getAll), `relationshipImportService` (getImportInbox),
 * and `relationshipStore` (data layer).
 */
export const googleContactsImportService = {
  canImportGoogleContacts(): boolean {
    return !Capacitor.isNativePlatform();
  },

  async startGoogleContactsOAuth(): Promise<void> {
    if (!googleContactsImportService.canImportGoogleContacts()) {
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
    if (!googleContactsImportService.canImportGoogleContacts()) {
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
      relationshipImportService.getImportInbox(),
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
};
