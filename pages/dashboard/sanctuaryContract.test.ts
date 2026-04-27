import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Sanctuary Life Wiki contract', () => {
  it('registers protected Sanctuary library and article routes', () => {
    const types = read('types.ts');
    const app = read('App.tsx');

    expect(types).toContain("SANCTUARY = '/sanctuary'");
    expect(types).toContain("SANCTUARY_ARTICLE = '/sanctuary/:pageType'");
    expect(app).toContain('path={RoutePath.SANCTUARY}');
    expect(app).toContain('path={RoutePath.SANCTUARY_ARTICLE}');
    expect(app).toContain('<LifeWiki />');
  });

  it('keeps Insights as a CTA into Sanctuary instead of owning wiki refresh', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');

    expect(insights).toContain('to={RoutePath.SANCTUARY}');
    expect(insights).toContain('Open Sanctuary');
    expect(insights).not.toContain('refreshWikiOnDemand');
    expect(insights).not.toContain('handleRefreshWiki');
    expect(dashboardLayout).not.toContain("label: 'Life Wiki'");
    expect(dashboardLayout).not.toContain('FREE_WIKI_MINIMUM_ENTRIES');
  });

  it('renders a library-first Sanctuary surface with five primary cards and a supporting shelf', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('SANCTUARY_WIKI_PAGES');
    expect(lifeWiki).toContain('SUPPORTING_WIKI_PAGES');
    expect(lifeWiki).toContain('Private reading room');
    expect(lifeWiki).toContain('Signals');
    expect(lifeWiki).toContain('Supporting shelf');
    expect(lifeWiki).toContain('quiet placeholder');
    expect(lifeWiki).toContain('Refresh with AI');
  });

  it('uses full-page articles for AI-generated wiki pages and excludes freeform/index pages', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('useParams');
    expect(lifeWiki).toContain('ReactMarkdown');
    expect(lifeWiki).toContain('skipHtml');
    expect(lifeWiki).toContain('isUserVisibleWikiPage');
    expect(lifeWiki).toContain("pageType !== 'theme'");
    expect(lifeWiki).toContain("pageType !== 'index'");
    expect(lifeWiki).toContain('Source notes');
  });

  it('preserves the opening animation as a threshold from Insights', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(insights).toContain("state={{ fromInsights: true }}");
    expect(lifeWiki).toContain('fromInsights');
    expect(lifeWiki).toContain('/assets/lottie/Level Up Animation.json');
  });
});
