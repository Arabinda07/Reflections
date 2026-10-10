import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tierManager } from './tierManager';
import { TIER1_MODEL, TIER2_MODEL, TIER1_DIM, TIER2_MRL_DIM } from './embeddingTypes';

// In-memory mock for localStorage in Node/Vitest environment
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
});

describe('tierManager', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to tier1-bge when no preference is persisted', () => {
    expect(tierManager.getPersistedTier()).toBe('tier1-bge');
  });

  it('persists and retrieves tier selection', () => {
    tierManager.setPersistedTier('tier2-gemma');
    expect(tierManager.getPersistedTier()).toBe('tier2-gemma');

    tierManager.setPersistedTier('tier1-bge');
    expect(tierManager.getPersistedTier()).toBe('tier1-bge');
  });

  it('maps tiers to correct models and dimensions', () => {
    expect(tierManager.getTierModel('tier1-bge')).toBe(TIER1_MODEL);
    expect(tierManager.getTierModel('tier2-gemma')).toBe(TIER2_MODEL);

    expect(tierManager.getTierDimension('tier1-bge')).toBe(TIER1_DIM);
    expect(tierManager.getTierDimension('tier2-gemma')).toBe(TIER2_MRL_DIM);
  });

  it('probes WebGPU safely without throwing', async () => {
    const isSupported = await tierManager.isWebGpuSupported();
    expect(typeof isSupported).toBe('boolean');
  });
});
