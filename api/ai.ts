import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type AiAction =
  | 'prompts'
  | 'reflection'
  | 'tags'
  | 'ingestDecision'
  | 'ingestSynthesis'
  | 'wikiPage'
  | 'index';

type AiRequest = {
  action?: AiAction;
  payload?: any;
};

const GEMINI_MODEL = 'gemini-3-flash-preview';
const INGEST_MODEL = 'gemini-2.5-flash';
const MAX_BODY_BYTES = 250_000;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getGemini = () => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenAI({ apiKey });
};

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const cleanJson = (text: string) =>
  text.replace(/```json/g, '').replace(/```/g, '').trim();

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const normalizeList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 6);
};

const parseBody = async (req: any): Promise<AiRequest> => {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Request body too large');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  return JSON.parse(raw);
};

const requireUser = async (authorization?: string) => {
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!token) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return data.user;
};

const generateJson = async <T>(
  prompt: string,
  schema: Record<string, unknown>
): Promise<T> => {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema as any,
    },
  });

  return JSON.parse(cleanJson(response.text || '{}')) as T;
};

const generateText = async (prompt: string, model = GEMINI_MODEL): Promise<string> => {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text?.trim() || '';
};

const buildPrompt = (parts: string[]) => parts.filter(Boolean).join('\n\n');

const handlePrompts = async (payload: any) => {
  const recentNotes = Array.isArray(payload?.recentNotes) ? payload.recentNotes : [];
  const currentMood = payload?.currentMood ? String(payload.currentMood) : '';
  const note = payload?.note || {};

  const noteContext = recentNotes
    .map((entry: any) => {
      const cleanContent = stripHtml(String(entry?.content || '')).slice(0, 300);
      return `Title: ${entry?.title || 'Untitled'}\nMood: ${entry?.mood || 'Unspecified'}\nContent: ${cleanContent}`;
    })
    .join('\n\n');

  const prompt = buildPrompt([
    'You are a thoughtful, grounded journaling partner. Your goal is to help the user connect their current mood with recurring themes in their life.',
    `Context:\n${currentMood ? `The user is currently feeling ${currentMood}.` : 'The user has not specified a mood for this entry yet.'}`,
    noteContext
      ? `Here are their most recent entries for context:\n${noteContext}`
      : 'The user has no past entries yet.',
    `Current entry:\nTitle: ${note?.title || 'Untitled'}\nContent: ${stripHtml(String(note?.content || ''))}`,
    'Instructions:\n1. Identify a recurring theme, unresolved tension, or pattern from these recent entries.\n2. Generate 4 brief, personalized journaling prompts.\n3. One prompt should be a gentle nudge, one should invite a slower look, and two should relate to their specific recurring themes.\n4. Avoid flowery language. Be direct, human, and helpful.\n5. Return only a JSON array of strings.',
  ]);

  const data = await generateJson<unknown>(prompt, {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  } as any);

  return normalizeList(data);
};

const handleTags = async (payload: any) => {
  const content = stripHtml(String(payload?.content || ''));
  const prompt = buildPrompt([
    'Based on this journal entry, suggest 3 relevant tags for organization.',
    'Return only a JSON array of strings.',
    `Entry:\n${content}`,
  ]);

  const data = await generateJson<unknown>(prompt, {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  } as any);

  return normalizeList(data);
};

const handleReflection = async (payload: any) => {
  const note = payload?.note || {};
  const wikiPages = Array.isArray(payload?.wikiPages) ? payload.wikiPages : [];
  const indexPage = payload?.indexPage || null;
  const recentNotes = Array.isArray(payload?.recentNotes) ? payload.recentNotes : [];

  const wikiContext = wikiPages.length > 0
    ? wikiPages.map((page: any) => `### ${page.title}\n${page.content}`).join('\n\n---\n\n')
    : '';

  const recentContext = recentNotes.length > 0
    ? recentNotes
        .map((entry: any) => {
          const cleanContent = stripHtml(String(entry?.content || '')).slice(0, 240);
          return `Title: ${entry?.title || 'Untitled'}\nMood: ${entry?.mood || 'Not noted'}\nContent: ${cleanContent}`;
        })
        .join('\n\n')
    : '';

  const prompt = buildPrompt([
    'You are a warm, careful reader for the app Reflections.',
    'Your tone is human, non-clinical, and quietly insightful.',
    indexPage?.content ? `Overview:\n${indexPage.content}` : '',
    wikiContext ? `PATTERNS THE NOTES SUGGEST\n${wikiContext}` : '',
    recentContext ? `RECENT ENTRIES\n${recentContext}` : '',
    `Now here is today's journal entry:\nTitle: ${note?.title || 'Untitled'}\nMood: ${note?.mood || 'Not noted'}\nContent:\n${stripHtml(String(note?.content || ''))}`,
    'Write a reflection of 3-4 short paragraphs. Open with something you genuinely noticed. Reference patterns only when it adds real insight. End with one open question. Output plain prose only.',
  ]);

  const text = await generateText(prompt);
  return text || "I wasn't able to generate a reflection right now. Please try again.";
};

const handleIngestDecision = async (payload: any) => {
  const themes = Array.isArray(payload?.themes) ? payload.themes : [];
  const note = payload?.note || {};
  const themeIndex = themes
    .map((theme: any) => `- ID: ${theme.id} | Title: ${theme.title}`)
    .join('\n');

  const prompt = buildPrompt([
    'You are a careful Life Wiki organizer for a journaling app.',
    'Decide whether this journal entry should integrate into an existing Life Theme, create a new one, or be skipped.',
    `Current Life Themes:\n${themeIndex || '(None yet - first entry)'}`,
    `New Journal Entry:\nTitle: ${note?.title || 'Untitled'}\nDate: ${note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}\nContent: ${stripHtml(String(note?.content || ''))}\nMood: ${note?.mood || 'Not set'}`,
    'Return only valid JSON with action, themeId, newThemeTitle, and reasoning.',
  ]);

  return generateJson<{
    action: 'append' | 'create' | 'skip';
    themeId: string | null;
    newThemeTitle: string | null;
    reasoning: string;
  }>(prompt, {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING },
      themeId: { type: Type.STRING, nullable: true },
      newThemeTitle: { type: Type.STRING, nullable: true },
      reasoning: { type: Type.STRING },
    },
    required: ['action', 'themeId', 'newThemeTitle', 'reasoning'],
  } as any);
};

const handleIngestSynthesis = async (payload: any) => {
  const note = payload?.note || {};
  const theme = payload?.theme || {};
  const prompt = buildPrompt([
    "You are a careful cognitive synthesizer maintaining the user's personal Wiki.",
    `Updating the Life Theme: "${theme?.title || 'Untitled'}"`,
    `Current state of this theme:\n${theme?.content || '(Brand new theme - start from scratch.)'}`,
    `New journal entry to ingest:\nTitle: ${note?.title || 'Untitled'}\nDate: ${note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}\nContent: ${stripHtml(String(note?.content || ''))}\nMood: ${note?.mood || 'Not set'}`,
    'Write the completely updated Markdown for this Life Theme. Output raw markdown only.',
  ]);

  return generateText(prompt, INGEST_MODEL);
};

const handleWikiPage = async (payload: any) => {
  const title = String(payload?.title || 'Untitled');
  const instruction = String(payload?.instruction || '');
  const allThemeContent = String(payload?.allThemeContent || '');

  const prompt = buildPrompt([
    'You are maintaining a personal wiki for a journaling app user.',
    `Here is everything they have written across all their Life Themes:\n${allThemeContent}`,
    `Task: Write the "${title}" wiki page for this person.`,
    instruction,
    'Output raw markdown only. No preamble.',
  ]);

  return generateText(prompt, INGEST_MODEL);
};

const handleIndex = async (payload: any) => {
  const pages = Array.isArray(payload?.pages) ? payload.pages : [];
  const allContent = pages
    .map((page: any) => `## ${page.title}\n${String(page.content || '').slice(0, 500)}`)
    .join('\n\n---\n\n');

  const prompt = buildPrompt([
    'You are building an index page for a personal wiki.',
    `Here are all the wiki pages (truncated):\n${allContent}`,
    "Write a concise index: one bullet per page, format exactly as - **[Page Title]**: one sentence summarising the page's key insight.",
    'Output only the bullet list.',
  ]);

  return generateText(prompt, INGEST_MODEL);
};

const handlers: Record<AiAction, (payload: any) => Promise<any>> = {
  prompts: handlePrompts,
  reflection: handleReflection,
  tags: handleTags,
  ingestDecision: handleIngestDecision,
  ingestSynthesis: handleIngestSynthesis,
  wikiPage: handleWikiPage,
  index: handleIndex,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    await requireUser(req.headers?.authorization);
    const body = await parseBody(req);

    if (!body.action || !(body.action in handlers)) {
      return sendJson(res, 400, { error: 'Invalid AI action' });
    }

    const data = await handlers[body.action](body.payload);
    return sendJson(res, 200, { ok: true, data });
  } catch (error: any) {
    const message = error?.message || 'AI request failed';
    const statusCode = message === 'Unauthorized' ? 401 : message === 'Method not allowed' ? 405 : 500;
    return sendJson(res, statusCode, { error: message });
  }
}
