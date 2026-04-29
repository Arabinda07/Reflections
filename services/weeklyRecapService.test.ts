import { describe, expect, it } from 'vitest';
import type { MoodCheckin, Note, RitualEvent } from '../types';
import { buildWeeklyRecap, getWritingRhythm } from './weeklyRecapService';

const note = (id: string, createdAt: string, mood: string | undefined, tags: string[]): Note => ({
  id,
  title: id,
  content: `<p>${id}</p>`,
  createdAt,
  updatedAt: createdAt,
  mood,
  tags,
});

const checkin = (id: string, createdAt: string, mood: string): MoodCheckin => ({
  id,
  userId: 'user-1',
  mood,
  createdAt,
});

const event = (id: string, createdAt: string, eventType: RitualEvent['eventType']): RitualEvent => ({
  id,
  userId: 'user-1',
  eventType,
  createdAt,
});

describe('buildWeeklyRecap', () => {
  it('builds a deterministic weekly recap from notes, standalone moods, tags, and ritual events', () => {
    const recap = buildWeeklyRecap({
      notes: [
        note('outside-week', '2026-04-19T12:00:00.000Z', 'sad', ['old']),
        note('one', '2026-04-27T12:00:00.000Z', 'calm', ['rest', 'family']),
        note('two', '2026-04-28T12:00:00.000Z', 'calm', ['rest']),
      ],
      moodCheckins: [
        checkin('one', '2026-04-28T15:00:00.000Z', 'steady'),
        checkin('two', '2026-04-29T15:00:00.000Z', 'steady'),
        checkin('three', '2026-04-29T16:00:00.000Z', 'heavy'),
      ],
      ritualEvents: [
        event('release', '2026-04-30T12:00:00.000Z', 'release_completed'),
        event('scheduled', '2026-05-01T12:00:00.000Z', 'letter_scheduled'),
        event('opened', '2026-05-02T12:00:00.000Z', 'letter_opened'),
      ],
      now: new Date('2026-04-29T12:00:00'),
    });

    expect(recap.weekStart).toBe('2026-04-27');
    expect(recap.weekEnd).toBe('2026-05-03');
    expect(recap.reflectionsSaved).toBe(2);
    expect(recap.moodCheckins).toBe(3);
    expect(recap.releaseMoments).toBe(1);
    expect(recap.lettersScheduled).toBe(1);
    expect(recap.lettersOpened).toBe(1);
    expect(recap.commonMood).toBe('steady');
    expect(recap.recurringTags).toEqual([{ tag: 'rest', count: 2 }, { tag: 'family', count: 1 }]);
    expect(recap.writingDays).toBe(6);
    expect(recap.nextQuestion).toBe('What would feel kind to return to next?');
  });

  it('falls back to note moods only when standalone mood check-ins are absent', () => {
    const recap = buildWeeklyRecap({
      notes: [
        note('one', '2026-04-27T12:00:00.000Z', 'calm', []),
        note('two', '2026-04-28T12:00:00.000Z', 'calm', []),
      ],
      moodCheckins: [],
      ritualEvents: [],
      now: new Date('2026-04-29T12:00:00'),
    });

    expect(recap.commonMood).toBe('calm');
  });
});

describe('getWritingRhythm', () => {
  it('counts notes, check-ins, release moments, and letter events without streak pressure copy', () => {
    const rhythm = getWritingRhythm({
      notes: [note('one', '2026-04-29T12:00:00.000Z', undefined, [])],
      moodCheckins: [checkin('one', '2026-04-28T12:00:00.000Z', 'steady')],
      ritualEvents: [event('release', '2026-04-27T12:00:00.000Z', 'release_completed')],
      now: new Date('2026-04-29T12:00:00'),
    });

    expect(rhythm.daysThisWeek).toBe(3);
    expect(rhythm.showedUpToday).toBe(true);
    expect(rhythm.message).toBe('You showed up today.');
    expect(rhythm.message.toLowerCase()).not.toMatch(/streak|lost|failed|xp|leaderboard/);
  });
});
