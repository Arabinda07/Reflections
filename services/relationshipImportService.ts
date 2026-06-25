import type { RelationshipImportInboxItem, RelationshipRecord } from '../types';
import { getAuthenticatedUserId } from './authUtils';
import { buildNonDestructiveMerge } from './relationshipImportPlanning';
import { relationshipService } from './relationshipService';
import { loadImports, markImportStatus } from './relationshipStore';

/**
 * Import-inbox slice of RelationshipOS: list/accept/merge/archive of imported people.
 * Depends one-way on `relationshipService` (core CRUD) and `relationshipStore` (data layer).
 */
export const relationshipImportService = {
  async getImportInbox(): Promise<RelationshipImportInboxItem[]> {
    const userId = await getAuthenticatedUserId();
    return loadImports(userId);
  },

  async archiveImportItem(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const item = (await relationshipImportService.getImportInbox()).find((candidate) => candidate.id === id);
    if (!item || item.userId !== userId) throw new Error('Import item not found.');
    await markImportStatus(item, 'archived');
  },

  async acceptImportItem(id: string, fields: Partial<RelationshipRecord>): Promise<RelationshipRecord> {
    const item = (await relationshipImportService.getImportInbox()).find((candidate) => candidate.id === id);
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
      relationshipImportService.getImportInbox().then((items) => items.find((candidate) => candidate.id === id)),
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
};
