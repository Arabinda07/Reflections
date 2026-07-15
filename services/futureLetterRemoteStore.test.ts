import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('./userModeStore', () => ({
  getCurrentUserMode: vi.fn(),
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
import { futureLetterRemoteStore } from './futureLetterRemoteStore';

const makeReturnRow = (overrides = {}) => ({
  id: 'letter-1',
  user_id: 'u-1',
  title: 'Hello future me',
  content: 'This is the body.',
  open_at: '2027-01-01T00:00:00Z',
  opened_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: 'scheduled',
  encrypted_payload: null,
  ...overrides,
});

const mockInsertChain = (returnData: object) => {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
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

describe('futureLetterRemoteStore.insert', () => {
  it('writes plaintext columns when user mode is reflective', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    const chain = mockInsertChain(makeReturnRow());

    await futureLetterRemoteStore.insert('u-1', 'Hello future me', 'This is the body.', '2027-01-01T00:00:00Z');

    expect(encryptedColumns).not.toHaveBeenCalled();

    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.title).toBe('Hello future me');
    expect(insertedRow.content).toBe('This is the body.');
    expect(insertedRow.encrypted_payload).toBeUndefined();
  });

  it('writes encrypted columns when user mode is encrypted', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('encrypted');
    const chain = mockInsertChain(
      makeReturnRow({ title: null, content: null, encrypted_payload: { ciphertext: 'ENCRYPTED', iv: 'iv', tag: 'tag' } }),
    );

    await futureLetterRemoteStore.insert('u-1', 'Hello future me', 'This is the body.', '2027-01-01T00:00:00Z');

    expect(encryptedColumns).toHaveBeenCalledOnce();

    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.title).toBeNull();
    expect(insertedRow.content).toBeNull();
  });
});

describe('futureLetterRemoteStore.list (reflective read path)', () => {
  it('maps plaintext rows without requiring a crypto session', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    setCurrentCryptoSession(null);
    mockListChain([makeReturnRow()]);

    const result = await futureLetterRemoteStore.list('u-1');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Hello future me');
    expect(result[0].content).toBe('This is the body.');
  });
});
