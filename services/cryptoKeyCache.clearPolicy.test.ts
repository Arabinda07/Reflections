import { describe, expect, it } from 'vitest';
import { shouldClearKeyCache } from './cryptoKeyCache';

describe('shouldClearKeyCache', () => {
  it('keeps the key on a cold start while the user is still hydrating', () => {
    expect(shouldClearKeyCache(null, null)).toBe(false);
    expect(shouldClearKeyCache(null, 'user-a')).toBe(false);
  });

  it('keeps the key when the same user re-renders', () => {
    expect(shouldClearKeyCache('user-a', 'user-a')).toBe(false);
  });

  it('clears the key on sign-out and on account switch', () => {
    expect(shouldClearKeyCache('user-a', null)).toBe(true);
    expect(shouldClearKeyCache('user-a', 'user-b')).toBe(true);
  });
});
