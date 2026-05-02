import DOMPurify, { type Config } from 'dompurify';

const NOTE_EMPTY_PREVIEW = 'No content available';

const COMMON_HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

const decodeEntities = (value: string) =>
  value.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => COMMON_HTML_ENTITIES[entity] || entity);

const DOMPURIFY_CONFIG: Config = {
  ALLOWED_ATTR: ['href', 'rel', 'target'],
  ALLOWED_TAGS: [
    'a',
    'blockquote',
    'br',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'strong',
    'u',
    'ul',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_ATTR: ['style'],
  FORBID_TAGS: ['form', 'iframe', 'img', 'input', 'math', 'object', 'script', 'style', 'svg'],
};

const stripAllTagsForNonBrowserRuntime = (html: string) =>
  decodeEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|blockquote|h1|h2|h3|h4|h5|h6|pre|ul|ol)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeNoteHtml = (html: string) => {
  if (!html) return '';

  if (typeof window === 'undefined' || !window.document) {
    return stripAllTagsForNonBrowserRuntime(html);
  }

  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG).trim();
};

export const extractNotePlainText = (html: string) => {
  const safeHtml = sanitizeNoteHtml(html);

  if (!safeHtml) return '';

  return decodeEntities(safeHtml)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|blockquote|h1|h2|h3|h4|h5|h6|pre|ul|ol)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const buildNotePreviewText = (html: string, maxLength = 110) => {
  const text = extractNotePlainText(html);

  if (!text) return NOTE_EMPTY_PREVIEW;
  if (text.length <= maxLength) return text;

  return `${text.slice(0, Math.max(0, maxLength - 2)).trimEnd()}...`;
};
