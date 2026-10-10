import { describe, it, expect } from 'vitest';
import {
  truncateAndNormalizeVector,
  calculateStorageSavings,
  DEFAULT_MRL_DIM,
} from './mrl';

describe('mrl - truncateAndNormalizeVector', () => {
  it('truncates a 768d vector to default 256d and normalizes to unit length (L2 norm = 1.0)', () => {
    // Construct a synthetic 768d vector with varying magnitudes
    const raw768 = new Float32Array(768);
    for (let i = 0; i < 768; i++) {
      raw768[i] = Math.sin(i + 1);
    }

    const truncated = truncateAndNormalizeVector(raw768);
    expect(truncated.length).toBe(DEFAULT_MRL_DIM);

    // Compute L2 norm of truncated vector
    let sumSquares = 0;
    for (let i = 0; i < truncated.length; i++) {
      sumSquares += truncated[i] * truncated[i];
    }
    const norm = Math.sqrt(sumSquares);
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it('preserves directional orientation of sliced components', () => {
    // Simple 4d vector sliced to 2d: [3, 4, 10, 20]
    // First 2 elements: [3, 4], norm = 5 -> normalized: [0.6, 0.8]
    const raw = [3, 4, 10, 20];
    const sliced = truncateAndNormalizeVector(raw, 2);

    expect(sliced.length).toBe(2);
    expect(sliced[0]).toBeCloseTo(0.6, 5);
    expect(sliced[1]).toBeCloseTo(0.8, 5);
  });

  it('handles zero vector without NaN or infinity', () => {
    const zeroVec = new Float32Array(768);
    const result = truncateAndNormalizeVector(zeroVec, 256);

    expect(result.length).toBe(256);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(0);
      expect(Number.isNaN(result[i])).toBe(false);
    }
  });

  it('handles empty or invalid inputs gracefully', () => {
    expect(truncateAndNormalizeVector([], 256).length).toBe(256);
    expect(truncateAndNormalizeVector(new Float32Array(0), 128).length).toBe(128);
    expect(truncateAndNormalizeVector([1, 2], -5).length).toBe(0);
  });

  it('handles raw vectors shorter than targetDim with zero-padding', () => {
    // 3d vector [3, 4, 0] truncated to 5d
    const raw = [3, 4, 0];
    const result = truncateAndNormalizeVector(raw, 5);

    expect(result.length).toBe(5);
    expect(result[0]).toBeCloseTo(0.6, 5);
    expect(result[1]).toBeCloseTo(0.8, 5);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(0);
    expect(result[4]).toBe(0);
  });
});

describe('mrl - calculateStorageSavings', () => {
  it('correctly calculates 66.67% savings for 768d to 256d', () => {
    const savings = calculateStorageSavings(768, 256);
    expect(savings).toBe(66.67);
  });

  it('correctly calculates 83.33% savings for 768d to 128d', () => {
    const savings = calculateStorageSavings(768, 128);
    expect(savings).toBe(83.33);
  });

  it('returns 0 when targetDim >= originalDim or on invalid inputs', () => {
    expect(calculateStorageSavings(256, 256)).toBe(0);
    expect(calculateStorageSavings(256, 384)).toBe(0);
    expect(calculateStorageSavings(0, 256)).toBe(0);
    expect(calculateStorageSavings(768, 0)).toBe(0);
  });
});
