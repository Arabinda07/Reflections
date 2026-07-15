import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getStrictPrivateModeDisabledMessage, isPrivateAiDisabled } from './privateMode';

describe('strict private mode', () => {
  it('disables backend AI for encrypted users', () => {
    expect(isPrivateAiDisabled('encrypted')).toBe(true);
    expect(getStrictPrivateModeDisabledMessage()).toContain('zero-knowledge');
    expect(getStrictPrivateModeDisabledMessage()).toContain('cannot read');
  });

  it('enables backend AI for reflective users', () => {
    expect(isPrivateAiDisabled('reflective')).toBe(false);
  });

  it('prevents a stale Smart Mode preference from starting an AI run after save', () => {
    const publisher = readFileSync(path.resolve(process.cwd(), 'services/notePublishingOrchestrator.ts'), 'utf8');
    expect(publisher).toContain('!isPrivateAiDisabled(input.userMode)');
  });
});
