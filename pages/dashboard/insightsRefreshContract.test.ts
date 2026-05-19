import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Insights refresh contract', () => {
  it('uses the server-side Life Wiki refresh path with durable run tracking', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('startLifeWikiRefresh');
    expect(lifeWiki).toContain("trigger: 'manual'");
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
