import { PUBLIC_SEO_PAGES, PUBLIC_SEO_LAST_MODIFIED } from './publicSeoCopy.js';
import { buildPublicCanonicalUrl, CANONICAL_PUBLIC_ORIGIN } from './publicSite.js';

// Open Knowledge Format (OKF v0.1) bundle. The page concepts are generated from
// the public SEO copy single source of truth so they stay in sync for free; the
// depth nodes below are hand-authored. See the okf reference.

const OKF_VERSION = '0.1';

const PRICING_URL = `${CANONICAL_PUBLIC_ORIGIN}/pricing.md`;
const LLMS_URL = `${CANONICAL_PUBLIC_ORIGIN}/llms.txt`;

const TYPE_BY_KEY = {
  home: 'Product',
  faq: 'FAQ',
  privacy: 'Privacy policy',
  about: 'Article',
  dayOne: 'Comparison',
};

const TAGS_BY_KEY = {
  home: ['journal', 'encryption', 'privacy'],
  faq: ['faq', 'journal', 'pricing'],
  privacy: ['privacy', 'encryption', 'data'],
  about: ['about', 'journal'],
  dayOne: ['comparison', 'day-one', 'journal'],
};

const fileNameByKey = (key) => (key === 'dayOne' ? 'day-one' : key);

// YAML double-quoted scalar — escape backslash and quote only (no newlines in our copy).
const yamlString = (value) => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const yamlTags = (tags) => `[${tags.map((tag) => yamlString(tag)).join(', ')}]`;

const renderFrontmatter = ({ type, title, description, resource, tags }) =>
  [
    '---',
    `type: ${type}`,
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `resource: ${yamlString(resource)}`,
    `tags: ${yamlTags(tags)}`,
    `timestamp: ${yamlString(PUBLIC_SEO_LAST_MODIFIED)}`,
    '---',
  ].join('\n');

const renderRelated = (links) =>
  `## Related\n\n${links.map(({ label, href }) => `- [${label}](${href})`).join('\n')}`;

const renderComparison = (comparison) => {
  if (!comparison) return '';
  const { headers, rows, caption } = comparison;
  const headerRow = `| ${headers.map((h) => h || ' ').join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyRows = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return `${caption ? `\n_${caption}_\n` : ''}\n${headerRow}\n${divider}\n${bodyRows}\n`;
};

const renderConceptBody = (page) => {
  const parts = [`# ${page.h1}`, '', page.intro, ''];

  for (const section of page.sections) {
    parts.push(`## ${section.title}`, '', section.body, '');
  }

  if (page.faqSchema) {
    for (const { question, answer } of page.faqSchema) {
      parts.push(`### ${question}`, '', answer, '');
    }
  }

  if (page.comparison) {
    parts.push(renderComparison(page.comparison));
  }

  return parts.join('\n').trimEnd();
};

// Buyer-facing concepts also point agents at the structured pricing file.
const PRICING_RELATED = ['home', 'dayOne'];

const renderConceptFile = (page) => {
  const related = PUBLIC_SEO_PAGES.filter((other) => other.key !== page.key).map((other) => ({
    label: other.h1,
    href: `./${fileNameByKey(other.key)}.md`,
  }));

  if (PRICING_RELATED.includes(page.key)) {
    related.push({ label: 'Pricing', href: PRICING_URL });
  }

  const frontmatter = renderFrontmatter({
    type: TYPE_BY_KEY[page.key],
    title: page.title,
    description: page.description,
    resource: buildPublicCanonicalUrl(page.path),
    tags: TAGS_BY_KEY[page.key],
  });

  return `${frontmatter}\n\n${renderConceptBody(page)}\n\n${renderRelated(related)}\n`;
};

// Hand-authored OKF-only concepts — depth agents can't get by crawling the SEO
// pages. Kept intentionally small; not auto-synced. `body` must stay factual.
const OKF_DEPTH_NODES = [
  {
    key: 'encryption',
    type: 'Reference',
    title: 'How Reflections encrypts your writing',
    description:
      'The zero-knowledge model: envelope encryption with a per-record AES-256-GCM data key wrapped by a PBKDF2-derived key from your password.',
    resourceKey: 'privacy',
    tags: ['encryption', 'zero-knowledge', 'security'],
    related: ['privacy', 'faq'],
    body: `# How Reflections encrypts your writing

Reflections uses zero-knowledge, device-side encryption: the server stores only ciphertext it cannot read.

## Envelope encryption

Each record is encrypted with a random per-record data key using **AES-256-GCM**. That data key is never stored in the clear — it is wrapped (encrypted) before it leaves your device.

## Key wrapping

The wrapping key is derived from your password with **PBKDF2-SHA256** (default **210,000** iterations), then used with **AES-GCM** to wrap the data key. The server never receives your password or the unwrapped data key.

## Recovery phrase

When you turn on private writing you set a recovery phrase. It wraps the same data key as a second secret, so it is the only other way to unlock your writing if you forget your password. Reflections cannot reset it.`,
  },
  {
    key: 'features',
    type: 'Dataset',
    title: 'Reflections features by plan',
    description:
      'Structured feature facts: what each capability does, which plan includes it, and supported platforms.',
    resourceKey: 'home',
    tags: ['features', 'pricing', 'product'],
    related: ['home', 'faq'],
    body: `# Reflections features by plan

Platforms: web app, installable PWA, and Android APK.

| Feature | What it does | Plan |
| --- | --- | --- |
| Private journal | Rich-text notes with mood tracking, tags, tasks, and attachments | Free |
| Device-side encryption | Zero-knowledge encryption for notes, moods, letters, attachments, Life Wiki, and relationships | Free |
| Relationships | Keep track of people you want to stay close to, with a few weekly reach-out suggestions | Free |
| Ambient soundscapes, whisper-to-text, focus mode, breathing | Calm-writing tools | Free |
| Future Letters | Write to your future self | Free |
| AI reflections | Ask AI for another lens on a note, on demand | One sample on Free, on-demand on Pro |
| Life Wiki | AI-supported pages that grow from saved writing when you ask | One refresh on Free, more on Pro |
| Unlimited note writing | Write past the 30 notes/month free room | Pro |

See the structured pricing file for current prices: ${PRICING_URL}`,
  },
];

const renderDepthFile = (node) => {
  const related = node.related
    .map((key) => {
      const page = PUBLIC_SEO_PAGES.find((p) => p.key === key);
      return { label: page.h1, href: `./${fileNameByKey(key)}.md` };
    })
    .concat({ label: 'Pricing', href: PRICING_URL });

  const frontmatter = renderFrontmatter({
    type: node.type,
    title: node.title,
    description: node.description,
    resource: buildPublicCanonicalUrl(PUBLIC_SEO_PAGES.find((p) => p.key === node.resourceKey).path),
    tags: node.tags,
  });

  return `${frontmatter}\n\n${node.body}\n\n${renderRelated(related)}\n`;
};

const renderIndex = () => {
  const frontmatter = ['---', `okf_version: "${OKF_VERSION}"`, '---'].join('\n');

  const pages = PUBLIC_SEO_PAGES.map(
    (page) => `- [${page.title}](./${fileNameByKey(page.key)}.md) — ${page.description}`,
  ).join('\n');

  const depth = OKF_DEPTH_NODES.map(
    (node) => `- [${node.title}](./${node.key}.md) — ${node.description}`,
  ).join('\n');

  const resources = [
    `- Pricing (machine-readable): ${PRICING_URL}`,
    `- LLM overview: ${LLMS_URL}`,
  ].join('\n');

  return `${frontmatter}

# Reflections

An agent-readable bundle of the public Reflections pages.

## Pages

${pages}

## Reference

${depth}

## Machine-readable resources

${resources}
`;
};

// Returns a { relativePath: content } map for the whole /okf/ bundle.
export const buildOkfBundle = () => {
  const files = { 'index.md': renderIndex() };

  for (const page of PUBLIC_SEO_PAGES) {
    files[`${fileNameByKey(page.key)}.md`] = renderConceptFile(page);
  }

  for (const node of OKF_DEPTH_NODES) {
    files[`${node.key}.md`] = renderDepthFile(node);
  }

  return files;
};
