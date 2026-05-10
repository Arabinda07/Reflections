import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('polish contract', () => {
  it('labels mobile CreateNote icon controls for assistive tech', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('aria-label="Back to notes"');
    expect(createNote).toContain('aria-label="Remove cover image"');
    expect(createNote).toContain('aria-label="Open reflection options"');
    expect(createNote).toContain('aria-label="Show another writing prompt"');
    expect(createNote).toContain('aria-label="Save reflection"');
    expect(createNote).toContain('aria-label="Reflection title"');
    expect(createNote).toContain('ariaLabel="Reflection body"');
    expect(createNote).toContain('aria-label={`Remove ${tag} tag`}');
  });

  it('keeps startup from showing a black empty media frame before video is ready', () => {
    const startupScreen = read('components/ui/StartupScreen.tsx');
    const appLaunch = read('src/native/appLaunch.ts');

    expect(startupScreen).toContain('src="/assets/videos/sanctuary.webp"');
    expect(startupScreen).toContain('poster="/assets/videos/sanctuary.webp"');
    expect(startupScreen).toContain('className="absolute inset-0 z-0 h-full w-full object-cover opacity-85"');
    expect(startupScreen).toContain('isVideoReady');
    expect(startupScreen).toContain('onLoadedData={() => setIsVideoReady(true)}');
    expect(startupScreen).toContain("isVideoReady ? 'opacity-85' : 'opacity-0'");
    expect(startupScreen).not.toContain('isPosterReady');
    expect(startupScreen).not.toContain('setIsPosterReady');
    expect(startupScreen).not.toContain("isPosterReady && !isVideoReady ? 'opacity-85' : 'opacity-0'");
    expect(startupScreen).toContain('opacity-0');
    expect(startupScreen).toContain('startup-ambient-wash');
    expect(startupScreen).not.toContain('animate-pulse');
    expect(appLaunch).toContain('NATIVE_STARTUP_MIN_MS = 650');
  });

  it('uses the destination writing surface while Create Note auth and route chunks load', () => {
    const app = read('App.tsx');
    const protectedRoute = read('components/auth/ProtectedRoute.tsx');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');

    expect(app).toContain('const writingRouteFallback');
    expect(app).toContain('surface-scope-paper page-wash min-h-[100dvh] bg-body');
    expect(app).toContain('const withWritingProtectedRoute');
    expect(app).toContain('path={RoutePath.CREATE_NOTE} element={withWritingProtectedRoute(<CreateNote />)}');
    expect(app).toContain('path={RoutePath.EDIT_NOTE} element={withWritingProtectedRoute(<CreateNote />)}');

    expect(protectedRoute).toContain('fallback?: React.ReactNode;');
    expect(protectedRoute).toContain('return <>{fallback}</>;');

    expect(dashboardLayout).toContain("const routeTransitionClass = isWritingRoute ? '' : 'animate-in fade-in duration-300 ease-out-expo';");
    expect(dashboardLayout).toContain('className={`flex-1 flex flex-col w-full ${routeTransitionClass}`.trim()}');
  });
});
