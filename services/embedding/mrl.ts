/**
 * Matryoshka Representation Learning (MRL) Truncation Engine.
 *
 * Slices high-dimensional embedding vectors (e.g. 768d from EmbeddingGemma 2)
 * down to nested sub-dimensions (e.g. 256d) and re-normalizes them
 * using L2 norm:
 *
 *   v_norm = v[:targetDim] / ||v[:targetDim]||_2
 *
 * Slashes storage consumption by ~66% in IndexedDB and accelerates cosine
 * distance comparisons 3x on client processors with negligible loss
 * in semantic retrieval precision.
 *
 * Reference: ADR 0004 §2.3, AI Architecture Roadmap §4.A
 */

export const MRL_EPSILON = 1e-12;
export const DEFAULT_MRL_DIM = 256;

/**
 * Truncates an embedding vector to targetDim and re-normalizes using L2 norm.
 * Defends against zero vectors, NaN, and invalid dimensions.
 */
export function truncateAndNormalizeVector(
  rawVector: Float32Array | number[],
  targetDim: number = DEFAULT_MRL_DIM
): Float32Array {
  if (!rawVector || rawVector.length === 0 || targetDim <= 0) {
    return new Float32Array(Math.max(0, targetDim));
  }

  const dim = Math.min(targetDim, rawVector.length);
  const truncated = new Float32Array(targetDim);

  let sumSquares = 0;
  for (let i = 0; i < dim; i++) {
    const val = rawVector[i] || 0;
    truncated[i] = val;
    sumSquares += val * val;
  }

  const norm = Math.sqrt(sumSquares);
  if (norm > MRL_EPSILON) {
    const invNorm = 1 / norm;
    for (let i = 0; i < dim; i++) {
      truncated[i] *= invNorm;
    }
  }

  return truncated;
}

/**
 * Calculates percentage storage savings when reducing from originalDim to targetDim.
 */
export function calculateStorageSavings(originalDim: number, targetDim: number): number {
  if (originalDim <= 0 || targetDim <= 0) return 0;
  if (targetDim >= originalDim) return 0;
  return Number((((originalDim - targetDim) / originalDim) * 100).toFixed(2));
}
