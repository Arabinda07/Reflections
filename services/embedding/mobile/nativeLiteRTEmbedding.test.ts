import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nativeLiteRTEmbedding } from './nativeLiteRTEmbedding';
import { Capacitor } from '@capacitor/core';
import { mobileRuntime } from '../../../src/native/mobileRuntime';

describe('nativeLiteRTEmbedding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports unsupported when not running on native platform', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    vi.spyOn(mobileRuntime, 'isAndroid').mockReturnValue(false);

    expect(nativeLiteRTEmbedding.isSupported()).toBe(false);
  });

  it('returns null on embedText when not in native environment', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    const vector = await nativeLiteRTEmbedding.embedText('quiet evening');
    expect(vector).toBeNull();
  });

  it('stays unsupported on native Android until the plugin runs a real model', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    vi.spyOn(mobileRuntime, 'isAndroid').mockReturnValue(true);

    // LiteRTEmbeddingPlugin.java currently hashes text instead of embedding it.
    expect(nativeLiteRTEmbedding.isSupported()).toBe(false);
  });
});
