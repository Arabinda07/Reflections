import type { Note } from '../../types';
import { extractNotePlainText } from './noteContent';

export type NoteExportFormat = 'txt' | 'md';

const formatExportDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getExportDateStamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'undated';

  return date.toISOString().slice(0, 10);
};

const slugify = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'untitled-reflection';
};

const getNoteTitle = (note: Note) => note.title.trim() || 'Untitled reflection';

const getTaskLines = (note: Note) =>
  (note.tasks || [])
    .filter((task) => task.text.trim())
    .map((task) => `${task.completed ? '[x]' : '[ ]'} ${task.text.trim()}`);

const getExportBody = (html: string) =>
  (extractNotePlainText(html) || 'No written text.').replace(/\s+([.,!?;:])/g, '$1');

const getMetadataLines = (note: Note) => {
  const lines = [
    `Created: ${formatExportDate(note.createdAt)}`,
    `Updated: ${formatExportDate(note.updatedAt)}`,
  ];

  if (note.mood) lines.push(`Mood: ${note.mood}`);
  if (note.tags?.length) lines.push(`Tags: ${note.tags.join(', ')}`);

  return lines;
};

export const getNoteExportFilename = (note: Note, format: NoteExportFormat) =>
  `${slugify(getNoteTitle(note))}-${getExportDateStamp(note.updatedAt)}.${format}`;

export const buildNoteExportText = (note: Note, format: NoteExportFormat) => {
  const title = getNoteTitle(note);
  const body = getExportBody(note.content);
  const taskLines = getTaskLines(note);

  if (format === 'md') {
    return [
      `# ${title}`,
      '',
      ...getMetadataLines(note).map((line) => `- ${line}`),
      '',
      body,
      ...(taskLines.length ? ['', '## Tasks', '', ...taskLines.map((line) => `- ${line}`)] : []),
      '',
    ].join('\n');
  }

  return [
    title,
    '',
    ...getMetadataLines(note),
    '',
    body,
    ...(taskLines.length ? ['', 'Tasks:', ...taskLines] : []),
    '',
  ].join('\n');
};

export const downloadNoteExport = (note: Note, format: NoteExportFormat) => {
  if (typeof document === 'undefined') return;

  const blob = new Blob([buildNoteExportText(note, format)], {
    type: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = getNoteExportFilename(note, format);
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
