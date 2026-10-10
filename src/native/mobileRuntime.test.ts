import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mobileRuntime } from './mobileRuntime';
import { Capacitor } from '@capacitor/core';

describe('mobileRuntime', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects web platform when Capacitor is not native', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('web');

    expect(mobileRuntime.isNativePlatform()).toBe(false);
    expect(mobileRuntime.getPlatform()).toBe('web');
    expect(mobileRuntime.isAndroid()).toBe(false);
    expect(mobileRuntime.isIos()).toBe(false);
  });

  it('detects native Android environment and enables LiteRT support', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');

    expect(mobileRuntime.isNativePlatform()).toBe(true);
    expect(mobileRuntime.getPlatform()).toBe('android');
    expect(mobileRuntime.isAndroid()).toBe(true);
    expect(mobileRuntime.isIos()).toBe(false);

    const caps = await mobileRuntime.probeCapabilities();
    expect(caps.isNative).toBe(true);
    expect(caps.platform).toBe('android');
    expect(caps.isLiteRTSupported).toBe(true);
    expect(caps.maxRecommendedWorkerThreads).toBe(1);
  });

  it('detects iOS native environment without Android LiteRT', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');

    expect(mobileRuntime.isNativePlatform()).toBe(true);
    expect(mobileRuntime.getPlatform()).toBe('ios');
    expect(mobileRuntime.isAndroid()).toBe(false);
    expect(mobileRuntime.isIos()).toBe(true);

    const caps = await mobileRuntime.probeCapabilities();
    expect(caps.isNative).toBe(true);
    expect(caps.platform).toBe('ios');
    expect(caps.isLiteRTSupported).toBe(false);
    expect(caps.maxRecommendedWorkerThreads).toBe(1);
  });
});
