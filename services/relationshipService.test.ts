import { describe, expect, it, vi } from 'vitest';
import { relationshipService } from './relationshipService';
import { daysUntilBirthday } from './relationshipSuggestions';
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
  tags: [],
  interactions: [],
  hooks: [],
  nextCare: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('daysUntilBirthday', () => {
  it('counts days to the next birthday and ignores invalid dates', () => {
    const now = new Date(2026, 9, 15);
    expect(daysUntilBirthday('10-15', now)).toBe(0);
    expect(daysUntilBirthday('1990-10-18', now)).toBe(3);
    expect(daysUntilBirthday('10-14', now)).toBe(364);
    expect(daysUntilBirthday('13-45', now)).toBe(Number.POSITIVE_INFINITY);
    expect(daysUntilBirthday(undefined, now)).toBe(Number.POSITIVE_INFINITY);
  });
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

  it('surfaces an upcoming birthday first and says so plainly', () => {
    const soon = new Date(Date.now() + 3 * 86_400_000);
    const mmdd = `${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}`;
    const suggestions = relationshipService.buildWeeklySuggestions([
      baseRelationship({ id: 'hooked', hooks: [{ id: 'h', description: 'New job', source: 'manual', createdAt: '2026-01-01', used: false }] }),
      baseRelationship({ id: 'bday', birthday: mmdd }),
    ]);

    expect(suggestions[0].relationship.id).toBe('bday');
    expect(suggestions[0].reason).toBe('Birthday in 3 days.');
  });

  it('quotes what the writer last wrote about the person, matched by alias', () => {
    const suggestions = relationshipService.buildWeeklySuggestions(
      [baseRelationship({ id: 'mom', name: 'Priya', aliases: ['Mom'] })],
      [
        { title: '', content: '<p>Long day. Mom called about the garden.</p>', createdAt: '2026-03-01T00:00:00.000Z' },
        { title: '', content: '<p>Nothing about anyone.</p>', createdAt: '2026-04-01T00:00:00.000Z' },
      ],
    );

    expect(suggestions[0].reason).toBe('You wrote: “Mom called about the garden.”');
    expect(suggestions[0].lastWrittenAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('respects a person\'s rhythm: early contacts rank below due ones', () => {
    const daysAgo = (days: number) => [{
      id: 't', date: new Date(Date.now() - days * 86_400_000).toISOString(), channel: 'phone' as const, notes: '', direction: 'mutual' as const,
    }];
    const suggestions = relationshipService.buildWeeklySuggestions([
      baseRelationship({ id: 'early', cadenceWeeks: 8, interactions: daysAgo(14) }),
      baseRelationship({ id: 'due', cadenceWeeks: 2, interactions: daysAgo(20) }),
    ]);

    expect(suggestions.map((suggestion) => suggestion.relationship.id)).toEqual(['due', 'early']);
    expect(suggestions[0].reason).toBe('It’s been about 3 weeks.');
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
