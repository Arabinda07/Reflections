import type { Note } from '../types';
import { stripHtml } from './collectionUtils';

export interface NotesCorpusOptions {
  maxCorpusChars?: number;
  maxRecentNotes?: number;
  maxRecentNoteChars?: number;
  maxOlderNoteChars?: number;
}

export interface NotesCorpus {
  text: string;
  sourceHash: string;
  sourceNoteIds: string[];
  noteCount: number;
  compacted: boolean;
}

const DEFAULT_MAX_CORPUS_CHARS = 40_000;
const DEFAULT_RECENT_NOTES = 24;
const DEFAULT_RECENT_NOTE_CHARS = 1_600;
const DEFAULT_OLDER_NOTE_CHARS = 420;
const COMPACTION_MARKER = '[Context compacted to fit the action budget.]';

export const stableNoteFingerprint = (note: Note) =>
  JSON.stringify({
    title: note.title || '',
    content: note.content || '',
    mood: note.mood || '',
    tags: [...(note.tags || [])].sort(),
    tasks: (note.tasks || []).map((task) => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.dueDate || '',
    })),
  });

const hashText = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return `ctx-${(hash >>> 0).toString(16)}`;
};

const truncate = (value: string, limit: number) => {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(limit - 18, 0)).trim()}... [compacted]`;
};

export const getNoteContentHash = (note: Note) => hashText(stableNoteFingerprint(note));

export const noteHasSignal = (note: Note) =>
  Boolean(
    stripHtml(note.title) ||
      stripHtml(note.content) ||
      note.mood ||
      note.tags?.length ||
      note.tasks?.length,
  );

export const sortNotesChronologically = (notes: Note[]) =>
  [...notes].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

export const getSignalNotes = (notes: Note[]) => sortNotesChronologically(notes.filter(noteHasSignal));

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const buildNoteEntry = (note: Note, bodyLimit: number, compacted: boolean) => {
  const plainTitle = stripHtml(note.title) || 'Untitled reflection';
  const plainContent = truncate(stripHtml(note.content) || 'No written body yet.', bodyLimit);
  const metadata = [
    `Note id: ${note.id}`,
    `Date: ${formatDate(note.createdAt)}`,
    note.mood ? `Mood: ${note.mood}` : null,
    note.tags?.length ? `Tags: ${note.tags.join(', ')}` : null,
    note.tasks?.length
      ? `Tasks: ${note.tasks
          .map((task) => `${task.completed ? '[done]' : '[open]'} ${task.text}`)
          .join('; ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const heading = compacted ? `## Older compacted note: ${plainTitle}` : `## ${plainTitle}`;
  return `${heading}\n${metadata}\n\nEntry:\n${plainContent}`;
};

const fitToBudget = (text: string, maxCorpusChars: number) => {
  if (text.length <= maxCorpusChars) {
    return { text, compacted: false };
  }

  const marker = `\n\n${COMPACTION_MARKER}\n\n`;
  const headLength = Math.floor((maxCorpusChars - marker.length) * 0.45);
  const tailLength = maxCorpusChars - marker.length - headLength;
  return {
    text: `${text.slice(0, headLength).trim()}${marker}${text.slice(-tailLength).trim()}`,
    compacted: true,
  };
};

export const buildNotesCorpus = (
  notes: Note[],
  options: NotesCorpusOptions = {},
): NotesCorpus => {
  const signalNotes = getSignalNotes(notes);
  const maxCorpusChars = options.maxCorpusChars ?? DEFAULT_MAX_CORPUS_CHARS;
  const maxRecentNotes = options.maxRecentNotes ?? DEFAULT_RECENT_NOTES;
  const perNoteBudget = Math.max(120, Math.floor(maxCorpusChars / Math.max(signalNotes.length, 1)) - 120);
  const recentNoteChars = Math.min(options.maxRecentNoteChars ?? DEFAULT_RECENT_NOTE_CHARS, perNoteBudget);
  const olderNoteChars = Math.min(options.maxOlderNoteChars ?? DEFAULT_OLDER_NOTE_CHARS, Math.max(80, Math.floor(perNoteBudget * 0.6)));
  const recentStart = Math.max(signalNotes.length - maxRecentNotes, 0);

  const entries = signalNotes.map((note, index) =>
    buildNoteEntry(note, index < recentStart ? olderNoteChars : recentNoteChars, index < recentStart),
  );
  const joined = entries.join('\n\n---\n\n');
  const budgeted = fitToBudget(joined, maxCorpusChars);

  return {
    text: budgeted.text,
    sourceHash: hashText(signalNotes.map((note) => `${note.id}:${getNoteContentHash(note)}`).join('|')),
    sourceNoteIds: signalNotes.map((note) => note.id),
    noteCount: signalNotes.length,
    compacted: budgeted.compacted || signalNotes.length > maxRecentNotes,
  };
};
