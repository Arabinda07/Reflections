import { describe, it, expect } from 'vitest';
import { computeContentHash } from './absorbLogService';

describe('absorbLogService', () => {
  describe('computeContentHash', () => {
    it('produces a consistent SHA-256 hex string for the same input', async () => {
      const hash1 = await computeContentHash('hello world');
      const hash2 = await computeContentHash('hello world');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await computeContentHash('hello world');
      const hash2 = await computeContentHash('hello world!');
      expect(hash1).not.toBe(hash2);
    });

    it('handles empty string', async () => {
      const hash = await computeContentHash('');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
