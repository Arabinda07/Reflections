import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Insights layout contract', () => {
  it('keeps the page heading on one line without shrinking the whole app header system', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const css = read('index.css');

    expect(insights).toContain('className="insights-section-header"');
    expect(css).toContain('.insights-section-header .section-header-title');
    expect(css).toContain('white-space: nowrap');
  });

  it('adds the weekly recap from standalone engagement signals without streak copy', () => {
    const insights = read('pages/dashboard/Insights.tsx');

    expect(insights).toContain('buildWeeklyRecap');
    expect(insights).toContain('moodCheckinService.list');
    expect(insights).toContain('ritualEventService.listSince');
    expect(insights).toContain('This week');
    expect(insights).toContain('This month');
    expect(insights).toContain('weeklyRecap.moodFamilyData');
    expect(insights).toContain('buildMonthSummary');
    // The weekly scoreboard (6-tile grid) is gone in favour of prose.
    expect(insights).not.toContain('lg:grid-cols-6');
    expect(insights).not.toContain('nextQuestion');
    expect(insights).not.toContain('Common mood');
    expect(insights.toLowerCase()).not.toMatch(/\b(streak|lost|xp|leaderboard)\b/);
    expect(insights).not.toMatch(/>\s*Failed/i);
  });

  it('keeps writing patterns accessible from homepage across user modes without a restrictive mode guard', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const app = read('App.tsx');
    const insights = read('pages/dashboard/Insights.tsx');

    // Homepage button triggers navigation to insights
    expect(home).toContain('onClick={() => navigate(RoutePath.INSIGHTS)}');
    expect(home).toContain('Writing patterns');

    // App route is not blocked by withModeGuard('reflective')
    expect(app).toContain('path={RoutePath.INSIGHTS}');
    expect(app).not.toMatch(/path=\{RoutePath\.INSIGHTS\}\s+element=\{[^}]*withModeGuard[^}]*'reflective'/);

    // Insights uses userMode to conditionally gate the Sanctuary CTA
    expect(insights).toContain('const { userMode } = useUserMode();');
    expect(insights).toContain("userMode === 'reflective' &&");
  });
});

