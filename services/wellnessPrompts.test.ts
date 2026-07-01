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
      "What made today different?",
      "What stood out today?",
      "What surprised you today?",
      "What do you want to remember from today?",
      "What's been on your mind today?",
      "What can't you stop thinking about?",
      "What's been distracting you today?",
      "What's worrying you today?",
      "What's making you smile today?",
      "Who did you talk to today?",
      "What conversation stayed with you?",
      "Did someone say something you keep thinking about?",
      "Who were you thinking about today?",
      "Who made today easier?",
      "Did someone surprise you today?",
      "What happened at work today?",
      "What took most of your time today?",
      "What felt harder than you expected today?",
      "Is there a decision on your mind?",
      "What are you trying to decide?",
      "What are you looking forward to?",
      "What's coming up that's on your mind?",
      "What do you want to remember for tomorrow?",
      "Is there something you wish you'd said today?",
      "Is there something you wish had gone differently?",
      "What's still on your mind tonight?",
      "What made you laugh today?",
      "What annoyed you today?",
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
