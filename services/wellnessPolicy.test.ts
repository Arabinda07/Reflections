import { describe, expect, it } from 'vitest';
import { FREE_MONTHLY_NOTE_LIMIT, getMonthlyNoteUsage } from './wellnessPolicy';
import type { Note, WellnessAccess } from '../types';

const note = (id: string, createdAt: string): Note => ({
  id,
  title: id,
  content: '<p>Today felt heavy but I took a walk.</p>',
  createdAt,
  updatedAt: createdAt,
});

describe('wellnessPolicy', () => {
  it('uses a 30 note monthly free limit', () => {
    expect(FREE_MONTHLY_NOTE_LIMIT).toBe(30);
  });

  it('counts only notes from the current month', () => {
    const access: WellnessAccess = { userId: '1', planTier: 'free', freeAiReflectionsUsed: 0, freeWikiInsightsUsed: 0, smartModeEnabled: false };
    const usage = getMonthlyNoteUsage([
      note('march', '2026-03-31T23:00:00.000Z'),
      note('april-one', '2026-04-01T00:00:00.000Z'),
      note('april-two', '2026-04-13T08:00:00.000Z'),
      note('may', '2026-05-01T00:00:00.000Z'),
    ], access, new Date('2026-04-13T10:30:00.000Z'));

    expect(usage).toEqual({
      usedThisMonth: 2,
      monthlyLimit: 30,
      remainingThisMonth: 28,
      canCreateNote: true,
    });
  });
});
