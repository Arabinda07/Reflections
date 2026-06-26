import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPublicCanonicalUrl,
  CANONICAL_PUBLIC_ORIGIN,
} from '../src/config/publicSite.js';
import {
  PUBLIC_APP_ROUTE_DESCRIPTION,
  PUBLIC_APP_ROUTE_SOCIAL_DESCRIPTION,
  PUBLIC_SEO_COPY,
  PUBLIC_SEO_PAGES,
} from '../src/config/publicSeoCopy.js';
import {
  AUTH_HINT_STALE_STORAGE_KEY,
  AUTH_HINT_STALE_VALUE,
} from '../src/config/authHintKeys.js';

const INDEX_FOLLOW_ROBOTS_META = '<meta name="robots" content="index, follow" />';
const NOINDEX_NOFOLLOW_ROBOTS_META = '<meta name="robots" content="noindex, nofollow" />';
const distDir = new URL('../dist/', import.meta.url);

const publicPages = PUBLIC_SEO_PAGES;

const appShellRoutes = [
  { path: '/dashboard', title: 'Opening Reflections' },
  { path: '/login', title: 'Sign in to Reflections' },
  { path: '/signup', title: 'Sign up for Reflections' },
  { path: '/reset-password', title: 'Reset your Reflections password' },
  { path: '/auth/callback', title: 'Finishing sign in' },
  { path: '/home', title: 'Opening your Reflections home' },
  { path: '/notes', title: 'Opening your notes' },
  { path: '/notes/new', title: 'Opening a new note' },
  { path: '/account', title: 'Opening account settings' },
  { path: '/insights', title: 'Opening insights' },
  { path: '/release', title: 'Opening Release Mode' },
  { path: '/letters', title: 'Opening future letters' },
  { path: '/wiki', title: 'Opening Life Wiki' },
  { path: '/sanctuary', title: 'Opening Life Wiki' },
  { path: '/relationships', title: 'Opening relationships' },
  { path: '/recover-private-writing', title: 'Recovering private writing' },
];

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const setMetaName = (html, name, content) =>
  html.replace(
    new RegExp(`<meta name="${name}" content="[^"]*"\\s*/?>`),
    `<meta name="${name}" content="${escapeHtml(content)}" />`,
  );

const setMetaProperty = (html, property, content) =>
  html.replace(
    new RegExp(`<meta property="${property}" content="[^"]*"\\s*/?>`),
    `<meta property="${property}" content="${escapeHtml(content)}" />`,
  );

const setCanonical = (html, href) =>
  html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(href)}" />`,
  );

const setRobotsMeta = (html, metaTag = INDEX_FOLLOW_ROBOTS_META) =>
  html.replace(/<meta name="robots" content="[^"]*"\s*\/?>/, metaTag);

const stripLandingHeroPreloads = (html) =>
  html
    .replace(/\n\s*<link rel="preload" href="\/assets\/videos\/landing_video_mobile\.webp"[^>]*\/>/, '')
    .replace(/\n\s*<link rel="preload" href="\/assets\/videos\/landing_video\.webp"[^>]*\/>/, '');

const buildExtraSchema = (page) => {
  if (page.faqSchema) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqSchema.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (page.articleSchema) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.articleSchema.headline,
      author: { '@type': 'Person', name: page.articleSchema.authorName },
      datePublished: page.articleSchema.datePublished,
      dateModified: page.articleSchema.dateModified,
      publisher: {
        '@type': 'Organization',
        name: 'Reflections',
        url: `${CANONICAL_PUBLIC_ORIGIN}/`,
      },
      description: page.articleSchema.description,
    });
  }

  return null;
};

const renderComparisonTable = (comparison) => {
  if (!comparison) {
    return '';
  }

  const head = comparison.headers
    .map((header) => `<th scope="col">${escapeHtml(header)}</th>`)
    .join('');
  const body = comparison.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, index) =>
            index === 0
              ? `<th scope="row">${escapeHtml(cell)}</th>`
              : `<td>${escapeHtml(cell)}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');

  return `
        <table>
          ${comparison.caption ? `<caption>${escapeHtml(comparison.caption)}</caption>` : ''}
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>`;
};

const renderSeoContent = (page) => {
  const navLinks = publicPages
    .map((item) => `<a href="${item.path}">${item.path === '/' ? 'Home' : escapeHtml(item.h1)}</a>`)
    .join(' ');
  const sections = page.sections
    .map(
      ({ title, body }) => `
        <section>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(body)}</p>
        </section>`,
    )
    .join('');

  return `
    <main id="public-seo-content" data-seo-snapshot="true" class="sr-only">
      <nav aria-label="Public pages">${navLinks}</nav>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.intro)}</p>
      ${sections}
      ${renderComparisonTable(page.comparison)}
      <p><a href="/signup">Begin writing</a></p>
    </main>`;
};

const renderLeafIcon = () => `
  <svg viewBox="0 0 256 256" aria-hidden="true" fill="currentColor">
    <path d="M223.45,40.07a8,8,0,0,0-7.52-7.52C139.8,28.08,78.82,51,52.82,94a87.09,87.09,0,0,0-12.76,49A101.72,101.72,0,0,0,46.7,175.2a4,4,0,0,0,6.61,1.43l85-86.3a8,8,0,0,1,11.32,11.32L56.74,195.94,42.55,210.13a8.2,8.2,0,0,0-.6,11.1,8,8,0,0,0,11.71.43l16.79-16.79c14.14,6.84,28.41,10.57,42.56,11.07q1.67.06,3.33.06A86.93,86.93,0,0,0,162,203.18C205,177.18,227.93,116.21,223.45,40.07Z" />
  </svg>`;

const renderArrowIcon = () => `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
    <path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

const renderSpeakerMutedIcon = () => `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
    <path d="M4 10v4h4l5 4V6L8 10H4Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
    <path d="m17 10 4 4m0-4-4 4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
  </svg>`;

const LANDING_AUTH_GATE_STYLE = `
    <style id="landing-auth-gate-style">
      .landing-auth-gate {
        display: none;
      }

      html.auth-hint-pending .landing-auth-gate {
        display: flex;
        min-height: 100dvh;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background:
          radial-gradient(circle at top, oklch(0.96 0.03 135 / 0.75), transparent 55%),
          oklch(0.99 0.01 135);
        color: oklch(0.24 0.01 135);
      }

      html.dark.auth-hint-pending .landing-auth-gate {
        background:
          radial-gradient(circle at top, oklch(0.32 0.04 135 / 0.55), transparent 55%),
          oklch(0.2 0.01 135);
        color: oklch(0.93 0.01 135);
      }

      .landing-auth-gate__panel {
        width: min(100%, 32rem);
        border: 1px solid oklch(0.89 0.01 135);
        border-radius: 1.5rem;
        background: oklch(1 0 0 / 0.72);
        padding: 1.75rem;
        box-shadow: 0 20px 44px -30px rgba(0, 0, 0, 0.2);
      }

      html.dark.auth-hint-pending .landing-auth-gate__panel {
        border-color: oklch(0.36 0.01 135 / 0.95);
        background: oklch(0.24 0.01 135 / 0.82);
      }

      .landing-auth-gate__eyebrow {
        margin: 0 0 0.75rem;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: oklch(0.46 0.01 135);
      }

      .landing-auth-gate__title {
        font-size: clamp(1.8rem, 6vw, 3rem);
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0;
      }

      html.auth-hint-pending .public-shell--landing {
        display: none;
      }
    </style>`;

const LANDING_AUTH_GATE_SCRIPT = `
    <script id="landing-auth-gate-script">
      (function () {
        try {
          var staleKey = ${JSON.stringify(AUTH_HINT_STALE_STORAGE_KEY)};
          var staleValue = ${JSON.stringify(AUTH_HINT_STALE_VALUE)};
          var hasAuthHint = false;

          for (var index = 0; index < localStorage.length; index += 1) {
            var key = localStorage.key(index);
            if (key && key.indexOf('sb-') === 0 && key.endsWith('-auth-token')) {
              hasAuthHint = true;
              break;
            }
          }

          if (!hasAuthHint) {
            return;
          }

          if (localStorage.getItem(staleKey) === staleValue) {
            return;
          }

          document.documentElement.classList.add('auth-hint-pending');
        } catch (error) {}
      })();
    </script>`;

const renderStaticLandingAuthGate = () => `
  <div class="landing-auth-gate" aria-hidden="true">
    <div class="landing-auth-gate__panel">
      <div class="landing-auth-gate__eyebrow">Reflections</div>
      <div class="landing-auth-gate__title">Opening your space</div>
    </div>
  </div>`;

const renderStaticLandingShell = (page) => `
  ${renderStaticLandingAuthGate()}
  <div class="public-shell public-shell--landing">
    <a href="#main-content" class="skip-link">Skip to content</a>
    <header class="public-header public-header--landing landing-nav-scrim">
      <div>
        <a href="/" aria-label="Reflections - go to home">
          <span>${renderLeafIcon()}</span>
          <span>Reflections</span>
        </a>
        <nav aria-label="Public navigation">
          <button type="button" aria-label="Use dark mode"></button>
          <a href="/" aria-current="page">Home</a>
          <a href="/faq">FAQ</a>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <span aria-hidden="true"></span>
          <a href="/login">Sign in</a>
          <a href="/signup">Sign up</a>
        </nav>
        <div>
          <button type="button" aria-label="Use dark mode"></button>
          <button type="button" aria-label="Toggle menu"></button>
        </div>
      </div>
    </header>
    <main id="main-content">
      <div role="region" aria-label="Welcome">
        <div>
          <div>
            <div class="video-mask video-mask--mobile"></div>
            <div class="video-mask video-mask--desktop"></div>
            <picture>
              <source srcset="/assets/videos/landing_video.webp" type="image/webp" media="(min-width: 1024px)" />
              <source srcset="/assets/videos/landing_video_mobile.webp" type="image/webp" media="(max-width: 1023px)" />
              <img src="/assets/videos/landing_video_mobile.webp" alt="" aria-hidden="true" fetchpriority="high" loading="eager" decoding="async" />
            </picture>
          </div>
          <div>
            <div>
              <h1 aria-label="${escapeHtml(PUBLIC_SEO_COPY.home.heroAriaLabel)}">
                <span>${escapeHtml(PUBLIC_SEO_COPY.home.heroLines[0])}</span>
                <span>${escapeHtml(PUBLIC_SEO_COPY.home.heroLines[1])}</span>
                <span>${escapeHtml(PUBLIC_SEO_COPY.home.heroLines[2])}</span>
              </h1>
              <p>${escapeHtml(PUBLIC_SEO_COPY.home.heroIntro)}</p>
            </div>
            <div>
              <a href="/signup" aria-label="Begin writing">
                ${escapeHtml(PUBLIC_SEO_COPY.home.ctaLabel)}
                ${renderArrowIcon()}
              </a>
              <div>
                <div>
                  <a href="/login">Sign in</a>
                  <a href="/faq">How it works</a>
                </div>
                <button type="button" aria-label="Mute video">${renderSpeakerMutedIcon()}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${renderSeoContent(page)}
    </main>
  </div>`;

const renderAppShellFallback = (route) => `
  <main id="app-shell-fallback" data-app-shell-fallback="true" style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:2rem;background:#f7f8f6;color:#30332f;font-family:Manrope,-apple-system,BlinkMacSystemFont,sans-serif;">
    <section style="max-width:34rem;width:100%;border:1px solid rgba(48,51,47,.12);border-radius:1.5rem;background:rgba(255,255,255,.72);padding:2rem;box-shadow:0 20px 44px -30px rgba(0,0,0,.2);">
      <p style="margin:0 0 .75rem;font-size:.72rem;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#5e665b;">Reflections</p>
      <h1 style="margin:0;font-size:clamp(2rem,7vw,3.25rem);line-height:1;font-weight:800;letter-spacing:0;">${escapeHtml(route.title)}</h1>
      <p style="margin:1rem 0 0;color:#5b6258;line-height:1.7;">The app is loading this route. If it does not open in a moment, refresh once.</p>
    </section>
  </main>`;

const applyPageSeo = (template, page) => {
  const url = buildPublicCanonicalUrl(page.path);
  let html = template;

  html = page.path === '/' ? html : stripLandingHeroPreloads(html);

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = setMetaName(html, 'description', page.description);
  html = setRobotsMeta(html);
  html = setCanonical(html, url);
  html = setMetaProperty(html, 'og:url', url);
  html = setMetaProperty(html, 'og:title', page.title);
  html = setMetaProperty(html, 'og:description', page.description);
  html = setMetaName(html, 'twitter:title', page.title);
  html = setMetaName(html, 'twitter:description', page.description);

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${page.path === '/' ? renderStaticLandingShell(page) : renderSeoContent(page)}</div>`,
  );

  if (page.path === '/') {
    html = html.replace('</head>', `${LANDING_AUTH_GATE_STYLE}\n${LANDING_AUTH_GATE_SCRIPT}\n  </head>`);
  }

  const extraSchema = buildExtraSchema(page);

  if (extraSchema) {
    html = html.replace('</head>', `<script type="application/ld+json">${extraSchema}</script>\n  </head>`);
  }

  return html;
};

const applyAppShellRoute = (template, route) => {
  const url = buildPublicCanonicalUrl(route.path);
  let html = stripLandingHeroPreloads(template);

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  html = setMetaName(html, 'description', PUBLIC_APP_ROUTE_DESCRIPTION);
  html = setRobotsMeta(html, NOINDEX_NOFOLLOW_ROBOTS_META);
  html = setCanonical(html, url);
  html = setMetaProperty(html, 'og:url', url);
  html = setMetaProperty(html, 'og:title', route.title);
  html = setMetaProperty(html, 'og:description', PUBLIC_APP_ROUTE_SOCIAL_DESCRIPTION);
  html = setMetaName(html, 'twitter:title', route.title);
  html = setMetaName(html, 'twitter:description', PUBLIC_APP_ROUTE_SOCIAL_DESCRIPTION);
  html = html.replace('<div id="root"></div>', `<div id="root">${renderAppShellFallback(route)}</div>`);

  return html;
};

const outputFilesFor = (page) => {
  if (page.path === '/') {
    return ['index.html'];
  }

  const slug = page.path.slice(1);
  return [`${slug}.html`, `${slug}/index.html`];
};

const outputFilesForAppPath = (routePath) => {
  const slug = routePath.slice(1);
  return [`${slug}.html`, `${slug}/index.html`];
};

const template = readFileSync(new URL('index.html', distDir), 'utf8');

for (const page of publicPages) {
  const html = applyPageSeo(template, page);

  for (const outputFile of outputFilesFor(page)) {
    const outputUrl = new URL(outputFile, distDir);
    const outputPath = fileURLToPath(outputUrl);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, html);
  }
}

for (const route of appShellRoutes) {
  const html = applyAppShellRoute(template, route);

  for (const outputFile of outputFilesForAppPath(route.path)) {
    const outputUrl = new URL(outputFile, distDir);
    const outputPath = fileURLToPath(outputUrl);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, html);
  }
}
