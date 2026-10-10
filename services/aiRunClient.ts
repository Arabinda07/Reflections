// ponytail: unplugged. The Life Wiki generator (Gemini via /api/ai-runs) was
// removed — every account is zero-knowledge, so a server LLM can't read notes.
// The page and stored pages stay; refreshes are off until an on-device builder
// replaces these three methods. Types are kept so LifeWiki.tsx is unchanged.

export type LifeWikiRunTrigger = 'manual' | 'smart_mode' | 'account_enable';
export type LifeWikiRunStatus = 'running' | 'succeeded' | 'partial' | 'failed' | 'skipped';

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

export const LIFE_WIKI_REFRESH_UNAVAILABLE =
  'Life Wiki refreshes are paused while we move them fully onto your device. Your existing pages are still here.';

export const aiRunClient = {
  startLifeWikiRefresh: async (_input: { trigger: LifeWikiRunTrigger; noteId?: string }): Promise<LifeWikiRunResult> => {
    throw new Error(LIFE_WIKI_REFRESH_UNAVAILABLE);
  },
  getLifeWikiRun: async (_runId: string): Promise<LifeWikiRunDetail> => {
    throw new Error(LIFE_WIKI_REFRESH_UNAVAILABLE);
  },
  listLifeWikiRuns: async (_limit = 10): Promise<LifeWikiRunList> => ({ runs: [] }),
};
