/**
 * Embedding Service — orchestrates the Web Worker and IndexedDB vector store.
 *
 * This is the public API surface for all embedding operations in the app.
 * It manages worker lifecycle, request/response correlation, and background
 * vector sync during browser idle time.
 */
import type { Note } from '../../types';
import type {
  EmbeddingWorkerResponse,
  EmbeddingStatus,
  StoredNoteVector,
  EmbeddingModelTier,
  SupportedEmbeddingModel,
} from './embeddingTypes';
import { formatDocumentText, formatQueryText } from './asymmetricPrefixes';
import { vectorStore } from './vectorStore';
import { tierManager } from './tierManager';
import { nativeLiteRTEmbedding } from './mobile/nativeLiteRTEmbedding';
import { multimodalEmbedder } from './multimodal/multimodalEmbedder';

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

let worker: Worker | null = null;
let status: EmbeddingStatus = { state: 'idle' };
const pending = new Map<string, PendingRequest>();

const nextId = (() => {
  let counter = 0;
  return () => `emb_${++counter}_${Date.now()}`;
})();

const sendRequest = <T>(message: Record<string, unknown>): Promise<T> => {
  if (!worker) return Promise.reject(new Error('Embedding worker not initialized'));

  const id = nextId();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    worker!.postMessage({ ...message, id });
  });
};

const handleWorkerMessage = (event: MessageEvent<EmbeddingWorkerResponse>) => {
  const { id, type } = event.data;

  // Progress events update status but don't resolve a pending request
  if (type === 'INIT_PROGRESS') {
    status = { state: 'loading', progress: event.data.progress, file: event.data.file };
    return;
  }

  const req = pending.get(id);
  if (!req) return;
  pending.delete(id);

  if (type === 'ERROR') {
    status = { state: 'error', message: event.data.error };
    req.reject(new Error(event.data.error));
    return;
  }

  // Resolve with the response payload
  if (type === 'INIT_DONE') {
    status = { state: 'ready' };
  }
  req.resolve(event.data);
};

/**
 * Generate a content hash for staleness detection.
 * Uses a fast string hash — cryptographic strength isn't needed here.
 */
const contentHash = (note: Note): string => {
  const input = `${note.updatedAt}|${note.title}|${note.content}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
};

let activeTier: EmbeddingModelTier = tierManager.getPersistedTier();

export const embeddingService = {
  /**
   * Initialize the embedding worker for the active tier.
   * Safe to call multiple times — subsequent calls are no-ops if already ready for this tier.
   */
  async initialize(targetTier?: EmbeddingModelTier): Promise<void> {
    const tierToLoad = targetTier || activeTier;
    if (worker && activeTier === tierToLoad && (status.state === 'ready' || status.state === 'loading')) {
      return;
    }

    if (worker) {
      worker.terminate();
      worker = null;
      pending.clear();
    }

    activeTier = tierToLoad;
    tierManager.setPersistedTier(activeTier);

    if (activeTier === 'tier2-gemma') {
      worker = new Worker(
        new URL('./tier2/embeddingGemmaWorker.ts', import.meta.url),
        { type: 'module' },
      );
    } else {
      worker = new Worker(
        new URL('./embeddingWorker.ts', import.meta.url),
        { type: 'module' },
      );
    }

    worker.onmessage = handleWorkerMessage;
    worker.onerror = (err) => {
      status = { state: 'error', message: err.message || 'Worker crashed' };
    };

    status = { state: 'loading', progress: 0, file: '' };
    await sendRequest<{ type: 'INIT_DONE'; ready: boolean }>({ type: 'INIT' });
  },

  /** Get the current embedding engine status. */
  getStatus(): EmbeddingStatus {
    return status;
  },

  /** Get the currently active model tier. */
  getActiveTier(): EmbeddingModelTier {
    return activeTier;
  },

  /** Get the model identifier for the active tier. */
  getActiveModel(): SupportedEmbeddingModel {
    return tierManager.getTierModel(activeTier);
  },

  /** Get the target dimensionality for the active tier. */
  getActiveDimension(): number {
    return tierManager.getTierDimension(activeTier);
  },

  /**
   * Switch the active model tier and re-initialize the worker.
   */
  async switchTier(tier: EmbeddingModelTier): Promise<void> {
    if (activeTier === tier && status.state === 'ready') return;
    await embeddingService.initialize(tier);
  },

  /**
   * Embed a single note and store the vector in IndexedDB.
   * Skips re-embedding if the note hasn't changed and matches active model/dimension.
   */
  async embedNote(note: Note): Promise<Float32Array> {
    const hash = contentHash(note);
    const activeModel = tierManager.getTierModel(activeTier);
    const activeDim = tierManager.getTierDimension(activeTier);

    // Check if we already have a fresh vector for this model tier
    const existing = await vectorStore.get(note.id);
    if (
      existing &&
      existing.updatedAtHash === hash &&
      existing.model === activeModel &&
      existing.dimension === activeDim
    ) {
      return existing.vector;
    }

    const text = formatDocumentText(note.title, note.content);
    if (!text) {
      // Empty note — remove any stale vector
      await vectorStore.delete(note.id);
      return new Float32Array(activeDim);
    }

    let vector: Float32Array;

    // On native mobile with Tier 2, attempt native LiteRT execution first to prevent WebView RAM spikes
    if (nativeLiteRTEmbedding.isSupported() && activeTier === 'tier2-gemma') {
      const nativeVec = await nativeLiteRTEmbedding.embedText(text, activeDim);
      if (nativeVec) {
        vector = nativeVec;
      } else {
        const response = await sendRequest<{
          type: 'EMBED_DOCUMENT_DONE';
          noteId: string;
          vector: number[];
        }>({ type: 'EMBED_DOCUMENT', text, noteId: note.id });
        vector = new Float32Array(response.vector);
      }
    } else {
      const response = await sendRequest<{
        type: 'EMBED_DOCUMENT_DONE';
        noteId: string;
        vector: number[];
      }>({ type: 'EMBED_DOCUMENT', text, noteId: note.id });
      vector = new Float32Array(response.vector);
    }

    // Blend multimodal features if note has photos or voice recordings
    const mediaVector = multimodalEmbedder.embedMedia(note, activeDim);
    if (mediaVector) {
      vector = multimodalEmbedder.blendTextAndMedia(vector, mediaVector);
    }

    const modality = multimodalEmbedder.detectModality(note);

    const record: StoredNoteVector = {
      noteId: note.id,
      vector,
      model: activeModel,
      dimension: activeDim,
      updatedAtHash: hash,
      createdAt: new Date().toISOString(),
      modality,
    };
    await vectorStore.put(record);

    return vector;
  },

  /**
   * Embed a search query. Returns the raw vector — no storage needed.
   */
  async embedQuery(query: string): Promise<Float32Array> {
    const activeDim = tierManager.getTierDimension(activeTier);
    const text = formatQueryText(query);
    if (!text) return new Float32Array(activeDim);

    if (nativeLiteRTEmbedding.isSupported() && activeTier === 'tier2-gemma') {
      const nativeVec = await nativeLiteRTEmbedding.embedText(text, activeDim);
      if (nativeVec) {
        return nativeVec;
      }
    }

    const response = await sendRequest<{
      type: 'EMBED_QUERY_DONE';
      vector: number[];
    }>({ type: 'EMBED_QUERY', text });

    return new Float32Array(response.vector);
  },

  /**
   * Background sync: index all notes that don't have fresh vectors for active tier.
   * Uses requestIdleCallback to avoid blocking user interactions.
   */
  async syncNotesVectors(notes: Note[]): Promise<void> {
    const activeModel = tierManager.getTierModel(activeTier);
    const activeDim = tierManager.getTierDimension(activeTier);
    const staleNotes: Note[] = [];

    for (const note of notes) {
      const hash = contentHash(note);
      const existing = await vectorStore.get(note.id);
      if (
        !existing ||
        existing.updatedAtHash !== hash ||
        existing.model !== activeModel ||
        existing.dimension !== activeDim
      ) {
        staleNotes.push(note);
      }
    }

    if (staleNotes.length === 0) return;

    // Process in idle callbacks to avoid UI jank
    const processNext = (index: number) => {
      if (index >= staleNotes.length) return;

      const processOne = async () => {
        await embeddingService.embedNote(staleNotes[index]);
        // Schedule next note in the next idle period
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => processNext(index + 1));
        } else {
          setTimeout(() => processNext(index + 1), 50);
        }
      };

      processOne().catch((err) => {
        console.warn(`[embeddingService] Failed to embed note ${staleNotes[index].id}:`, err);
        // Continue with next note despite error
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => processNext(index + 1));
        } else {
          setTimeout(() => processNext(index + 1), 50);
        }
      });
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => processNext(0));
    } else {
      setTimeout(() => processNext(0), 50);
    }
  },

  /**
   * Clean up orphaned vectors for notes that no longer exist.
   */
  async pruneOrphanedVectors(activeNoteIds: Set<string>): Promise<number> {
    const allVectors = await vectorStore.getAll();
    let pruned = 0;
    for (const vec of allVectors) {
      if (!activeNoteIds.has(vec.noteId)) {
        await vectorStore.delete(vec.noteId);
        pruned++;
      }
    }
    return pruned;
  },

  /** Terminate the worker and reset state. */
  destroy(): void {
    worker?.terminate();
    worker = null;
    status = { state: 'idle' };
    pending.clear();
  },
};
