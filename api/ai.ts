import { GoogleGenAI, Type } from '@google/genai';
import {
  HttpError,
  createSupabaseAdminClient,
  createSupabaseAuthClient,
  getClientIp,
  getErrorMessage,
  getErrorStatusCode,
  hashForLogs,
  parseJsonBody,
  requireUser,
  sendJson,
} from '../server/apiUtils';

type AiAction =
  | 'prompts'
  | 'reflection'
  | 'tags'
  | 'ingestDecision'
  | 'ingestSynthesis'
  | 'wikiPage'
  | 'index'
  | 'writingNotes';

type AiRequest = {
  action?: AiAction;
  payload?: any;
};

const GEMINI_MODEL = 'gemini-3-flash-preview';
const INGEST_MODEL = 'gemini-2.5-flash';
const MAX_BODY_BYTES = 250_000;
const NOTE_OWNERSHIP_ACTIONS = new Set<AiAction>([
  'reflection',
  'ingestDecision',
  'ingestSynthesis',
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_RATE_WINDOW_MS = 60 * 60 * 1000;
const LOCAL_RATE_LIMITS: Record<AiAction, { user: number; ip: number }> = {
  prompts: { user: 20, ip: 80 },
  reflection: { user: 10, ip: 40 },
  tags: { user: 30, ip: 100 },
  ingestDecision: { user: 20, ip: 60 },
  ingestSynthesis: { user: 20, ip: 60 },
  wikiPage: { user: 20, ip: 60 },
  index: { user: 20, ip: 60 },
  writingNotes: { user: 20, ip: 80 },
};
const localRateBuckets = new Map<string, number[]>();

const supabaseAuth = createSupabaseAuthClient();

const getGemini = () => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenAI({ apiKey });
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

const pruneRateBucket = (key: string, now: number) => {
  const cutoff = now - LOCAL_RATE_WINDOW_MS;
  const entries = (localRateBuckets.get(key) || []).filter((time) => time > cutoff);
  localRateBuckets.set(key, entries);
  return entries;
};

const assertLocalRateLimit = (action: AiAction, userId: string, ipHash: string) => {
  const now = Date.now();
  const limits = LOCAL_RATE_LIMITS[action];
  const keys = [
    { key: `user:${userId}:${action}`, limit: limits.user },
    { key: `ip:${ipHash}:${action}`, limit: limits.ip },
  ];

  for (const { key, limit } of keys) {
    const entries = pruneRateBucket(key, now);
    if (entries.length >= limit) {
      throw new HttpError(429, 'rate_limit_exceeded');
    }
    entries.push(now);
    localRateBuckets.set(key, entries);
  }
};

const assertNoteOwnership = async (userId: string, action: AiAction, payload: any) => {
  const noteId = String(payload?.note?.id || '');
  if (!NOTE_OWNERSHIP_ACTIONS.has(action) || !noteId || !UUID_PATTERN.test(noteId)) {
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    throw new HttpError(403, 'Note does not belong to the authenticated user');
  }
};

const claimAiUsage = async (userId: string, action: AiAction, req: any) => {
  const ipHash = hashForLogs(getClientIp(req));
  assertLocalRateLimit(action, userId, ipHash);

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.rpc('claim_ai_usage', {
    p_action: action,
    p_ip_hash: ipHash,
    p_user_id: userId,
  });

  if (error) {
    throw new HttpError(500, 'AI quota check failed');
  }

  const allowed = typeof data === 'object' && data !== null && (data as any).allowed === true;
  if (!allowed) {
    const reason =
      typeof data === 'object' && data !== null && typeof (data as any).reason === 'string'
        ? (data as any).reason
        : 'AI quota exhausted';
    throw new HttpError(429, reason);
  }
};

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
    'You are a careful, grounded reader for the app Reflections. Your goal is to help the user notice patterns in their writing without judgment.',
    `Context:\n${currentMood ? `The user is currently feeling ${currentMood}.` : 'The user has not specified a mood for this entry yet.'}`,
    noteContext
      ? `Here are their most recent entries for context:\n${noteContext}`
      : 'The user has no past entries yet.',
    `Current entry:\nTitle: ${note?.title || 'Untitled'}\nContent: ${stripHtml(String(note?.content || ''))}`,
    'Instructions:\n1. Notice a recurring theme, quiet tension, or pattern from these recent entries.\n2. Generate 4 brief, personalized journaling prompts that act as practical writing starters.\n3. Avoid clinical language, poetic metaphors, or wellness slogans. Do not use phrases like "gentle nudge," "slower look," "inner world," or "journey."\n4. Be direct, human, and useful. Focus on the actual events and thoughts described.\n5. Return only a JSON array of strings.',
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
    'You are a careful, grounded reader for the app Reflections.',
    'Your tone is human, observant, calm, and reflective. You mirror the user’s language lightly and avoid certainty.',
    indexPage?.content ? `Overview of their patterns:\n${indexPage.content}` : '',
    wikiContext ? `PATTERNS NOTICED SO FAR\n${wikiContext}` : '',
    recentContext ? `RECENT ENTRIES\n${recentContext}` : '',
    `Now here is today's journal entry:\nTitle: ${note?.title || 'Untitled'}\nMood: ${note?.mood || 'Not noted'}\nContent:\n${stripHtml(String(note?.content || ''))}`,
    'Instructions:',
    '1. Write a reflection of 3 short paragraphs.',
    '2. Use the structure: One specific observation, one possible pattern ("seems to", "might"), and one gentle question or point to return to.',
    '3. Avoid diagnosis, clinical labels, or generic advice.',
    '4. Stay grounded in the current note while noticing connections to the past.',
    '5. Output plain prose only.',
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
    'You are a careful Life Wiki organizer for the app Reflections.',
    'Decide whether this journal entry contains a pattern worth noticing or if it should be skipped.',
    `Current Life Themes:\n${themeIndex || '(None yet - first entry)'}`,
    `New Journal Entry:\nTitle: ${note?.title || 'Untitled'}\nDate: ${note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}\nContent: ${stripHtml(String(note?.content || ''))}\nMood: ${note?.mood || 'Not set'}`,
    'Return only valid JSON with action, themeId, newThemeTitle, and reasoning. Use grounded, non-clinical reasoning.',
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
    'You are a careful reader maintaining the user’s Life Wiki in Reflections.',
    `Updating the Life Theme: "${theme?.title || 'Untitled'}"`,
    `Current state of this theme:\n${theme?.content || '(New theme)'}`,
    `New journal entry to ingest:\nTitle: ${note?.title || 'Untitled'}\nDate: ${note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}\nContent: ${stripHtml(String(note?.content || ''))}\nMood: ${note?.mood || 'Not set'}`,
    'Rewrite the updated Markdown for this Life Theme. Use observant, non-clinical language. Focus on what seems to be returning. Output raw markdown only.',
  ]);

  return generateText(prompt, INGEST_MODEL);
};

const handleWikiPage = async (payload: any) => {
  const title = String(payload?.title || 'Untitled');
  const instruction = String(payload?.instruction || '');
  const allThemeContent = String(payload?.allThemeContent || '');

  const prompt = buildPrompt([
    'You are a careful reader maintaining a Life Wiki for the app Reflections.',
    `Here is everything they have written across all their Life Themes:\n${allThemeContent}`,
    `Task: Write the "${title}" wiki page for this person.`,
    instruction,
    'Output raw markdown only. Use quiet, observant language. Avoid clinical labels.',
  ]);

  return generateText(prompt, INGEST_MODEL);
};

const handleIndex = async (payload: any) => {
  const pages = Array.isArray(payload?.pages) ? payload.pages : [];
  const allContent = pages
    .map((page: any) => `## ${page.title}\n${String(page.content || '').slice(0, 500)}`)
    .join('\n\n---\n\n');

  const prompt = buildPrompt([
    'You are building a quiet index page for a personal Life Wiki.',
    `Here are all the wiki pages (truncated):\n${allContent}`,
    "Write a concise index: one bullet per page, format exactly as - **[Page Title]**: one short sentence noticing the page's primary theme.",
    'Output only the bullet list. Use observant, plain language.',
  ]);

  return generateText(prompt, INGEST_MODEL);
};

const handleWritingNotes = async (payload: any) => {
  const indexPage = payload?.indexPage || null;
  const prompt = buildPrompt([
    'You are a careful, grounded mentor for the app Reflections, focused on private writing and mental clarity.',
    indexPage?.content ? `User context (from their Life Wiki patterns):\n${indexPage.content}` : 'No user context available yet.',
    'Instructions:\n1. Generate 3 fresh "Writing Notes" (short, punchy quotes or pieces of advice) for the user.\n2. They should be grounded and focused on the act of noticing or returning to one’s thoughts. Avoid being overly "inspiring" or using wellness slogans.\n3. If user context is provided, tailor at least one note to what seems to be recurring in their life.\n4. Each note must have an "author" (a real person like Marcus Aurelius, Carl Jung, Joan Didion, Natalie Goldberg, or "Reflections" if it is general system wisdom).\n5. Avoid clinical labels or "optimization" language. Be quiet, human, and direct.\n6. Return only a JSON array of objects with "text" and "author" fields.',
  ]);

  return generateJson<unknown>(prompt, {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        author: { type: Type.STRING },
      },
      required: ['text', 'author'],
    },
  } as any);
};

const handlers: Record<AiAction, (payload: any) => Promise<any>> = {
  prompts: handlePrompts,
  reflection: handleReflection,
  tags: handleTags,
  ingestDecision: handleIngestDecision,
  ingestSynthesis: handleIngestSynthesis,
  wikiPage: handleWikiPage,
  index: handleIndex,
  writingNotes: handleWritingNotes,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const user = await requireUser(supabaseAuth, req.headers?.authorization);
    const body = await parseJsonBody<AiRequest>(req, MAX_BODY_BYTES);

    if (!body.action || !(body.action in handlers)) {
      return sendJson(res, 400, { error: 'Invalid AI action' });
    }

    await assertNoteOwnership(user.id, body.action, body.payload);
    await claimAiUsage(user.id, body.action, req);

    const data = await handlers[body.action](body.payload);
    return sendJson(res, 200, { ok: true, data });
  } catch (error: unknown) {
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'AI request failed'),
    });
  }
}
