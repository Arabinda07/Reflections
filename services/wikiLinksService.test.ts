import { describe, it, expect } from 'vitest';
import { extractWikilinks } from './wikiLinksService';

describe('wikiLinksService', () => {
  describe('extractWikilinks', () => {
    it('extracts single wikilink', () => {
      const result = extractWikilinks('See [[Morning Routine]] for details.');
      expect(result).toEqual(['Morning Routine']);
    });

    it('extracts multiple wikilinks', () => {
      const result = extractWikilinks(
        'Related to [[Sarah]] and [[Sunday Anxiety Spiral]].'
      );
      expect(result).toEqual(['Sarah', 'Sunday Anxiety Spiral']);
    });

    it('returns empty array when no wikilinks', () => {
      const result = extractWikilinks('No links here.');
      expect(result).toEqual([]);
    });

    it('deduplicates repeated wikilinks', () => {
      const result = extractWikilinks('[[Sarah]] said hi. Later [[Sarah]] called.');
      expect(result).toEqual(['Sarah']);
    });

    it('handles nested brackets gracefully', () => {
      const result = extractWikilinks('Some [[Valid Link]] and [not a link].');
      expect(result).toEqual(['Valid Link']);
    });

    it('trims whitespace inside brackets', () => {
      const result = extractWikilinks('See [[ Padded Title ]] here.');
      expect(result).toEqual(['Padded Title']);
    });
  });
});
