/**
 * IndexedDB vector store for note embeddings.
 *
 * Uses the native IndexedDB API (no Dexie) to keep the vector store
 * independently versioned and evolvable for the Phase 4 EmbeddingGemma 2
 * upgrade without disturbing the existing note/relationship databases.
 *
 * Database: reflections_ai_vectors
 * Store:    note_vectors (keyed by noteId)
 */
import { type StoredNoteVector, type SupportedEmbeddingModel, EMBEDDING_MODEL } from './embeddingTypes';

const DB_NAME = 'reflections_ai_vectors';
const DB_VERSION = 1;
const STORE_NAME = 'note_vectors';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'noteId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/**
 * Serialize a StoredNoteVector for IndexedDB storage.
 * IndexedDB structured clone can be unreliable with typed arrays across
 * browsers, so we convert to a plain number array for portability.
 */
const serializeVector = (record: StoredNoteVector): Record<string, unknown> => ({
  ...record,
  vector: Array.from(record.vector),
});

/**
 * Deserialize a stored record back into a StoredNoteVector with Float32Array.
 */
const deserializeVector = (raw: Record<string, unknown>): StoredNoteVector => {
  const vector = new Float32Array(raw.vector as number[]);
  return {
    noteId: raw.noteId as string,
    vector,
    model: (raw.model as SupportedEmbeddingModel) || EMBEDDING_MODEL,
    dimension: (raw.dimension as number) || vector.length,
    updatedAtHash: raw.updatedAtHash as string,
    createdAt: raw.createdAt as string,
  };
};

export const vectorStore = {
  /** Store or update a note's embedding vector. */
  async put(record: StoredNoteVector): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(serializeVector(record));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  /** Retrieve a single note's vector by noteId. */
  async get(noteId: string): Promise<StoredNoteVector | undefined> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(noteId);
      req.onsuccess = () => {
        db.close();
        resolve(req.result ? deserializeVector(req.result) : undefined);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  },

  /** Retrieve all stored vectors. */
  async getAll(): Promise<StoredNoteVector[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as Record<string, unknown>[]).map(deserializeVector));
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  },

  /** Delete a specific note's vector. */
  async delete(noteId: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(noteId);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  /** Wipe the entire vector store (useful for model upgrades). */
  async clear(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  /** Count the total number of stored vectors. */
  async count(): Promise<number> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  },

  /**
   * Compute cosine similarity between two vectors.
   * Both vectors must be L2-normalized.
   * Returns 0 if dimensions mismatch, vectors are empty, or computation results in NaN.
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (!a || !b || a.length !== b.length || a.length === 0) {
      return 0;
    }
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return Number.isNaN(dot) ? 0 : dot;
  },

  /**
   * Find the top-K most similar vectors to a query vector.
   * Returns results sorted by descending cosine similarity.
   * Supports filtering by dimension and specific model tier.
   */
  async findSimilar(
    queryVector: Float32Array,
    topK: number = 10,
    minScore: number = 0.3,
    options?: { model?: SupportedEmbeddingModel; dimension?: number },
  ): Promise<Array<{ noteId: string; score: number }>> {
    const all = await vectorStore.getAll();
    const targetDim = options?.dimension ?? queryVector.length;

    const scored = all
      .filter((record) => {
        if (record.dimension !== targetDim) return false;
        if (options?.model && record.model !== options.model) return false;
        return true;
      })
      .map((record) => ({
        noteId: record.noteId,
        score: vectorStore.cosineSimilarity(queryVector, record.vector),
      }))
      .filter((r) => r.score >= minScore && !Number.isNaN(r.score));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  },

  /**
   * Count vectors partitioned by model type.
   */
  async getModelCounts(): Promise<Record<string, number>> {
    const all = await vectorStore.getAll();
    const counts: Record<string, number> = {};
    for (const record of all) {
      counts[record.model] = (counts[record.model] || 0) + 1;
    }
    return counts;
  },

  /**
   * Delete vectors generated by a specific model.
   * Useful when pruning old model representations after upgrading.
   */
  async deleteByModel(model: SupportedEmbeddingModel): Promise<number> {
    const all = await vectorStore.getAll();
    const toDelete = all.filter((r) => r.model === model);
    if (toDelete.length === 0) return 0;

    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const item of toDelete) {
        store.delete(item.noteId);
      }
      tx.oncomplete = () => { db.close(); resolve(toDelete.length); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },
};

