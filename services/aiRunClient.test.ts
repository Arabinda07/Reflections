import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./aiClient', () => ({
  getAccessToken: vi.fn(async () => 'test-token'),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('aiRunClient', () => {
  beforeEach(async () => {
    fetchMock.mockReset();
    vi.resetModules();
  });

  it('fetches one Life Wiki run with its event timeline', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          run: { id: 'run-1', status: 'running' },
          events: [{ id: 'event-1', event_type: 'sources_selected' }],
        },
      }),
    });

    const { aiRunClient } = await import('./aiRunClient');
    const result = await aiRunClient.getLifeWikiRun('run-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/ai-runs?id=run-1', {
      method: 'GET',
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(result.events).toHaveLength(1);
  });

  it('lists recent Life Wiki runs for the signed-in user', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          runs: [
            { id: 'run-2', status: 'succeeded', page_count: 5 },
            { id: 'run-1', status: 'skipped', page_count: 0 },
          ],
        },
      }),
    });

    const { aiRunClient } = await import('./aiRunClient');
    const result = await aiRunClient.listLifeWikiRuns(2);

    expect(fetchMock).toHaveBeenCalledWith('/api/ai-runs?limit=2', {
      method: 'GET',
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(result.runs.map((run) => run.id)).toEqual(['run-2', 'run-1']);
  });
});
