import type { Note } from '../../types';
import { extractNotePlainText } from './noteContent';

export type NoteExportFormat = 'txt' | 'md';

type HtmlTextNode = {
  type: 'text';
  value: string;
};

type HtmlElementNode = {
  type: 'element';
  tagName: string;
  attributes: Record<string, string>;
  children: HtmlNode[];
};

type HtmlNode = HtmlTextNode | HtmlElementNode;

type RenderContext = {
  orderedListIndex?: number;
  preserveWhitespace?: boolean;
};

const BLOCK_TAGS = new Set(['blockquote', 'div', 'h1', 'h2', 'h3', 'li', 'ol', 'p', 'pre', 'ul']);
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta']);
const UNSAFE_TAG_BLOCK_PATTERN = /<(script|style|iframe|object|form|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi;
const TAG_PATTERN = /<\/?[^>]+>|[^<]+/g;

const formatExportDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getExportDateStamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'undated';

  return date.toISOString().slice(0, 10);
};

const slugify = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'untitled-reflection';
};

const getNoteTitle = (note: Note) => note.title.trim() || 'Untitled reflection';

const getTaskLines = (note: Note) =>
  (note.tasks || [])
    .filter((task) => task.text.trim())
    .map((task) => `${task.completed ? '[x]' : '[ ]'} ${task.text.trim()}`);

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const getExportBody = (html: string) =>
  (extractNotePlainText(html) || 'No written text.').replace(/\s+([.,!?;:])/g, '$1');

const getMetadataLines = (note: Note) => {
  const lines = [
    `Created: ${formatExportDate(note.createdAt)}`,
    `Updated: ${formatExportDate(note.updatedAt)}`,
  ];

  if (note.mood) lines.push(`Mood: ${note.mood}`);
  if (note.tags?.length) lines.push(`Tags: ${note.tags.join(', ')}`);

  return lines;
};

export const getNoteExportFilename = (note: Note, format: NoteExportFormat) =>
  `${slugify(getNoteTitle(note))}-${getExportDateStamp(note.updatedAt)}.${format}`;

const parseAttributes = (tag: string) => {
  const attributes: Record<string, string> = {};
  const attributePattern = /([^\s="'<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const tagNameMatch = tag.match(/^<\/?\s*([a-z0-9-]+)/i);
  const attributeSource = tag.slice(tagNameMatch?.[0].length || 0);
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attributeSource))) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }

  return attributes;
};

const parseHtml = (html: string): HtmlElementNode => {
  const root: HtmlElementNode = { type: 'element', tagName: 'root', attributes: {}, children: [] };
  const stack = [root];
  const safeHtml = html.replace(UNSAFE_TAG_BLOCK_PATTERN, ' ');
  let match: RegExpExecArray | null;

  while ((match = TAG_PATTERN.exec(safeHtml))) {
    const token = match[0];
    const parent = stack[stack.length - 1];

    if (!token.startsWith('<')) {
      parent.children.push({ type: 'text', value: decodeHtmlEntities(token) });
      continue;
    }

    const tagNameMatch = token.match(/^<\/?\s*([a-z0-9-]+)/i);
    if (!tagNameMatch) continue;

    const tagName = tagNameMatch[1].toLowerCase();
    if (token.startsWith('</')) {
      while (stack.length > 1) {
        const current = stack.pop();
        if (current?.tagName === tagName) break;
      }
      continue;
    }

    const node: HtmlElementNode = {
      type: 'element',
      tagName,
      attributes: parseAttributes(token),
      children: [],
    };
    parent.children.push(node);

    if (!VOID_TAGS.has(tagName) && !token.endsWith('/>')) {
      stack.push(node);
    }
  }

  return root;
};

const normalizeInlineText = (value: string, preserveWhitespace = false) => {
  if (preserveWhitespace) return value;
  return value.replace(/\s+/g, ' ');
};

const renderInline = (nodes: HtmlNode[], context: RenderContext = {}) =>
  nodes
    .map((node) => renderNode(node, { ...context, orderedListIndex: undefined }))
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const renderListItem = (node: HtmlElementNode, prefix: string) => {
  const content = renderInline(node.children).replace(/\n+/g, '\n  ').trim();
  return content ? `${prefix}${content}` : '';
};

const renderBlockquote = (node: HtmlElementNode) =>
  renderInline(node.children)
    .split('\n')
    .map((line) => `> ${line}`.trimEnd())
    .join('\n');

const isSafeMarkdownHref = (href: string) => !/^\s*(javascript|data|vbscript):/i.test(href);

const renderNode = (node: HtmlNode, context: RenderContext = {}): string => {
  if (node.type === 'text') {
    return normalizeInlineText(node.value, context.preserveWhitespace);
  }

  const childText = () => renderInline(node.children, context);

  switch (node.tagName) {
    case 'a': {
      const label = childText();
      const href = node.attributes.href;
      return href && isSafeMarkdownHref(href) ? `[${label}](${href})` : label;
    }
    case 'blockquote':
      return `${renderBlockquote(node)}\n\n`;
    case 'br':
      return '\n';
    case 'code':
      return context.preserveWhitespace ? childText() : `\`${childText()}\``;
    case 'div':
    case 'p':
      return `${childText()}\n\n`;
    case 'em':
    case 'i':
      return `*${childText()}*`;
    case 'h1':
      return `# ${childText()}\n\n`;
    case 'h2':
      return `## ${childText()}\n\n`;
    case 'h3':
      return `### ${childText()}\n\n`;
    case 'li':
      return renderListItem(node, context.orderedListIndex ? `${context.orderedListIndex}. ` : '- ');
    case 'ol':
      return `${node.children
        .filter((child): child is HtmlElementNode => child.type === 'element' && child.tagName === 'li')
        .map((child, index) => renderNode(child, { orderedListIndex: index + 1 }))
        .filter(Boolean)
        .join('\n')}\n\n`;
    case 'pre': {
      const code = renderInline(node.children, { preserveWhitespace: true }).trim();
      return code ? `\`\`\`\n${code}\n\`\`\`\n\n` : '';
    }
    case 's':
    case 'strike':
    case 'del':
      return `~~${childText()}~~`;
    case 'strong':
    case 'b':
      return `**${childText()}**`;
    case 'u':
      return `<u>${childText()}</u>`;
    case 'ul':
      return `${node.children
        .filter((child): child is HtmlElementNode => child.type === 'element' && child.tagName === 'li')
        .map((child) => renderNode(child))
        .filter(Boolean)
        .join('\n')}\n\n`;
    default:
      return BLOCK_TAGS.has(node.tagName) ? `${childText()}\n\n` : childText();
  }
};

const normalizeMarkdownBody = (markdown: string) =>
  markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const htmlToMarkdown = (html: string) => {
  const markdown = normalizeMarkdownBody(renderInline(parseHtml(html).children));
  return markdown || 'No written text.';
};

const escapeYamlString = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const getFrontmatter = (note: Note) => [
  '---',
  `id: ${note.id}`,
  `title: ${escapeYamlString(getNoteTitle(note))}`,
  `created_at: ${note.createdAt}`,
  `updated_at: ${note.updatedAt}`,
  ...(note.mood ? [`mood: ${note.mood}`] : []),
  ...(note.tags?.length ? ['tags:', ...note.tags.map((tag) => `  - ${tag}`)] : ['tags: []']),
  '---',
];

export const buildNoteExportText = (note: Note, format: NoteExportFormat) => {
  const title = getNoteTitle(note);
  const taskLines = getTaskLines(note);

  if (format === 'md') {
    return [
      ...getFrontmatter(note),
      '',
      htmlToMarkdown(note.content),
      ...(taskLines.length ? ['', '## Tasks', '', ...taskLines.map((line) => `- ${line}`)] : []),
      '',
    ].join('\n');
  }

  const body = getExportBody(note.content);

  return [
    title,
    '',
    ...getMetadataLines(note),
    '',
    body,
    ...(taskLines.length ? ['', 'Tasks:', ...taskLines] : []),
    '',
  ].join('\n');
};

export const downloadNoteExport = (note: Note, format: NoteExportFormat) => {
  if (typeof document === 'undefined') return;

  const blob = new Blob([buildNoteExportText(note, format)], {
    type: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = getNoteExportFilename(note, format);
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
