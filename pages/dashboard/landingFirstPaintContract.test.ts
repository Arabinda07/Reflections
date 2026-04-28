import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('landing first-paint contract', () => {
  it('keeps lazy route waits inside the app shell instead of replacing the router', () => {
    const app = read('App.tsx');
    const protectedRoute = read('components/auth/ProtectedRoute.tsx');
    const home = read('pages/dashboard/Home.tsx');

    expect(existsSync(path.resolve(process.cwd(), 'components/ui/RouteLoadingFrame.tsx'))).toBe(true);
    expect(app).toContain("import { RouteLoadingFrame } from './components/ui/RouteLoadingFrame';");
    expect(app).toContain('const withRouteFallback = (element: React.ReactNode) => (');
    expect(app).toContain('fallback={<RouteLoadingFrame />}');
    expect(app).not.toContain('const PageLoader');
    expect(app).not.toContain('<Suspense fallback={<PageLoader />}>');

    expect(protectedRoute).toContain("import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';");
    expect(protectedRoute).toContain('return <RouteLoadingFrame />;');
    expect(protectedRoute).not.toContain('return null;');
    expect(protectedRoute).not.toContain('StartupScreen is covering this visually');

    expect(home).toContain("import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';");
    expect(home).toContain('return <RouteLoadingFrame />;');
    expect(home).toContain('<Suspense fallback={<RouteLoadingFrame />}>');
    expect(home).not.toContain('CircleNotch');
  });

  it('keeps guests on a stable landing frame after local auth hydration', () => {
    const authContext = read('context/AuthContext.tsx');
    const home = read('pages/dashboard/Home.tsx');

    expect(authContext).toContain('isAuthStoreHydrated: boolean');
    expect(authContext).toContain('isAuthStoreHydrated: isHydrated');
    expect(home).toContain('isAuthStoreHydrated');
    expect(home).toContain('if (!isInitialCheckDone && isAuthStoreHydrated && !isAuthenticated)');
    expect(home).toContain('return <Landing />;');
  });

  it('lets the startup overlay fade over already-rendered app content', () => {
    const authContext = read('context/AuthContext.tsx');

    expect(authContext).toContain("className=\"flex min-h-0 flex-1 flex-col\"");
    expect(authContext).toContain("pointerEvents: showStartup ? 'none' : 'auto'");
    expect(authContext).not.toContain("visibility: showStartup ? 'hidden' : 'visible'");
    expect(authContext).not.toContain('className="flex-1 contents"');
  });

  it('pins the landing hero to the poster while the video crossfades over it', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const indexHtml = read('index.html');

    expect(indexHtml).toContain('rel="preload" href="/assets/videos/landing_video.png" as="image" fetchpriority="high"');
    expect(landing).toContain('const [isHeroPosterReady, setIsHeroPosterReady] = useState(false);');
    expect(landing).toContain('const [shouldLoadHeroVideo, setShouldLoadHeroVideo] = useState(false);');
    expect(landing).toContain('const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);');
    expect(landing).toContain('fetchPriority="high"');
    expect(landing).toContain('onLoad={() => setIsHeroPosterReady(true)}');
    expect(landing).toContain("navigator as Navigator & { connection?: { saveData?: boolean } }");
    expect(landing).toContain('preload="metadata"');
    expect(landing).not.toContain('preload="auto"');
    expect(landing).toContain('opacity-90 sm:object-[64%_center]');
    expect(landing).not.toContain("isHeroPosterReady && !isHeroVideoReady ? 'opacity-90' : 'opacity-0'");
    expect(landing).toContain('onCanPlay={() => setIsHeroVideoReady(true)}');
    expect(landing).toContain('onPlaying={() => setIsHeroVideoReady(true)}');
    expect(landing).toContain("isHeroVideoReady ? 'opacity-90' : 'opacity-0'");
  });

  it('allows the landing content to grow vertically while clipping horizontal bleed', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('<main className="relative min-h-[100dvh] overflow-x-hidden');
    expect(landing).not.toContain('<main className="relative min-h-[100dvh] overflow-hidden');
  });

  it('clips hero media to the page frame instead of letting it bleed into the shell', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('h-[100dvh] min-h-[100dvh]');
    expect(layout).toContain('min-h-0 w-full flex-1 flex-col overflow-y-auto');
    expect(landing).toContain('relative isolate min-h-[100dvh] w-full overflow-hidden bg-body');
    expect(landing).toContain('h-full min-h-full w-full min-w-full object-cover');
    expect(homeAuthenticated).toContain('relative isolate h-[60dvh] min-h-[450px] w-full overflow-hidden bg-body');
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
