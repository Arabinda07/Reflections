import { describe, it, expect } from 'vitest';
import { formatDocumentText, formatQueryText } from './asymmetricPrefixes';

describe('formatDocumentText', () => {
  it('prefixes with title and separator when title is present', () => {
    expect(formatDocumentText('My Day', 'Felt great today'))
      .toBe('Document: My Day | Felt great today');
  });

  it('prefixes without separator when title is empty', () => {
    expect(formatDocumentText('', 'Felt great today'))
      .toBe('Document: Felt great today');
  });

  it('handles whitespace-only title as empty', () => {
    expect(formatDocumentText('   ', 'Content here'))
      .toBe('Document: Content here');
  });

  it('returns empty string when both title and content are empty', () => {
    expect(formatDocumentText('', '')).toBe('');
  });

  it('handles title-only with empty content', () => {
    expect(formatDocumentText('Title Only', ''))
      .toBe('Document: Title Only | ');
  });
});

describe('formatQueryText', () => {
  it('prefixes with SearchQuery:', () => {
    expect(formatQueryText('burnout at work'))
      .toBe('SearchQuery: burnout at work');
  });

  it('trims whitespace', () => {
    expect(formatQueryText('  tired  '))
      .toBe('SearchQuery: tired');
  });

  it('returns empty string for empty query', () => {
    expect(formatQueryText('')).toBe('');
  });
});
