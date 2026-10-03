import { describe, expect, it, vi } from 'vitest';
import { TypeSafeClient } from './typesafeClient';
import type { SystemOneRequest, SystemOneResponse } from '../services/typesafeTypes';

describe('TypeSafeClient', () => {
  const dummyRequest: SystemOneRequest = {
    state: 'Draft note text',
    model: 'jev-latest',
    questions: {
      is_grounded: {
        type: 'noul',
        instructions: 'Is this grounded in reality?',
      },
    },
  };

  it('returns null if API key is not configured', async () => {
    const client = new TypeSafeClient({ apiKey: '' });
    expect(client.isConfigured()).toBe(false);

    const result = await client.evaluate(dummyRequest);
    expect(result).toBeNull();
  });

  it('successfully returns evaluated response on 200 OK', async () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        is_grounded: {
          probability: 0.96,
        },
      },
      usage: {
        input_tokens: 45,
        output_tokens: 1,
      },
    };

    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const client = new TypeSafeClient({
      apiKey: 'test-key',
      fetcher: mockFetcher as any,
    });

    expect(client.isConfigured()).toBe(true);
    const result = await client.evaluate(dummyRequest);

    expect(result).toEqual(mockResponse);
    expect(mockFetcher).toHaveBeenCalledWith(
      'https://api.typesafe.ai/v1/systemone',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dummyRequest),
      }),
    );
  });

  it('returns null on non-200 responses', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const client = new TypeSafeClient({
      apiKey: 'test-key',
      fetcher: mockFetcher as any,
    });

    const result = await client.evaluate(dummyRequest);
    expect(result).toBeNull();
  });

  it('returns null on fetch network exception or timeout', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('Network offline'));

    const client = new TypeSafeClient({
      apiKey: 'test-key',
      fetcher: mockFetcher as any,
    });

    const result = await client.evaluate(dummyRequest);
    expect(result).toBeNull();
  });
});
