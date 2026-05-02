import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('mobile Insights and Sanctuary navigation contract', () => {
  it('hides the shared mobile navbar on Insights and Sanctuary while preserving desktop nav', () => {
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('isMobileNavSuppressedRoute');
    expect(layout).toContain('location.pathname === RoutePath.INSIGHTS');
    expect(layout).toContain('location.pathname.startsWith(RoutePath.SANCTUARY)');
    expect(layout).toContain("isMobileNavSuppressedRoute ? 'hidden lg:flex' : 'flex'");
  });

  it('uses page-owned back buttons for the intended mobile route flow', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(insights).toContain('onClick={() => navigate(RoutePath.HOME)}');
    expect(lifeWiki).toContain('onClick={() => navigate(RoutePath.INSIGHTS)}');
    expect(lifeWiki).toContain('onClick={() => navigate(RoutePath.SANCTUARY)}');
  });
});
