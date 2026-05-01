import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('landing semantic contract', () => {
  it('renders the guest landing headline as the page h1', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('<h1');
    expect(landing).toContain('aria-label="Your mind, beautifully organized"');
    expect(landing).toContain('</h1>');
    expect(landing).toContain('Your mind,');
    expect(landing).toContain('beautifully');
    expect(landing).toContain('organized');
  });
});
