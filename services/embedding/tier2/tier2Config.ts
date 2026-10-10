/**
 * Tier 2 Embedding Model Configuration.
 *
 * Model: Google EmbeddingGemma 2 (270M ONNX WebGPU variant)
 * Context Window: 8,192 tokens (eliminates artificial chunking for long essays)
 * Raw Dimensionality: 768 dimensions
 * Matryoshka Truncated: 256 dimensions
 *
 * Reference: ADR 0004 §2.2, AI Architecture Roadmap §3 & §4.A
 */
import { TIER2_MODEL, TIER2_RAW_DIM, TIER2_MRL_DIM } from '../embeddingTypes';

export const TIER2_MODEL_ID = 'onnx-community/embeddinggemma-270m';
export const TIER2_CONTEXT_WINDOW = 8192;
export { TIER2_MODEL, TIER2_RAW_DIM, TIER2_MRL_DIM };
