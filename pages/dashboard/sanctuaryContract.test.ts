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
    expect(insights).toContain('bg-green text-white');
    expect(insights).not.toContain('Writing rhythm');
    expect(insights).not.toContain('total notes');
    expect(insights).not.toContain('Your Life Wiki has grown');
    expect(insights).not.toContain('ProUpgradeCTA');
    expect(insights).not.toContain('refreshWikiOnDemand');
    expect(insights).not.toContain('handleRefreshWiki');
    expect(dashboardLayout).not.toContain("label: 'Life Wiki'");
    expect(dashboardLayout).not.toContain('FREE_WIKI_MINIMUM_ENTRIES');
  });

  it('renders a library-first Sanctuary surface with five primary cards and a supporting shelf', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('SANCTUARY_WIKI_PAGES');
    expect(lifeWiki).toContain('SUPPORTING_WIKI_PAGES');
    expect(lifeWiki).toContain('Sanctuary pages');
    expect(lifeWiki).toContain('Supporting shelf');
    expect(lifeWiki).toContain('hasEnoughEntriesForWiki');
    expect(lifeWiki).toContain('primaryPages.length > 0');
    expect(lifeWiki).not.toContain('quiet placeholder');
    expect(lifeWiki).not.toContain('Waiting for signal');
    expect(lifeWiki).toContain('Refresh with AI');
  });

  it('keeps all five Sanctuary rooms designed once the Life Wiki is unlocked, even before every page has content', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(lifeWiki).toContain('const canShowSanctuaryRooms = hasEnoughEntriesForWiki || primaryPages.length > 0;');
    expect(lifeWiki).toContain('Room awaiting signal');
    expect(lifeWiki).toContain('This Sanctuary room is ready, but it has not been written yet.');
    expect(lifeWiki).toContain('SANCTUARY_META.map((meta) => renderPageCard(meta, pageMap.get(meta.pageType)))');
    expect(lifeWiki).toContain('font-serif');
    expect(lifeWiki).toContain('italic');
  });

  it('emphasizes the 3-entry gate and locks only future refreshes after the free generation', () => {
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const policy = read('services/wellnessPolicy.ts');

    expect(policy).toContain('FREE_WIKI_MINIMUM_ENTRIES = 3');
    expect(policy).toContain('FREE_WIKI_INSIGHT_GENERATIONS = 1');
    expect(policy).toContain("reason: 'free_limit_reached'");
    expect(lifeWiki).toContain('Still gathering enough signal.');
    expect(lifeWiki).toContain('Life Wiki unlocks after 3 entries');
    expect(lifeWiki).toContain('Existing generated pages stay readable');
    expect(lifeWiki).toContain('gate?.requiresUpgrade');
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
    expect(insights).toContain('isOpeningSanctuary');
    expect(insights).toContain('handleOpenSanctuary');
    expect(insights).toContain('event.preventDefault()');
    expect(insights).toContain('loop={false}');
    expect(insights).toContain('dotLottieRefCallback={bindSanctuaryEntrancePlayer}');
    expect(insights).toContain("addEventListener('complete'");
    expect(insights).toContain('window.setTimeout(completeOpenSanctuary, SANCTUARY_ENTRANCE_FALLBACK_MS)');
    expect(insights).toContain('/assets/lottie/Level Up Animation.json');
    expect(lifeWiki).not.toContain('refreshModeLabel');
    expect(lifeWiki).not.toContain('On demand. Use Refresh with AI when you want the library rebuilt.');
  });
});
