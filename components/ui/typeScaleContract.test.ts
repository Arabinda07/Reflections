import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Type-scale guardrail: arbitrary `text-[Npx]` font sizes are retired in favor of the
 * canonical `ui-*` ladder (see docs/brand/type-and-icon-framework.md §A.3).
 *
 * The ONLY allowed literals are serif reading text and brand wordmarks (`font-serif`) and
 * emoji glyph sizing — the "reading/brand stays generous" exceptions, never UI chrome.
 */
const ROOTS = ['pages', 'components', 'layouts', 'features'];
const LITERAL = /text-\[\d+px\]/;

const walk = (dir: string): string[] => {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.tsx') ? [full] : [];
  });
};

describe('type-scale: no arbitrary text-[Npx] in UI chrome', () => {
  it('only allows pixel literals on serif/wordmark or emoji lines', () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      const base = path.resolve(process.cwd(), root);
      for (const file of walk(base)) {
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            if (!LITERAL.test(line)) return;
            const allowed = line.includes('font-serif') || line.includes('emoji');
            if (!allowed) offenders.push(`${path.relative(process.cwd(), file)}:${i + 1}`);
          });
      }
    }
    expect(offenders, `arbitrary text-[Npx] found:\n${offenders.join('\n')}`).toEqual([]);
  });
});
