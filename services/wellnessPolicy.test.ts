import { describe, expect, it } from 'vitest';
import {
  FREE_AI_REFLECTION_SAMPLES,
  FREE_MONTHLY_NOTE_LIMIT,
  getAiReflectionGate,
  getMonthlyNoteUsage,
} from './wellnessPolicy';
import type { Note, WellnessAccess } from '../types';

const note = (id: string, createdAt: string): Note => ({
  id,
  title: id,
  content: '<p>Today felt heavy but I took a walk.</p>',
  createdAt,
  updatedAt: createdAt,
});

describe('wellnessPolicy', () => {
  it('uses a 30 note monthly free limit and one free AI sample', () => {
    expect(FREE_MONTHLY_NOTE_LIMIT).toBe(30);
    expect(FREE_AI_REFLECTION_SAMPLES).toBe(1);
  });

  it('counts only notes from the current month', () => {
    const usage = getMonthlyNoteUsage([
      note('march', '2026-03-31T23:00:00.000Z'),
      note('april-one', '2026-04-01T00:00:00.000Z'),
      note('april-two', '2026-04-13T08:00:00.000Z'),
      note('may', '2026-05-01T00:00:00.000Z'),
    ], new Date('2026-04-13T10:30:00.000Z'));

    expect(usage).toEqual({
      usedThisMonth: 2,
      monthlyLimit: 30,
      remainingThisMonth: 28,
      canCreateNote: true,
    });
  });

  it('gates AI reflection for free users before enough notes and after the sample is used', () => {
    const access: WellnessAccess = {
      userId: 'user-1',
      planTier: 'free',
      freeAiReflectionsUsed: 1,
    };

    expect(getAiReflectionGate(access, 2, true)).toEqual({
      canReflect: false,
      reason: 'needs_more_notes',
      remainingFreeSamples: 0,
      requiresUpgrade: false,
    });

    expect(getAiReflectionGate(access, 3, true)).toEqual({
      canReflect: false,
      reason: 'sample_used',
      remainingFreeSamples: 0,
      requiresUpgrade: true,
    });
  });

  it('lets free users use one sample after a few notes', () => {
    const access: WellnessAccess = {
      userId: 'user-1',
      planTier: 'free',
      freeAiReflectionsUsed: 0,
    };

    expect(getAiReflectionGate(access, 3, true)).toEqual({
      canReflect: true,
      remainingFreeSamples: 1,
      requiresUpgrade: false,
    });
  });
});
