/**
 * Shared type definitions for the embedding pipeline.
 * The worker file duplicates request/response types to avoid bundler issues with
 * importing from main-thread modules into worker scope.
 */

export const TIER1_MODEL = 'bge-small-en-v1.5' as const;
export const TIER2_MODEL = 'embeddinggemma-2-270m-mrl256' as const;

export const EMBEDDING_MODEL = TIER1_MODEL;
export const EMBEDDING_DIM = 384;

export const TIER1_DIM = 384;
export const TIER2_RAW_DIM = 768;
export const TIER2_MRL_DIM = 256;

export type SupportedEmbeddingModel = typeof TIER1_MODEL | typeof TIER2_MODEL;
export type EmbeddingModelTier = 'tier1-bge' | 'tier2-gemma';

// --- Worker Message Protocol ---

export type EmbeddingWorkerRequest =
  | { id: string; type: 'INIT' }
  | { id: string; type: 'EMBED_DOCUMENT'; text: string; noteId: string }
  | { id: string; type: 'EMBED_QUERY'; text: string }
  | { id: string; type: 'BATCH_EMBED'; items: Array<{ id: string; text: string }> };

export type EmbeddingWorkerResponse =
  | { id: string; type: 'INIT_DONE'; ready: boolean }
  | { id: string; type: 'INIT_PROGRESS'; progress: number; file: string }
  | { id: string; type: 'EMBED_DOCUMENT_DONE'; noteId: string; vector: number[] }
  | { id: string; type: 'EMBED_QUERY_DONE'; vector: number[] }
  | { id: string; type: 'BATCH_EMBED_DONE'; results: Array<{ id: string; vector: number[] }> }
  | { id: string; type: 'ERROR'; error: string };

// --- IndexedDB Vector Record ---

export interface StoredNoteVector {
  noteId: string;
  vector: Float32Array;
  model: SupportedEmbeddingModel;
  dimension: number;
  updatedAtHash: string;
  createdAt: string;
}

// --- Service Status ---

export type EmbeddingStatus =
  | { state: 'idle' }
  | { state: 'loading'; progress: number; file: string }
  | { state: 'ready' }
  | { state: 'error'; message: string };
