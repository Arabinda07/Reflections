import { describe, it, expect } from 'vitest';
import { formatImageCaption, formatVoiceMemo } from './asymmetricMultimodalPrefixes';

describe('asymmetricMultimodalPrefixes', () => {
  it('formats image caption with default description', () => {
    const formatted = formatImageCaption('Morning Fog');
    expect(formatted).toBe('VisualMemory: Morning Fog | Photographic journal memory');
  });

  it('formats image caption with custom caption and tags', () => {
    const formatted = formatImageCaption('Studio Desk', 'Minimalist setup with coffee', ['focus', 'morning']);
    expect(formatted).toBe('VisualMemory: Studio Desk | Minimalist setup with coffee | tags: focus, morning');
  });

  it('formats voice memo with duration and transcript', () => {
    const formatted = formatVoiceMemo('Walking in the Rain', 124, 'Observing the droplets on the pine needles');
    expect(formatted).toBe('AudioReflection: Walking in the Rain | duration: 124s | Observing the droplets on the pine needles');
  });

  it('formats voice memo with default spoken prompt when empty transcript', () => {
    const formatted = formatVoiceMemo('Quick Thought', 30);
    expect(formatted).toBe('AudioReflection: Quick Thought | duration: 30s | Spoken introspective audio note');
  });
});
