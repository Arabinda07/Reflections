import type { AudioAcousticFeatures } from './multimodalTypes';

export const audioEmbedder = {
  /**
   * Extract acoustic features from PCM audio samples or duration fallback.
   */
  extractFeatures(
    durationSeconds: number,
    pcmSamples?: Float32Array,
  ): AudioAcousticFeatures {
    const safeDuration = Math.max(0.1, durationSeconds);

    if (!pcmSamples || pcmSamples.length === 0) {
      return {
        durationSeconds: safeDuration,
        energyVariance: 0.4,
        pitchCentroid: 0.5,
        tempoCadence: 0.5,
        silenceRatio: 0.1,
      };
    }

    let sum = 0;
    let sumSquares = 0;
    let silentSamples = 0;
    const threshold = 0.01;

    for (let i = 0; i < pcmSamples.length; i++) {
      const val = Math.abs(pcmSamples[i]);
      sum += val;
      sumSquares += val * val;
      if (val < threshold) {
        silentSamples++;
      }
    }

    const mean = sum / pcmSamples.length;
    const variance = sumSquares / pcmSamples.length - mean * mean;
    const energyVariance = Math.max(0, Math.min(1, variance * 10));
    const silenceRatio = Math.max(0, Math.min(1, silentSamples / pcmSamples.length));

    // Zero-crossing rate approximation for pitch centroid
    let zeroCrossings = 0;
    for (let i = 1; i < pcmSamples.length; i++) {
      if ((pcmSamples[i] >= 0 && pcmSamples[i - 1] < 0) || (pcmSamples[i] < 0 && pcmSamples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / pcmSamples.length;
    const pitchCentroid = Math.max(0, Math.min(1, zcr * 5));

    // Pacing cadence derived from energy modulation
    const tempoCadence = Math.max(0, Math.min(1, (1 - silenceRatio) * 0.7 + energyVariance * 0.3));

    return {
      durationSeconds: safeDuration,
      energyVariance,
      pitchCentroid,
      tempoCadence,
      silenceRatio,
    };
  },

  /**
   * Project acoustic features into a normalized float embedding vector.
   */
  projectToVector(features: AudioAcousticFeatures, targetDim = 256): Float32Array {
    const vector = new Float32Array(targetDim);
    let sumSquares = 0;

    for (let i = 0; i < targetDim; i++) {
      const phase = (i * Math.PI) / targetDim;
      const f1 = Math.sin(phase * 4 * features.energyVariance);
      const f2 = Math.cos(phase * 6 * features.pitchCentroid);
      const f3 = Math.sin(phase * 8 * features.tempoCadence);
      const f4 = Math.cos(phase * 2 * (1 - features.silenceRatio));

      const val = f1 * 0.35 + f2 * 0.35 + f3 * 0.2 + f4 * 0.1;
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
