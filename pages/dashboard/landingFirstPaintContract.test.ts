import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('landing first-paint contract', () => {
  it('keeps lazy route waits inside async routes instead of replacing the router', () => {
    const app = read('App.tsx');
    const protectedRoute = read('components/auth/ProtectedRoute.tsx');

    expect(existsSync(path.resolve(process.cwd(), 'components/ui/RouteLoadingFrame.tsx'))).toBe(true);
    expect(app).toContain("import { RouteLoadingFrame } from './components/ui/RouteLoadingFrame';");
    expect(app).toContain("import { Landing } from './pages/dashboard/Landing';");
    expect(app).toContain('const withRouteFallback = (element: React.ReactNode) => (');
    expect(app).toContain('fallback={<RouteLoadingFrame />}');
    expect(app).toContain('path={RoutePath.HOME} element={<Landing />}');
    expect(app).not.toContain('const PageLoader');
    expect(app).not.toContain('<Suspense fallback={<PageLoader />}>');

    expect(protectedRoute).toContain("import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';");
    expect(protectedRoute).toContain('return <RouteLoadingFrame />;');
    expect(protectedRoute).not.toContain('return null;');
    expect(protectedRoute).not.toContain('StartupScreen is covering this visually');
  });

  it('keeps guests on the landing frame without waiting for auth hydration', () => {
    const app = read('App.tsx');
    const landing = read('pages/dashboard/Landing.tsx');

    expect(app).not.toContain('<AuthProvider>');
    expect(app).not.toContain('<Home />');
    expect(landing).toContain("import('../../src/supabaseClient')");
    expect(landing).toContain('navigate(RoutePath.DASHBOARD, { replace: true })');
  });

  it('lets the startup overlay fade over already-rendered app content', () => {
    const authContext = read('context/AuthContext.tsx');

    expect(authContext).toContain("className=\"flex min-h-0 flex-1 flex-col\"");
    expect(authContext).toContain("const isStartupBlocking = showStartup || !startupExitDone;");
    expect(authContext).toContain("pointerEvents: isStartupBlocking ? 'none' : 'auto'");
    expect(authContext).not.toContain('opacity: showStartup ? 0 : 1');
    expect(authContext).not.toContain('transition: `opacity ${NATIVE_STARTUP_FADE_MS}ms');
    expect(authContext).not.toContain("visibility: showStartup ? 'hidden' : 'visible'");
    expect(authContext).not.toContain('className="flex-1 contents"');
  });

  it('keeps the startup poster visible while video fades above it', () => {
    const startup = read('components/ui/StartupScreen.tsx');

    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/sanctuary.webp'))).toBe(true);
    expect(startup).toContain('src="/assets/videos/sanctuary.webp"');
    expect(startup).toContain('poster="/assets/videos/sanctuary.webp"');
    expect(startup).not.toContain('/assets/videos/sanctuary.png');
    expect(startup).toContain('className="absolute inset-0 z-0 h-full w-full object-cover opacity-85"');
    expect(startup).toContain("isVideoReady ? 'opacity-85' : 'opacity-0'");
    expect(startup).not.toContain('isPosterReady');
    expect(startup).not.toContain('setIsPosterReady');
    expect(startup).not.toContain("isPosterReady && !isVideoReady ? 'opacity-85' : 'opacity-0'");
  });

  it('pins the landing hero to the poster while the video crossfades over it', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const indexHtml = read('index.html');

    expect(indexHtml).toContain('rel="preload" href="/assets/videos/landing_video_mobile.webp" as="image" type="image/webp" fetchpriority="high" media="(max-width: 1023px)"');
    expect(indexHtml).toContain('rel="preload" href="/assets/videos/landing_video.webp" as="image" type="image/webp" fetchpriority="high" media="(min-width: 1024px)"');
    expect(landing).toContain('const [shouldLoadHeroVideo, setShouldLoadHeroVideo] = useState(false);');
    expect(landing).toContain('const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);');
    expect(landing).not.toContain("const desktopHeroVideoQuery = window.matchMedia('(min-width: 1024px)');");
    expect(landing).toContain('fetchPriority="high"');
    expect(landing).toContain('<source srcSet="/assets/videos/landing_video.webp" type="image/webp" media="(min-width: 1024px)" />');
    expect(landing).toContain('<source srcSet="/assets/videos/landing_video_mobile.webp" type="image/webp" media="(max-width: 1023px)" />');
    expect(landing).toContain('src="/assets/videos/landing_video_mobile.webp"');
    expect(landing).not.toContain('poster="/assets/videos/landing_video.webp"');
    expect(landing).toContain('src="/assets/videos/landing_video_mobile.webm" type="video/webm" media="(max-width: 1023px)"');
    expect(landing).toContain('src="/assets/videos/landing_video_mobile.mp4" type="video/mp4" media="(max-width: 1023px)"');
    expect(landing).toContain('src="/assets/videos/landing_video.webm" type="video/webm" media="(min-width: 1024px)"');
    expect(landing).not.toContain('landing_video.mp4');
    expect(landing).not.toContain('isHeroPosterReady');
    expect(landing).not.toContain('setIsHeroPosterReady');
    expect(landing).not.toContain('onLoad={() => setIsHeroPosterReady(true)}');
    expect(landing).toContain("navigator as Navigator & { connection?: { saveData?: boolean } }");
    expect(landing).toContain("const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');");
    expect(landing).toContain('if (saveData || reducedMotionQuery.matches) return;');
    expect(landing).toContain('requestIdleCallback');
    expect(landing).toContain('cancelIdleCallback');
    expect(landing).toContain('preload="metadata"');
    expect(landing).not.toContain('preload="auto"');
    expect(landing).toContain("isHeroVideoReady ? 'opacity-0' : 'opacity-100'");
    expect(landing).toContain('sm:object-[64%_center]');
    expect(landing).not.toContain("isHeroPosterReady && !isHeroVideoReady ? 'opacity-90' : 'opacity-0'");
    expect(landing).toContain('onCanPlay={(event) => {');
    expect(landing).toContain('onPlaying={() => setIsHeroVideoReady(true)}');
    expect(landing).toContain("isHeroVideoReady ? 'opacity-90' : 'opacity-0'");
    expect(landing).not.toContain('poster="/assets/videos/landing_video.png"');
  });

  it('renders landing hero copy and calls to action on the first paint', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).not.toContain('const staggerContainer');
    expect(landing).not.toContain('const staggerLine');
    expect(landing).not.toContain('initial="hidden"');
    expect(landing).not.toContain('variants={staggerLine}');
    expect(landing).not.toContain('initial={{ opacity: 0, y: 20 }}');
    expect(landing).not.toContain('initial={{ opacity: 0, y: 24 }}');
    expect(landing).not.toContain("willChange: 'transform, opacity'");
  });

  it('allows the landing content to grow vertically while clipping horizontal bleed', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toMatch(/<div role="region" aria-label="Welcome" className="[^"]*min-h-\[100dvh\][^"]*overflow-x-hidden/);
    expect(landing).not.toMatch(/<div role="region" aria-label="Welcome" className="[^"]*min-h-\[100dvh\][^"]*overflow-hidden/);
  });

  it('clips hero media to the page frame instead of letting it bleed into the shell', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('h-[100dvh] min-h-[100dvh]');
    expect(layout).toContain('min-h-0 w-full flex-1 flex-col overflow-y-auto');
    expect(landing).toContain('relative isolate min-h-[100dvh] w-full overflow-hidden bg-body');
    expect(landing).toContain('h-full min-h-full w-full min-w-full transform-gpu object-cover');
    expect(homeAuthenticated).toContain('relative isolate h-[56dvh] min-h-[360px] w-full overflow-hidden bg-body sm:h-[60dvh] sm:min-h-[450px]');
    expect(homeAuthenticated).toContain('src="/assets/videos/field.png"');
    expect(homeAuthenticated).toContain('h-full min-h-full w-full min-w-full object-cover object-center');
    expect(homeAuthenticated).toContain('object-cover object-center opacity-100');
    expect(homeAuthenticated).not.toContain('isHeroPosterReady');
    expect(homeAuthenticated).not.toContain("isHeroPosterReady && !isHeroVideoReady ? 'opacity-100' : 'opacity-0'");
    expect(homeAuthenticated).not.toContain("filter: 'blur(10px) brightness(0.8)'");
  });

  it('keeps non-critical third-party scripts off the initial document', () => {
    const indexHtml = read('index.html');
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');

    expect(indexHtml).not.toContain('https://checkout.razorpay.com/v1/checkout.js');
    expect(indexHtml).not.toContain('@dotlottie/player-component');
    expect(proUpgrade).toContain('const razorpayLoaded = await loadRazorpay();');
    expect(proUpgrade).toContain("throw new Error('Could not load Razorpay checkout. Please try again.');");
  });
});
