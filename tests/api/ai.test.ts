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

describe('/api/ai strict private mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.SUPABASE_URL = 'https://reflections.example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.GEMINI_API_KEY = 'server-gemini-key';

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

  it('authenticates then rejects private writing AI without quota or provider calls', async () => {
    const { default: handler } = await import('../../api/ai');
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

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'strict_private_mode_ai_disabled',
      message: expect.stringContaining('zero-knowledge'),
    });
    expect(mockGetUser).toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(mockGoogleGenAI).not.toHaveBeenCalled();
  });

  it('keeps method and auth failures outside the private payload path', async () => {
    const { default: handler } = await import('../../api/ai');
    const methodResponse = createResponse();
    await handler({ ...createRequest({}), method: 'GET' }, methodResponse);

    expect(methodResponse.statusCode).toBe(405);

    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('bad token'),
    });
    const authResponse = createResponse();
    await handler(createRequest({ action: 'tags', payload: { content: 'private' } }), authResponse);

    expect(authResponse.statusCode).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
