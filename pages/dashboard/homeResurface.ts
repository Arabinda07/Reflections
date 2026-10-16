import type { Note } from '../../types';

export interface ResurfacedNote {
  note: Note;
  label: string;
}

// Earliest match wins: a year back reads as more meaningful than last week.
const LOOKBACKS: Array<{ label: string; shift: (d: Date) => void }> = [
  { label: 'One year ago today', shift: (d) => d.setFullYear(d.getFullYear() - 1) },
  { label: 'Six months ago today', shift: (d) => d.setMonth(d.getMonth() - 6) },
  { label: 'A month ago today', shift: (d) => d.setMonth(d.getMonth() - 1) },
  { label: 'A week ago today', shift: (d) => d.setDate(d.getDate() - 7) },
];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** A past note written on the same calendar day a week, month, half-year or year back. */
export const findResurfacedNote = (notes: Note[], now: Date): ResurfacedNote | null => {
  const byDay = new Map<string, Note>();
  for (const note of notes) {
    const key = dayKey(new Date(note.createdAt));
    if (!byDay.has(key)) byDay.set(key, note);
  }
  for (const { label, shift } of LOOKBACKS) {
    const target = new Date(now);
    shift(target);
    const note = byDay.get(dayKey(target));
    if (note) return { note, label };
  }
  return null;
};
