import type { ImageSemanticFeatures } from './multimodalTypes';

export const imageEmbedder = {
  /**
   * Extract image semantic features from basic attributes or canvas pixel data.
   */
  extractFeatures(
    width: number,
    height: number,
    samplePixels?: Uint8ClampedArray,
  ): ImageSemanticFeatures {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const aspectRatio = safeWidth / safeHeight;

    if (!samplePixels || samplePixels.length < 4) {
      return {
        warmthScore: 0.5,
        luminosity: 0.5,
        paletteHarmony: 0.8,
        aspectRatio,
        width: safeWidth,
        height: safeHeight,
      };
    }

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    const pixelCount = Math.floor(samplePixels.length / 4);

    for (let i = 0; i < samplePixels.length; i += 4) {
      rSum += samplePixels[i];
      gSum += samplePixels[i + 1];
      bSum += samplePixels[i + 2];
    }

    const rAvg = rSum / (pixelCount * 255);
    const gAvg = gSum / (pixelCount * 255);
    const bAvg = bSum / (pixelCount * 255);

    // Warmth: higher red/yellow relative to blue
    const warmthScore = Math.max(0, Math.min(1, (rAvg + gAvg - bAvg + 1) / 2));
    // Perceived luminosity formula
    const luminosity = Math.max(0, Math.min(1, 0.299 * rAvg + 0.587 * gAvg + 0.114 * bAvg));
    // Palette harmony: inverse of RGB variance
    const variance = (Math.pow(rAvg - luminosity, 2) + Math.pow(gAvg - luminosity, 2) + Math.pow(bAvg - luminosity, 2)) / 3;
    const paletteHarmony = Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));

    return {
      warmthScore,
      luminosity,
      paletteHarmony,
      aspectRatio,
      width: safeWidth,
      height: safeHeight,
    };
  },

  /**
   * Project image features into a normalized float embedding vector.
   */
  projectToVector(features: ImageSemanticFeatures, targetDim = 256): Float32Array {
    const vector = new Float32Array(targetDim);
    let sumSquares = 0;

    for (let i = 0; i < targetDim; i++) {
      // Frequency synthesis with harmonic modulation based on visual features
      const phase = (i * Math.PI) / targetDim;
      const f1 = Math.sin(phase * 3 * features.warmthScore);
      const f2 = Math.cos(phase * 5 * features.luminosity);
      const f3 = Math.sin(phase * 7 * features.paletteHarmony);
      const f4 = Math.cos(phase * 2 * (features.aspectRatio > 1 ? 1 : -1));

      const val = f1 * 0.4 + f2 * 0.3 + f3 * 0.2 + f4 * 0.1;
      vector[i] = val;
      sumSquares += val * val;
    }

    // L2 Normalization
    const norm = Math.sqrt(sumSquares);
    if (norm > 1e-12) {
      for (let i = 0; i < targetDim; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  },
};
