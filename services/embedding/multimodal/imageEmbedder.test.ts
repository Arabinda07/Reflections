import { describe, it, expect } from 'vitest';
import { imageEmbedder } from './imageEmbedder';

describe('imageEmbedder', () => {
  it('extracts default features when pixel array is empty', () => {
    const features = imageEmbedder.extractFeatures(800, 600);
    expect(features.width).toBe(800);
    expect(features.height).toBe(600);
    expect(features.aspectRatio).toBeCloseTo(1.333, 2);
    expect(features.warmthScore).toBe(0.5);
  });

  it('extracts warm features from reddish pixel data', () => {
    // 2x2 red image
    const pixels = new Uint8ClampedArray([
      255, 50, 50, 255,
      250, 40, 40, 255,
      240, 60, 60, 255,
      255, 30, 30, 255,
    ]);
    const features = imageEmbedder.extractFeatures(2, 2, pixels);
    expect(features.warmthScore).toBeGreaterThan(0.6);
  });

  it('projects features to exact L2 normalized vector of target dimension', () => {
    const features = imageEmbedder.extractFeatures(1200, 800);
    const vector256 = imageEmbedder.projectToVector(features, 256);
    expect(vector256.length).toBe(256);

    let sumSq = 0;
    for (let i = 0; i < vector256.length; i++) {
      sumSq += vector256[i] * vector256[i];
    }
    expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 4);

    const vector384 = imageEmbedder.projectToVector(features, 384);
    expect(vector384.length).toBe(384);
  });
});
