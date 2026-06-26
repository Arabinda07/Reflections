import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readAiRunResponse } from './aiRunClient';

vi.mock('./aiClient', () => ({
  getAccessToken: vi.fn(async () => 'test-token'),
}));

const mockResponse = (init: { ok: boolean; status?: number; body: unknown }) =>
  ({
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    json: async () => init.body,
  }) as unknown as Response;

describe('readAiRunResponse', () => {
  it('throws a clean error (not a TypeError) when an ok response has an empty body', async () => {
    await expect(readAiRunResponse(mockResponse({ ok: true, body: null }))).rejects.toThrow(/empty|unexpected/i);
  });

  it('throws the server error message on a non-ok response', async () => {
    await expect(
      readAiRunResponse(mockResponse({ ok: false, status: 500, body: { error: 'nope' } })),
    ).rejects.toThrow('nope');
  });

  it('returns the inner data on a well-formed ok response', async () => {
    await expect(
      readAiRunResponse<{ runs: unknown[] }>(mockResponse({ ok: true, body: { ok: true, data: { runs: [] } } })),
    ).resolves.toEqual({ runs: [] });
  });
});

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
