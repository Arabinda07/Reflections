import type { LifeTheme, Note } from '../types';
import { wikiService } from './wikiService';
import { type WikiPageType } from './wikiTypes';
import { aiClient } from './aiClient';

export type WikiRefreshSource = 'themes' | 'notes' | 'none';

export interface WikiRefreshResult {
  pageCount: number;
  source: WikiRefreshSource;
}

const WIKI_PAGE_CONFIGS: { pageType: WikiPageType; title: string; instruction: string }[] = [
  {
    pageType: 'people',
    title: 'People',
    instruction: `Write a compact wiki essay about the people, relationships, and social worlds that appear in the notes.
Focus on recurring names, roles, tensions, support, and unresolved relationship patterns. Avoid diagnosis or certainty.
Use inline source markers near grounded claims in this exact format: [source:note-id]. Max 420 words.`,
  },
  {
    pageType: 'patterns',
    title: 'Patterns',
    instruction: `Write a compact wiki essay about recurring emotional, practical, and attention patterns visible in the notes.
Focus on repeated situations, rhythms, moods, triggers, and shifts over time. Avoid diagnosis or certainty.
Use inline source markers near grounded claims in this exact format: [source:note-id]. Max 420 words.`,
  },
  {
    pageType: 'philosophies',
    title: 'Philosophies',
    instruction: `Write a compact wiki essay about values, beliefs, principles, and ways of seeing life that show up in the notes.
Focus on what the person seems to care about and the ideas they return to. Keep the language grounded and tentative.
Use inline source markers near grounded claims in this exact format: [source:note-id]. Max 420 words.`,
  },
  {
    pageType: 'eras',
    title: 'Eras',
    instruction: `Write a compact wiki essay about seasons, phases, transitions, and periods that appear across the notes.
Focus on what changed, what repeated, and what may still be forming. Do not overstate the timeline if dates are thin.
Use inline source markers near grounded claims in this exact format: [source:note-id]. Max 420 words.`,
  },
  {
    pageType: 'decisions',
    title: 'Decisions',
    instruction: `Write a compact wiki essay about meaningful decisions, open questions, commitments, and tradeoffs visible in the notes.
Focus on choices already made, choices being considered, and what seems to make those choices difficult.
Use inline source markers near grounded claims in this exact format: [source:note-id]. Max 420 words.`,
  },
];

const stripHtml = (value = '') =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const noteHasSignal = (note: Note) =>
  Boolean(
    stripHtml(note.title) ||
      stripHtml(note.content) ||
      note.mood ||
      note.tags?.length ||
      note.tasks?.length,
  );

const buildNotesCorpus = (notes: Note[]) =>
  notes
    .filter(noteHasSignal)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .map((note) => {
      const plainTitle = stripHtml(note.title) || 'Untitled reflection';
      const plainContent = stripHtml(note.content);
      const metadata = [
        `Note id: ${note.id}`,
        `Date: ${new Date(note.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`,
        note.mood ? `Mood: ${note.mood}` : null,
        note.tags?.length ? `Tags: ${note.tags.join(', ')}` : null,
        note.tasks?.length
          ? `Tasks: ${note.tasks
              .map((task) => `${task.completed ? '[done]' : '[open]'} ${task.text}`)
              .join('; ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      return `## ${plainTitle}\n${metadata}\n\nEntry:\n${plainContent || 'No written body yet.'}`;
    })
    .join('\n\n---\n\n');

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

const refreshStructuredWikiPages = async (allThemeContent: string): Promise<number> => {
  let pageCount = 0;

  for (const config of WIKI_PAGE_CONFIGS) {
    try {
      const content = await aiClient.requestText('wikiPage', {
        title: config.title,
        instruction: config.instruction,
        allThemeContent,
      });

      const trimmedContent = content?.trim();

      if (trimmedContent) {
        await wikiService.upsertWikiPage(config.pageType, config.title, trimmedContent);
        pageCount += 1;
      }
    } catch (error) {
      console.error(`[aiService] Failed to refresh wiki page: ${config.pageType}`, error);
    }
  }

  if (pageCount > 0) {
    await aiService._rebuildIndex();
  }

  return pageCount;
};

export const aiService = {
  /**
   * The ingest flow can be used when the user explicitly chooses to build
   * or update Life Wiki themes from a note.
   */
  processNoteIntoWiki: async (newNote: Note): Promise<void> => {
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
    const notesCorpus = buildNotesCorpus(notes);
    if (!notesCorpus.trim()) {
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
   * Preserves the older theme-first API for any existing callers.
   */
  refreshWikiSummaries: async (): Promise<void> => {
    await aiService.refreshWikiOnDemand([]);
  },

  /**
   * Rebuilds the `index` wiki page after ingest and refresh flows.
   */
  _rebuildIndex: async (): Promise<void> => {
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
};
