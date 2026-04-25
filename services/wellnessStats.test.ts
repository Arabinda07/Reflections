import { describe, expect, it } from 'vitest';
import { buildMonthlyWellnessSummary } from './wellnessStats';
import type { Note } from '../types';

const makeNote = (id: string, createdAt: string, mood: string | undefined, tags: string[], content: string): Note => ({
  id,
  title: id,
  content,
  createdAt,
  updatedAt: createdAt,
  mood,
  tags,
});

describe('buildMonthlyWellnessSummary', () => {
  it('builds a gentle monthly summary from notes in the selected month', () => {
    const summary = buildMonthlyWellnessSummary([
      makeNote('outside', '2026-03-20T12:00:00.000Z', 'happy', ['travel'], '<p>Outside month</p>'),
      makeNote('one', '2026-04-02T12:00:00.000Z', 'calm', ['rest', 'family'], '<p>I wanted rest today.</p>'),
      makeNote('two', '2026-04-04T12:00:00.000Z', 'anxious', ['work', 'rest'], '<p>Work felt loud, but I took a pause.</p>'),
      makeNote('three', '2026-04-04T16:00:00.000Z', 'calm', ['rest'], '<p>The pause helped.</p>'),
    ], new Date('2026-04-13T10:00:00.000Z'));

    expect(summary.monthLabel).toBe('April 2026');
    expect(summary.noteCount).toBe(3);
    expect(summary.writingDays).toBe(2);
    expect(summary.topMood).toBe('calm');
    expect(summary.moodCounts).toEqual({ calm: 2, anxious: 1 });
    expect(summary.topTags).toEqual([
      { tag: 'rest', count: 3 },
      { tag: 'family', count: 1 },
      { tag: 'work', count: 1 },
    ]);
    expect(summary.recurringThemes).toContain('rest');
    expect(summary.summary).toContain('April 2026');
    expect(summary.nextStep.length).toBeGreaterThan(10);
  });

  it('uses human empty-state copy when there are no notes this month', () => {
    const summary = buildMonthlyWellnessSummary([], new Date('2026-04-13T10:00:00.000Z'));
    expect(summary.summary).toBe('April is still open. One honest note is enough to begin.');
    expect(summary.nextStep).toBe('Start with one line about what has been taking up space today.');
  });
});
