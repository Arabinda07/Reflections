import { describe, expect, it } from 'vitest';
import { getStrictPrivateModeDisabledMessage, isPrivateAiDisabled } from './privateMode';

describe('strict private mode', () => {
  it('disables backend AI for private writing surfaces', () => {
    expect(isPrivateAiDisabled()).toBe(true);
    expect(getStrictPrivateModeDisabledMessage()).toContain('zero-knowledge');
    expect(getStrictPrivateModeDisabledMessage()).toContain('cannot read');
  });
});
