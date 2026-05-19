import { GoogleGenAI } from '@google/genai';
import type { LifeTheme, MoodName, Note } from '../types';
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
import {
  runLifeWikiRefresh,
  type LifeWikiRunEventInput,
  type LifeWikiRunStore,
  type LifeWikiRunTrigger,
} from '../server/lifeWikiRuns';
import type { AiAction } from '../services/aiContracts';
import { getNoteContentHash } from '../services/aiContext';

type AiRunRequest = {
  kind?: 'life_wiki_refresh';
  trigger?: LifeWikiRunTrigger;
  noteId?: string;
};

type SupabaseNoteRow = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  attachments: Note['attachments'] | null;
  mood: string | null;
  tasks: Note['tasks'] | null;
};

type SupabaseLifeThemeRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  state: LifeTheme['state'];
  page_type: LifeTheme['pageType'];
  created_at: string;
  updated_at: string;
};

const MAX_BODY_BYTES = 50_000;
const VALID_TRIGGERS = new Set<LifeWikiRunTrigger>(['manual', 'smart_mode', 'account_enable']);
const supabaseAuth = createSupabaseAuthClient();

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenAI({ apiKey });
};

const mapNoteRow = (row: SupabaseNoteRow): Note => ({
  id: row.id,
  title: row.title || '',
  content: row.content || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  thumbnailUrl: row.thumbnail_url || undefined,
  tags: row.tags || [],
  attachments: row.attachments || [],
  mood: (row.mood as MoodName) || undefined,
  tasks: row.tasks || [],
});

const mapLifeThemeRow = (row: SupabaseLifeThemeRow): LifeTheme => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  content: row.content,
  state: row.state,
  pageType: row.page_type,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const assertAllowed = (data: unknown) => {
  const allowed = typeof data === 'object' && data !== null && (data as { allowed?: unknown }).allowed === true;
  if (allowed) return;

  const reason =
    typeof data === 'object' && data !== null && typeof (data as { reason?: unknown }).reason === 'string'
      ? String((data as { reason: string }).reason)
      : 'AI quota exhausted';
  throw new HttpError(429, reason);
};

const createRunStore = (supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>, userId: string): LifeWikiRunStore => ({
  createRun: async (input) => {
    const { data, error } = await supabaseAdmin
      .from('ai_runs')
      .insert({
        user_id: userId,
        kind: input.kind,
        trigger: input.trigger,
        status: input.status,
        source_hash: input.sourceHash,
        source_note_ids: input.sourceNoteIds,
        prompt_version: input.promptVersion,
        model: input.model,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data?.id) throw error || new Error('AI run could not be created');
    return String(data.id);
  },
  finishRun: async (runId, patch) => {
    const { error } = await supabaseAdmin
      .from('ai_runs')
      .update({
        status: patch.status,
        page_count: patch.pageCount,
        error: patch.error || null,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .eq('user_id', userId);

    if (error) throw error;
  },
  recordEvent: async (runId: string, event: LifeWikiRunEventInput) => {
    const { error } = await supabaseAdmin
      .from('ai_run_events')
      .insert({
        run_id: runId,
        user_id: userId,
        event_type: event.eventType,
        page_type: event.pageType || null,
        status: event.status || null,
        message: event.message || null,
        metadata: event.metadata || {},
      });

    if (error) throw error;
  },
  fetchNotes: async () => {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('id,title,content,created_at,updated_at,thumbnail_url,tags,attachments,mood,tasks')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return ((data || []) as SupabaseNoteRow[]).map(mapNoteRow);
  },
  fetchWikiPages: async () => {
    const { data, error } = await supabaseAdmin
      .from('life_themes')
      .select('*')
      .eq('user_id', userId)
      .neq('page_type', 'theme');

    if (error) throw error;
    return ((data || []) as SupabaseLifeThemeRow[]).map(mapLifeThemeRow);
  },
  getAbsorbedHash: async (noteId) => {
    const { data, error } = await supabaseAdmin
      .from('wiki_absorb_log')
      .select('content_hash')
      .eq('user_id', userId)
      .eq('note_id', noteId)
      .maybeSingle();

    if (error) throw error;
    return typeof data?.content_hash === 'string' ? data.content_hash : null;
  },
  upsertWikiPage: async (pageType, title, content) => {
    const now = new Date().toISOString();
    const existing = await supabaseAdmin
      .from('life_themes')
      .select('id')
      .eq('user_id', userId)
      .eq('page_type', pageType)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data?.id) {
      const { data, error } = await supabaseAdmin
        .from('life_themes')
        .update({
          title,
          content,
          state: 'active',
          updated_at: now,
        })
        .eq('id', existing.data.id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error || !data) throw error || new Error('Wiki page could not be saved');
      return mapLifeThemeRow(data as SupabaseLifeThemeRow);
    }

    const { data, error } = await supabaseAdmin
      .from('life_themes')
      .insert(
        {
          user_id: userId,
          page_type: pageType,
          title,
          content,
          state: 'active',
          updated_at: now,
        },
      )
      .select('*')
      .single();

    if (error || !data) throw error || new Error('Wiki page could not be saved');
    return mapLifeThemeRow(data as SupabaseLifeThemeRow);
  },
  logAbsorptions: async (notes) => {
    if (notes.length === 0) return;

    const absorbedAt = new Date().toISOString();
    const rows = notes.map((note) => ({
      user_id: userId,
      note_id: note.id,
      content_hash: getNoteContentHash(note),
      absorbed_at: absorbedAt,
    }));
    const { error } = await supabaseAdmin
      .from('wiki_absorb_log')
      .upsert(rows, { onConflict: 'user_id,note_id' });

    if (error) throw error;
  },
});

const claimFeatureUsage = async (
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  feature: 'life_wiki_refresh',
) => {
  const { data, error } = await supabaseAdmin.rpc('claim_ai_feature_usage', {
    p_feature: feature,
    p_user_id: userId,
  });

  if (error) throw new HttpError(500, 'AI feature quota check failed');
  assertAllowed(data);
};

const claimProviderUsage = async (
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  action: AiAction,
  ipHash: string,
) => {
  const { data, error } = await supabaseAdmin.rpc('claim_ai_usage', {
    p_action: action,
    p_ip_hash: ipHash,
    p_user_id: userId,
  });

  if (error) throw new HttpError(500, 'AI quota check failed');
  assertAllowed(data);
};

const parseRunRequest = (body: AiRunRequest) => {
  if (body.kind && body.kind !== 'life_wiki_refresh') {
    throw new HttpError(400, 'Invalid AI run kind');
  }

  const trigger = body.trigger || 'manual';
  if (!VALID_TRIGGERS.has(trigger)) {
    throw new HttpError(400, 'Invalid AI run trigger');
  }

  return {
    trigger,
    noteId: typeof body.noteId === 'string' && body.noteId.trim() ? body.noteId.trim() : undefined,
  };
};

const getRunIdFromRequest = (req: any) => {
  if (typeof req.query?.id === 'string') return req.query.id;
  const url = new URL(req.url || '/', 'https://reflections.local');
  return url.searchParams.get('id') || '';
};

const handleGet = async (req: any, res: any, userId: string, supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>) => {
  const runId = getRunIdFromRequest(req);
  if (!runId) return sendJson(res, 400, { error: 'Missing AI run id' });

  const [runResult, eventsResult] = await Promise.all([
    supabaseAdmin
      .from('ai_runs')
      .select('*')
      .eq('id', runId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('ai_run_events')
      .select('*')
      .eq('run_id', runId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  if (runResult.error || eventsResult.error) {
    throw runResult.error || eventsResult.error;
  }

  if (!runResult.data) {
    return sendJson(res, 404, { error: 'AI run not found' });
  }

  return sendJson(res, 200, { ok: true, data: { run: runResult.data, events: eventsResult.data || [] } });
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const user = await requireUser(supabaseAuth, req.headers?.authorization);
    const supabaseAdmin = createSupabaseAdminClient();

    if (req.method === 'GET') {
      return handleGet(req, res, user.id, supabaseAdmin);
    }

    const body = await parseJsonBody<AiRunRequest>(req, MAX_BODY_BYTES);
    const { trigger, noteId } = parseRunRequest(body);
    const ipHash = hashForLogs(getClientIp(req));
    const ai = getGemini();

    const result = await runLifeWikiRefresh({
      store: createRunStore(supabaseAdmin, user.id),
      generateText: async (prompt, model) => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return response.text?.trim() || '';
      },
      claimFeatureUsage: (feature) => claimFeatureUsage(supabaseAdmin, user.id, feature),
      claimProviderUsage: (action) => claimProviderUsage(supabaseAdmin, user.id, action, ipHash),
      userId: user.id,
      trigger,
      noteId,
    });

    return sendJson(res, 200, { ok: true, data: result });
  } catch (error: unknown) {
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'AI run failed'),
    });
  }
}
