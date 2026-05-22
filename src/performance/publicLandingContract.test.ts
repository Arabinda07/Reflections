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
    const landingRoute = read('pages/dashboard/LandingRoute.tsx');

    expect(existsSync(shellPath)).toBe(true);
    expect(app).toContain("import { LandingRoute } from './pages/dashboard/LandingRoute';");
    expect(app).toContain('path={RoutePath.HOME} element={<LandingRoute />}');
    expect(app).toContain("const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell')");
    expect(landingRoute).toContain("import { Landing } from './Landing';");
    expect(landingRoute).toContain('hasStrongStoredAuthSessionHint(),');
    expect(landingRoute).toContain("await import('../../src/supabaseClient')");
    expect(landingRoute).toContain('Promise.race([');
    expect(landingRoute).toContain('RouteLoadingFrame');
    expect(landingRoute).toContain('navigate(RoutePath.DASHBOARD, { replace: true, state: location.state });');

    expect(app).not.toContain("import { PWAInstallProvider } from './context/PWAInstallContext';");
    expect(app).not.toContain("import { ProtectedRoute } from './components/auth/ProtectedRoute';");
    expect(app).not.toContain("import { ToastProvider } from './components/ui/Toast';");
    expect(app).not.toContain("import { DashboardLayout } from './layouts/DashboardLayout';");
    expect(app).toContain("import { PublicAppShell } from './layouts/PublicAppShell';");
    expect(app).not.toContain("const PublicAppShell = lazy(() => import('./layouts/PublicAppShell')");
    expect(app).not.toContain("import { MotionConfig } from 'motion/react';");
    expect(app).not.toContain('<MotionConfig reducedMotion="user">');
    expect(app).not.toContain("import { useSync } from './hooks/useSync';");
    expect(app).not.toContain("import { useNativeStatusBar } from './hooks/useNativeStatusBar';");
    expect(app).not.toContain("import { useNativeOAuthListener } from './hooks/useNativeOAuthListener';");

    const shell = read('layouts/AuthenticatedAppShell.tsx');

    expect(shell).toContain("import { PWAInstallProvider } from '../context/PWAInstallContext';");
    expect(shell).toContain("import { DashboardLayout } from './DashboardLayout';");
    expect(shell).not.toContain("import { MotionConfig } from 'motion/react';");
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

  it('keeps the mobile landing CTA cluster compact and visually grouped', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const indexHtml = read('index.html');

    expect(landing).toContain('items-start gap-4 sm:max-w-none sm:flex-row');
    expect(landing).toContain('h-14 min-w-0 items-center');
    expect(landing).toContain('px-8 font-sans text-ui-base font-bold');
    expect(landing).toContain('sm:h-16 sm:px-10 sm:text-btn-lg');
    expect(landing).toContain('ml-2.5 h-[1.125rem] w-[1.125rem]');
    expect(landing).toContain('flex w-full items-center justify-between gap-4 sm:w-auto');
    expect(landing).not.toContain('mt-4 flex w-full items-center justify-between gap-5');

    expect(indexHtml).toContain('gap: 1rem;');
    expect(indexHtml).toContain('height: 3.5rem;');
    expect(indexHtml).toContain('padding-inline: 2rem;');
    expect(indexHtml).toContain('font-size: 1rem;');
    expect(indexHtml).toContain('height: 4rem;');
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
    const authHints = read('src/utils/authHints.ts');
    const landingRoute = read('pages/dashboard/LandingRoute.tsx');
    const seoGenerator = read('scripts/generate-public-seo-pages.mjs');

    expect(landing).not.toContain("import { hasStoredAuthSessionHint } from '../../src/utils/authHints';");
    expect(authHints).toContain('export const hasStoredAuthSessionHint = (');
    expect(authHints).toContain('export const hasStrongStoredAuthSessionHint = (');
    expect(authHints).toContain('export const syncStoredAuthSessionHintStatus = (');
    expect(authHints).toContain("export const AUTH_HINT_CHANGE_EVENT = 'reflections:auth-hint-change';");
    expect(authHints).toContain("export const AUTH_HINT_PENDING_CLASS = 'auth-hint-pending';");
    expect(authHints).toContain('export const usePublicHomePath = ()');
    expect(authHints).toContain('export const clearLandingAuthHintPendingClass = ()');
    expect(authHints).toContain("key?.startsWith('sb-') && key.endsWith('-auth-token')");
    expect(authHints).toContain('export const getPublicHomePath = (');
    expect(authHints).toContain('export const resolveAuthHintLandingPath = async (');
    expect(landingRoute).toContain('if (!isCheckingSession)');
    expect(landingRoute).toContain("await import('../../src/supabaseClient')");
    expect(landingRoute).toContain('clearLandingAuthHintPendingClass();');
    expect(seoGenerator).toContain("document.documentElement.classList.add('auth-hint-pending');");
    expect(seoGenerator).toContain('landing-auth-gate');
  });

  it('keeps decorative video out of the initial landing network burst', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).not.toContain('window.requestAnimationFrame(() => {\n      setShouldLoadHeroVideo(true);');
    expect(landing).toContain('const videoDelay = window.setTimeout(() => {');
    expect(landing).toContain('cancelVideoLoad = scheduleIdleTask(() => setShouldLoadHeroVideo(true), 3000);');
    expect(landing).toContain('}, 9000);');
    expect(landing).toContain('cancelVideoLoad?.();');
  });

  it('keeps first-paint media and font hints mobile friendly', () => {
    const indexHtml = read('index.html');

    expect(indexHtml).not.toContain('landing_video_mobile.webp" as="image"');
    expect(indexHtml).not.toContain('landing_video.webp" as="image"');
    expect(indexHtml).toContain('rel="preload" href="/assets/fonts/Manrope-Variable.woff2"');
    expect(indexHtml).toContain('rel="preload" href="/assets/fonts/Spectral-Regular.woff2"');
    expect(indexHtml).toContain('rel="preload" href="/assets/fonts/Spectral-Italic.woff2"');
  });

  it('keeps the global stylesheet render-blocking after the inline landing critical CSS', () => {
    const indexHtml = read('index.html');
    const viteConfig = read('vite.config.ts');
    const criticalStyleIndex = indexHtml.indexOf('<style id="critical-landing-css">');
    const stylesheetIndex = indexHtml.indexOf('<link rel="stylesheet" href="/index.css" />');

    expect(criticalStyleIndex).toBeGreaterThan(-1);
    expect(stylesheetIndex).toBeGreaterThan(criticalStyleIndex);
    expect(indexHtml).toContain('.public-shell');
    expect(indexHtml).toContain('[aria-label="Welcome"]');
    expect(indexHtml).toContain('button[aria-label="Begin writing"]');
    expect(indexHtml).toContain('.video-mask--mobile');
    expect(indexHtml).toContain('.public-header nav[aria-label="Public navigation"] a[aria-current="page"]');
    expect(indexHtml).toContain('.public-header nav[aria-label="Public navigation"] > a[href="/signup"]');
    expect(indexHtml).toContain('scrollbar-gutter: stable;');
    expect(viteConfig).not.toContain('nonBlockingGlobalCssPlugin');
    expect(viteConfig).not.toContain('media="print"');
    expect(viteConfig).not.toContain("this.media='all'");
    expect(viteConfig).not.toContain('transformIndexHtml');
  });

  it('keeps component-only chrome out of the public landing stylesheet', () => {
    const scopedCssFiles = [
      'components/ui/modal-sheet.css',
      'components/ui/overlay-feedback.css',
      'components/ui/ambient-music.css',
      'components/ui/quill-snow.css',
    ];

    for (const filePath of scopedCssFiles) {
      expect(existsSync(path.resolve(process.cwd(), filePath)), `${filePath} should exist`).toBe(true);
    }

    const indexCss = read('index.css');
    const modalCss = read('components/ui/modal-sheet.css');
    const overlayCss = read('components/ui/overlay-feedback.css');
    const audioCss = read('components/ui/ambient-music.css');
    const quillCss = read('components/ui/quill-snow.css');
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const overlayFeedback = read('components/ui/OverlayFeedback.tsx');
    const ambientMusicButton = read('components/ui/AmbientMusicButton.tsx');
    const editor = read('components/ui/Editor.tsx');

    expect(indexCss).not.toContain('.modal-sheet-root');
    expect(indexCss).not.toContain('.overlay-feedback');
    expect(indexCss).not.toContain('.audio-popup');
    expect(indexCss).not.toContain('.ql-toolbar.ql-snow');
    expect(indexCss).toMatch(/(^|\n)\s*\.no-scroll\s*{/);
    expect(indexCss).toMatch(/(^|\n)\s*\.no-scroll\s+#main-content\s*{/);

    expect(modalCss).not.toContain('.no-scroll');
    expect(modalCss).toContain('.modal-sheet-root');
    expect(overlayCss).toContain('.overlay-feedback');
    expect(audioCss).toContain('.audio-popup');
    expect(quillCss).toContain('.ql-toolbar.ql-snow');

    expect(modalSheet).toContain("import './modal-sheet.css';");
    expect(overlayFeedback).toContain("import './overlay-feedback.css';");
    expect(ambientMusicButton).toContain("import './ambient-music.css';");
    expect(editor).toContain("import './quill-snow.css';");
  });

  it('keeps editor-only critical styles out of the public document head', () => {
    const indexHtml = read('index.html');
    const editor = read('components/ui/Editor.tsx');

    expect(indexHtml).not.toContain('.ql-container.ql-snow');
    expect(indexHtml).not.toContain('.ql-editor {');
    expect(editor).toContain("import './quill-snow.css';");
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
