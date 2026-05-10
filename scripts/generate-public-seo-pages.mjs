import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://reflections-ebon.vercel.app';
const INDEX_FOLLOW_ROBOTS_META = '<meta name="robots" content="index, follow" />';
const NOINDEX_NOFOLLOW_ROBOTS_META = '<meta name="robots" content="noindex, nofollow" />';
const distDir = new URL('../dist/', import.meta.url);

const publicPages = [
  {
    path: '/',
    title: 'Reflections - Private Journal for Notes, Mood & Reflection',
    description:
      'A private journal for writing notes, naming moods, and noticing patterns. AI stays on demand unless you turn on Smart Mode. No streaks, no pressure.',
    h1: 'Private journal for notes, mood, and reflection',
    intro:
      'Write a few lines, name the mood if it helps, and return to patterns at your own pace.',
    sections: [
      ['Private writing', 'Your notes belong to your account and stay centered on your own words.'],
      ['Mood and tags', 'Use moods and tags to notice patterns in ordinary language.'],
      ['Optional AI support', 'Reflect with AI and Refresh with AI run on demand. Smart Mode can refresh the Life Wiki only if you turn it on.'],
    ],
  },
  {
    path: '/faq',
    title: 'FAQ about private journaling | Reflections',
    description:
      'How Reflections works: the writing practice, mood check-ins, optional AI, Life Wiki, and the design choices behind each feature.',
    h1: 'FAQ about private journaling',
    intro:
      'How Reflections works, what it stores, and how AI fits around private writing.',
    sections: [
      ['What is Reflections?', 'A journal built around writing for notes, moods, tags, and personal patterns.'],
      ['Does AI run automatically?', 'No. AI support runs when you ask for a reflection or Life Wiki refresh, or when you explicitly enable Smart Mode.'],
      ['Is Reflections therapy?', 'No. Reflections is a personal writing tool, not professional mental health care.'],
    ],
    extraSchema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Reflections?",
          "acceptedAnswer": { "@type": "Answer", "text": "Reflections is a journal built around writing. You save notes, name your mood, tag patterns, and can ask AI for a personalised reflection that draws on everything you have written before." }
        },
        {
          "@type": "Question",
          "name": "Does AI run automatically?",
          "acceptedAnswer": { "@type": "Answer", "text": "AI support runs when you explicitly press Reflect with AI or Refresh Insights, or when you turn on Smart Mode for Life Wiki refreshes after saves." }
        },
        {
          "@type": "Question",
          "name": "Is Reflections free?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. The free tier includes 30 notes per month with full AI features. A Pro tier with unlimited notes is planned." }
        },
        {
          "@type": "Question",
          "name": "Is Reflections therapy?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. Reflections is a personal writing tool for noticing thoughts more clearly. It is not professional mental health care." }
        },
        {
          "@type": "Question",
          "name": "What is the Life Wiki?",
          "acceptedAnswer": { "@type": "Answer", "text": "The Life Wiki is an AI-maintained personal knowledge base that grows from your writing, tracking mood patterns, recurring themes, and a timeline." }
        },
        {
          "@type": "Question",
          "name": "How is my data protected?",
          "acceptedAnswer": { "@type": "Answer", "text": "All data is stored in Supabase with Row Level Security. Every query is scoped to your account. Read our Privacy page for the full picture." }
        }
      ]
    }),
  },
  {
    path: '/privacy',
    title: 'Privacy for your private journal | Reflections',
    description:
      'What Reflections stores, when AI runs, how payments and analytics work, and how to export or delete your writing.',
    h1: 'Privacy for your private journal',
    intro:
      'This page explains what Reflections stores, when AI is used, and how you can export or delete your writing.',
    sections: [
      ['What Reflections keeps', 'Account details, notes, moods, tags, attachments, future letters, and Life Wiki pages are tied to your account.'],
      ['AI and Smart Mode', 'AI features use the relevant writing only when you choose an AI action or enable Smart Mode.'],
      ['Export and deletion', 'You can export notes, delete individual notes, and remove saved app data from Account.'],
    ],
  },
  {
    path: '/about',
    title: 'About Reflections and Arabinda | Private journal app',
    description:
      'A note from Arabinda about why Reflections is a personal writing app with mood notes, Life Wiki, and AI that stays out of the way.',
    h1: 'About Reflections and Arabinda',
    intro:
      'Reflections began as a slower place to write, notice feelings, and leave without being pushed to perform.',
    sections: [
      ['Private writing', 'The product is built around writing that stays private and ordinary.'],
      ['No pressure loops', 'Write at your own pace without streaks, scores, or public feeds.'],
      ['AI should wait', 'AI support appears when invited, or when Smart Mode is explicitly enabled, and never acts like it knows you better than you do.'],
    ],
    extraSchema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "About Reflections and Arabinda",
      "author": { "@type": "Person", "name": "Arabinda" },
      "datePublished": "2025-01-01",
      "dateModified": "2026-05-02",
      "publisher": { "@type": "Organization", "name": "Reflections", "url": "https://reflections-ebon.vercel.app/" },
      "description": "A note from Arabinda about why Reflections is a personal writing app with mood notes, Life Wiki, and AI that stays out of the way."
    }),
  },
];

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

const renderSeoContent = (page) => {
  const navLinks = publicPages
    .map((item) => `<a href="${item.path}">${item.path === '/' ? 'Home' : escapeHtml(item.h1)}</a>`)
    .join(' ');
  const sections = page.sections
    .map(
      ([title, body]) => `
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

const renderStaticLandingShell = (page) => `
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
              <h1 aria-label="Your mind beautifully organized">
                <span>Your mind</span>
                <span>beautifully</span>
                <span>organized</span>
              </h1>
              <p>A private journal. Write what's on your mind, notice the patterns, and keep it to yourself</p>
            </div>
            <div>
              <a href="/signup" aria-label="Begin writing">
                Begin writing
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
  const url = `${SITE_ORIGIN}${page.path === '/' ? '/' : page.path}`;
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

  if (page.extraSchema) {
    html = html.replace('</head>', `<script type="application/ld+json">${page.extraSchema}</script>\n  </head>`);
  }

  return html;
};

const applyAppShellRoute = (template, route) => {
  const url = `${SITE_ORIGIN}${route.path}`;
  let html = stripLandingHeroPreloads(template);

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  html = setMetaName(html, 'description', 'Open Reflections to continue writing, signing in, or managing your private journal.');
  html = setRobotsMeta(html, NOINDEX_NOFOLLOW_ROBOTS_META);
  html = setCanonical(html, url);
  html = setMetaProperty(html, 'og:url', url);
  html = setMetaProperty(html, 'og:title', route.title);
  html = setMetaProperty(html, 'og:description', 'Open Reflections to continue writing.');
  html = setMetaName(html, 'twitter:title', route.title);
  html = setMetaName(html, 'twitter:description', 'Open Reflections to continue writing.');
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
