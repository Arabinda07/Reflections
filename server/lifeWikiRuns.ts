import type { LifeTheme, Note } from '../types';
import type { AiAction } from '../services/aiContracts';
import { buildNotesCorpus, getNoteContentHash } from '../services/aiContext.js';
import {
  INGEST_MODEL,
  LIFE_WIKI_REFRESH_PROMPT_VERSION,
  WIKI_PAGE_CONFIGS,
  buildIndexPrompt,
  buildWikiPagePrompt,
} from '../services/aiPromptSpecs.js';
import { buildWikiRetryInstruction, validateWikiPageOutput } from '../services/aiOutputValidation.js';
import type { LifeWikiReviewInput, LifeWikiReviewResult } from '../services/aiOutputReview.js';

export type LifeWikiRunTrigger = 'manual' | 'smart_mode' | 'account_enable';
export type LifeWikiRunStatus = 'running' | 'succeeded' | 'partial' | 'failed' | 'skipped';
export type LifeWikiRefreshSource = 'notes' | 'none';

export interface LifeWikiRunCreateInput {
  userId: string;
  kind: 'life_wiki_refresh';
  trigger: LifeWikiRunTrigger;
  status: LifeWikiRunStatus;
  sourceHash: string;
  sourceNoteIds: string[];
  promptVersion: string;
  model: string;
}

export interface LifeWikiRunEventInput {
  eventType: string;
  pageType?: string;
  status?: LifeWikiRunStatus | 'retrying';
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface LifeWikiRunStore {
  createRun(input: LifeWikiRunCreateInput): Promise<string>;
  finishRun(runId: string, patch: { status: LifeWikiRunStatus; pageCount: number; error?: string | null }): Promise<void>;
  recordEvent(runId: string, event: LifeWikiRunEventInput): Promise<void>;
  fetchNotes(): Promise<Note[]>;
  fetchWikiPages(): Promise<LifeTheme[]>;
  getAbsorbedHash(noteId: string): Promise<string | null>;
  upsertWikiPage(pageType: LifeTheme['pageType'], title: string, content: string): Promise<LifeTheme>;
  logAbsorptions(notes: Note[]): Promise<void>;
}

export interface LifeWikiRunResult {
  runId: string;
  pageCount: number;
  source: LifeWikiRefreshSource;
  status: LifeWikiRunStatus;
  skipped: boolean;
}

interface RunLifeWikiRefreshInput {
  store: LifeWikiRunStore;
  generateText(prompt: string, model: string, action: AiAction): Promise<string>;
  reviewWikiPageDraft?(input: LifeWikiReviewInput): Promise<LifeWikiReviewResult>;
  claimFeatureUsage(feature: 'life_wiki_refresh'): Promise<void>;
  claimProviderUsage(action: AiAction): Promise<void>;
  userId: string;
  trigger: LifeWikiRunTrigger;
  noteId?: string;
}

const getRunStatus = (pageCount: number) => {
  if (pageCount === WIKI_PAGE_CONFIGS.length) return 'succeeded';
  if (pageCount > 0) return 'partial';
  return 'failed';
};

const compactError = (error: unknown) =>
  error instanceof Error ? error.message.slice(0, 240) : 'Life Wiki refresh failed';

const generateWikiPage = async (
  input: {
    config: (typeof WIKI_PAGE_CONFIGS)[number];
    corpusText: string;
    sourceNoteIds: string[];
    runId: string;
    store: LifeWikiRunStore;
    generateText(prompt: string, model: string, action: AiAction): Promise<string>;
    reviewWikiPageDraft?: (input: LifeWikiReviewInput) => Promise<LifeWikiReviewResult>;
    claimProviderUsage(action: AiAction): Promise<void>;
  },
) => {
  const buildPrompt = (retryInstruction?: string) =>
    buildWikiPagePrompt({
      title: input.config.title,
      instruction: input.config.instruction,
      allThemeContent: input.corpusText,
      retryInstruction,
    });

  await input.claimProviderUsage('wikiPage');
  const firstDraft = await input.generateText(buildPrompt(), INGEST_MODEL, 'wikiPage');
  const firstValidation = validateWikiPageOutput(firstDraft || '', {
    allowedSourceIds: input.sourceNoteIds,
  });

  const reviewValidatedContent = async (content: string) => {
    if (!input.reviewWikiPageDraft) return content;

    const review = await input.reviewWikiPageDraft({
      pageType: input.config.pageType,
      title: input.config.title,
      content,
      allowedSourceIds: input.sourceNoteIds,
    });
    const reasons = review.reasons || [];

    if (review.status === 'approve') {
      await input.store.recordEvent(input.runId, {
        eventType: 'review_approved',
        pageType: input.config.pageType,
        status: 'succeeded',
        metadata: { reasons },
      });
      return content;
    }

    if (review.status === 'revise' && review.revisedContent) {
      const revisedValidation = validateWikiPageOutput(review.revisedContent, {
        allowedSourceIds: input.sourceNoteIds,
      });

      if (revisedValidation.ok === true) {
        await input.store.recordEvent(input.runId, {
          eventType: 'review_revised',
          pageType: input.config.pageType,
          status: 'succeeded',
          metadata: { reasons },
        });
        return revisedValidation.content;
      }

      await input.store.recordEvent(input.runId, {
        eventType: 'review_rejected',
        pageType: input.config.pageType,
        status: 'failed',
        message: revisedValidation.reason,
        metadata: { reasons },
      });
      return null;
    }

    await input.store.recordEvent(input.runId, {
      eventType: 'review_rejected',
      pageType: input.config.pageType,
      status: 'failed',
      message: reasons[0] || 'review_rejected',
      metadata: { reasons },
    });
    return null;
  };

  if (firstValidation.ok === true) return reviewValidatedContent(firstValidation.content);

  await input.store.recordEvent(input.runId, {
    eventType: 'wiki_page_validation_failed',
    pageType: input.config.pageType,
    status: 'retrying',
    message: firstValidation.reason,
  });

  await input.claimProviderUsage('wikiPage');
  const retryDraft = await input.generateText(
    buildPrompt(buildWikiRetryInstruction(firstValidation.reason)),
    INGEST_MODEL,
    'wikiPage',
  );
  const retryValidation = validateWikiPageOutput(retryDraft || '', {
    allowedSourceIds: input.sourceNoteIds,
  });

  if (retryValidation.ok === true) return reviewValidatedContent(retryValidation.content);

  await input.store.recordEvent(input.runId, {
    eventType: 'wiki_page_failed',
    pageType: input.config.pageType,
    status: 'failed',
    message: retryValidation.reason,
  });
  return null;
};

export const runLifeWikiRefresh = async ({
  store,
  generateText,
  reviewWikiPageDraft,
  claimFeatureUsage,
  claimProviderUsage,
  userId,
  trigger,
  noteId,
}: RunLifeWikiRefreshInput): Promise<LifeWikiRunResult> => {
  const notes = await store.fetchNotes();
  const corpus = buildNotesCorpus(notes);
  const runId = await store.createRun({
    userId,
    kind: 'life_wiki_refresh',
    trigger,
    status: 'running',
    sourceHash: corpus.sourceHash,
    sourceNoteIds: corpus.sourceNoteIds,
    promptVersion: LIFE_WIKI_REFRESH_PROMPT_VERSION,
    model: INGEST_MODEL,
  });
  let savedPageCount = 0;

  try {
    const savedNote = noteId ? notes.find((note) => note.id === noteId) : null;
    if (trigger === 'smart_mode' && savedNote) {
      const absorbedHash = await store.getAbsorbedHash(savedNote.id);
      if (absorbedHash === getNoteContentHash(savedNote)) {
        await store.recordEvent(runId, {
          eventType: 'smart_mode_skipped',
          status: 'skipped',
          message: 'Saved note hash is unchanged.',
        });
        await store.finishRun(runId, { status: 'skipped', pageCount: 0 });
        return { runId, pageCount: 0, source: 'none', status: 'skipped', skipped: true };
      }
    }

    if (!corpus.text.trim()) {
      await store.finishRun(runId, { status: 'skipped', pageCount: 0 });
      return { runId, pageCount: 0, source: 'none', status: 'skipped', skipped: true };
    }

    await claimFeatureUsage('life_wiki_refresh');

    const savedPages: LifeTheme[] = [];
    for (const config of WIKI_PAGE_CONFIGS) {
      const content = await generateWikiPage({
        config,
        corpusText: corpus.text,
        sourceNoteIds: corpus.sourceNoteIds,
        runId,
        store,
        generateText,
        reviewWikiPageDraft,
        claimProviderUsage,
      });

      if (content) {
        const page = await store.upsertWikiPage(config.pageType, config.title, content);
        savedPages.push(page);
        savedPageCount = savedPages.length;
        await store.recordEvent(runId, {
          eventType: 'wiki_page_saved',
          pageType: config.pageType,
          status: 'succeeded',
        });
      }
    }

    if (savedPages.length > 0) {
      const existingPages = await store.fetchWikiPages();
      await claimProviderUsage('index');
      const indexContent = await generateText(
        buildIndexPrompt([...existingPages, ...savedPages]),
        INGEST_MODEL,
        'index',
      );
      if (indexContent.trim()) {
        await store.upsertWikiPage('index', 'Wiki Index', indexContent.trim());
      }
      await store.logAbsorptions(notes);
    }

    const status = getRunStatus(savedPages.length);
    await store.finishRun(runId, { status, pageCount: savedPages.length });

    return {
      runId,
      pageCount: savedPages.length,
      source: savedPages.length > 0 ? 'notes' : 'none',
      status,
      skipped: false,
    };
  } catch (error) {
    await store.finishRun(runId, {
      status: 'failed',
      pageCount: savedPageCount,
      error: compactError(error),
    });
    throw error;
  }
};
