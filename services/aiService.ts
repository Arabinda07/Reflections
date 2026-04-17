import { Note, LifeTheme } from '../types';
import { wikiService } from './wikiService';
import { WikiPageType } from './wikiTypes';
import { aiClient } from './aiClient';

export const aiService = {
  /**
   * The ingest flow runs after a note save and keeps the user's freeform
   * themes current without touching the browser bundle with Gemini.
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
          'Initializing...'
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
    const wikiPages = await wikiService.getAllWikiPages();
    const indexPage = await wikiService.getWikiPage('index');

    try {
      return await aiClient.requestText('reflection', {
        note,
        wikiPages,
        indexPage,
        recentNotes: [],
      });
    } catch (error) {
      console.error('[aiService] Reflection error:', error);
      return "I wasn't able to generate a reflection right now. Please try again.";
    }
  },

  /**
   * Rebuilds the structured wiki pages from the user's freeform themes.
   */
  refreshWikiSummaries: async (): Promise<void> => {
    const userThemes = await wikiService.getUserThemes();
    if (userThemes.length === 0) return;

    const allThemeContent = userThemes
      .map((theme) => `## ${theme.title}\n${theme.content}`)
      .join('\n\n---\n\n');

    const pageConfigs: { pageType: WikiPageType; title: string; instruction: string }[] = [
      {
        pageType: 'mood_patterns',
        title: 'Mood Patterns',
        instruction: `Extract and synthesise the recurring emotional states and triggers visible across all life themes.
Focus on: what emotions come up repeatedly, what situations tend to cause them, and any shifts over time.
Format: short paragraphs + bullet points. Max 300 words.`,
      },
      {
        pageType: 'recurring_themes',
        title: 'Recurring Themes',
        instruction: `Identify the topics and concerns this person keeps returning to across all their life themes.
Focus on: what subjects appear repeatedly, which ones seem unresolved, which ones show growth.
Format: short paragraphs + bullet points. Max 300 words.`,
      },
      {
        pageType: 'self_model',
        title: 'Self Model',
        instruction: `Build a concise picture of how this person sees themselves — their values, beliefs, and identity as revealed through their writing.
Focus on: how they describe themselves, what they care about, and any contradictions in self-perception.
Format: short paragraphs. Max 300 words. Write in third person ("They...").`,
      },
      {
        pageType: 'timeline',
        title: 'Timeline',
        instruction: `Extract the key moments, turning points, and shifts mentioned across all life themes.
List them chronologically where possible.
Format: bullet list, each item with approximate context. Max 300 words.`,
      },
    ];

    for (const config of pageConfigs) {
      try {
        const content = await aiClient.requestText('wikiPage', {
          title: config.title,
          instruction: config.instruction,
          allThemeContent,
        });

        if (content) {
          await wikiService.upsertWikiPage(config.pageType, config.title, content.trim());
        }
      } catch (error) {
        console.error(`[aiService] Failed to refresh wiki page: ${config.pageType}`, error);
      }
    }

    await aiService._rebuildIndex();
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
};
