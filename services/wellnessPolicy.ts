import type { Note, NoteUsage, WellnessAccess } from '../types';

export const FREE_MONTHLY_NOTE_LIMIT = 30;

export function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function getMonthlyNoteUsage(notes: Note[], access: WellnessAccess, now = new Date()): NoteUsage {
  if (access.planTier === 'pro') {
    return {
      usedThisMonth: notes.length,
      monthlyLimit: Infinity,
      remainingThisMonth: Infinity,
      canCreateNote: true,
    };
  }

  const { start, end } = getMonthRange(now);
  const usedThisMonth = notes.filter((note) => {
    const created = new Date(note.createdAt);
    return created >= start && created < end;
  }).length;

  return {
    usedThisMonth,
    monthlyLimit: FREE_MONTHLY_NOTE_LIMIT,
    remainingThisMonth: Math.max(FREE_MONTHLY_NOTE_LIMIT - usedThisMonth, 0),
    canCreateNote: usedThisMonth < FREE_MONTHLY_NOTE_LIMIT,
  };
}
