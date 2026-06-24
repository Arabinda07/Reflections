import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockGenerateContent = vi.fn();
const mockGoogleGenAI = vi.fn();

class MockGoogleGenAI {
  readonly models = { generateContent: mockGenerateContent };

  constructor(options: { apiKey: string }) {
    mockGoogleGenAI(options);
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: vi.fn(),
  })),
}));

vi.mock('@google/genai', () => ({ GoogleGenAI: MockGoogleGenAI }));

const createResponse = () => {
  const response = {
    statusCode: 0,
    body: '',
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      response.headers[name] = value;
    },
    end(value: string) {
      response.body = value;
    },
  };
  return response;
};

describe('/api/ai-runs strict private mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://reflections.example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.GEMINI_API_KEY = 'server-gemini-key';
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('rejects new AI runs before quota, storage, or provider work', async () => {
    const { default: handler } = await import('../../api/ai-runs');
    const response = createResponse();

    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer access-token' },
      body: { kind: 'life_wiki_refresh', trigger: 'smart_mode' },
    }, response);

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'strict_private_mode_ai_disabled',
      message: expect.stringContaining('zero-knowledge'),
    });
    expect(mockGetUser).toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockGoogleGenAI).not.toHaveBeenCalled();
  });
});
