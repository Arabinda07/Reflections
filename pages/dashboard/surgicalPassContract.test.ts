import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('surgical route and landing contract', () => {
  it('adds a branded route error element to the data router shell', () => {
    const app = read('App.tsx');
    const routeErrorPath = path.resolve(process.cwd(), 'pages/RouteErrorBoundary.tsx');

    expect(app).toContain("import { RouteErrorBoundary } from './pages/RouteErrorBoundary';");
    expect(app).toContain('errorElement={<RouteErrorBoundary />}');
    expect(existsSync(routeErrorPath)).toBe(true);

    if (existsSync(routeErrorPath)) {
      const routeErrorBoundary = read('pages/RouteErrorBoundary.tsx');

      expect(routeErrorBoundary).toContain('useRouteError');
      expect(routeErrorBoundary).toContain('error404Animation');
      expect(routeErrorBoundary).toContain('Try again');
      expect(routeErrorBoundary).toContain('Return home');
    }
  });

  it('keeps CreateNote entry feedback tied to real loading only', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('const showEntryExperience = loading;');
    expect(createNote).toContain('if (showEntryExperience) {');
    expect(createNote).not.toContain('const [isBreathing');
    expect(createNote).not.toContain('setIsBreathing');
    expect(createNote).not.toContain('<OverlayFeedback isVisible={loading || isBreathing}');
    expect(createNote).toContain('DotLottieReact');
    expect(createNote).toContain("from '@/src/lottie/trail-loading.json'");
    expect(createNote).toContain('h-48 w-48');
    expect(createNote).toContain('value={content}');
  });

  it('anchors landing actions near the bottom and strengthens mobile framing', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const layout = read('layouts/DashboardLayout.tsx');

    expect(landing).toContain('pb-[calc(env(safe-area-inset-bottom)+1.75rem)]');
    expect(landing).toContain('mt-auto');
    expect(landing).toContain('object-[70%_center]');
    expect(landing).toContain('sm:object-[64%_center]');
    expect(layout).toContain('landing-nav-scrim');
  });
});
