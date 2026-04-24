import { describe, it, expect } from 'vitest';
import { type WikiPageType, STRUCTURED_WIKI_PAGES, SANCTUARY_CATEGORIES } from './wikiTypes';

describe('wikiTypes', () => {
  it('includes all 5 sanctuary categories', () => {
    expect(SANCTUARY_CATEGORIES).toContain('people');
    expect(SANCTUARY_CATEGORIES).toContain('patterns');
    expect(SANCTUARY_CATEGORIES).toContain('philosophies');
    expect(SANCTUARY_CATEGORIES).toContain('eras');
    expect(SANCTUARY_CATEGORIES).toContain('decisions');
    expect(SANCTUARY_CATEGORIES).toHaveLength(5);
  });

  it('does not include timeline in structured pages', () => {
    expect(STRUCTURED_WIKI_PAGES).not.toContain('timeline');
  });

  it('includes eras in structured pages as replacement for timeline', () => {
    expect(STRUCTURED_WIKI_PAGES).toContain('eras');
  });

  it('keeps system summary pages', () => {
    expect(STRUCTURED_WIKI_PAGES).toContain('mood_patterns');
    expect(STRUCTURED_WIKI_PAGES).toContain('recurring_themes');
    expect(STRUCTURED_WIKI_PAGES).toContain('self_model');
  });
});
