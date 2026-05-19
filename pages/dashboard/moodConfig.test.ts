import { describe, expect, it } from 'vitest';
import { MOOD_FAMILIES, MOOD_OPTIONS, getMoodFamilyForMood } from './moodConfig';

describe('mood personalization config', () => {
  it('offers grouped personal moods without optional neutral choices', () => {
    expect(MOOD_FAMILIES.map((family) => family.id)).toEqual([
      'light',
      'steady',
      'restless',
      'heavy',
      'heated',
      'low',
      'complex',
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

  it('maps legacy and expanded moods to recap-safe families', () => {
    expect(getMoodFamilyForMood('calm')?.id).toBe('steady');
    expect(getMoodFamilyForMood('settled')?.id).toBe('steady');
    expect(getMoodFamilyForMood('happy')?.id).toBe('light');
    expect(getMoodFamilyForMood('unknown')).toBeUndefined();
  });
});
