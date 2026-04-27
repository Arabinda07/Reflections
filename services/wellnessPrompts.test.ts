import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WELLNESS_PROMPTS,
  getCurrentWellnessPrompt,
  getNextWellnessPromptState,
} from './wellnessPrompts';

describe('wellnessPrompts', () => {
  it('provides a shared fallback prompt list', () => {
    expect(DEFAULT_WELLNESS_PROMPTS).toEqual([
      "What happened today?",
      "What is on your mind right now?",
      "What are you trying to figure out?",
      "Write down the thing you keep replaying.",
      "What do you need to handle next?",
      "What changed since yesterday?",
      "What did you not get to say?",
      "What do you want to remember later?",
    ]);
  });

  it('keeps the default prompts grounded instead of therapy-coded', () => {
    const forbidden = [
      'few lines',
      'small detail',
      'day moves on',
      'journey',
      'deeper',
      'unlock',
      'inner world',
      'enough',
      'gentle nudge',
    ];
    const joined = DEFAULT_WELLNESS_PROMPTS.join(' ').toLowerCase();
    
    forbidden.forEach(phrase => {
      expect(joined).not.toContain(phrase);
    });
    
    expect(joined).not.toMatch(
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
