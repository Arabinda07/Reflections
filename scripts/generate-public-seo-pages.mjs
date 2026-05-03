import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://reflections-ebon.vercel.app';
const INDEX_FOLLOW_ROBOTS_META = '<meta name="robots" content="index, follow" />';
const distDir = new URL('../dist/', import.meta.url);

const publicPages = [
  {
    path: '/',
    title: 'Reflections - Private Journal for Notes, Mood & Reflection',
    description:
      'A private journal for writing notes, naming moods, and noticing patterns. AI runs only when you ask. No streaks, no pressure.',
    h1: 'Private journal for notes, mood, and reflection',
    intro:
      'Write a few lines, name the mood if it helps, and return to patterns at your own pace.',
    sections: [
      ['Private writing', 'Your notes belong to your account and stay centered on your own words.'],
      ['Mood and tags', 'Use moods and tags to notice patterns in ordinary language.'],
      ['Optional AI support', 'Reflect with AI and Refresh with AI run on demand, not in the background.'],
    ],
  },
  {
    path: '/faq',
    title: 'FAQ about private journaling | Reflections',
    description:
      'How Reflections works: the writing practice, mood check-ins, AI that waits for you, Life Wiki, and the design choices behind each feature.',
    h1: 'FAQ about private journaling',
    intro:
      'How Reflections works, what it stores, and how AI fits around private writing.',
    sections: [
      ['What is Reflections?', 'A journal built around writing for notes, moods, tags, and personal patterns.'],
      ['Does AI run automatically?', 'No. AI support runs only when you ask for a reflection or a Life Wiki refresh.'],
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
          "acceptedAnswer": { "@type": "Answer", "text": "No. AI support only runs when you explicitly press Reflect with AI or Refresh Insights." }
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
      ['AI should wait', 'AI support appears only when invited and never acts like it knows you better than you do.'],
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

const setRobotsMeta = (html) =>
  html.replace(/<meta name="robots" content="[^"]*"\s*\/?>/, INDEX_FOLLOW_ROBOTS_META);

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

  html = html.replace('<div id="root"></div>', `<div id="root">${renderSeoContent(page)}</div>`);

  if (page.extraSchema) {
    html = html.replace('</head>', `<script type="application/ld+json">${page.extraSchema}</script>\n  </head>`);
  }

  return html;
};

const outputFilesFor = (page) => {
  if (page.path === '/') {
    return ['index.html'];
  }

  const slug = page.path.slice(1);
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
