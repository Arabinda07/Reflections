import { describe, expect, it, vi } from 'vitest';
import { relationshipService } from './relationshipService';
import { buildNonDestructiveMerge, deriveRelationshipImportFingerprint, fetchAllGoogleConnections, findRelationshipMergeSuggestion } from './relationshipImportPlanning';
import { mergeRemoteWithPending } from './relationshipStore';
import type { RelationshipRecord } from '../types';
import type { LocalSyncStatus } from './db';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: vi.fn(),
  },
}));

const baseRelationship = (overrides: Partial<RelationshipRecord>): RelationshipRecord => ({
  id: overrides.id || 'relationship-1',
  userId: 'user-1',
  name: overrides.name || 'Ada',
  tier: 'none',
  stage: 'active',
  closeness: 3,
  energy: 3,
  opportunity: 3,
  tags: [],
  interactions: [],
  hooks: [],
  nextCare: [],
  connections: [],
  valueLedger: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('relationshipService.buildWeeklySuggestions', () => {
  it('prioritizes dormant relationships and unused hooks over fresh active relationships', () => {
    const suggestions = relationshipService.buildWeeklySuggestions([
      baseRelationship({
        id: 'fresh',
        name: 'Fresh Active',
        interactions: [{
          id: 'touch-1',
          date: new Date().toISOString(),
          channel: 'email',
          notes: 'Recent note',
          direction: 'mutual',
        }],
      }),
      baseRelationship({
        id: 'hook',
        name: 'Hook Person',
        hooks: [{
          id: 'hook-1',
          description: 'Started a new role',
          source: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          used: false,
        }],
      }),
      baseRelationship({
        id: 'dormant',
        name: 'Dormant Person',
        // Dormant is now derived from a >90-day gap, not the stage field.
        interactions: [{
          id: 'touch-old',
          date: new Date(Date.now() - 120 * 86_400_000).toISOString(),
          channel: 'email',
          notes: 'Old note',
          direction: 'mutual',
        }],
      }),
    ]);

    expect(suggestions.map((suggestion) => suggestion.relationship.id).slice(0, 2)).toEqual([
      'dormant',
      'hook',
    ]);
    expect(suggestions[1].suggestedHook?.description).toContain('Started a new role');
  });

  it('ranks on behavior only — closeness/energy/opportunity do not change order', () => {
    const recent = () => [{
      id: 'touch',
      date: new Date().toISOString(),
      channel: 'email' as const,
      notes: 'Recent',
      direction: 'mutual' as const,
    }];
    const suggestions = relationshipService.buildWeeklySuggestions([
      baseRelationship({ id: 'low', closeness: 1, energy: 1, opportunity: 1, interactions: recent() }),
      baseRelationship({ id: 'high', closeness: 5, energy: 5, opportunity: 5, interactions: recent() }),
    ]);

    // Equal behavior → stable input order. Old slider weights would have floated 'high' to the top.
    expect(suggestions.map((suggestion) => suggestion.relationship.id)).toEqual(['low', 'high']);
  });

  it('does not suggest archived relationships', () => {
    const suggestions = relationshipService.buildWeeklySuggestions([
      baseRelationship({ id: 'archived', stage: 'archived' }),
      baseRelationship({ id: 'active', stage: 'active' }),
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].relationship.id).toBe('active');
  });

  it('does not suggest relationships already tended this week', () => {
    const suggestions = relationshipService.buildWeeklySuggestions([
      baseRelationship({ id: 'tended', lastTendedAt: new Date().toISOString() }),
      baseRelationship({ id: 'waiting' }),
    ]);

    expect(suggestions.map((suggestion) => suggestion.relationship.id)).toEqual(['waiting']);
  });
});

describe('deriveRelationshipImportFingerprint', () => {
  it('uses Google resourceName before contact details and stays stable', async () => {
    const first = await deriveRelationshipImportFingerprint('google_contacts', {
      googleResourceName: 'people/c123',
      email: 'ada@example.com',
      phone: '+1 555 0000',
    });
    const second = await deriveRelationshipImportFingerprint('google_contacts', {
      googleResourceName: ' PEOPLE/C123 ',
      email: 'other@example.com',
      phone: '+1 555 9999',
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('falls back to normalized email or phone without exposing raw values', async () => {
    const byEmail = await deriveRelationshipImportFingerprint('google_contacts', {
      email: ' ADA@Example.com ',
    });
    const byPhone = await deriveRelationshipImportFingerprint('google_contacts', {
      phone: '+1 (555) 123-4567',
    });

    expect(byEmail).toMatch(/^[a-f0-9]{64}$/);
    expect(byPhone).toMatch(/^[a-f0-9]{64}$/);
    expect(byEmail).not.toContain('ada');
    expect(byPhone).not.toContain('555');
  });
});

describe('relationship import planning', () => {
  it('suggests an existing relationship without overwriting its context during merge', () => {
    const existing = baseRelationship({
      id: 'ada',
      name: 'Ada Lovelace',
      email: 'personal@example.com',
      company: 'Existing company',
      closeness: 5,
    });
    const item = {
      id: 'import-1', userId: 'user-1', source: 'google_contacts' as const, status: 'pending' as const,
      name: 'Ada Lovelace', email: 'work@example.com', company: 'Google company',
      createdAt: '', updatedAt: '',
    };

    expect(findRelationshipMergeSuggestion(item, [existing])).toBe('ada');
    const updates = buildNonDestructiveMerge(existing, item, { tags: [], hooks: [] });
    expect(updates.email).toBe('personal@example.com');
    expect(updates.company).toBe('Existing company');
    expect(updates).not.toHaveProperty('closeness');
    expect(updates).not.toHaveProperty('stage');
  });

  it('follows Google pagination tokens', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ connections: [{ resourceName: 'people/1' }], nextPageToken: 'next' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ connections: [{ resourceName: 'people/2' }] }), { status: 200 }));

    const result = await fetchAllGoogleConnections('token', fetcher as typeof fetch);

    expect(result.connections).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1][0])).toContain('pageToken=next');
  });
});

describe('mergeRemoteWithPending', () => {
  it('keeps pending local changes ahead of stale remote rows', () => {
    const remote: Array<{ id: string; value: string; syncStatus: LocalSyncStatus }> = [{ id: 'one', value: 'remote', syncStatus: 'synced' }];
    const local: Array<{ id: string; value: string; syncStatus: LocalSyncStatus }> = [
      { id: 'one', value: 'local', syncStatus: 'pending_update' },
      { id: 'two', value: 'new', syncStatus: 'pending_insert' },
    ];

    expect(mergeRemoteWithPending(remote, local)).toEqual(local);
  });

  it('keeps pending deletes hidden', () => {
    const remote: Array<{ id: string; syncStatus: LocalSyncStatus }> = [{ id: 'one', syncStatus: 'synced' }];
    const local: Array<{ id: string; syncStatus: LocalSyncStatus }> = [{ id: 'one', syncStatus: 'pending_delete' }];

    expect(mergeRemoteWithPending(remote, local)).toEqual([]);
  });
});
