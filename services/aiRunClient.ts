import { getAccessToken } from './aiClient';
import type { LifeWikiRunStatus, LifeWikiRunTrigger } from '../server/lifeWikiRuns';

export interface LifeWikiRunResult {
  runId: string;
  pageCount: number;
  source: 'notes' | 'none';
  status: LifeWikiRunStatus;
  skipped: boolean;
}

type AiRunResponse<T> = {
  ok: true;
  data: T;
};

const AI_RUNS_ENDPOINT = '/api/ai-runs';

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

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `AI run failed with status ${response.status}`);
  }

  return (data as AiRunResponse<T>).data;
};

export const aiRunClient = {
  startLifeWikiRefresh: (input: { trigger: LifeWikiRunTrigger; noteId?: string }): Promise<LifeWikiRunResult> =>
    callAiRuns<LifeWikiRunResult>({
      kind: 'life_wiki_refresh',
      trigger: input.trigger,
      noteId: input.noteId,
    }),
};
