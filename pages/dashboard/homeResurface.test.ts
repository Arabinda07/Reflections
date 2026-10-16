import { describe, expect, it } from 'vitest';
import type { Note } from '../../types';
import { findResurfacedNote } from './homeResurface';

const note = (id: string, createdAt: string) => ({ id, title: id, content: '', createdAt }) as Note;
const now = new Date('2026-10-16T09:00:00');

describe('findResurfacedNote', () => {
  it('prefers the oldest matching lookback', () => {
    const result = findResurfacedNote(
      [note('week', '2026-10-09T20:00:00'), note('year', '2025-10-16T07:00:00')],
      now,
    );
    expect(result?.note.id).toBe('year');
    expect(result?.label).toBe('One year ago today');
  });

  it('falls back to a week ago', () => {
    expect(findResurfacedNote([note('week', '2026-10-09T08:00:00')], now)?.label).toBe('A week ago today');
  });

  it('returns null when no past day matches', () => {
    expect(findResurfacedNote([note('today', '2026-10-16T08:00:00'), note('x', '2026-10-01T08:00:00')], now)).toBeNull();
  });
});
