import type { LifeTheme, Note } from '../types';
import { wikiService } from './wikiService';
import { type WikiPageType } from './wikiTypes';
import { aiClient } from './aiClient';
import { absorbLogService } from './absorbLogService';
import { buildNotesCorpus, getSignalNotes, type NotesCorpus } from './aiContext';
import { WIKI_PAGE_CONFIGS } from './aiPromptSpecs';
import { buildWikiRetryInstruction, validateWikiPageOutput } from './aiOutputValidation';
import { getStrictPrivateModeDisabledMessage, isPrivateAiDisabled } from './privateMode';
import { getCurrentUserMode } from './userModeStore';

export type WikiRefreshSource = 'themes' | 'notes' | 'none';

export interface WikiRefreshResult {
  pageCount: number;
  source: WikiRefreshSource;
}

export interface GreatIngestProgress {
  batchCount: number;
  batchIndex: number;
  processedCount: number;
  totalCount: number;
}

export interface GreatIngestResult extends WikiRefreshResult {
  batchCount: number;
  processedCount: number;
  totalCount: number;
}

export interface AutoIngestResult extends WikiRefreshResult {
  skipped: boolean;
}

const SMART_MODE_BATCH_SIZE = 5;

const getReflectionFallbackMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('GEMINI_API_KEY is not configured')) {
      return "AI reflections aren't configured on this environment yet. Add GEMINI_API_KEY and try again.";
    }

    if (
      error.message.includes('Unauthorized') ||
      error.message.includes('User not authenticated')
    ) {
      return 'Your session expired before the reflection could run. Sign in again and try once more.';
    }
  }

  return "I wasn't able to generate a reflection right now. Please try again.";
};

const generateValidatedWikiPage = async (
  config: { pageType: WikiPageType; title: string; instruction: string },
  corpus: NotesCorpus,
) => {
  const firstDraft = await aiClient.requestText('wikiPage', {
    title: config.title,
    instruction: config.instruction,
    allThemeContent: corpus.text,
  });
  const firstValidation = validateWikiPageOutput(firstDraft || '', {
    allowedSourceIds: corpus.sourceNoteIds,
  });
  if (firstValidation.ok === true) return firstValidation.content;

  const retryDraft = await aiClient.requestText('wikiPage', {
    title: config.title,
    instruction: config.instruction,
    allThemeContent: corpus.text,
    retryInstruction: buildWikiRetryInstruction(firstValidation.reason),
  });
  const retryValidation = validateWikiPageOutput(retryDraft || '', {
    allowedSourceIds: corpus.sourceNoteIds,
  });

  if (retryValidation.ok === true) return retryValidation.content;
  throw new Error(retryValidation.reason);
};

const refreshStructuredWikiPages = async (corpus: NotesCorpus): Promise<number> => {
  let pageCount = 0;

  for (const config of WIKI_PAGE_CONFIGS) {
    try {
      const content = await generateValidatedWikiPage(config, corpus);
      await wikiService.upsertWikiPage(config.pageType, config.title, content);
      pageCount += 1;
    } catch (error) {
      console.error(`[aiService] Failed to refresh wiki page: ${config.pageType}`, error);
    }
  }

  if (pageCount > 0) {
    await aiService._rebuildIndex();
  }

  return pageCount;
};

const ensureNoteInCorpus = (savedNote: Note, notes: Note[]) => {
  if (notes.some((note) => note.id === savedNote.id)) return notes;
  return [...notes, savedNote];
};

export const aiService = {
  /**
   * The ingest flow can be used when the user explicitly chooses to build
   * or update Life Wiki themes from a note.
   */
  processNoteIntoWiki: async (newNote: Note): Promise<void> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) return;

    const userThemes = await wikiService.getUserThemes();

    try {
      const decision = await aiClient.requestJson<{
        action: 'append' | 'create' | 'skip';
        themeId: string | null;
        newThemeTitle: string | null;
        reasoning: string;
      }>('ingestDecision', {
        note: newNote,
        themes: userThemes.map((theme) => ({
          id: theme.id,
          title: theme.title,
        })),
      });

      if (decision.action === 'skip') return;

      let targetThemeId: string | null = decision.themeId;

      if (decision.action === 'create' && decision.newThemeTitle) {
        const newTheme = await wikiService.createTheme(
          decision.newThemeTitle,
          'Initializing...',
        );
        targetThemeId = newTheme.id;
      }

      if (!targetThemeId) return;

      const theme = await wikiService.getThemeById(targetThemeId);
      if (!theme) throw new Error('Theme not found during synthesis.');

      const synthesis = await aiClient.requestText('ingestSynthesis', {
        note: newNote,
        theme: {
          ...theme,
          content: theme.content === 'Initializing...' ? '' : theme.content,
          isNew: theme.content === 'Initializing...',
        },
      });

      if (synthesis) {
        await wikiService.updateThemeContent(targetThemeId, synthesis.trim());
        try {
          await wikiService.addCitation(targetThemeId, newNote.id);
        } catch (_) {
          // Duplicate citations are expected when a note is re-saved.
        }
      }

      await aiService._rebuildIndex();
    } catch (error) {
      console.error('[aiService] Ingest error:', error);
    }
  },

  /**
   * Generates a contextual reflection for a single note using the structured
   * wiki pages plus the note itself.
   */
  generateReflection: async (note: Note): Promise<string> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) {
      return getStrictPrivateModeDisabledMessage();
    }

    try {
      const [wikiPages, indexPage] = await Promise.all([
        wikiService.getAllWikiPages(),
        wikiService.getWikiPage('index'),
      ]);

      return await aiClient.requestText('reflection', {
        note,
        wikiPages,
        indexPage,
        recentNotes: [],
      });
    } catch (error) {
      console.error('[aiService] Reflection error:', error);
      return getReflectionFallbackMessage(error);
    }
  },

  /**
   * Rebuilds the primary Sanctuary pages directly from the user's saved notes.
   */
  refreshWikiOnDemand: async (notes: Note[]): Promise<WikiRefreshResult> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) {
      return {
        pageCount: 0,
        source: 'none',
      };
    }

    const notesCorpus = buildNotesCorpus(notes);
    if (!notesCorpus.text.trim()) {
      return {
        pageCount: 0,
        source: 'none',
      };
    }

    const pageCount = await refreshStructuredWikiPages(notesCorpus);
    return {
      pageCount,
      source: pageCount > 0 ? 'notes' : 'none',
    };
  },

  /**
   * Smart Mode's first run. It rebuilds the Sanctuary from saved notes in
   * small chronological batches so the UI can show honest progress.
   */
  runGreatIngest: async (
    notes: Note[],
    options: { onProgress?: (progress: GreatIngestProgress) => void } = {},
  ): Promise<GreatIngestResult> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) {
      return {
        batchCount: 0,
        pageCount: 0,
        processedCount: 0,
        source: 'none',
        totalCount: notes.length,
      };
    }

    const signalNotes = getSignalNotes(notes);
    const totalCount = signalNotes.length;

    if (totalCount === 0) {
      return {
        batchCount: 0,
        pageCount: 0,
        processedCount: 0,
        source: 'none',
        totalCount: 0,
      };
    }

    const batchCount = Math.ceil(totalCount / SMART_MODE_BATCH_SIZE);
    let processedNotes: Note[] = [];
    let pageCount = 0;

    for (let index = 0; index < batchCount; index += 1) {
      const batch = signalNotes.slice(
        index * SMART_MODE_BATCH_SIZE,
        (index + 1) * SMART_MODE_BATCH_SIZE,
      );
      processedNotes = [...processedNotes, ...batch];

      const notesCorpus = buildNotesCorpus(processedNotes);
      pageCount = notesCorpus.text.trim() ? await refreshStructuredWikiPages(notesCorpus) : 0;

      if (pageCount > 0) {
        await absorbLogService.logAbsorptions(batch);
      }

      options.onProgress?.({
        batchCount,
        batchIndex: index + 1,
        processedCount: processedNotes.length,
        totalCount,
      });
    }

    return {
      batchCount,
      pageCount,
      processedCount: processedNotes.length,
      source: pageCount > 0 ? 'notes' : 'none',
      totalCount,
    };
  },

  /**
   * Smart Mode's steady state. This is intentionally fire-and-forget from the
   * editor; the saved note is already durable before this runs.
   */
  autoIngestSavedNote: async (savedNote: Note, notes: Note[] = [savedNote]): Promise<AutoIngestResult> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) {
      return {
        pageCount: 0,
        skipped: true,
        source: 'none',
      };
    }

    const needsReAbsorb = await absorbLogService.needsReAbsorb(savedNote);
    if (!needsReAbsorb) {
      return {
        pageCount: 0,
        skipped: true,
        source: 'none',
      };
    }

    const refreshResult = await aiService.refreshWikiOnDemand(ensureNoteInCorpus(savedNote, notes));

    if (refreshResult.pageCount > 0) {
      await absorbLogService.logAbsorption(savedNote);
    }

    return {
      ...refreshResult,
      skipped: false,
    };
  },

  /**
   * Preserves the older theme-first API for any existing callers.
   */
  refreshWikiSummaries: async (): Promise<void> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) return;
    await aiService.refreshWikiOnDemand([]);
  },

  /**
   * Rebuilds the `index` wiki page after ingest and refresh flows.
   */
  _rebuildIndex: async (): Promise<void> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) return;

    try {
      const [userThemes, wikiPages] = await Promise.all([
        wikiService.getUserThemes(),
        wikiService.getAllWikiPages(),
      ]);

      const allPages = [...wikiPages, ...userThemes];
      if (allPages.length === 0) return;

      const content = await aiClient.requestText('index', {
        pages: allPages.map((page: LifeTheme) => ({
          title: page.title,
          content: page.content.slice(0, 500),
        })),
      });

      if (content) {
        await wikiService.upsertWikiPage('index', 'Wiki Index', content.trim());
      }
    } catch (error) {
      console.error('[aiService] Index rebuild error:', error);
    }
  },

  /**
   * Generates a fresh set of writing notes (quotes/advice) for the dashboard.
   */
  generateWritingNotes: async (): Promise<{ text: string; author: string }[]> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) return [];

    try {
      const indexPage = await wikiService.getWikiPage('index');
      const notes = await aiClient.requestJson<{ text: string; author: string }[]>(
        'writingNotes',
        { indexPage },
      );

      return notes || [];
    } catch (error) {
      console.error('[aiService] Failed to generate writing notes:', error);
      return [];
    }
  },

  /**
   * Suggests tags for a note based on its content.
   */
  suggestTags: async (content: string): Promise<string[]> => {
    if (isPrivateAiDisabled(getCurrentUserMode())) return [];

    try {
      const tags = await aiClient.requestJson<string[]>('tags', { content });
      return Array.isArray(tags) ? tags : [];
    } catch (error) {
      console.error('[aiService] Failed to suggest tags:', error);
      return [];
    }
  },
};
