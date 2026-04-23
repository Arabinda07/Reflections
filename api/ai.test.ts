import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
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
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GEMINI_API_KEY;
    process.env.VITE_GEMINI_API_KEY = 'legacy-gemini-key';

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockGenerateContent.mockResolvedValue({ text: 'A thoughtful reflection.' });
  });

  it('accepts the legacy VITE_GEMINI_API_KEY fallback for reflection requests', async () => {
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

    expect(mockGoogleGenAI).toHaveBeenCalledWith({ apiKey: 'legacy-gemini-key' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      data: 'A thoughtful reflection.',
    });
  });
});
