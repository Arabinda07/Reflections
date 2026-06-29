import type { Note } from '../../types';
import { extractNotePlainText } from './noteContent';

/**
 * In-memory note search. Notes arrive already decrypted from `noteService.getAll()`,
 * so we match the query (case-insensitive) against title, plain-text content, and tags.
 * An empty query returns the list unchanged (callers show it as "recent").
 */
export const searchNotes = (notes: Note[], query: string): Note[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return notes;

  return notes.filter((note) => {
    const haystack = [
      note.title,
      extractNotePlainText(note.content || ''),
      ...(note.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
};
