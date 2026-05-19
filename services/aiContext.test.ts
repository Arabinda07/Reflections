import { describe, expect, it } from 'vitest';
import type { Note } from '../types';
import { buildNotesCorpus, getNoteContentHash, getSignalNotes } from './aiContext';

const note = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'Morning',
  content: '<p>Walked before work and felt clearer.</p>',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  tags: ['clarity'],
  tasks: [],
  attachments: [],
  ...overrides,
});

describe('aiContext', () => {
  it('builds a source-preserving notes corpus without raw HTML', () => {
    const result = buildNotesCorpus([
      note({ id: 'note-2', title: 'Later', createdAt: '2026-04-02T00:00:00.000Z' }),
      note({ id: 'note-1', title: 'Earlier', createdAt: '2026-04-01T00:00:00.000Z' }),
    ]);

    expect(result.text).toMatch(/Earlier[\s\S]*Note id: note-1[\s\S]*Later[\s\S]*Note id: note-2/);
    expect(result.text).not.toContain('<p>');
    expect(result.sourceNoteIds).toEqual(['note-1', 'note-2']);
    expect(result.sourceHash).toMatch(/^ctx-/);
  });

  it('uses deterministic budgets and marks oversized corpora as compacted', () => {
    const longBody = 'detail '.repeat(1000);
    const result = buildNotesCorpus(
      Array.from({ length: 8 }, (_, index) =>
        note({
          id: `note-${index + 1}`,
          title: `Entry ${index + 1}`,
          content: longBody,
          createdAt: `2026-04-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
        }),
      ),
      { maxCorpusChars: 1_800, maxRecentNotes: 2 },
    );

    expect(result.text.length).toBeLessThanOrEqual(1_800);
    expect(result.compacted).toBe(true);
    expect(result.text).toContain('Older compacted note');
    expect(result.text).toContain('Entry 8');
  });

  it('ignores empty notes and hashes unchanged note content consistently', () => {
    const meaningful = note({ id: 'meaningful' });
    const empty = note({ id: 'empty', title: '', content: '', mood: undefined, tags: [], tasks: [] });

    expect(getSignalNotes([empty, meaningful]).map((entry) => entry.id)).toEqual(['meaningful']);
    expect(getNoteContentHash(meaningful)).toBe(getNoteContentHash({ ...meaningful, updatedAt: new Date().toISOString() }));
  });
});
