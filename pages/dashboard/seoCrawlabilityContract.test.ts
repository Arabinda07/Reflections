import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SITE_ORIGIN = 'https://reflections-ebon.vercel.app';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const sitemapLocations = () => {
  const sitemap = read('public/sitemap.xml');
  return Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), ([, loc]) => loc);
};

describe('SEO crawlability contract', () => {
  it('publishes only public canonical routes in the static sitemap', () => {
    const sitemap = read('public/sitemap.xml');
    const locations = sitemapLocations();

    expect(sitemap).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(locations).toEqual([
      `${SITE_ORIGIN}/`,
      `${SITE_ORIGIN}/faq`,
      `${SITE_ORIGIN}/privacy`,
      `${SITE_ORIGIN}/about`,
    ]);
    expect(sitemap).not.toContain('localhost');

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
      expect(locations).not.toContain(`${SITE_ORIGIN}${privateRoute}`);
    }
  });

  it('keeps robots.txt open for public pages and pointed at the static sitemap', () => {
    const robots = read('public/robots.txt');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
    expect(robots).toContain('Disallow: /home');
    expect(robots).toContain('Disallow: /notes');
    expect(robots).toContain('Disallow: /wiki');
    expect(robots).toContain('Disallow: /sanctuary');
    expect(robots).not.toMatch(/Disallow:\s*\/faq\b/);
    expect(robots).not.toMatch(/Disallow:\s*\/privacy\b/);
    expect(robots).not.toMatch(/Disallow:\s*\/about\b/);
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

    expect(pkg.scripts.postbuild).toBe('node scripts/generate-public-seo-pages.mjs');
    expect(generator).toContain("path: '/'");
    expect(generator).toContain("path: '/faq'");
    expect(generator).toContain("path: '/privacy'");
    expect(generator).toContain("path: '/about'");
    expect(generator).toContain('<meta name="robots" content="index, follow" />');
    expect(generator).toContain('<main id="public-seo-content"');
    expect(generator).toContain('Private journal for notes, mood, and reflection');
    expect(generator).toContain('FAQ about private journaling');
    expect(generator).toContain('Privacy for your private journal');
    expect(generator).toContain('About Reflections and Arabinda');
  });

  it('lets Vercel serve public SEO snapshots instead of rewriting them to the SPA shell', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      cleanUrls?: boolean;
      rewrites: Array<{ source: string; destination: string }>;
    };
    const rewriteSource = vercel.rewrites.map((rewrite) => rewrite.source).join('\n');

    expect(vercel.cleanUrls).toBe(true);
    expect(rewriteSource).toContain('sitemap\\.xml');
    expect(rewriteSource).toContain('robots\\.txt');
    expect(rewriteSource).toContain('faq$');
    expect(rewriteSource).toContain('privacy$');
    expect(rewriteSource).toContain('about$');
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
    expect(llms).toContain('https://reflections-ebon.vercel.app/');
    expect(llms).toContain('Pricing');
  });

  it('provides a machine-readable pricing file', () => {
    const pricing = read('public/pricing.md');

    expect(pricing).toContain('Free');
    expect(pricing).toContain('Pro');
    expect(pricing).toContain('30 notes');
  });

  it('excludes llms.txt and pricing.md from the SPA rewrite', () => {
    const vercel = JSON.parse(read('vercel.json')) as {
      rewrites: Array<{ source: string; destination: string }>;
    };
    const rewriteSource = vercel.rewrites.map((rewrite) => rewrite.source).join('\n');

    expect(rewriteSource).toContain('llms\\.txt');
    expect(rewriteSource).toContain('pricing\\.md');
  });

  it('uses a 1200×630 OG social card image, not the app icon', () => {
    const html = read('index.html');

    expect(html).toContain('og:image:width" content="1200"');
    expect(html).toContain('og:image:height" content="630"');
    expect(html).toContain('og-social.png');
    expect(html).not.toMatch(/og:image:width" content="512"/);
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
      ['pages/dashboard/Landing.tsx', '/'],
      ['pages/dashboard/FAQ.tsx', '/faq'],
      ['pages/dashboard/PrivacyPolicy.tsx', '/privacy'],
      ['pages/dashboard/AboutArabinda.tsx', '/about'],
    ] as const) {
      const source = read(file);
      expect(source).toContain('useDocumentMeta');
      expect(source).toContain(`path: '${path}'`);
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
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('Footer navigation');
    expect(layout).toContain('RoutePath.HOME');
    expect(layout).toContain('RoutePath.FAQ');
    expect(layout).toContain('RoutePath.ABOUT');
    expect(layout).toContain('RoutePath.PRIVACY');
  });

  it('keeps FAQ guide sections with key product questions for AI extractability', () => {
    const faq = read('pages/dashboard/FAQ.tsx');

    expect(faq).toContain('What is Reflections?');
    expect(faq).toContain('Life Wiki');
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

    expect(html).not.toContain('"FAQPage"');
    expect(generator).toContain('"FAQPage"');
    expect(generator).toContain('extraSchema');
  });

  it('places Article schema on /about snapshot only', () => {
    const generator = read('scripts/generate-public-seo-pages.mjs');

    expect(generator).toContain('"Article"');
    expect(generator).toContain('"Arabinda"');
    expect(generator).toContain('"datePublished"');
  });
});
