import { type WikiPageType } from './wikiTypes';

export interface PromptSpec {
  id: string;
  version: string;
  model: string;
}

export const GEMINI_MODEL = 'gemini-3-flash-preview';
export const INGEST_MODEL = 'gemini-2.5-flash';
export const AI_PROMPT_VERSION = '2026-05-19';
export const LIFE_WIKI_REFRESH_PROMPT_VERSION = `life-wiki-refresh@${AI_PROMPT_VERSION}`;

export const buildPrompt = (parts: string[]) => parts.filter(Boolean).join('\n\n');

export const PROMPT_SPECS = {
  reflection: {
    id: 'reflection',
    model: GEMINI_MODEL,
    version: AI_PROMPT_VERSION,
  },
  lifeWikiRefresh: {
    id: 'life-wiki-refresh',
    model: INGEST_MODEL,
    version: AI_PROMPT_VERSION,
  },
  writingNotes: {
    id: 'writing-notes',
    model: GEMINI_MODEL,
    version: AI_PROMPT_VERSION,
  },
} satisfies Record<string, PromptSpec>;

export const WIKI_PAGE_CONFIGS: { pageType: WikiPageType; title: string; instruction: string }[] = [
  {
    pageType: 'people',
    title: 'People',
    instruction: `Write a compact wiki essay about the people, relationships, and social worlds that appear in the notes.
Focus on recurring names, roles, tensions, support, and unresolved relationship patterns. Avoid diagnosis or certainty.
Use an encyclopedic third-person tone. Do not summarize diary events; synthesize durable roles and relationships.
Every grounded claim must carry an inline source marker in this exact format: [Source: note-id]. Max 420 words.`,
  },
  {
    pageType: 'patterns',
    title: 'Patterns',
    instruction: `Write a compact wiki essay about recurring emotional, practical, and attention patterns visible in the notes.
Focus on repeated situations, rhythms, moods, triggers, and shifts over time. Avoid diagnosis or certainty.
Use an encyclopedic third-person tone. Do not diagnose or turn patterns into certainty.
Every grounded claim must carry an inline source marker in this exact format: [Source: note-id]. Max 420 words.`,
  },
  {
    pageType: 'philosophies',
    title: 'Philosophies',
    instruction: `Write a compact wiki essay about values, beliefs, principles, and ways of seeing life that show up in the notes.
Focus on what the person seems to care about and the ideas they return to. Keep the language grounded and tentative.
Use an encyclopedic third-person tone. Prefer careful synthesis over motivational language.
Every grounded claim must carry an inline source marker in this exact format: [Source: note-id]. Max 420 words.`,
  },
  {
    pageType: 'eras',
    title: 'Eras',
    instruction: `Write a compact wiki essay about seasons, phases, transitions, and periods that appear across the notes.
Focus on what changed, what repeated, and what may still be forming. Do not overstate the timeline if dates are thin.
Use an encyclopedic third-person tone. Name eras only when the notes give enough signal.
Every grounded claim must carry an inline source marker in this exact format: [Source: note-id]. Max 420 words.`,
  },
  {
    pageType: 'decisions',
    title: 'Decisions',
    instruction: `Write a compact wiki essay about meaningful decisions, open questions, commitments, and tradeoffs visible in the notes.
Focus on choices already made, choices being considered, and what seems to make those choices difficult.
Use an encyclopedic third-person tone. Preserve uncertainty around unresolved choices.
Every grounded claim must carry an inline source marker in this exact format: [Source: note-id]. Max 420 words.`,
  },
];

export const buildWikiPagePrompt = (input: {
  title: string;
  instruction: string;
  allThemeContent: string;
  retryInstruction?: string;
}) =>
  buildPrompt([
    'You are a careful reader maintaining a Life Wiki for the app Reflections.',
    `Here is the bounded source corpus. Use only these note ids for source markers:\n${input.allThemeContent}`,
    `Task: Write the "${input.title}" wiki page for this person.`,
    input.instruction,
    input.retryInstruction || '',
    'Output raw markdown only. Use quiet, observant language. Avoid clinical labels.',
  ]);

export const buildIndexPrompt = (pages: Array<{ title: string; content: string }>) => {
  const allContent = pages
    .map((page) => `## ${page.title}\n${String(page.content || '').slice(0, 500)}`)
    .join('\n\n---\n\n');

  return buildPrompt([
    'You are building a quiet index page for a personal Life Wiki.',
    `Here are all the wiki pages (truncated):\n${allContent}`,
    "Write a concise index page: one bullet per page, format exactly as - **[Page Title]**: one short sentence noticing the page's primary theme.",
    'Output only the bullet list. Use observant, plain language.',
  ]);
};
