import { describe, expect, it } from 'vitest';
import {
  MOOD_OPTIONS,
  MOOD_PICKER_GROUPS,
  getMoodConfig,
  getMoodGroupForMood,
} from './moodConfig';

describe('mood personalization config', () => {
  it('offers a calmer set of broad picker groups without removing legacy specific moods', () => {
    expect(MOOD_PICKER_GROUPS.map((group) => group.id)).toEqual([
      'light',
      'steady',
      'charged',
      'heavy',
      'mixed',
    ]);

    expect(MOOD_OPTIONS).toEqual([
      'happy',
      'glad',
      'sparked',
      'calm',
      'settled',
      'spacious',
      'anxious',
      'wired',
      'overthinking',
      'sad',
      'lonely',
      'tender',
      'angry',
      'irritated',
      'done',
      'tired',
      'drained',
      'foggy',
      'mixed',
      'raw',
      'numb',
    ]);

    expect(MOOD_OPTIONS).not.toContain('not_sure');
    expect(MOOD_OPTIONS).not.toContain('neutral');
  });

  it('maps broad, legacy, and expanded moods to recap-safe groups', () => {
    expect(getMoodGroupForMood('steady')?.id).toBe('steady');
    expect(getMoodGroupForMood('calm')?.id).toBe('steady');
    expect(getMoodGroupForMood('settled')?.id).toBe('steady');
    expect(getMoodGroupForMood('happy')?.id).toBe('light');
    expect(getMoodGroupForMood('angry')?.id).toBe('charged');
    expect(getMoodGroupForMood('restless')?.id).toBe('charged');
    expect(getMoodGroupForMood('low')?.id).toBe('heavy');
    expect(getMoodGroupForMood('complex')?.id).toBe('mixed');
    expect(getMoodGroupForMood('unknown')).toBeUndefined();
  });

  it('returns display config for broad and specific saved moods', () => {
    expect(getMoodConfig('light')?.label).toBe('Light');
    expect(getMoodConfig('charged')?.label).toBe('Charged');
    expect(getMoodConfig('calm')?.label).toBe('Calm');
    expect(getMoodConfig('unknown')).toBeUndefined();
  });
});
