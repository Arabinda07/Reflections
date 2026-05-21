import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('landing semantic contract', () => {
  it('renders the guest landing headline as the page h1', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const publicSeoCopy = read('src/config/publicSeoCopy.js');

    expect(landing).toContain('<h1');
    expect(landing).toContain('aria-label={HOME_SEO.heroAriaLabel}');
    expect(landing).toContain('</h1>');
    expect(landing).toContain('HOME_SEO.heroLines[0]');
    expect(landing).toContain('HOME_SEO.heroLines[1]');
    expect(landing).toContain('HOME_SEO.heroLines[2]');
    expect(publicSeoCopy).toContain('Your mind');
    expect(publicSeoCopy).toContain('beautifully');
    expect(publicSeoCopy).toContain('organized');
  });
});
