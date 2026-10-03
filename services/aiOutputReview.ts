import type { WikiPageType } from './wikiTypes';
import { buildPrompt } from './aiPromptSpecs';
import type {
  ChoiceAnswer,
  NoulAnswer,
  SystemOneRequest,
  SystemOneResponse,
} from './typesafeTypes';

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
    'Set status to approve, revise (and put the corrected markdown in revisedContent), or reject, with short reasons.',
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
  const jsonText = raw.trim();

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

export const JEV_APPROVAL_THRESHOLD = 0.85;
export const JEV_MAX_CLINICAL_PROBABILITY = 0.15;

export const buildJevWikiReviewRequest = (input: LifeWikiReviewInput): SystemOneRequest => ({
  state: {
    page_type: input.pageType,
    page_title: input.title,
    allowed_source_ids: input.allowedSourceIds,
    draft_markdown: input.content,
  },
  model: 'jev-latest',
  questions: {
    review_status: {
      type: 'choice',
      instructions: 'Review this AI-generated Life Wiki page draft for Reflections before saving. Should it be approved, revised, or rejected based on factual grounding and editorial safety?',
      criteria: {
        approve: 'The draft is fully grounded in the provided sources, maintains a quiet observant third-person voice, avoids clinical or diagnostic claims, has no motivational slogans, and all inline citations use the exact format `[Source: note-id]` matching allowed_source_ids.',
        revise: 'The draft has minor fixable flaws: 1-2 citations missing brackets or slightly vague wording, but contains no psychiatric claims or severe hallucinations.',
        reject: 'The draft contains diagnostic/clinical labels, psychiatric terminology, motivational coaching language, completely hallucinated events/people absent from the notes, or invalid URLs/markdown.',
        none_of_these: 'The draft is ambiguous or cannot be classified under clean approval, minor revision, or standard rejection.',
      },
    },
    has_clinical_labels: {
      type: 'noul',
      instructions: 'Does the draft include diagnostic, therapeutic, or clinical psychology labels (e.g., depression, bipolar, ADHD, trauma, dysregulation)?',
      criteria: {
        true: 'Contains explicit clinical terminology, diagnoses, or therapeutic pathology framing.',
        false: 'Maintains non-clinical, observant, descriptive language.',
      },
    },
  },
});

export const evaluateJevWikiReview = (
  response: SystemOneResponse | null | undefined,
): LifeWikiReviewResult | null => {
  if (!response?.answers) return null;

  const reviewStatusAnswer = response.answers.review_status as ChoiceAnswer<string> | undefined;
  const clinicalAnswer = response.answers.has_clinical_labels as NoulAnswer | undefined;

  if (!reviewStatusAnswer || !reviewStatusAnswer.probabilities) return null;

  const approveProb = reviewStatusAnswer.probabilities.approve ?? 0;
  const rejectProb = reviewStatusAnswer.probabilities.reject ?? 0;
  const clinicalProb = clinicalAnswer?.probability ?? 0;

  // Confident Approve: High probability of approval and very low clinical label risk
  if (
    reviewStatusAnswer.selected === 'approve' &&
    approveProb >= JEV_APPROVAL_THRESHOLD &&
    clinicalProb < JEV_MAX_CLINICAL_PROBABILITY
  ) {
    return {
      status: 'approve',
      reasons: ['jev_grounded_and_safe'],
    };
  }

  // Confident Reject: High probability of rejection
  if (reviewStatusAnswer.selected === 'reject' && rejectProb >= JEV_APPROVAL_THRESHOLD) {
    return {
      status: 'reject',
      reasons: ['jev_unsupported_or_unsafe'],
    };
  }

  // Uncertain, revise, or ambiguous: return null so caller escalates to generative LLM
  return null;
};

