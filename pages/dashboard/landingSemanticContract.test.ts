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

  it('ensures static SEO generator does not introduce a duplicate h1 on the home page', () => {
    const generator = read('scripts/generate-public-seo-pages.mjs');
    expect(generator).toContain("const headingTag = page.path === '/' ? 'h2' : 'h1';");
  });

  it('ensures landing hero image provides descriptive alt text for search engine crawlers', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const generator = read('scripts/generate-public-seo-pages.mjs');
    expect(landing).toContain('alt="Reflections private journal calm writing atmosphere"');
    expect(generator).toContain('alt="Reflections private journal calm writing atmosphere"');
  });
});
