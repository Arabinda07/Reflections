import { describe, expect, it } from 'vitest';
import type { Note } from '../../types';
import { buildNoteExportText, getNoteExportFilename } from './noteExport';

const note: Note = {
  id: 'note-1',
  title: 'A quiet Tuesday / draft',
  content: '<p>Hello <strong>there</strong>.</p><script>alert("no")</script>',
  createdAt: '2026-04-20T10:00:00.000Z',
  updatedAt: '2026-04-21T11:30:00.000Z',
  mood: 'calm',
  tags: ['work', 'rest'],
  tasks: [
    { id: 'task-1', text: 'Reply to Mira', completed: false },
    { id: 'task-2', text: 'Pack notes', completed: true },
  ],
};

describe('noteExport', () => {
  it('builds a calm plain-text export with note metadata and tasks', () => {
    expect(buildNoteExportText(note, 'txt')).toContain('A quiet Tuesday / draft');
    expect(buildNoteExportText(note, 'txt')).toContain('Mood: calm');
    expect(buildNoteExportText(note, 'txt')).toContain('Tags: work, rest');
    expect(buildNoteExportText(note, 'txt')).toContain('[ ] Reply to Mira');
    expect(buildNoteExportText(note, 'txt')).toContain('[x] Pack notes');
    expect(buildNoteExportText(note, 'txt')).toContain('Hello there.');
    expect(buildNoteExportText(note, 'txt')).not.toContain('<script>');
  });

  it('uses a safe filename for downloaded note exports', () => {
    expect(getNoteExportFilename(note, 'md')).toBe('a-quiet-tuesday-draft-2026-04-21.md');
  });
});
