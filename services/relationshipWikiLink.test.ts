import { describe, expect, it } from 'vitest';

import { countMentionedNames, findWikiMentions } from './relationshipWikiLink';

const content = [
  'Maya keeps showing up when I write about work. She pushed me to ship.',
  'Quieter week. Nothing much to report.',
  'Had coffee with Maya again; also reconnected with Sam after a long gap.',
].join('\n\n');

describe('findWikiMentions', () => {
  it('returns paragraphs that mention the name (case-insensitive)', () => {
    const hits = findWikiMentions(content, 'maya');
    expect(hits).toHaveLength(2);
    expect(hits[0]).toContain('Maya keeps showing up');
  });

  it('respects word boundaries and ignores blanks', () => {
    expect(findWikiMentions(content, 'May')).toHaveLength(0);
    expect(findWikiMentions(content, '')).toHaveLength(0);
    expect(findWikiMentions('', 'Maya')).toHaveLength(0);
  });
});

describe('countMentionedNames', () => {
  it('counts only names present in the content', () => {
    expect(countMentionedNames(content, ['Maya', 'Sam', 'Priya'])).toBe(2);
    expect(countMentionedNames('', ['Maya'])).toBe(0);
  });
});
