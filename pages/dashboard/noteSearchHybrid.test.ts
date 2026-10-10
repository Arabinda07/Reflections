import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Note } from '../../types';
import { searchNotesHybrid } from './noteSearch';
import { vectorStore } from '../../services/embedding/vectorStore';
import { embeddingService } from '../../services/embedding/embeddingService';

const note = (over: Partial<Note>): Note => ({
  id: over.id || crypto.randomUUID(),
  title: over.title || '',
  content: over.content || '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  tags: over.tags,
});

const notes: Note[] = [
  note({ id: '1', title: 'Delhi office', content: '<p>Getting to know my new colleagues</p>', tags: ['work', 'trip'] }),
  note({ id: '2', title: 'Sunday walk', content: '<p>Quiet morning by the river</p>', tags: ['calm'] }),
  note({ id: '3', title: 'Evening reflection', content: '<p>Mental exhaustion after a long quarter</p>', tags: ['health'] }),
];

describe('searchNotesHybrid', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns all notes with score 1.0 and matchType exact for an empty query', async () => {
    const results = await searchNotesHybrid(notes, '   ');
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.score === 1.0 && r.matchType === 'exact')).toBe(true);
  });

  it('matches keyword when vectorStore is empty', async () => {
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(384));
    vi.spyOn(vectorStore, 'getAll').mockResolvedValue([]);

    const results = await searchNotesHybrid(notes, 'colleagues');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].note.id).toBe('1');
    expect(results[0].matchType).toBe('keyword');
  });

  it('ranks exact title match at top with matchType exact', async () => {
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(384));
    vi.spyOn(vectorStore, 'getAll').mockResolvedValue([]);

    const results = await searchNotesHybrid(notes, 'Delhi office');
    expect(results[0].note.id).toBe('1');
    expect(results[0].matchType).toBe('exact');
  });

  it('surfaces semantic matches when keywords do not overlap', async () => {
    const queryVec = new Float32Array(384);
    queryVec[0] = 1.0;

    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(queryVec);
    vi.spyOn(vectorStore, 'getAll').mockResolvedValue([
      {
        noteId: '3',
        vector: queryVec,
        model: 'bge-small-en-v1.5',
        dimension: 384,
        updatedAtHash: 'hash',
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.spyOn(vectorStore, 'cosineSimilarity').mockImplementation((a, b) => (a === queryVec && b === queryVec ? 0.88 : 0.1));

    // "burnout" is nowhere in note 3's text ("Mental exhaustion after a long quarter")
    const results = await searchNotesHybrid(notes, 'burnout');
    expect(results.length).toBe(1);
    expect(results[0].note.id).toBe('3');
    expect(results[0].matchType).toBe('semantic');
    expect(results[0].similarity).toBeCloseTo(0.88);
  });

  it('blends scores into hybrid matchType when both keyword and semantic match', async () => {
    const queryVec = new Float32Array(384);
    queryVec[0] = 1.0;

    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(queryVec);
    vi.spyOn(vectorStore, 'getAll').mockResolvedValue([
      {
        noteId: '2',
        vector: queryVec,
        model: 'bge-small-en-v1.5',
        dimension: 384,
        updatedAtHash: 'hash',
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.spyOn(vectorStore, 'cosineSimilarity').mockReturnValue(0.75);

    const results = await searchNotesHybrid(notes, 'river');
    expect(results.length).toBe(1);
    expect(results[0].note.id).toBe('2');
    expect(results[0].matchType).toBe('hybrid');
    expect(results[0].similarity).toBeCloseTo(0.75);
  });

  it('respects topK option', async () => {
    const results = await searchNotesHybrid(notes, '', { topK: 2 });
    expect(results).toHaveLength(2);
  });

  it('falls back gracefully to keyword search when embedding fails', async () => {
    vi.spyOn(embeddingService, 'embedQuery').mockRejectedValue(new Error('Worker not available'));

    const results = await searchNotesHybrid(notes, 'Sunday');
    expect(results.length).toBe(1);
    expect(results[0].note.id).toBe('2');
    expect(results[0].matchType).toBe('keyword');
  });

  it('correctly executes hybrid search with Tier 2 MRL 256d vectors without dimension mismatch', async () => {
    const t2Query = new Float32Array(256);
    t2Query[0] = 1.0;
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(t2Query);

    const t2StoreVec = new Float32Array(256);
    t2StoreVec[0] = 0.95;

    vi.spyOn(vectorStore, 'getAll').mockResolvedValue([
      {
        noteId: '1',
        vector: t2StoreVec,
        model: 'embeddinggemma-2-270m-mrl256',
        dimension: 256,
        updatedAtHash: 'h_t2',
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.spyOn(vectorStore, 'cosineSimilarity').mockReturnValue(0.95);

    const results = await searchNotesHybrid(notes, 'deep thought');
    expect(results.length).toBeGreaterThan(0);
    const note1 = results.find((r) => r.note.id === '1');
    expect(note1).toBeDefined();
    expect(note1?.similarity).toBeCloseTo(0.95);
  });
});

