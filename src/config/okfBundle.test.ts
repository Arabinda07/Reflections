import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildOkfBundle } from './okfBundle.js';
import { PUBLIC_SEO_PAGES } from './publicSeoCopy.js';
import { buildPublicCanonicalUrl } from './publicSite.js';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const conceptFileName = (key: string) => (key === 'dayOne' ? 'day-one' : key);

const frontmatterOf = (content: string) => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
};

const DEPTH_NODE_KEYS = ['encryption', 'features'];

describe('OKF bundle', () => {
  const bundle = buildOkfBundle();

  it('emits a root index, a concept file per public page, and each depth node', () => {
    const expected = [
      'index.md',
      ...PUBLIC_SEO_PAGES.map((page) => `${conceptFileName(page.key)}.md`),
      ...DEPTH_NODE_KEYS.map((key) => `${key}.md`),
    ];
    expect(Object.keys(bundle).sort()).toEqual([...expected].sort());
  });

  it('declares the OKF version in the index frontmatter', () => {
    expect(bundle['index.md']).toMatch(/^---\nokf_version: "0\.1"\n---/);
  });

  it('links every concept and depth node from the index', () => {
    for (const page of PUBLIC_SEO_PAGES) {
      expect(bundle['index.md']).toContain(`(./${conceptFileName(page.key)}.md)`);
    }
    for (const key of DEPTH_NODE_KEYS) {
      expect(bundle['index.md']).toContain(`(./${key}.md)`);
    }
  });

  it('lists the machine-readable resources in the index', () => {
    expect(bundle['index.md']).toContain('/pricing.md');
    expect(bundle['index.md']).toContain('/llms.txt');
  });

  it('gives every page concept a non-empty type and canonical resource', () => {
    for (const page of PUBLIC_SEO_PAGES) {
      const content = bundle[`${conceptFileName(page.key)}.md`];
      const frontmatter = frontmatterOf(content);
      expect(frontmatter).toMatch(/^type: \S.*/m);
      expect(frontmatter).toContain(`resource: "${buildPublicCanonicalUrl(page.path)}"`);
    }
  });

  it('gives every depth node a non-empty type and resource', () => {
    for (const key of DEPTH_NODE_KEYS) {
      const frontmatter = frontmatterOf(bundle[`${key}.md`]);
      expect(frontmatter).toMatch(/^type: \S.*/m);
      expect(frontmatter).toMatch(/^resource: "https:\/\/\S+"/m);
    }
  });

  it('cross-links only to emitted files', () => {
    for (const content of Object.values(bundle)) {
      for (const [, target] of content.matchAll(/\]\(\.\/([^)]+)\)/g)) {
        expect(bundle).toHaveProperty(target);
      }
    }
  });

  it('is discoverable from llms.txt', () => {
    expect(read('public/llms.txt')).toContain('/okf/index.md');
  });
});
