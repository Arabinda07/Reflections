import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const assetSize = (filePath: string) => statSync(path.resolve(process.cwd(), filePath)).size;

describe('public landing performance contract', () => {
  it('keeps the root landing route outside the authenticated app shell', () => {
    const app = read('App.tsx');
    const shellPath = path.resolve(process.cwd(), 'layouts/AuthenticatedAppShell.tsx');

    expect(existsSync(shellPath)).toBe(true);
    expect(app).toContain("import { Landing } from './pages/dashboard/Landing';");
    expect(app).toContain('path={RoutePath.HOME} element={<Landing />}');
    expect(app).toContain("const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell')");
    expect(app).not.toContain("import { AuthProvider } from './context/AuthContext';");
    expect(app).not.toContain("import { PWAInstallProvider } from './context/PWAInstallContext';");
    expect(app).not.toContain("import { ProtectedRoute } from './components/auth/ProtectedRoute';");
    expect(app).not.toContain("import { ToastProvider } from './components/ui/Toast';");
    expect(app).not.toContain("import { DashboardLayout } from './layouts/DashboardLayout';");
    expect(app).not.toContain("import { MotionConfig } from 'motion/react';");
    expect(app).not.toContain("import { useSync } from './hooks/useSync';");
    expect(app).not.toContain("import { useNativeStatusBar } from './hooks/useNativeStatusBar';");
    expect(app).not.toContain("import { useNativeOAuthListener } from './hooks/useNativeOAuthListener';");

    const shell = read('layouts/AuthenticatedAppShell.tsx');
    expect(shell).toContain("import { AuthProvider } from '../context/AuthContext';");
    expect(shell).toContain("import { PWAInstallProvider } from '../context/PWAInstallContext';");
    expect(shell).toContain("import { DashboardLayout } from './DashboardLayout';");
    expect(shell).toContain("import { MotionConfig } from 'motion/react';");
    expect(shell).toContain('useNativeStatusBar();');
    expect(shell).toContain('useNativeOAuthListener();');
  });

  it('keeps landing controls out of motion and icon vendor chunks', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).not.toContain("@phosphor-icons/react");
    expect(landing).not.toContain("components/ui/Button");
    expect(landing).not.toContain("whileHover");
    expect(landing).not.toContain("whileTap");
    expect(landing).toContain('const ArrowRightIcon');
    expect(landing).toContain('const SpeakerHighIcon');
    expect(landing).toContain('const SpeakerMutedIcon');
  });

  it('serves mobile-specific hero video without forcing the desktop poster', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('src="/assets/videos/landing_video_mobile.webm" type="video/webm" media="(max-width: 1023px)"');
    expect(landing).toContain('src="/assets/videos/landing_video_mobile.mp4" type="video/mp4" media="(max-width: 1023px)"');
    expect(landing).toContain('src="/assets/videos/landing_video.webm" type="video/webm" media="(min-width: 1024px)"');
    expect(landing).not.toContain('landing_video.mp4');
    expect(landing).not.toContain('poster="/assets/videos/landing_video.webp"');
    expect(landing).not.toContain('src="/assets/videos/landing_video.webm" type="video/webm" />');
    expect(landing).not.toContain('src="/assets/videos/landing_video.mp4" type="video/mp4" />');
  });

  it('does not import Supabase on guest landing sessions without an auth hint', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('const hasStoredAuthSessionHint = () => {');
    expect(landing).toContain("key?.startsWith('sb-') && key.endsWith('-auth-token')");
    expect(landing).toContain('if (!hasStoredAuthSessionHint())');
    expect(landing).toContain("import('../../src/supabaseClient')");
  });

  it('keeps decorative video out of the initial landing network burst', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).not.toContain('window.requestAnimationFrame(() => {\n      setShouldLoadHeroVideo(true);');
    expect(landing).toContain('const videoDelay = window.setTimeout(() => {');
    expect(landing).toContain('cancelVideoLoad = scheduleIdleTask(() => setShouldLoadHeroVideo(true), 1800);');
    expect(landing).toContain('}, 3200);');
    expect(landing).toContain('cancelVideoLoad?.();');
  });

  it('keeps first-paint media and font hints mobile friendly', () => {
    const indexHtml = read('index.html');

    expect(indexHtml).toContain('rel="preload" href="/assets/videos/landing_video_mobile.webp" as="image" type="image/webp" fetchpriority="high" media="(max-width: 1023px)"');
    expect(indexHtml).toContain('rel="preload" href="/assets/videos/landing_video.webp" as="image" type="image/webp" fetchpriority="high" media="(min-width: 1024px)"');
    expect(indexHtml).toContain('rel="preload" href="/assets/fonts/Manrope-Variable.woff2"');
    expect(indexHtml).toContain('rel="preload" href="/assets/fonts/Spectral-Italic.woff2"');
    expect(indexHtml).not.toContain('rel="preload" href="/assets/fonts/Spectral-Regular.woff2"');
  });

  it('keeps generated mobile video assets inside the mobile payload budget', () => {
    const mobileWebm = 'public/assets/videos/landing_video_mobile.webm';
    const mobileMp4 = 'public/assets/videos/landing_video_mobile.mp4';

    expect(existsSync(path.resolve(process.cwd(), mobileWebm))).toBe(true);
    expect(existsSync(path.resolve(process.cwd(), mobileMp4))).toBe(true);
    expect(assetSize(mobileWebm)).toBeLessThanOrEqual(850 * 1024);
    expect(assetSize(mobileMp4)).toBeLessThanOrEqual(1100 * 1024);
  });
});
