import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('landing first-paint contract', () => {
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

  it('pins the landing hero to the poster before the video crossfades in', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const indexHtml = read('index.html');

    expect(indexHtml).toContain('rel="preload" href="/assets/videos/landing_video.png" as="image" fetchpriority="high"');
    expect(landing).toContain('const [isHeroPosterReady, setIsHeroPosterReady] = useState(false);');
    expect(landing).toContain('const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);');
    expect(landing).toContain('fetchPriority="high"');
    expect(landing).toContain('onLoad={() => setIsHeroPosterReady(true)}');
    expect(landing).toContain('onLoadedData={() => setIsHeroVideoReady(true)}');
    expect(landing).toContain("isHeroPosterReady && !isHeroVideoReady ? 'opacity-90' : 'opacity-0'");
    expect(landing).toContain("isHeroVideoReady ? 'opacity-90' : 'opacity-0'");
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
