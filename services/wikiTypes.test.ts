import { describe, expect, it } from 'vitest';
import {
  SANCTUARY_WIKI_PAGES,
  STRUCTURED_WIKI_PAGES,
  SUPPORTING_WIKI_PAGES,
  USER_VISIBLE_WIKI_PAGES,
} from './wikiTypes';

describe('wiki page taxonomy', () => {
  it('defines the five primary Sanctuary pages separately from supporting summaries', () => {
    expect(SANCTUARY_WIKI_PAGES).toEqual([
      'people',
      'patterns',
      'philosophies',
      'eras',
      'decisions',
    ]);

    expect(SUPPORTING_WIKI_PAGES).toEqual([
      'mood_patterns',
      'recurring_themes',
      'self_model',
      'timeline',
    ]);

    expect(USER_VISIBLE_WIKI_PAGES).toEqual([
      ...SANCTUARY_WIKI_PAGES,
      ...SUPPORTING_WIKI_PAGES,
    ]);
    expect(STRUCTURED_WIKI_PAGES).toEqual(USER_VISIBLE_WIKI_PAGES);
    expect(USER_VISIBLE_WIKI_PAGES).not.toContain('theme');
    expect(USER_VISIBLE_WIKI_PAGES).not.toContain('index');
  });
});
