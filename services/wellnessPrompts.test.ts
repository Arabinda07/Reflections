import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WELLNESS_PROMPTS,
  getCurrentWellnessPrompt,
  getNextWellnessPromptState,
} from './wellnessPrompts';

describe('wellnessPrompts', () => {
  it('provides a shared fallback prompt list', () => {
    expect(DEFAULT_WELLNESS_PROMPTS.length).toBeGreaterThan(3);
  });

  it('keeps the default prompts grounded instead of therapy-coded', () => {
    expect(DEFAULT_WELLNESS_PROMPTS.join(' ')).not.toMatch(
      /felt heavy|quietest moment|little room|keep returning/i,
    );
  });

  it('returns the prompt at the current index', () => {
    expect(getCurrentWellnessPrompt(1, ['one', 'two', 'three'])).toBe('two');
  });

  it('cycles to the next prompt and wraps around', () => {
    expect(getNextWellnessPromptState(0, ['one', 'two', 'three'])).toEqual({
      nextIndex: 1,
      prompt: 'two',
    });

    expect(getNextWellnessPromptState(2, ['one', 'two', 'three'])).toEqual({
      nextIndex: 0,
      prompt: 'one',
    });
  });

  it('falls back to the shared prompt list when no dynamic prompts exist', () => {
    const state = getNextWellnessPromptState(DEFAULT_WELLNESS_PROMPTS.length - 1, []);

    expect(state).toEqual({
      nextIndex: 0,
      prompt: DEFAULT_WELLNESS_PROMPTS[0],
    });
  });
});
