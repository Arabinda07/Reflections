import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');

describe('app bootstrap contract', () => {
  it('validates required client env before loading App eagerly', () => {
    expect(indexSource).toContain("getMissingClientEnvNames");
    expect(indexSource).toContain("await import('./App')");
    expect(indexSource).not.toContain("import App from './App'");
  });
});
