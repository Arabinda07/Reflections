import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Insights refresh contract', () => {
  it('uses the on-demand Life Wiki refresh path and refunds unusable refresh claims', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('refreshWikiOnDemand(notes)');
    expect(lifeWiki).toContain('releaseClaimedFreeWikiInsight()');
    expect(lifeWiki).toContain("source === 'none'");
    expect(lifeWiki).toContain('pageCount === 0');
  });

  it('shows inline feedback when the Life Wiki cannot be built or refresh fails', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('Nothing could be built yet');
    expect(lifeWiki).toContain('Refresh failed');
    expect(lifeWiki).toContain('<Alert');
  });
});
