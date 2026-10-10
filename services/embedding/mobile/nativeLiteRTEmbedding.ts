import { Capacitor, registerPlugin } from '@capacitor/core';
import { mobileRuntime } from '../../../src/native/mobileRuntime';

export interface LiteRTAvailabilityResponse {
  supported: boolean;
  delegate: 'gpu' | 'npu' | 'cpu';
  modelLoaded: boolean;
  modelTag: string;
}

export interface LiteRTEmbeddingPlugin {
  isAvailable(): Promise<LiteRTAvailabilityResponse>;
  loadModel(options: { modelName?: string; modelPath?: string }): Promise<{
    success: boolean;
    modelTag: string;
  }>;
  embedText(options: { text: string; targetDim?: number }): Promise<{
    vector: number[];
    dimension: number;
    model: string;
  }>;
  embedMultimodal(options: {
    inputType: 'text' | 'image' | 'audio';
    data: string;
    targetDim?: number;
  }): Promise<{
    vector: number[];
    dimension: number;
    inputType: string;
  }>;
  unload(): Promise<{ unloaded: boolean }>;
}

const NATIVE_LITERT_READY = false;

const LiteRTEmbedding = registerPlugin<LiteRTEmbeddingPlugin>('LiteRTEmbedding');

export const nativeLiteRTEmbedding = {
  /**
   * Check if the current runtime environment is native Android with LiteRT capability.
   */
  isSupported(): boolean {
    // ponytail: hard-off — LiteRTEmbeddingPlugin.java still returns SHA-256 hash
    // vectors, not model output. Restore the platform check once a real
    // EmbeddingGemma .tflite runs natively.
    return NATIVE_LITERT_READY && Capacitor.isNativePlatform() && mobileRuntime.isAndroid();
  },

  /**
   * Check if native LiteRT runtime is initialized and available.
   */
  async checkAvailability(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const res = await LiteRTEmbedding.isAvailable();
      return !!res?.supported;
    } catch {
      return false;
    }
  },

  /**
   * Initialize or load the model in the native runtime.
   */
  async initializeModel(modelName = 'embeddinggemma-2-270m-mrl256'): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const res = await LiteRTEmbedding.loadModel({ modelName });
      return !!res?.success;
    } catch {
      return false;
    }
  },

  /**
   * Compute text embedding via native LiteRT runner.
   */
  async embedText(text: string, targetDim = 256): Promise<Float32Array | null> {
    if (!this.isSupported() || !text.trim()) return null;
    try {
      const res = await LiteRTEmbedding.embedText({ text, targetDim });
      if (res?.vector && Array.isArray(res.vector)) {
        return new Float32Array(res.vector);
      }
      return null;
    } catch (err) {
      console.warn('[nativeLiteRTEmbedding] embedText failed, falling back to Web Worker:', err);
      return null;
    }
  },

  /**
   * Compute multimodal embedding via native LiteRT runner.
   */
  async embedMultimodal(
    inputType: 'text' | 'image' | 'audio',
    data: string,
    targetDim = 256,
  ): Promise<Float32Array | null> {
    if (!this.isSupported() || !data.trim()) return null;
    try {
      const res = await LiteRTEmbedding.embedMultimodal({ inputType, data, targetDim });
      if (res?.vector && Array.isArray(res.vector)) {
        return new Float32Array(res.vector);
      }
      return null;
    } catch (err) {
      console.warn('[nativeLiteRTEmbedding] embedMultimodal failed:', err);
      return null;
    }
  },

  /**
   * Unload native model resources.
   */
  async unload(): Promise<void> {
    if (!this.isSupported()) return;
    try {
      await LiteRTEmbedding.unload();
    } catch {
      // Ignored
    }
  },
};
