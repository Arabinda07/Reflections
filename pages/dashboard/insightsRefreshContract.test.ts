import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Insights refresh contract', () => {
  it('uses the on-demand Life Wiki refresh path and refunds unusable refresh claims', () => {
    const insights = read('pages/dashboard/Insights.tsx');

    expect(insights).toContain('refreshWikiOnDemand(notes)');
    expect(insights).toContain('releaseClaimedFreeWikiInsight()');
    expect(insights).toContain("source === 'none'");
    expect(insights).toContain('pageCount === 0');
  });

  it('shows inline feedback when the Life Wiki cannot be built or refresh fails', () => {
    const insights = read('pages/dashboard/Insights.tsx');

    expect(insights).toContain('Nothing could be built yet');
    expect(insights).toContain('Refresh failed');
    expect(insights).toContain('<Alert');
  });
});
