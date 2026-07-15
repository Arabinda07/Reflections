import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('./userModeStore', () => ({
  getCurrentUserMode: vi.fn(),
}));

vi.mock('./authUtils', () => ({
  getAuthenticatedUserId: vi.fn().mockResolvedValue('u-1'),
}));

// Keep the REAL decryptEnvelope so the reflective read path is exercised
// end-to-end (this is the path that previously threw without a crypto session).
vi.mock('./encryptedPayload', async () => {
  const actual = await vi.importActual<typeof import('./encryptedPayload')>('./encryptedPayload');
  return {
    ...actual,
    encryptedColumns: vi.fn().mockResolvedValue({
      encrypted_payload: { ciphertext: 'ENCRYPTED', iv: 'iv', tag: 'tag' },
      encrypted_payload_version: 1,
      encryption_migration_state: 'verified',
    }),
  };
});

import { supabase } from '../src/supabaseClient';
import { getCurrentUserMode } from './userModeStore';
import { encryptedColumns } from './encryptedPayload';
import { setCurrentCryptoSession } from './cryptoSessionStore';
import { wikiService } from './wikiService';

const makeThemeRow = (overrides = {}) => ({
  id: 'theme-1',
  user_id: 'u-1',
  title: 'Health',
  content: 'My health goals.',
  state: 'active',
  page_type: 'theme',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  encrypted_payload: null,
  ...overrides,
});

const mockChain = (returnData: object) => {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

const mockListChain = (rows: object[]) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
  setCurrentCryptoSession(null);
});

describe('wikiService.createTheme', () => {
  it('writes real title/content for reflective users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    const chain = mockChain(makeThemeRow());

    await wikiService.createTheme('Health', 'My health goals.');

    expect(encryptedColumns).not.toHaveBeenCalled();
    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.title).toBe('Health');
    expect(insertedRow.content).toBe('My health goals.');
  });

  it('writes encrypted payload for encrypted users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('encrypted');
    const chain = mockChain(makeThemeRow({ title: 'Encrypted theme', content: '' }));

    await wikiService.createTheme('Health', 'My health goals.');

    expect(encryptedColumns).toHaveBeenCalledOnce();
    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.title).toBe('Encrypted theme');
    expect(insertedRow.content).toBe('');
  });
});

describe('wikiService.updateThemeContent', () => {
  beforeEach(() => {
    // Mock getThemeById (called internally by updateThemeContent)
    vi.spyOn(wikiService, 'getThemeById').mockResolvedValue({
      id: 'theme-1',
      userId: 'u-1',
      title: 'Health',
      content: 'old content',
      state: 'active',
      pageType: 'theme' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('writes real content for reflective users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    const chain = mockChain(makeThemeRow({ content: 'new content' }));

    await wikiService.updateThemeContent('theme-1', 'new content');

    expect(encryptedColumns).not.toHaveBeenCalled();
    const updateArgs = chain.update.mock.calls[0][0];
    expect(updateArgs.content).toBe('new content');
  });

  it('writes encrypted payload for encrypted users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('encrypted');
    const chain = mockChain(makeThemeRow({ content: '' }));

    await wikiService.updateThemeContent('theme-1', 'new content');

    expect(encryptedColumns).toHaveBeenCalledOnce();
    const updateArgs = chain.update.mock.calls[0][0];
    expect(updateArgs.content).toBe('');
  });
});

describe('wikiService.getUserThemes (reflective read path)', () => {
  it('maps plaintext theme rows without requiring a crypto session', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    setCurrentCryptoSession(null);
    mockListChain([makeThemeRow()]);

    const result = await wikiService.getUserThemes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Health');
    expect(result[0].content).toBe('My health goals.');
  });
});
