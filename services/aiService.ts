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
    pageType: 'mood_patterns',
    title: 'Mood Patterns',
    instruction: `Extract and synthesise the recurring emotional states and triggers visible across the source material below.
Focus on: what emotions come up repeatedly, what situations tend to cause them, and any shifts over time.
Format: short paragraphs + bullet points. Max 300 words.`,
  },
  {
    pageType: 'recurring_themes',
    title: 'Recurring Themes',
    instruction: `Identify the topics and concerns this person keeps returning to across the source material below.
Focus on: what subjects appear repeatedly, which ones seem unresolved, which ones show growth.
Format: short paragraphs + bullet points. Max 300 words.`,
  },
  {
    pageType: 'self_model',
    title: 'Self Model',
    instruction: `Build a concise picture of how this person sees themselves — their values, beliefs, and identity as revealed through the source material below.
Focus on: how they describe themselves, what they care about, and any contradictions in self-perception.
Format: short paragraphs. Max 300 words. Write in third person ("They...").`,
  },
  {
    pageType: 'eras',
    title: 'Eras',
    instruction: `Identify the distinct life chapters, transitions, and time-boxed periods visible across the source material below.
Each era should be defined by a project, place, relationship, or mindset shift.
Format: short narrative paragraphs with approximate time context. Max 300 words.`,
  },
];

const stripHtml = (value = '') =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const buildThemeCorpus = (themes: LifeTheme[]) =>
  themes
    .map((theme) => `## ${theme.title}\n${theme.content}`)
    .join('\n\n---\n\n');

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

      if (content) {
        await wikiService.upsertWikiPage(config.pageType, config.title, content.trim());
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
   * Rebuilds the structured wiki pages from either freeform themes or, when
   * needed, directly from the user's notes.
   */
  refreshWikiOnDemand: async (notes: Note[]): Promise<WikiRefreshResult> => {
    const userThemes = await wikiService.getUserThemes();

    if (userThemes.length > 0) {
      const pageCount = await refreshStructuredWikiPages(buildThemeCorpus(userThemes));
      return {
        pageCount,
        source: pageCount > 0 ? 'themes' : 'none',
      };
    }

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
   * Send a question to the Companion, grounded in wiki content.
   */
  companionQuery: async (question: string): Promise<string> => {
    try {
      const allPages = await wikiService.getAll();
      const wikiPages = allPages
        .filter((p: LifeTheme) => p.state === 'active')
        .map((p: LifeTheme) => ({
          title: p.title,
          content: p.content,
        }));

      const content = await aiClient.call<string>('companionQuery', {
        question,
        wikiPages,
      });

      return content || "I don't have enough in your Sanctuary to answer that. Keep writing — the picture will fill in.";
    } catch (error) {
      console.error('[aiService] Companion query error:', error);
      return "Something went wrong while I was thinking. Try again in a moment.";
    }
  },
};
