import { GoogleGenAI } from "@google/genai";
import { Note, LifeTheme } from '../types';
import { wikiService, WikiPageType, STRUCTURED_WIKI_PAGES } from './wikiService';

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Strip HTML tags from Quill rich text before sending to Gemini */
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

/** Strip markdown fences Gemini sometimes hallucinates around JSON */
const cleanJson = (text: string) =>
  text.replace(/```json/g, '').replace(/```/g, '').trim();

// ─────────────────────────────────────────────
// AI Service
// ─────────────────────────────────────────────
export const aiService = {

  // ── 1. INGEST ────────────────────────────────────────────────────────────────
  /**
   * The Ingest Flow.
   * Called after a user saves a note (user-triggered from the UI).
   *
   * What it does:
   *   a) Decides whether to append to an existing freeform theme or create a new one.
   *   b) Synthesises and updates that theme's content.
   *   c) Records the citation (note → theme).
   *   d) Rebuilds the lightweight `index` wiki page so future queries stay fast.
   *
   * Gemini calls: 2 (decision + synthesis) + 1 (index rebuild) = 3 total per ingest.
   */
  processNoteIntoWiki: async (newNote: Note): Promise<void> => {
    const ai = getAI();

    // Only freeform themes — structured wiki pages are managed separately
    const userThemes = await wikiService.getUserThemes();
    const themeIndex = userThemes
      .map(t => `- ID: ${t.id} | Title: ${t.title}`)
      .join('\n');

    // ── Step 1: Decision ──────────────────────────────────────────────────────
    const decisionPrompt = `You are a personal cognitive librarian. The user just saved a journal entry.

Decide: should this entry integrate into an existing Life Theme, create a new one, or be skipped?

Current Life Themes:
${themeIndex || "(None yet — first entry)"}

New Journal Entry:
Title: ${newNote.title}
Date: ${new Date(newNote.createdAt).toLocaleDateString()}
Content: ${stripHtml(newNote.content)}
Mood: ${newNote.mood || 'Not set'}

Return ONLY valid JSON — no markdown fences, no preamble:
{
  "action": "append" | "create" | "skip",
  "themeId": "existing theme UUID if action is append, else null",
  "newThemeTitle": "short evocative title if action is create, else null",
  "reasoning": "one sentence"
}

Return "skip" only if the entry is entirely mundane with zero personal insight.`;

    try {
      const decisionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: decisionPrompt,
      });

      const decision = JSON.parse(cleanJson(decisionResponse.text || "{}"));
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

      // ── Step 2: Synthesis ───────────────────────────────────────────────────
      const theme = await wikiService.getThemeById(targetThemeId);
      if (!theme) throw new Error('Theme not found during synthesis.');

      const isNew = theme.content === 'Initializing...';

      const synthesisPrompt = `You are a careful cognitive synthesizer maintaining the user's personal Wiki.

Updating the Life Theme: "${theme.title}"

Current state of this theme:
${isNew ? '(Brand new theme — start from scratch.)' : theme.content}

New journal entry to ingest:
Title: ${newNote.title}
Date: ${new Date(newNote.createdAt).toLocaleDateString()}
Content: ${stripHtml(newNote.content)}
Mood: ${newNote.mood || 'Not set'}

Write the completely updated Markdown for this Life Theme.
Rules:
1. Integrate new information smoothly. Show how thinking is evolving.
2. If new info contradicts old info, note the shift explicitly:
   e.g. "Earlier: felt X → Now: realises Y"
3. Use clean markdown (headings, bullet points). Be concise — this page should stay under 400 words.
4. Output raw markdown only. No \`\`\`markdown wrapper.`;

      const synthesisResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: synthesisPrompt,
      });

      if (synthesisResponse.text) {
        await wikiService.updateThemeContent(targetThemeId, synthesisResponse.text.trim());
        // Silently ignore duplicate citation errors (UNIQUE constraint)
        try {
          await wikiService.addCitation(targetThemeId, newNote.id);
        } catch (_) {}
      }

      // ── Step 3: Rebuild Index ───────────────────────────────────────────────
      // The index is cheap to rebuild and keeps the query flow fast.
      // It's one short Gemini call to summarise all themes in one line each.
      await aiService._rebuildIndex();

    } catch (error) {
      console.error('[aiService] Ingest error:', error);
      // Suppress — ingest should never break the save flow
    }
  },

  // ── 2. QUERY / REFLECTION ─────────────────────────────────────────────────
  /**
   * The enriched Reflection Flow.
   * Replaces the raw Gemini call you had before.
   *
   * What it does:
   *   1. Reads the `index` wiki page to understand the user's overall picture.
   *   2. Reads all structured wiki pages (mood_patterns, self_model, etc.).
   *   3. Passes these as context alongside the current note.
   *   4. Gemini's reflection is now personal, not generic.
   *
   * Gemini calls: 1 per reflection request.
   */
  generateReflection: async (note: Note): Promise<string> => {
    const ai = getAI();

    // Pull all structured wiki pages for context
    const wikiPages = await wikiService.getAllWikiPages();
    const indexPage = await wikiService.getWikiPage('index');

    const wikiContext = wikiPages.length > 0
      ? wikiPages.map(p =>
          `### ${p.title}\n${p.content}`
        ).join('\n\n---\n\n')
      : null;

    const hasWikiContext = wikiContext || indexPage?.content;

    const reflectionPrompt = `You are a warm, perceptive journaling companion for the app "Reflections".
Your tone is human, non-clinical, and quietly insightful — never preachy.

${hasWikiContext ? `
──────────────────────────────────────
WHAT YOU KNOW ABOUT THIS PERSON
(compiled from their past entries)
──────────────────────────────────────
${indexPage ? `Overview:\n${indexPage.content}\n\n` : ''}${wikiContext || ''}
──────────────────────────────────────
Use this context to make your reflection feel personal, not generic.
Reference their patterns only when it adds genuine insight — don't force it.
` : `(This user is new — no prior patterns yet. Respond warmly to this first entry.)`}

Now here is today's journal entry:
Title: ${note.title}
Date: ${new Date(note.createdAt).toLocaleDateString()}
Mood: ${note.mood || 'Not noted'}
Content:
${stripHtml(note.content)}

Write a reflection of 3–4 short paragraphs.
- Open with something you genuinely noticed in this entry.
- If their current mood or theme connects to a past pattern you know about, gently name it.
- End with one open question that invites deeper thinking — not a generic prompt.
- Output plain prose only. No headers, no bullet points, no markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reflectionPrompt,
    });

    return response.text?.trim() || "I wasn't able to generate a reflection right now. Please try again.";
  },

  // ── 3. FULL WIKI REFRESH ──────────────────────────────────────────────────
  /**
   * Rebuilds the 4 structured wiki pages from scratch using all the user's
   * freeform life themes as source material.
   *
   * This is expensive (1 Gemini call per structured page = 4 calls).
   * Trigger this from a "Refresh Insights" button in the UI — not automatically.
   * Recommended: once every 5–10 new entries.
   *
   * Gemini calls: 4 total.
   */
  refreshWikiSummaries: async (): Promise<void> => {
    const ai = getAI();

    const userThemes = await wikiService.getUserThemes();
    if (userThemes.length === 0) return; // Nothing to synthesise yet

    const allThemeContent = userThemes
      .map(t => `## ${t.title}\n${t.content}`)
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
        const prompt = `You are maintaining a personal wiki for a journaling app user.

Here is everything they have written across all their Life Themes:
──────────────────────────────────────
${allThemeContent}
──────────────────────────────────────

Task: Write the "${config.title}" wiki page for this person.
${config.instruction}

Output raw markdown only. No \`\`\`markdown wrapper. No preamble.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        if (response.text) {
          await wikiService.upsertWikiPage(
            config.pageType,
            config.title,
            response.text.trim()
          );
        }
      } catch (error) {
        console.error(`[aiService] Failed to refresh wiki page: ${config.pageType}`, error);
        // Continue with other pages even if one fails
      }
    }

    // Rebuild index after all pages are refreshed
    await aiService._rebuildIndex();
  },

  // ── Internal ──────────────────────────────────────────────────────────────

  /**
   * Rebuilds the `index` wiki page — one-liner summaries of every page.
   * Called internally after every ingest and after refreshWikiSummaries.
   * Not intended to be called directly from the UI.
   *
   * Gemini calls: 1.
   */
  _rebuildIndex: async (): Promise<void> => {
    const ai = getAI();

    try {
      const [userThemes, wikiPages] = await Promise.all([
        wikiService.getUserThemes(),
        wikiService.getAllWikiPages(),
      ]);

      const allPages = [...wikiPages, ...userThemes];
      if (allPages.length === 0) return;

      const allContent = allPages
        .map(p => `## ${p.title}\n${p.content.slice(0, 500)}`) // First 500 chars is enough for indexing
        .join('\n\n---\n\n');

      const prompt = `You are building an index page for a personal wiki.

Here are all the wiki pages (truncated):
──────────────────────────────────────
${allContent}
──────────────────────────────────────

Write a concise index: one bullet per page, format exactly as:
- **[Page Title]**: one sentence summarising the page's key insight.

Output only the bullet list. No preamble, no headers, no markdown wrapper.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response.text) {
        await wikiService.upsertWikiPage(
          'index',
          'Wiki Index',
          response.text.trim()
        );
      }
    } catch (error) {
      console.error('[aiService] Index rebuild error:', error);
    }
  },
};
