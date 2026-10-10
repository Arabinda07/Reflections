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

  it('detects supported state on native Android', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    vi.spyOn(mobileRuntime, 'isAndroid').mockReturnValue(true);

    expect(nativeLiteRTEmbedding.isSupported()).toBe(true);
  });
});
