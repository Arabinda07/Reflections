import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const APP_UI_HARD_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(|\bbg-white\b|\btext-white\b|\bborder-white\b|\btext-red-\d{2,3}\b|\bbg-gray-\d{2,3}\b|\btext-gray-\d{2,3}\b|\bborder-gray-\d{2,3}\b/;

describe('PrivateDataGate contract', () => {
  it('uses design tokens instead of hard-coded app UI colors', () => {
    const source = read('components/auth/PrivateDataGate.tsx');

    expect(source).toContain('input-surface');
    expect(source).toContain('text-clay');
    expect(source).not.toMatch(APP_UI_HARD_COLOR_PATTERN);
  });
});
