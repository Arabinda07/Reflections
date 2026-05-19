export const AI_ACTIONS = [
  'prompts',
  'reflection',
  'tags',
  'ingestDecision',
  'ingestSynthesis',
  'wikiPage',
  'index',
  'writingNotes',
] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

export type AiRequest = {
  action?: unknown;
  payload?: unknown;
};

export type AiValidationResult =
  | { ok: true; action: AiAction; payload: Record<string, unknown> }
  | { ok: false; error: string };

export type IngestDecision = {
  action: 'append' | 'create' | 'skip';
  themeId: string | null;
  newThemeTitle: string | null;
  reasoning: string;
};

const MAX_WIKI_CONTEXT_CHARS = 80_000;
const ACTION_SET = new Set<string>(AI_ACTIONS);

export const isAiAction = (action: unknown): action is AiAction =>
  typeof action === 'string' && ACTION_SET.has(action);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const isString = (value: unknown) => typeof value === 'string';

const invalid = (action: AiAction) => ({ ok: false as const, error: `Invalid ${action} payload` });

export const validateAiRequest = (body: AiRequest): AiValidationResult => {
  if (!isAiAction(body.action)) {
    return { ok: false, error: 'Invalid AI action' };
  }

  const action = body.action;
  const payload = isPlainObject(body.payload) ? body.payload : {};

  switch (action) {
    case 'prompts':
      if ('recentNotes' in payload && !Array.isArray(payload.recentNotes)) return invalid(action);
      if ('currentMood' in payload && payload.currentMood !== undefined && !isString(payload.currentMood)) return invalid(action);
      return { ok: true, action, payload };
    case 'reflection':
      if (!isPlainObject(payload.note)) return invalid(action);
      return { ok: true, action, payload };
    case 'tags':
      if (!isString(payload.content)) return invalid(action);
      return { ok: true, action, payload };
    case 'ingestDecision':
      if (!isPlainObject(payload.note) || !Array.isArray(payload.themes)) return invalid(action);
      return { ok: true, action, payload };
    case 'ingestSynthesis':
      if (!isPlainObject(payload.note) || !isPlainObject(payload.theme)) return invalid(action);
      return { ok: true, action, payload };
    case 'wikiPage':
      if (!isString(payload.title) || !isString(payload.instruction) || !isString(payload.allThemeContent)) {
        return invalid(action);
      }
      if (payload.allThemeContent.length > MAX_WIKI_CONTEXT_CHARS) return invalid(action);
      return { ok: true, action, payload };
    case 'index':
      if (!Array.isArray(payload.pages)) return invalid(action);
      return { ok: true, action, payload };
    case 'writingNotes':
      return { ok: true, action, payload };
    default:
      return { ok: false, error: 'Invalid AI action' };
  }
};

const isDecisionAction = (action: unknown): action is IngestDecision['action'] =>
  action === 'append' || action === 'create' || action === 'skip';

export const validateIngestDecision = (
  value: unknown,
  knownThemeIds: string[],
): { ok: true; data: IngestDecision } | { ok: false; error: string } => {
  if (!isPlainObject(value) || !isDecisionAction(value.action)) {
    return { ok: false, error: 'Malformed ingest decision' };
  }

  const decision: IngestDecision = {
    action: value.action,
    themeId: typeof value.themeId === 'string' ? value.themeId : null,
    newThemeTitle: typeof value.newThemeTitle === 'string' ? value.newThemeTitle : null,
    reasoning: typeof value.reasoning === 'string' ? value.reasoning : '',
  };

  if (decision.action === 'append' && (!decision.themeId || !knownThemeIds.includes(decision.themeId))) {
    return { ok: false, error: 'AI selected an unknown theme' };
  }

  if (decision.action === 'create' && !decision.newThemeTitle) {
    return { ok: false, error: 'AI omitted the new theme title' };
  }

  return { ok: true, data: decision };
};
