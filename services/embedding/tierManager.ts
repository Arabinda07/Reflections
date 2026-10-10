/**
 * Progressive Model Tier Orchestrator.
 *
 * Coordinates switching between:
 * - Tier 1: bge-small-en-v1.5 (384d, ~33 MB instant download, default)
 * - Tier 2: EmbeddingGemma 2 (270M ONNX WebGPU, 8K tokens, 256d MRL, Pro / Desktop opt-in)
 *
 * Persists user preference and probes hardware WebGPU capabilities.
 *
 * Reference: ADR 0004 §2.2
 */
import {
  type EmbeddingModelTier,
  type SupportedEmbeddingModel,
  TIER1_MODEL,
  TIER2_MODEL,
  TIER1_DIM,
  TIER2_MRL_DIM,
} from './embeddingTypes';

const STORAGE_KEY = 'reflections_active_embedding_tier';

export const tierManager = {
  /**
   * Get the persisted model tier. Defaults to Tier 1 (lightweight instant).
   */
  getPersistedTier(): EmbeddingModelTier {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'tier2-gemma' || stored === 'tier1-bge') {
          return stored;
        }
      }
    } catch {
      // Storage access blocked or unavailable
    }
    return 'tier1-bge';
  },

  /**
   * Persist user's selected model tier.
   */
  setPersistedTier(tier: EmbeddingModelTier): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, tier);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  },

  /**
   * Probe whether WebGPU is supported on the client device.
   */
  async isWebGpuSupported(): Promise<boolean> {
    if (typeof navigator !== 'undefined') {
      const nav = navigator as unknown as { gpu?: { requestAdapter?: () => Promise<unknown> } };
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
  },

  /**
   * Map model tier to its respective model identifier.
   */
  getTierModel(tier: EmbeddingModelTier): SupportedEmbeddingModel {
    return tier === 'tier2-gemma' ? TIER2_MODEL : TIER1_MODEL;
  },

  /**
   * Map model tier to its target vector dimensionality.
   */
  getTierDimension(tier: EmbeddingModelTier): number {
    return tier === 'tier2-gemma' ? TIER2_MRL_DIM : TIER1_DIM;
  },
};
