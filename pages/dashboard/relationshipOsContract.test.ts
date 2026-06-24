import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('RelationshipOS routing and UI contracts', () => {
  it('registers protected relationship routes and navigation entries', () => {
    const app = read('App.tsx');
    const types = read('types.ts');
    const desktopNav = read('layouts/DashboardLayout.tsx');
    const mobileNav = read('layouts/AuthenticatedMobileNav.tsx');

    expect(types).toContain("RELATIONSHIPS = '/relationships'");
    expect(types).toContain("RELATIONSHIP_DETAIL = '/relationships/:id'");
    expect(app).toContain('RoutePath.RELATIONSHIPS');
    expect(app).toContain('RoutePath.RELATIONSHIP_DETAIL');
    expect(desktopNav).toContain("label: 'Relationships'");
    expect(mobileNav).toContain("label: 'Relationships'");
  });

  it('keeps Google Contacts import one-time, read-only, and inbox-gated', () => {
    const service = read('services/relationshipService.ts');
    const page = read('pages/dashboard/RelationshipImportInbox.tsx');
    const importPlanning = read('services/relationshipImportPlanning.ts');

    expect(service).toContain('https://www.googleapis.com/auth/contacts.readonly');
    expect(importPlanning).toContain('people.googleapis.com/v1/people/me/connections');
    expect(importPlanning).toContain('nextPageToken');
    expect(service).toContain('/auth/callback?next=');
    expect(service).toContain('/relationships?tab=import');
    expect(importPlanning).toContain('deriveRelationshipImportFingerprint');
    expect(service).toContain('seenFingerprints');
    expect(service).toContain("source: 'google_contacts'");
    expect(service).toContain("status: 'pending'");
    expect(importPlanning).toContain('googleResourceName');
    expect(importPlanning).not.toContain('people:createContact');
    expect(importPlanning).not.toContain('people:updateContact');
    expect(page).toContain('Review one by one');
    expect(page).toContain('Google import');
  });
});

describe('RelationshipOS security migration contract', () => {
  it('creates encrypted RLS tables and clears them during account deletion', () => {
    const migration = read('supabase/migrations/20260623090000_relationship_os.sql');
    const privacyMigration = read('supabase/migrations/20260624120000_remove_relationship_import_fingerprint.sql');
    const service = read('services/relationshipService.ts');
    const store = read('services/relationshipStore.ts');
    const db = read('services/db.ts');

    ['relationships', 'relationship_import_inbox', 'relationship_import_runs'].forEach((table) => {
      expect(migration).toContain(`public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`delete from public.${table}`);
    });

    expect(migration).toContain('encrypted_payload jsonb');
    expect(migration).toContain('zero_knowledge_is_forced()');
    expect(migration).toContain('source_fingerprint text');
    expect(migration).toContain('relationship_import_inbox_source_fingerprint_uidx');
    expect(privacyMigration).toContain('drop index if exists public.relationship_import_inbox_source_fingerprint_uidx');
    expect(privacyMigration).toContain('drop column if exists source_fingerprint');
    expect(store).not.toContain('source_fingerprint');
    expect(db).not.toContain('sourceFingerprint?: string');
    expect(migration).not.toContain('display_name');
    expect(migration).not.toContain('relationship_hooks');
    expect(migration).not.toContain('relationship_connections');
    expect(service).not.toContain('display_name: relationship.name');
  });
});
