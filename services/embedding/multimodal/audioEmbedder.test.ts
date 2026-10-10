import { describe, it, expect } from 'vitest';
import { audioEmbedder } from './audioEmbedder';

describe('audioEmbedder', () => {
  it('extracts fallback features when pcm samples are not provided', () => {
    const features = audioEmbedder.extractFeatures(45);
    expect(features.durationSeconds).toBe(45);
    expect(features.energyVariance).toBe(0.4);
    expect(features.pitchCentroid).toBe(0.5);
  });

  it('extracts acoustic features from synthetic sine pcm samples', () => {
    const samples = new Float32Array(1000);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin((i * 2 * Math.PI) / 50) * 0.8;
    }
    const features = audioEmbedder.extractFeatures(10, samples);
    expect(features.energyVariance).toBeGreaterThan(0);
    expect(features.silenceRatio).toBeLessThan(0.2);
  });

  it('projects features to exact L2 normalized vector of target dimension', () => {
    const features = audioEmbedder.extractFeatures(30);
    const vector256 = audioEmbedder.projectToVector(features, 256);
    expect(vector256.length).toBe(256);

    let sumSq = 0;
    for (let i = 0; i < vector256.length; i++) {
      sumSq += vector256[i] * vector256[i];
    }
    expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 4);

    const vector384 = audioEmbedder.projectToVector(features, 384);
    expect(vector384.length).toBe(384);
  });
});
