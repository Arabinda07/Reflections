import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { vectorStore } from './vectorStore';
import { EMBEDDING_MODEL } from './embeddingTypes';

const makeVector = (seed: number): Float32Array => {
  const vec = new Float32Array(384);
  for (let i = 0; i < 384; i++) vec[i] = Math.sin(seed + i);
  return vec;
};

const makeRecord = (noteId: string, seed: number) => ({
  noteId,
  vector: makeVector(seed),
  model: EMBEDDING_MODEL,
  dimension: 384,
  updatedAtHash: `hash_${seed}`,
  createdAt: new Date().toISOString(),
});

beforeEach(async () => {
  await vectorStore.clear();
});

describe('vectorStore CRUD', () => {
  it('puts and gets a vector record', async () => {
    const record = makeRecord('note-1', 42);
    await vectorStore.put(record);

    const retrieved = await vectorStore.get('note-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.noteId).toBe('note-1');
    expect(retrieved!.model).toBe(EMBEDDING_MODEL);
    expect(retrieved!.dimension).toBe(384);
    expect(retrieved!.vector).toBeInstanceOf(Float32Array);
    expect(retrieved!.vector.length).toBe(384);
  });

  it('overwrites existing record on put', async () => {
    await vectorStore.put(makeRecord('note-1', 1));
    await vectorStore.put(makeRecord('note-1', 2));

    const retrieved = await vectorStore.get('note-1');
    expect(retrieved!.updatedAtHash).toBe('hash_2');
  });

  it('returns undefined for missing noteId', async () => {
    const result = await vectorStore.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('deletes a vector', async () => {
    await vectorStore.put(makeRecord('note-1', 1));
    await vectorStore.delete('note-1');

    const result = await vectorStore.get('note-1');
    expect(result).toBeUndefined();
  });

  it('getAll returns all stored vectors', async () => {
    await vectorStore.put(makeRecord('note-1', 1));
    await vectorStore.put(makeRecord('note-2', 2));
    await vectorStore.put(makeRecord('note-3', 3));

    const all = await vectorStore.getAll();
    expect(all.length).toBe(3);
    expect(all.map((v) => v.noteId).sort()).toEqual(['note-1', 'note-2', 'note-3']);
  });

  it('count returns the number of stored vectors', async () => {
    expect(await vectorStore.count()).toBe(0);
    await vectorStore.put(makeRecord('note-1', 1));
    await vectorStore.put(makeRecord('note-2', 2));
    expect(await vectorStore.count()).toBe(2);
  });

  it('clear removes all vectors', async () => {
    await vectorStore.put(makeRecord('note-1', 1));
    await vectorStore.put(makeRecord('note-2', 2));
    await vectorStore.clear();
    expect(await vectorStore.count()).toBe(0);
  });
});

describe('vectorStore.cosineSimilarity', () => {
  it('returns 1.0 for identical normalized vectors', () => {
    const vec = new Float32Array([0.6, 0.8, 0]);
    expect(vectorStore.cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.0 for orthogonal vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([0, 1, 0]);
    expect(vectorStore.cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
  });

  it('returns negative for opposite vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([-1, 0, 0]);
    expect(vectorStore.cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
  });

  it('returns 0 for vectors with mismatched dimensions or empty vectors (no NaN)', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0]);
    expect(vectorStore.cosineSimilarity(a, b)).toBe(0);
    expect(vectorStore.cosineSimilarity(new Float32Array(0), a)).toBe(0);
  });
});

describe('vectorStore.findSimilar', () => {
  it('returns top-K results sorted by descending score', async () => {
    // Create vectors with known similarity to a query
    const query = new Float32Array(384);
    query[0] = 1.0; // unit vector along first axis

    const closeVec = new Float32Array(384);
    closeVec[0] = 0.9;
    closeVec[1] = 0.1;

    const farVec = new Float32Array(384);
    farVec[0] = 0.1;
    farVec[1] = 0.9;

    await vectorStore.put({ ...makeRecord('close', 1), vector: closeVec });
    await vectorStore.put({ ...makeRecord('far', 2), vector: farVec });

    const results = await vectorStore.findSimilar(query, 10, 0.0);
    expect(results[0].noteId).toBe('close');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('filters by minScore', async () => {
    const query = new Float32Array(384);
    query[0] = 1.0;

    const lowVec = new Float32Array(384);
    lowVec[1] = 1.0; // orthogonal → score ≈ 0

    await vectorStore.put({ ...makeRecord('low', 1), vector: lowVec });

    const results = await vectorStore.findSimilar(query, 10, 0.5);
    expect(results.length).toBe(0);
  });

  it('safely filters by dimension and model tier to prevent cross-tier NaN contamination', async () => {
    // Stored Tier 1 384d vector
    const t1Vec = new Float32Array(384);
    t1Vec[0] = 1.0;
    await vectorStore.put({
      ...makeRecord('t1_note', 1),
      vector: t1Vec,
      dimension: 384,
      model: 'bge-small-en-v1.5',
    });

    // Stored Tier 2 256d vector
    const t2Vec = new Float32Array(256);
    t2Vec[0] = 1.0;
    await vectorStore.put({
      ...makeRecord('t2_note', 2),
      vector: t2Vec,
      dimension: 256,
      model: 'embeddinggemma-2-270m-mrl256',
    });

    // Query with 256d vector (Tier 2)
    const query256 = new Float32Array(256);
    query256[0] = 1.0;

    const t2Results = await vectorStore.findSimilar(query256, 10, 0.1);
    expect(t2Results.some((r) => r.noteId === 't2_note')).toBe(true);
    expect(t2Results.some((r) => r.noteId === 't1_note')).toBe(false);

    // Query with 384d vector (Tier 1)
    const query384 = new Float32Array(384);
    query384[0] = 1.0;

    const t1Results = await vectorStore.findSimilar(query384, 10, 0.1);
    expect(t1Results.some((r) => r.noteId === 't1_note')).toBe(true);
    expect(t1Results.some((r) => r.noteId === 't2_note')).toBe(false);
  });
});

describe('vectorStore multi-model management', () => {
  it('getModelCounts partitions counts correctly', async () => {
    await vectorStore.clear();

    await vectorStore.put({
      ...makeRecord('bge_1', 1),
      model: 'bge-small-en-v1.5',
      dimension: 384,
    });
    await vectorStore.put({
      ...makeRecord('bge_2', 2),
      model: 'bge-small-en-v1.5',
      dimension: 384,
    });
    await vectorStore.put({
      ...makeRecord('gemma_1', 3),
      model: 'embeddinggemma-2-270m-mrl256',
      dimension: 256,
      vector: new Float32Array(256),
    });

    const counts = await vectorStore.getModelCounts();
    expect(counts['bge-small-en-v1.5']).toBe(2);
    expect(counts['embeddinggemma-2-270m-mrl256']).toBe(1);
  });

  it('deleteByModel prunes only targeted model vectors', async () => {
    await vectorStore.put({
      ...makeRecord('bge_1', 1),
      model: 'bge-small-en-v1.5',
      dimension: 384,
    });
    await vectorStore.put({
      ...makeRecord('bge_2', 2),
      model: 'bge-small-en-v1.5',
      dimension: 384,
    });
    await vectorStore.put({
      ...makeRecord('gemma_1', 3),
      model: 'embeddinggemma-2-270m-mrl256',
      dimension: 256,
      vector: new Float32Array(256),
    });

    const deleted = await vectorStore.deleteByModel('bge-small-en-v1.5');
    expect(deleted).toBe(2);

    const counts = await vectorStore.getModelCounts();
    expect(counts['bge-small-en-v1.5'] || 0).toBe(0);
    expect(counts['embeddinggemma-2-270m-mrl256']).toBe(1);
  });
});

