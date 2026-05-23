import type { WikiPageType } from './wikiTypes';
import { buildPrompt } from './aiPromptSpecs';

export type LifeWikiReviewStatus = 'approve' | 'revise' | 'reject';

export interface LifeWikiReviewInput {
  pageType: WikiPageType;
  title: string;
  content: string;
  allowedSourceIds: string[];
}

export interface LifeWikiReviewResult {
  status: LifeWikiReviewStatus;
  reasons: string[];
  revisedContent?: string;
}

const REVIEW_STATUS = new Set<LifeWikiReviewStatus>(['approve', 'revise', 'reject']);

export const buildWikiReviewPrompt = (input: LifeWikiReviewInput) =>
  buildPrompt([
    'You are reviewing one AI-generated Life Wiki page for Reflections before it is saved.',
    'Approve only if the page is grounded, quiet, safe, and fully supported by the listed note sources.',
    `Page: ${input.title} (${input.pageType})`,
    `Allowed source ids: ${input.allowedSourceIds.join(', ') || 'none'}`,
    'Reject or revise pages with missing source markers, unsupported certainty, diagnostic/clinical labels, unsafe markdown or links, motivational coaching language, or claims that go beyond the notes.',
    'Return JSON only in this exact shape: {"status":"approve"|"revise"|"reject","reasons":["short reason"],"revisedContent":"optional safe markdown"}.',
    `Draft markdown:\n${input.content}`,
  ]);

const coerceReasons = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((reason) => (typeof reason === 'string' ? reason.trim() : ''))
    .filter(Boolean)
    .slice(0, 5);
};

export const parseLifeWikiReviewResult = (raw: string): LifeWikiReviewResult => {
  const trimmed = raw.trim();
  const jsonText = trimmed.match(/\{[\s\S]*\}/)?.[0] || trimmed;

  try {
    const parsed = JSON.parse(jsonText) as {
      status?: unknown;
      reasons?: unknown;
      revisedContent?: unknown;
    };
    const status = typeof parsed.status === 'string' && REVIEW_STATUS.has(parsed.status as LifeWikiReviewStatus)
      ? parsed.status as LifeWikiReviewStatus
      : 'reject';

    return {
      status,
      reasons: coerceReasons(parsed.reasons),
      revisedContent: typeof parsed.revisedContent === 'string' ? parsed.revisedContent.trim() : undefined,
    };
  } catch {
    return {
      status: 'reject',
      reasons: ['review_parse_failed'],
    };
  }
};
