/**
 * Embedding Web Worker — runs bge-small-en-v1.5 via @huggingface/transformers.
 * Communicates with the main thread via structured postMessage protocol.
 * Model weights are cached in browser CacheStorage after first download.
 */
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/bge-small-en-v1.5';
const EMBEDDING_DIM = 384;

let extractor: FeatureExtractionPipeline | null = null;

// --- Message Types (duplicated from embeddingTypes.ts for worker isolation) ---
type WorkerRequest =
  | { id: string; type: 'INIT' }
  | { id: string; type: 'EMBED_DOCUMENT'; text: string; noteId: string }
  | { id: string; type: 'EMBED_QUERY'; text: string }
  | { id: string; type: 'BATCH_EMBED'; items: Array<{ id: string; text: string }> };

// Initialization
const initModel = async (requestId: string) => {
  try {
    extractor = await pipeline('feature-extraction', MODEL_ID, {
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
    self.postMessage({ id: requestId, type: 'INIT_DONE', ready: true });
  } catch (err) {
    self.postMessage({
      id: requestId,
      type: 'ERROR',
      error: err instanceof Error ? err.message : 'Model initialization failed',
    });
  }
};

const embed = async (text: string): Promise<number[]> => {
  if (!extractor) throw new Error('Model not initialized');
  const output = await extractor(text, { pooling: 'cls', normalize: true });
  const raw = output.tolist()[0] as number[];
  // Defensive: ensure we return exactly EMBEDDING_DIM floats
  return raw.slice(0, EMBEDDING_DIM);
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
      error: err instanceof Error ? err.message : 'Unknown worker error',
    });
  }
};
