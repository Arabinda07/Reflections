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

export const sanitizeNoteHtml = (html: string) => {
  if (!html) return '';

  let sanitized = html;

  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  sanitized = sanitized.replace(/<img\b[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    '',
  );
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*\/?>/gi,
    '',
  );
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '');

  return sanitized.trim();
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
