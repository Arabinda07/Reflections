import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { embeddingService } from './embeddingService';

// Mock the Worker constructor and vectorStore
vi.mock('./vectorStore', () => ({
  vectorStore: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    clear: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    cosineSimilarity: vi.fn(),
    findSimilar: vi.fn(),
  },
}));

// Simulate a Worker that responds correctly
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(data: Record<string, unknown>) {
    setTimeout(() => {
      const id = data.id as string;
      const type = data.type as string;

      let response: Record<string, unknown>;

      switch (type) {
        case 'INIT':
          response = { id, type: 'INIT_DONE', ready: true };
          break;
        case 'EMBED_DOCUMENT':
          response = {
            id,
            type: 'EMBED_DOCUMENT_DONE',
            noteId: data.noteId,
            vector: new Array(embeddingService.getActiveDimension()).fill(0.1),
          };
          break;
        case 'EMBED_QUERY':
          response = {
            id,
            type: 'EMBED_QUERY_DONE',
            vector: new Array(embeddingService.getActiveDimension()).fill(0.2),
          };
          break;
        default:
          response = { id, type: 'ERROR', error: 'Unknown type' };
      }

      this.onmessage?.({ data: response } as MessageEvent);
    }, 0);
  }

  terminate() { /* no-op */ }
}

// Replace the global Worker
const OriginalWorker = globalThis.Worker;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).Worker = MockWorker;
  // Force the service back to idle state
  embeddingService.destroy();
});

afterEach(() => {
  embeddingService.destroy();
  (globalThis as unknown as Record<string, unknown>).Worker = OriginalWorker;
});

describe('embeddingService.initialize', () => {
  it('transitions status from idle to ready', async () => {
    expect(embeddingService.getStatus().state).toBe('idle');
    await embeddingService.initialize();
    expect(embeddingService.getStatus().state).toBe('ready');
  });

  it('is idempotent when already ready', async () => {
    await embeddingService.initialize();
    await embeddingService.initialize(); // should not throw
    expect(embeddingService.getStatus().state).toBe('ready');
  });
});

describe('embeddingService.embedQuery', () => {
  it('returns a Float32Array of 384 dimensions', async () => {
    await embeddingService.initialize();
    const vector = await embeddingService.embedQuery('burnout at work');
    expect(vector).toBeInstanceOf(Float32Array);
    expect(vector.length).toBe(384);
  });

  it('returns zero vector for empty query', async () => {
    await embeddingService.initialize();
    const vector = await embeddingService.embedQuery('');
    expect(vector.every((v) => v === 0)).toBe(true);
  });
});

describe('embeddingService.destroy', () => {
  it('resets status to idle', async () => {
    await embeddingService.initialize();
    embeddingService.destroy();
    expect(embeddingService.getStatus().state).toBe('idle');
  });
});

describe('embeddingService progressive tier switching', () => {
  it('defaults to tier1-bge with 384 dimensions', () => {
    expect(embeddingService.getActiveTier()).toBe('tier1-bge');
    expect(embeddingService.getActiveModel()).toBe('bge-small-en-v1.5');
    expect(embeddingService.getActiveDimension()).toBe(384);
  });

  it('switches to tier2-gemma and adjusts dimensions to 256d MRL', async () => {
    await embeddingService.switchTier('tier2-gemma');
    expect(embeddingService.getActiveTier()).toBe('tier2-gemma');
    expect(embeddingService.getActiveModel()).toBe('embeddinggemma-2-270m-mrl256');
    expect(embeddingService.getActiveDimension()).toBe(256);
    expect(embeddingService.getStatus().state).toBe('ready');

    const vector = await embeddingService.embedQuery('long context introspective essay');
    expect(vector.length).toBe(256);

    // Switch back to tier1
    await embeddingService.switchTier('tier1-bge');
    expect(embeddingService.getActiveTier()).toBe('tier1-bge');
    expect(embeddingService.getActiveDimension()).toBe(384);
  });
});


describe('embeddingService lazy initialization (regression: no prod caller ever initialized)', () => {
  it('embedQuery works without an explicit initialize()', async () => {
    const vector = await embeddingService.embedQuery('drained by endless meetings');
    expect(vector.length).toBe(384);
    expect(embeddingService.getStatus().state).toBe('ready');
  });

  it('concurrent callers share a single model load', async () => {
    const spy = vi.spyOn(MockWorker.prototype, 'postMessage');
    await Promise.all([
      embeddingService.embedQuery('one'),
      embeddingService.embedQuery('two'),
    ]);
    const inits = spy.mock.calls.filter(([msg]) => msg.type === 'INIT');
    expect(inits).toHaveLength(1);
    spy.mockRestore();
  });
});

describe('embeddingService.reset', () => {
  it('terminates the worker and wipes stored vectors', async () => {
    const { vectorStore } = await import('./vectorStore');
    await embeddingService.initialize();
    await embeddingService.reset();
    expect(embeddingService.getStatus().state).toBe('idle');
    expect(vectorStore.clear).toHaveBeenCalled();
  });
});
