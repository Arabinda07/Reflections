import { GoogleGenAI, Type } from '@google/genai';
import {
  HttpError,
  createSupabaseAdminClient,
  createSupabaseAuthClient,
  getClientIp,
  getErrorMessage,
  getErrorStatusCode,
  getUserMode,
  hashForLogs,
  logAiUsage,
  parseJsonBody,
  requireUser,
  sendJson,
} from '../server/apiUtils.js';
import {
  validateAiRequest,
  validateIngestDecision,
  type AiAction,
  type AiRequest,
} from '../services/aiContracts.js';
import {
  GEMINI_MODEL,
  INGEST_MODEL,
  buildIndexPrompt,
  buildPrompt,
  buildWikiPagePrompt,
} from '../services/aiPromptSpecs.js';
import {
  STRICT_PRIVATE_MODE_DISABLED_MESSAGE,
  isStrictPrivateModeEnabled,
} from '../services/privateMode.js';
import { typesafeClient } from '../server/typesafeClient.js';
import {
  buildJevIngestDecisionRequest,
  evaluateJevIngestDecision,
} from '../services/typesafeRouting.js';

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

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const normalizeList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 6);
};

const generateJson = async <T>(
  action: AiAction,
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
  logAiUsage(action, GEMINI_MODEL, response.usageMetadata);

  try {
    return JSON.parse(response.text || '{}') as T;
  } catch {
    throw new HttpError(502, 'Malformed AI JSON');
  }
};

const generateText = async (action: AiAction, prompt: string, model = GEMINI_MODEL): Promise<string> => {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  logAiUsage(action, model, response.usageMetadata);

  return response.text?.trim() || '';
};

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

const assertAllowedQuota = (data: unknown) => {
  const allowed = typeof data === 'object' && data !== null && (data as any).allowed === true;
  if (allowed) return;

  const reason =
    typeof data === 'object' && data !== null && typeof (data as any).reason === 'string'
      ? (data as any).reason
      : 'AI quota exhausted';
  throw new HttpError(429, reason);
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

  assertAllowedQuota(data);
};

const claimAiFeatureUsage = async (userId: string, feature: 'reflection') => {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.rpc('claim_ai_feature_usage', {
    p_feature: feature,
    p_user_id: userId,
  });

  if (error) {
    throw new HttpError(500, 'AI feature quota check failed');
  }

  assertAllowedQuota(data);
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
    'Write 4 brief, personalized journaling prompts that work as practical writing starters, drawing on a recurring theme, quiet tension, or pattern in these entries. Write like a plain-spoken friend rather than a wellness app: name the actual events and thoughts described, and skip clinical language, metaphor, and slogans.',
  ]);

  const data = await generateJson<unknown>('prompts', prompt, {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  } as any);

  return normalizeList(data);
};

const handleTags = async (payload: any) => {
  const content = stripHtml(String(payload?.content || ''));
  const prompt = buildPrompt([
    'Based on this journal entry, suggest 3 relevant tags for organization.',
    `Entry:\n${content}`,
  ]);

  const data = await generateJson<unknown>('tags', prompt, {
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
    'Write a reflection of 3 short paragraphs of plain prose: one specific observation, one possible pattern ("seems to", "might"), and one gentle question or point to return to. Stay grounded in today\'s note while noticing connections to the past, and leave out diagnosis, clinical labels, and generic advice.',
  ]);

  const text = await generateText('reflection', prompt);
  return text || "I wasn't able to generate a reflection right now. Please try again.";
};

const handleIngestDecision = async (payload: any) => {
  const themes = Array.isArray(payload?.themes) ? payload.themes : [];
  const note = payload?.note || {};
  const validThemeIds = themes.map((theme: any) => String(theme.id));

  // 1. Fast-path routing via TypeSafe Jev System One model
  if (typesafeClient.isConfigured()) {
    const jevRequest = buildJevIngestDecisionRequest(note, themes);
    const jevResponse = await typesafeClient.evaluate(jevRequest);
    const jevDecision = evaluateJevIngestDecision(jevResponse, validThemeIds);

    if (jevDecision !== null) {
      logAiUsage('ingestDecision', 'jev-latest', {
        promptTokenCount: jevResponse?.usage?.input_tokens ?? 0,
        candidatesTokenCount: jevResponse?.usage?.output_tokens ?? 0,
        totalTokenCount:
          (jevResponse?.usage?.input_tokens ?? 0) + (jevResponse?.usage?.output_tokens ?? 0),
      } as any);
      return jevDecision;
    }
  }

  // 2. Escalation / fallback to Gemini for new theme creation or uncertain cases
  const themeIndex = themes
    .map((theme: any) => `- ID: ${theme.id} | Title: ${theme.title}`)
    .join('\n');

  const prompt = buildPrompt([
    'You are a careful Life Wiki organizer for the app Reflections.',
    'Decide whether this journal entry contains a pattern worth noticing or if it should be skipped.',
    `Current Life Themes:\n${themeIndex || '(None yet - first entry)'}`,
    `New Journal Entry:\nTitle: ${note?.title || 'Untitled'}\nDate: ${note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}\nContent: ${stripHtml(String(note?.content || ''))}\nMood: ${note?.mood || 'Not set'}`,
    'Set action to "append" to add the entry to an existing theme (give its themeId), "create" to start a new theme (give newThemeTitle), or "skip" if the entry carries no pattern worth noticing. Use grounded, non-clinical reasoning.',
  ]);

  const decision = await generateJson<{
    action: 'append' | 'create' | 'skip';
    themeId: string | null;
    newThemeTitle: string | null;
    reasoning: string;
  }>('ingestDecision', prompt, {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['append', 'create', 'skip'] },
      themeId: { type: Type.STRING, nullable: true },
      newThemeTitle: { type: Type.STRING, nullable: true },
      reasoning: { type: Type.STRING },
    },
    required: ['action', 'themeId', 'newThemeTitle', 'reasoning'],
  } as any);

  const validation = validateIngestDecision(decision, validThemeIds);
  if (validation.ok === false) {
    throw new HttpError(502, validation.error);
  }

  return validation.data;
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

  return generateText('ingestSynthesis', prompt, INGEST_MODEL);
};

const handleWikiPage = async (payload: any) => {
  const title = String(payload?.title || 'Untitled');
  const instruction = String(payload?.instruction || '');
  const allThemeContent = String(payload?.allThemeContent || '');
  const retryInstruction = typeof payload?.retryInstruction === 'string' ? payload.retryInstruction : '';

  const prompt = buildWikiPagePrompt({
    title,
    instruction,
    allThemeContent,
    retryInstruction,
  });

  return generateText('wikiPage', prompt, INGEST_MODEL);
};

const handleIndex = async (payload: any) => {
  const pages = Array.isArray(payload?.pages) ? payload.pages : [];
  const prompt = buildIndexPrompt(
    pages.map((page: any) => ({
      title: String(page.title || 'Untitled'),
      content: String(page.content || ''),
    })),
  );

  return generateText('index', prompt, INGEST_MODEL);
};

const handleWritingNotes = async (payload: any) => {
  const indexPage = payload?.indexPage || null;
  const prompt = buildPrompt([
    'You are a careful, grounded mentor for the app Reflections, focused on private writing and mental clarity.',
    indexPage?.content ? `User context (from their Life Wiki patterns):\n${indexPage.content}` : 'No user context available yet.',
    'Write 3 fresh "Writing Notes": short, grounded pieces of advice about noticing or returning to one’s thoughts, in a quiet, human, direct voice rather than an inspirational or self-optimization one, and without clinical labels. If user context is provided, tailor at least one note to what seems to be recurring in their life.',
    'Set author to "Reflections" for notes you write. Attribute a note to a real person (for example Marcus Aurelius or Joan Didion) only when it is a well-known quote reproduced word for word; users read these as real quotations, so never paraphrase or invent one.',
  ]);

  return generateJson<unknown>('writingNotes', prompt, {
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
    const userMode = await getUserMode(user.id);
    if (userMode == null) {
      return sendJson(res, 403, {
        error: 'user_mode_unavailable',
        message: 'Your privacy mode could not be confirmed. Try again in a moment.',
      });
    }
    if (isStrictPrivateModeEnabled(userMode)) {
      return sendJson(res, 403, {
        error: 'strict_private_mode_ai_disabled',
        message: STRICT_PRIVATE_MODE_DISABLED_MESSAGE,
      });
    }

    const body = await parseJsonBody<AiRequest>(req, MAX_BODY_BYTES);
    const validation = validateAiRequest(body);

    if (validation.ok === false) {
      return sendJson(res, 400, { error: validation.error });
    }

    await assertNoteOwnership(user.id, validation.action, validation.payload);
    await claimAiUsage(user.id, validation.action, req);
    if (validation.action === 'reflection') {
      await claimAiFeatureUsage(user.id, 'reflection');
    }

    const data = await handlers[validation.action](validation.payload);
    return sendJson(res, 200, { ok: true, data });
  } catch (error: unknown) {
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'AI request failed'),
    });
  }
}
