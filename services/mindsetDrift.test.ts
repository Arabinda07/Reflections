import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeCentroid,
  projectVectorToFamilies,
  computeMindsetDrift,
} from './mindsetDrift';
import { vectorStore } from './embedding/vectorStore';
import type { Note } from '../types';

vi.mock('./embedding/vectorStore', () => ({
  vectorStore: {
    cosineSimilarity: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    findSimilar: vi.fn(),
  },
}));

vi.mock('./embedding/embeddingService', () => ({
  embeddingService: {
    getActiveModel: vi.fn().mockReturnValue('bge-small-en-v1.5'),
    getActiveDimension: vi.fn().mockReturnValue(384),
    embedQuery: vi.fn().mockResolvedValue(new Float32Array(384).fill(0.1)),
  },
}));

describe('mindsetDrift service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeCentroid', () => {
    it('returns null on empty vector list', () => {
      expect(computeCentroid([])).toBeNull();
    });

    it('computes unit-normalized centroid vector', () => {
      const v1 = new Float32Array([1, 0, 0]);
      const v2 = new Float32Array([0, 1, 0]);

      const centroid = computeCentroid([v1, v2]);
      expect(centroid).not.toBeNull();
      expect(centroid?.length).toBe(3);

      // Verify L2 norm is ~1
      let normSq = 0;
      for (const val of centroid!) {
        normSq += val * val;
      }
      expect(Math.abs(Math.sqrt(normSq) - 1.0)).toBeLessThan(1e-5);
    });
  });

  describe('projectVectorToFamilies', () => {
    it('projects a vector to 5 families summing to 100%', () => {
      const vec = new Float32Array(384).fill(0.1);
      const anchors = new Map();
      anchors.set('calm', new Float32Array(384).fill(0.2));
      anchors.set('happy', new Float32Array(384).fill(0.15));

      vi.mocked(vectorStore.cosineSimilarity).mockReturnValue(0.5);

      const proportions = projectVectorToFamilies(vec, anchors);
      expect(proportions).toHaveProperty('light');
      expect(proportions).toHaveProperty('steady');
      expect(proportions).toHaveProperty('charged');
      expect(proportions).toHaveProperty('heavy');
      expect(proportions).toHaveProperty('mixed');

      const sum =
        proportions.light +
        proportions.steady +
        proportions.charged +
        proportions.heavy +
        proportions.mixed;
      expect(sum).toBe(100);
    });
  });

  describe('computeMindsetDrift', () => {
    it('returns insufficient data report when notes count is less than 2', async () => {
      const notes: Note[] = [
        {
          id: 'n1',
          title: 'Single note',
          content: 'One reflection only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const report = await computeMindsetDrift(notes);
      expect(report.hasSufficientData).toBe(false);
      expect(report.trajectorySummary).toContain('will begin forming here');
    });

    it('computes drift report and trajectory summary when sufficient notes exist', async () => {
      const now = Date.now();
      const notes: Note[] = [
        {
          id: 'n1',
          title: 'Recent 1',
          content: 'Calm morning',
          createdAt: new Date(now - 2 * 86400000).toISOString(),
          updatedAt: new Date(now - 2 * 86400000).toISOString(),
        },
        {
          id: 'n2',
          title: 'Recent 2',
          content: 'Clear thinking',
          createdAt: new Date(now - 5 * 86400000).toISOString(),
          updatedAt: new Date(now - 5 * 86400000).toISOString(),
        },
        {
          id: 'n3',
          title: 'Old 1',
          content: 'Past stress',
          createdAt: new Date(now - 40 * 86400000).toISOString(),
          updatedAt: new Date(now - 40 * 86400000).toISOString(),
        },
        {
          id: 'n4',
          title: 'Old 2',
          content: 'Past worries',
          createdAt: new Date(now - 45 * 86400000).toISOString(),
          updatedAt: new Date(now - 45 * 86400000).toISOString(),
        },
      ];

      vi.mocked(vectorStore.get).mockImplementation(async (id: string) => {
        const val = id.startsWith('n1') || id.startsWith('n2') ? 0.2 : 0.05;
        return {
          noteId: id,
          vector: new Float32Array(384).fill(val),
          model: 'bge-small-en-v1.5',
          dimension: 384,
          updatedAtHash: 'hash',
          createdAt: new Date().toISOString(),
        };
      });

      vi.mocked(vectorStore.cosineSimilarity).mockReturnValue(0.85);

      const report = await computeMindsetDrift(notes);
      expect(report.hasSufficientData).toBe(true);
      expect(report.currentWindowNoteCount).toBe(2);
      expect(report.previousWindowNoteCount).toBe(2);
      expect(report.driftDistance).toBeGreaterThanOrEqual(0);
      expect(report.trajectorySummary).toBeTruthy();
    });
  });
});
