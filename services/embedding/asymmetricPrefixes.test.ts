import { describe, it, expect } from 'vitest';
import { formatDocumentText, formatQueryText } from './asymmetricPrefixes';

describe('formatDocumentText', () => {
  it('bge: joins title and content without a prefix', () => {
    expect(formatDocumentText('My Day', 'Felt great today')).toBe('My Day\nFelt great today');
  });

  it('bge: content only when title is blank', () => {
    expect(formatDocumentText('   ', 'Content here')).toBe('Content here');
  });

  it('gemma: uses title/text format with "none" for a missing title', () => {
    expect(formatDocumentText('My Day', 'Felt great', 'tier2-gemma')).toBe('title: My Day | text: Felt great');
    expect(formatDocumentText('', 'Felt great', 'tier2-gemma')).toBe('title: none | text: Felt great');
  });

  it('returns empty string when both title and content are empty', () => {
    expect(formatDocumentText('', '')).toBe('');
    expect(formatDocumentText('', '', 'tier2-gemma')).toBe('');
  });
});

describe('formatQueryText', () => {
  it('bge: prepends the retrieval instruction', () => {
    expect(formatQueryText('  burnout at work ')).toBe(
      'Represent this sentence for searching relevant passages: burnout at work',
    );
  });

  it('gemma: uses the search-result task prompt', () => {
    expect(formatQueryText('tired', 'tier2-gemma')).toBe('task: search result | query: tired');
  });

  it('returns empty string for empty query', () => {
    expect(formatQueryText('')).toBe('');
  });
});
