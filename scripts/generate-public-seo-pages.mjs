import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://reflections-ebon.vercel.app';
const INDEX_FOLLOW_ROBOTS_META = '<meta name="robots" content="index, follow" />';
const distDir = new URL('../dist/', import.meta.url);

const publicPages = [
  {
    path: '/',
    title: 'Private journal app for notes, mood, and reflection',
    description:
      'Reflections is a private journal app for writing notes, naming moods, tagging patterns, and using optional AI support only when you ask.',
    h1: 'Private journal app for notes, mood, and reflection',
    intro:
      'Write a few lines, name the mood if it helps, and return to patterns without streaks, scores, or pressure.',
    sections: [
      ['Private writing', 'Your notes belong to your account and stay centered on your own words.'],
      ['Mood and tags', 'Use moods and tags to notice patterns in ordinary language.'],
      ['Optional AI support', 'Reflect with AI and Refresh with AI stay on demand, not automatic.'],
    ],
  },
  {
    path: '/faq',
    title: 'FAQ about private journaling | Reflections',
    description:
      'Answers about Reflections, private notes, mood check-ins, optional AI support, Life Wiki, and writing without streaks or scores.',
    h1: 'FAQ about private journaling',
    intro:
      'Plain answers about how Reflections works, what it stores, and how optional AI fits around private writing.',
    sections: [
      ['What is Reflections?', 'Reflections is a private writing-first journal for notes, moods, tags, and personal patterns.'],
      ['Does AI run automatically?', 'No. AI support runs only when you ask for a reflection or a Life Wiki refresh.'],
      ['Is Reflections therapy?', 'No. Reflections is a personal writing tool, not professional mental health care.'],
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy for your private journal | Reflections',
    description:
      'How Reflections handles private notes, moods, tags, attachments, optional AI actions, analytics, payments, exports, and deletion.',
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
      'A note from Arabinda about why Reflections is a private writing app with mood notes, Life Wiki, and optional AI support.',
    h1: 'About Reflections and Arabinda',
    intro:
      'Reflections began as a quieter place to write, notice feelings, and leave without being pushed to perform.',
    sections: [
      ['Private writing', 'The product is built around writing that stays private and ordinary.'],
      ['No pressure loops', 'Reflections avoids streaks, scores, public feeds, and productivity rankings.'],
      ['AI should wait', 'Optional AI support appears only when invited and should never act like it knows you better than you do.'],
    ],
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

const renderSeoContent = (page) => {
  const navLinks = publicPages
    .map((item) => `<a href="${item.path}">${item.path === '/' ? 'Home' : escapeHtml(item.h1)}</a>`)
    .join('');
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
    <main id="public-seo-content" data-seo-snapshot="true">
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

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = setMetaName(html, 'description', page.description);
  html = setRobotsMeta(html);
  html = setCanonical(html, url);
  html = setMetaProperty(html, 'og:url', url);
  html = setMetaProperty(html, 'og:title', page.title);
  html = setMetaProperty(html, 'og:description', page.description);
  html = setMetaName(html, 'twitter:title', page.title);
  html = setMetaName(html, 'twitter:description', page.description);

  return html.replace('<div id="root"></div>', `<div id="root">${renderSeoContent(page)}</div>`);
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
