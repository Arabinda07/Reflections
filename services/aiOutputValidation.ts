export type WikiOutputValidationResult =
  | { ok: true; content: string; sourceIds: string[] }
  | { ok: false; reason: string };

interface WikiOutputValidationOptions {
  allowedSourceIds: string[];
  maxWords?: number;
}

const DEFAULT_MAX_WORDS = 420;
const SOURCE_MARKER_PATTERN = /\[Source:\s*([^\]]+)\]/gi;
const RAW_HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const UNSAFE_LINK_PATTERN = /\]\((?:javascript|data):/i;
const DIAGNOSTIC_TERMS = [
  'adhd',
  'anxiety disorder',
  'bipolar',
  'clinical',
  'depression',
  'diagnosis',
  'diagnose',
  'ocd',
  'ptsd',
  'trauma response',
];

const splitSourceIds = (rawIds: string) =>
  rawIds
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);

export const extractWikiSourceIds = (content: string) => {
  const sourceIds = new Set<string>();

  content.replace(SOURCE_MARKER_PATTERN, (_match, rawIds: string) => {
    splitSourceIds(rawIds).forEach((sourceId) => sourceIds.add(sourceId));
    return '';
  });

  return Array.from(sourceIds);
};

const wordCount = (content: string) =>
  content
    .replace(SOURCE_MARKER_PATTERN, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export const validateWikiPageOutput = (
  content: string,
  options: WikiOutputValidationOptions,
): WikiOutputValidationResult => {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, reason: 'empty_output' };
  if (RAW_HTML_PATTERN.test(trimmed) || UNSAFE_LINK_PATTERN.test(trimmed)) {
    return { ok: false, reason: 'unsafe_markdown' };
  }

  const lower = trimmed.toLowerCase();
  const diagnosticTerm = DIAGNOSTIC_TERMS.find((term) => lower.includes(term));
  if (diagnosticTerm) {
    return { ok: false, reason: `diagnostic_language:${diagnosticTerm}` };
  }

  if (wordCount(trimmed) > (options.maxWords ?? DEFAULT_MAX_WORDS)) {
    return { ok: false, reason: 'too_long' };
  }

  const sourceIds = extractWikiSourceIds(trimmed);
  if (options.allowedSourceIds.length > 0 && sourceIds.length === 0) {
    return { ok: false, reason: 'missing_source_markers' };
  }

  const allowed = new Set(options.allowedSourceIds);
  const unknownSourceId = sourceIds.find((sourceId) => !allowed.has(sourceId));
  if (unknownSourceId) {
    return { ok: false, reason: `unknown_source_id:${unknownSourceId}` };
  }

  return { ok: true, content: trimmed, sourceIds };
};

export const buildWikiRetryInstruction = (reason: string) =>
  `Retry once. The previous draft was rejected for ${reason}. Return safe markdown only, keep every grounded claim cited as [Source: note-id], use only provided note ids, avoid diagnostic labels, and stay under 420 words.`;
