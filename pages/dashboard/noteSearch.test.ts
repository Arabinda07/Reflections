import { describe, expect, it } from 'vitest';

import type { Note } from '../../types';
import { searchNotes } from './noteSearch';

const note = (over: Partial<Note>): Note => ({
  id: over.id || crypto.randomUUID(),
  title: over.title || '',
  content: over.content || '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  tags: over.tags,
});

const notes: Note[] = [
  note({ id: '1', title: 'Delhi office', content: '<p>Getting to know my new colleagues</p>', tags: ['work', 'trip'] }),
  note({ id: '2', title: 'Sunday walk', content: '<p>Quiet morning by the river</p>', tags: ['calm'] }),
];

describe('searchNotes', () => {
  it('returns all notes for an empty query', () => {
    expect(searchNotes(notes, '   ')).toHaveLength(2);
  });

  it('matches on title, case-insensitively', () => {
    expect(searchNotes(notes, 'DELHI').map((n) => n.id)).toEqual(['1']);
  });

  it('matches on plain-text content, ignoring html', () => {
    expect(searchNotes(notes, 'colleagues').map((n) => n.id)).toEqual(['1']);
  });

  it('matches on tags', () => {
    expect(searchNotes(notes, 'calm').map((n) => n.id)).toEqual(['2']);
  });

  it('returns nothing when there is no match', () => {
    expect(searchNotes(notes, 'zzz')).toHaveLength(0);
  });
});
