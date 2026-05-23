import { getAccessToken } from './aiClient';
import type { LifeWikiRunStatus, LifeWikiRunTrigger } from '../server/lifeWikiRuns';

export interface LifeWikiRunResult {
  runId: string;
  pageCount: number;
  source: 'notes' | 'none';
  status: LifeWikiRunStatus;
  skipped: boolean;
}

export interface LifeWikiRunRecord {
  id: string;
  kind: 'life_wiki_refresh';
  trigger: LifeWikiRunTrigger;
  status: LifeWikiRunStatus;
  page_count: number | null;
  error: string | null;
  source_note_ids: string[] | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LifeWikiRunEventRecord {
  id: string;
  run_id: string;
  event_type: string;
  page_type: string | null;
  status: LifeWikiRunStatus | 'retrying' | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LifeWikiRunDetail {
  run: LifeWikiRunRecord;
  events: LifeWikiRunEventRecord[];
}

export interface LifeWikiRunList {
  runs: LifeWikiRunRecord[];
}

type AiRunResponse<T> = {
  ok: true;
  data: T;
};

const AI_RUNS_ENDPOINT = '/api/ai-runs';

const readAiRunResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `AI run failed with status ${response.status}`);
  }

  return (data as AiRunResponse<T>).data;
};

const callAiRuns = async <T>(body: unknown): Promise<T> => {
  const token = await getAccessToken();
  const response = await fetch(AI_RUNS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return readAiRunResponse<T>(response);
};

const getAiRuns = async <T>(query: string): Promise<T> => {
  const token = await getAccessToken();
  const response = await fetch(`${AI_RUNS_ENDPOINT}?${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readAiRunResponse<T>(response);
};

export const aiRunClient = {
  startLifeWikiRefresh: (input: { trigger: LifeWikiRunTrigger; noteId?: string }): Promise<LifeWikiRunResult> =>
    callAiRuns<LifeWikiRunResult>({
      kind: 'life_wiki_refresh',
      trigger: input.trigger,
      noteId: input.noteId,
    }),
  getLifeWikiRun: (runId: string): Promise<LifeWikiRunDetail> =>
    getAiRuns<LifeWikiRunDetail>(`id=${encodeURIComponent(runId)}`),
  listLifeWikiRuns: (limit = 10): Promise<LifeWikiRunList> =>
    getAiRuns<LifeWikiRunList>(`limit=${encodeURIComponent(String(limit))}`),
};
