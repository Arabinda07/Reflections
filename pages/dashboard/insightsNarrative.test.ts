import { describe, expect, it } from 'vitest';
import {
  buildMonthSummary,
  buildMoodSentence,
  buildTagsSentence,
  buildWeekSummary,
  listToSentence,
} from './insightsNarrative';

describe('insights narrative builders', () => {
  it('joins lists with Oxford-style grammar', () => {
    expect(listToSentence([])).toBe('');
    expect(listToSentence(['work'])).toBe('work');
    expect(listToSentence(['work', 'sleep'])).toBe('work and sleep');
    expect(listToSentence(['work', 'sleep', 'family'])).toBe('work, sleep, and family');
  });

  it('weaves the week count into prose with correct plurals', () => {
    expect(buildWeekSummary({ writingDays: 1, reflectionsSaved: 0, moodCheckins: 0, releaseMoments: 0 })).toBe(
      'You returned 1 day.',
    );
    expect(buildWeekSummary({ writingDays: 4, reflectionsSaved: 6, moodCheckins: 1, releaseMoments: 0 })).toBe(
      'You returned 4 days, saved 6 reflections and checked in 1 time.',
    );
  });

  it('returns null mood/tag sentences when there is no signal', () => {
    expect(buildMoodSentence([])).toBeNull();
    expect(buildTagsSentence([])).toBeNull();
    expect(buildMoodSentence(['calm', 'tender'])).toBe('Your mood leaned calm and tender.');
    expect(buildTagsSentence(['work', 'sleep', 'sister'])).toBe('You kept circling work, sleep, and sister.');
  });

  it('builds the monthly summary and stays gentle when the month is empty', () => {
    expect(buildMonthSummary({ monthNotes: 0, daysCheckedIn: 0, wordsWritten: 0 })).toContain('still open');
    expect(
      buildMonthSummary({ monthNotes: 8, daysCheckedIn: 5, wordsWritten: 1240, tone: 'Calm' }),
    ).toBe("This month you've written 8 reflections across 5 days, about 1,240 words, and your tone has leaned calm.");
  });
});
