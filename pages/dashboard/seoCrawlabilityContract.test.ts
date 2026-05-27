import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPublicCanonicalUrl,
  CANONICAL_PUBLIC_ORIGIN,
  FALLBACK_PUBLIC_ORIGIN,
} from '../../src/config/publicSite.js';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const sitemapLocations = () => {
  const sitemap = read('public/sitemap.xml');
  return Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), ([, loc]) => loc);
};

const BARE_PUBLIC_HOST = 'reflections-sanctuary.space';

describe('SEO crawlability contract', () => {
  it('publishes only public canonical routes in the static sitemap', () => {
    const sitemap = read('public/sitemap.xml');
    const locations = sitemapLocations();

    expect(sitemap).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(locations).toEqual([
      `${CANONICAL_PUBLIC_ORIGIN}/`,
      `${CANONICAL_PUBLIC_ORIGIN}/faq`,
      `${CANONICAL_PUBLIC_ORIGIN}/privacy`,
      `${CANONICAL_PUBLIC_ORIGIN}/about`,
    ]);
    expect(sitemap).not.toContain('localhost');
    expect(sitemap).not.toContain(FALLBACK_PUBLIC_ORIGIN);

    for (const privateRoute of [
      '/home',
      '/notes',
      '/notes/new',
      '/account',
      '/insights',
      '/release',
      '/letters',
      '/wiki',
      '/sanctuary',
      '/login',
      '/signup',
    ]) {
      expect(locations).not.toContain(`${CANONICAL_PUBLIC_ORIGIN}${privateRoute}`);
    }
  });

  it('keeps robots.txt open for public pages and pointed at the static sitemap', () => {
    const robots = read('public/robots.txt');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${CANONICAL_PUBLIC_ORIGIN}/sitemap.xml`);
    expect(robots).toContain('Disallow: /home');
    expect(robots).toContain('Disallow: /notes');
    expect(robots).toContain('Disallow: /wiki');
    expect(robots).toContain('Disallow: /sanctuary');
    expect(robots).not.toMatch(/Disallow:\s*\/faq\b/);
    expect(robots).not.toMatch(/Disallow:\s*\/privacy\b/);
    expect(robots).not.toMatch(/Disallow:\s*\/about\b/);
    expect(robots).not.toContain(FALLBACK_PUBLIC_ORIGIN);
  });

  it('exposes a focused SEO audit script for crawl-file regressions', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

    expect(pkg.scripts['seo:audit']).toBe(
      'vitest run pages/dashboard/seoCrawlabilityContract.test.ts',
    );
  });

  it('generates static HTML snapshots for public pages after build', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const generator = read('scripts/generate-public-seo-pages.mjs');
    const copySource = read('src/config/publicSeoCopy.js');

    expect(pkg.scripts.postbuild).toBe('node scripts/generate-public-seo-pages.mjs');
    expect(generator).toContain('PUBLIC_SEO_PAGES');
    expect(copySource).toContain("path: '/'");
    expect(copySource).toContain("path: '/faq'");
    expect(copySource).toContain("path: '/privacy'");
    expect(copySource).toContain("path: '/about'");
    expect(generator).toContain('<meta name="robots" content="index, follow" />');
    expect(generator).toContain('renderStaticLandingShell');
    expect(generator).toContain('<main id="public-seo-content" data-seo-snapshot="true" class="sr-only">');
    expect(copySource).toContain('Reflections - Private Journal for Writing and Mood Notes');
    expect(copySource).toContain('Reflections FAQ - Journaling, AI, Privacy, and Pricing');
    expect(copySource).toContain('Reflections Privacy - Notes, AI, Payments, and Deletion');
    expect(copySource).toContain('About Reflections - A Private Journal by Arabinda');
  });

  it('keeps generated SEO snapshot content out of the visual page flow', () => {
    const html = read('index.html');
    const generator = read('scripts/generate-public-seo-pages.mjs');

    expect(generator).toContain('data-seo-snapshot="true" class="sr-only"');
    expect(html).toContain('/* Hide SEO content from users but keep for crawlers (sr-only pattern) */');
    expect(html).toContain('#public-seo-content');
    expect(html).toContain('position: absolute;');
    expect(html).toContain('width: 1px;');
    expect(html).toContain('height: 1px;');
    expect(html).toContain('clip: rect(0, 0, 0, 0);');
    expect(html).not.toContain('width: min(100%, 960px);');
    expect(html).not.toContain('padding: 5rem 1.5rem 6rem;');
  });

  it('keeps landing-only hero preloads out of non-home SEO snapshots', () => {
    const generator = read('scripts/generate-public-seo-pages.mjs');

    expect(generator).toContain('const stripLandingHeroPreloads = (html) =>');
    expect(generator).toContain("page.path === '/' ? html : stripLandingHeroPreloads(html)");
    expect(generator).toContain('landing_video_mobile\\.webp');
    expect(generator).toContain('landing_video\\.webp');
  });

  it('lets Vercel serve public SEO snapshots while explicitly rewriting app routes', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      cleanUrls?: boolean;
      rewrites: Array<{ source: string; destination: string }>;
    };
    const rewriteSources = vercel.rewrites.map((rewrite) => rewrite.source);

    expect(vercel.cleanUrls).toBe(true);
    expect(vercel.rewrites.every((rewrite) => rewrite.destination === '/index.html')).toBe(true);
    expect(rewriteSources).toEqual(expect.arrayContaining([
      '/login',
      '/signup',
      '/reset-password',
      '/auth/:path*',
      '/home',
      '/notes',
      '/notes/:path*',
      '/account',
      '/insights',
      '/release',
      '/letters',
      '/wiki',
      '/wiki/:path*',
      '/sanctuary',
      '/sanctuary/:path*',
    ]));
    expect(rewriteSources).not.toContain('/faq');
    expect(rewriteSources).not.toContain('/privacy');
    expect(rewriteSources).not.toContain('/about');
    expect(rewriteSources).not.toContain('/(.*)');
  });

  it('permanently redirects the bare production host to the canonical www host', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      redirects?: Array<{
        source: string;
        destination: string;
        statusCode?: number;
        has?: Array<{ type: string; value: string }>;
      }>;
      rewrites: Array<{ source: string; destination: string }>;
    };
    const topLevelKeys = Object.keys(vercel);
    const bareHostRedirect = vercel.redirects?.[0];

    expect(topLevelKeys.indexOf('redirects')).toBeLessThan(topLevelKeys.indexOf('rewrites'));
    expect(bareHostRedirect).toEqual({
      source: '/(.*)',
      destination: `${CANONICAL_PUBLIC_ORIGIN}/$1`,
      statusCode: 301,
      has: [
        {
          type: 'host',
          value: BARE_PUBLIC_HOST,
        },
      ],
    });
    expect(vercel.rewrites.map((rewrite) => rewrite.source)).not.toContain('/(.*)');
  });

  it('generates noindex app-shell fallbacks for cold app route requests', () => {
    const generator = read('scripts/generate-public-seo-pages.mjs');

    expect(generator).toContain('const appShellRoutes = [');
    expect(generator).toContain("path: '/login'");
    expect(generator).toContain("path: '/signup'");
    expect(generator).toContain("path: '/auth/callback'");
    expect(generator).toContain("path: '/home'");
    expect(generator).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(generator).toContain('data-app-shell-fallback="true"');
    expect(generator).toContain('outputFilesForAppPath');
  });

  it('uses real public anchors from the landing page to crawlable public routes', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('href={RoutePath.FAQ}');
    expect(landing).not.toContain('navigate(RoutePath.FAQ)');
  });

  it('explicitly allows AI search crawlers in robots.txt', () => {
    const robots = read('public/robots.txt');

    for (const bot of ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended']) {
      expect(robots).toContain(`User-agent: ${bot}`);
    }
  });

  it('provides an llms.txt context file for AI systems', () => {
    const llms = read('public/llms.txt');

    expect(llms).toContain('Reflections');
    expect(llms).toContain('journal');
    expect(llms).toContain('AI stays optional and writing comes first');
    expect(llms).toContain(`${CANONICAL_PUBLIC_ORIGIN}/`);
    expect(llms).not.toContain(FALLBACK_PUBLIC_ORIGIN);
    expect(llms).toContain('Pricing');
  });

  it('provides a machine-readable pricing file', () => {
    const pricing = read('public/pricing.md');

    expect(pricing).toContain('Free');
    expect(pricing).toContain('Pro');
    expect(pricing).toContain('30 notes');
    expect(pricing).toContain('₹49/week after a 3-day trial');
    expect(pricing).toContain('₹149/month after a 3-day trial');
    expect(pricing).toContain('No payment is due during the trial');
  });

  it('excludes llms.txt and pricing.md from the SPA rewrite', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      rewrites: Array<{ source: string; destination: string }>;
    };
    const rewriteSources = vercel.rewrites.map((rewrite) => rewrite.source);

    expect(rewriteSources).not.toContain('/llms.txt');
    expect(rewriteSources).not.toContain('/pricing.md');
    expect(rewriteSources.some((source) => source.includes('(.*)'))).toBe(false);
  });

  it('uses a 1200×630 OG social card image, not the app icon', () => {
    const html = read('index.html');

    expect(html).toContain('og:image:width" content="1200"');
    expect(html).toContain('og:image:height" content="630"');
    expect(html).toContain('og-social.webp');
    expect(html).not.toMatch(/og:image:width" content="512"/);
  });

  it('emits the canonical custom domain in the document head and structured data', () => {
    const html = read('index.html');

    expect(html).toContain(`<link rel="canonical" href="${buildPublicCanonicalUrl('/')}" />`);
    expect(html).toContain(`property="og:url" content="${buildPublicCanonicalUrl('/')}"`);
    expect(html).toContain(`content="${CANONICAL_PUBLIC_ORIGIN}/assets/images/og-social.webp"`);
    expect(html).toContain(`"url": "${CANONICAL_PUBLIC_ORIGIN}/"`);
    expect(html).toContain(`"logo": "${CANONICAL_PUBLIC_ORIGIN}/icons/icon-512.png"`);
    expect(html).not.toContain(FALLBACK_PUBLIC_ORIGIN);
  });

  it('includes dateModified in structured data schemas', () => {
    const html = read('index.html');

    expect(html).toContain('"dateModified"');
  });

  it('does not expose a SearchAction pointing to a private route', () => {
    const html = read('index.html');

    expect(html).not.toContain('"SearchAction"');
  });

  it('sets per-page document meta via useDocumentMeta on every public page', () => {
    for (const [file, path] of [
      ['pages/dashboard/Landing.tsx', 'HOME_SEO.path'],
      ['pages/dashboard/FAQ.tsx', 'FAQ_SEO.path'],
      ['pages/dashboard/PrivacyPolicy.tsx', 'PRIVACY_SEO.path'],
      ['pages/dashboard/AboutArabinda.tsx', 'ABOUT_SEO.path'],
    ] as const) {
      const source = read(file);
      expect(source).toContain('useDocumentMeta');
      expect(source).toContain('PUBLIC_SEO_COPY');
      expect(source).toContain(`path: ${path}`);
    }
  });

  it('shows a visible last-updated date on FAQ, Privacy, and About pages', () => {
    for (const file of [
      'pages/dashboard/FAQ.tsx',
      'pages/dashboard/PrivacyPolicy.tsx',
      'pages/dashboard/AboutArabinda.tsx',
    ]) {
      const source = read(file);
      expect(source).toMatch(/Last updated/i);
    }
  });

  it('renders a global footer with crawlable links to all public routes', () => {
    const footer = read('components/ui/PublicFooter.tsx');
    const header = read('components/ui/PublicHeader.tsx');

    expect(footer).toContain('Public pages');
    expect(footer).toContain('const homeHref = usePublicHomePath();');
    expect(footer).toContain("href: RoutePath.FAQ");
    expect(footer).toContain("href: RoutePath.ABOUT");
    expect(footer).toContain("href: RoutePath.PRIVACY");
    expect(header).toContain('Public navigation');
    expect(header).toContain('Mobile public navigation');
    expect(header).toContain('href={item.href}');
    expect(header).toContain('const homeHref = usePublicHomePath();');
  });

  it('keeps FAQ guide sections with key product questions for AI extractability', () => {
    const faq = read('pages/dashboard/FAQ.tsx');
    const privacy = read('pages/dashboard/PrivacyPolicy.tsx');
    const copySource = read('src/config/publicSeoCopy.js');

    expect(faq).toContain('What is Reflections?');
    expect(copySource).toContain('What is Reflections?');
    expect(faq).toContain('Life Wiki');
    expect(faq).toContain('Plans and billing');
    expect(faq).toContain('₹49/week');
    expect(faq).toContain('₹149/month');
    expect(privacy).toContain('Razorpay handles checkout, subscription billing');
  });

  it('sends HSTS header on all routes', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    const globalHeaders = vercel.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
    const hsts = globalHeaders.find((h) => h.key === 'Strict-Transport-Security');

    expect(hsts).toBeDefined();
    expect(hsts?.value).toContain('max-age=');
  });

  it('places FAQPage schema on /faq snapshot only, not in the global shell', () => {
    const html = read('index.html');
    const generator = read('scripts/generate-public-seo-pages.mjs');
    const copySource = read('src/config/publicSeoCopy.js');

    expect(html).not.toContain('"FAQPage"');
    expect(generator).toContain('FAQPage');
    expect(generator).toContain('buildExtraSchema');
    expect(copySource).toContain('faqSchema');
  });

  it('places Article schema on /about snapshot only', () => {
    const generator = read('scripts/generate-public-seo-pages.mjs');
    const copySource = read('src/config/publicSeoCopy.js');

    expect(generator).toContain('Article');
    expect(copySource).toContain('Arabinda');
    expect(generator).toContain('datePublished');
  });

  it('keeps SEO metadata and machine-readable surfaces out of stale AI-ish positioning', () => {
    const publicSeoSurfaces = [
      read('index.html'),
      read('metadata.json'),
      read('public/llms.txt'),
      read('public/pricing.md'),
      read('src/config/publicSeoCopy.js'),
      read('scripts/generate-public-seo-pages.mjs'),
      read('pages/dashboard/Landing.tsx'),
    ].join('\n').toLowerCase();

    for (const phrase of [
      'ai-powered',
      'mental health journaling',
      'digital sanctuary',
      'personal growth',
      'mess before it has words',
      'people in their 20s',
      'feelings, but make them less loud',
      'meta name="keywords"',
    ]) {
      expect(publicSeoSurfaces).not.toContain(phrase);
    }
  });
});
