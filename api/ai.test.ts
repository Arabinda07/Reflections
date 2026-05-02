import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockGenerateContent = vi.fn();
const mockGoogleGenAI = vi.fn();

class MockGoogleGenAI {
  readonly models = {
    generateContent: mockGenerateContent,
  };

  constructor(options: { apiKey: string }) {
    mockGoogleGenAI(options);
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  })),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI,
  Type: {
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    STRING: 'STRING',
  },
}));

const createRequest = (body: unknown) => ({
  method: 'POST',
  headers: {
    authorization: 'Bearer access-token',
  },
  body,
});

const createResponse = () => {
  const response = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(name: string, value: string) {
      response.headers[name] = value;
    },
    end(value: string) {
      response.body = value;
    },
  };

  return response;
};

describe('/api/ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.SUPABASE_URL = 'https://reflections.example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.GEMINI_API_KEY = 'server-gemini-key';
    delete process.env.GOOGLE_GEMINI_API_KEY;
    delete process.env.VITE_GEMINI_API_KEY;

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockRpc.mockResolvedValue({
      data: { allowed: true },
      error: null,
    });
    mockGenerateContent.mockResolvedValue({ text: 'A thoughtful reflection.' });
  });

  it('claims server-side quota before making the provider request', async () => {
    const { default: handler } = await import('./ai');
    const response = createResponse();

    await handler(
      createRequest({
        action: 'reflection',
        payload: {
          note: {
            title: 'Today',
            content: '<p>I slowed down.</p>',
            mood: 'calm',
          },
          wikiPages: [],
          indexPage: null,
          recentNotes: [],
        },
      }),
      response,
    );

    expect(mockRpc).toHaveBeenCalledWith(
      'claim_ai_usage',
      expect.objectContaining({
        p_action: 'reflection',
        p_user_id: 'user-1',
      }),
    );
    expect(mockGoogleGenAI).toHaveBeenCalledWith({ apiKey: 'server-gemini-key' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      data: 'A thoughtful reflection.',
    });
  });

  it('stops before the provider when quota is exhausted', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { allowed: false, reason: 'monthly_quota_exhausted' },
      error: null,
    });
    const { default: handler } = await import('./ai');
    const response = createResponse();

    await handler(
      createRequest({
        action: 'reflection',
        payload: {
          note: {
            title: 'Today',
            content: '<p>I slowed down.</p>',
            mood: 'calm',
          },
        },
      }),
      response,
    );

    expect(response.statusCode).toBe(429);
    expect(JSON.parse(response.body)).toEqual({
      error: 'monthly_quota_exhausted',
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('does not accept public VITE-prefixed AI provider keys on the server', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GEMINI_API_KEY;
    process.env.VITE_GEMINI_API_KEY = 'legacy-public-key';
    const { default: handler } = await import('./ai');
    const response = createResponse();

    await handler(
      createRequest({
        action: 'reflection',
        payload: {
          note: {
            title: 'Today',
            content: '<p>I slowed down.</p>',
          },
        },
      }),
      response,
    );

    expect(response.statusCode).toBe(500);
    expect(mockGoogleGenAI).not.toHaveBeenCalledWith({ apiKey: 'legacy-public-key' });
  });
});
