/**
 * Tier 2 Embedding Web Worker — runs EmbeddingGemma 2 (270M) via @huggingface/transformers.
 *
 * Capabilities:
 * - WebGPU execution provider with automatic WASM fallback.
 * - 8,192 token context window (indexes long-form introspective essays without chunking).
 * - Matryoshka Representation Learning (MRL): slices 768d raw embeddings to 256d
 *   and applies L2 re-normalization in-worker before postMessage transfer.
 *
 * Reference: ADR 0004 §2.2 & §2.3, AI Roadmap Phase 4
 */
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { truncateAndNormalizeVector } from '../mrl';
import { TIER2_MODEL_ID, TIER2_MRL_DIM } from './tier2Config';

let extractor: FeatureExtractionPipeline | null = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';

// --- Worker Message Protocol ---
type WorkerRequest =
  | { id: string; type: 'INIT' }
  | { id: string; type: 'EMBED_DOCUMENT'; text: string; noteId: string }
  | { id: string; type: 'EMBED_QUERY'; text: string }
  | { id: string; type: 'BATCH_EMBED'; items: Array<{ id: string; text: string }> };

interface NavigatorWithGPU {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
}

/**
 * Probe WebGPU availability in worker scope.
 */
const checkWebGpuSupport = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined') {
    const nav = navigator as unknown as NavigatorWithGPU;
    if (nav.gpu && typeof nav.gpu.requestAdapter === 'function') {
      try {
        const adapter = await nav.gpu.requestAdapter();
        return !!adapter;
      } catch {
        return false;
      }
    }
  }
  return false;
};

// Initialization
const initModel = async (requestId: string) => {
  try {
    const hasWebGpu = await checkWebGpuSupport();
    activeDevice = hasWebGpu ? 'webgpu' : 'wasm';

    extractor = await pipeline('feature-extraction', TIER2_MODEL_ID, {
      device: activeDevice,
      dtype: activeDevice === 'webgpu' ? 'fp16' : 'q4',
      progress_callback: (progress: { status: string; file?: string; progress?: number }) => {
        if (progress.status === 'progress' && progress.file && progress.progress != null) {
          self.postMessage({
            id: requestId,
            type: 'INIT_PROGRESS',
            progress: progress.progress,
            file: progress.file,
          });
        }
      },
    });

    self.postMessage({
      id: requestId,
      type: 'INIT_DONE',
      ready: true,
      device: activeDevice,
    });
  } catch (err) {
    self.postMessage({
      id: requestId,
      type: 'ERROR',
      error: err instanceof Error ? err.message : 'Tier 2 model initialization failed',
    });
  }
};

/**
 * Generate embedding, apply MRL truncation to 256d, and normalize with L2 norm.
 */
const embed = async (text: string): Promise<number[]> => {
  if (!extractor) throw new Error('Tier 2 model not initialized');

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: false, // Normalization performed during MRL truncation
  });

  const raw = output.tolist()[0] as number[];
  const mrlVector = truncateAndNormalizeVector(raw, TIER2_MRL_DIM);
  return Array.from(mrlVector);
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type } = event.data;

  try {
    switch (type) {
      case 'INIT':
        await initModel(id);
        break;

      case 'EMBED_DOCUMENT':
        self.postMessage({
          id,
          type: 'EMBED_DOCUMENT_DONE',
          noteId: event.data.noteId,
          vector: await embed(event.data.text),
        });
        break;

      case 'EMBED_QUERY':
        self.postMessage({
          id,
          type: 'EMBED_QUERY_DONE',
          vector: await embed(event.data.text),
        });
        break;

      case 'BATCH_EMBED': {
        const results: Array<{ id: string; vector: number[] }> = [];
        for (const item of event.data.items) {
          results.push({ id: item.id, vector: await embed(item.text) });
        }
        self.postMessage({ id, type: 'BATCH_EMBED_DONE', results });
        break;
      }
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: err instanceof Error ? err.message : 'Unknown Tier 2 worker error',
    });
  }
};
