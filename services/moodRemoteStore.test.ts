import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('./userModeStore', () => ({
  getCurrentUserMode: vi.fn(),
}));

// Keep the REAL decryptEnvelope so the reflective read path is exercised
// end-to-end (this is the path that previously threw for users without a
// crypto session). Only encryptedColumns is stubbed for the write assertions.
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
import { moodRemoteStore } from './moodRemoteStore';

// ── Helpers ───────────────────────────────────────────────────────────────

const mockSupabaseInsert = (returnData: object) => {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

const mockSupabaseList = (rows: object[]) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
  setCurrentCryptoSession(null);
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('moodRemoteStore.insert', () => {
  it('writes plaintext columns when user mode is reflective', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    const returnRow = {
      id: 'id-1',
      user_id: 'u-1',
      mood: 'calm',
      label: 'Morning',
      source: null,
      created_at: new Date().toISOString(),
      encrypted_payload: null,
    };
    const chain = mockSupabaseInsert(returnRow);

    await moodRemoteStore.insert('u-1', 'calm', 'Morning');

    // encryptedColumns must NOT have been called
    expect(encryptedColumns).not.toHaveBeenCalled();

    // The inserted row must contain real plaintext values
    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.mood).toBe('calm');
    expect(insertedRow.label).toBe('Morning');
    expect(insertedRow.source).toBeNull();
    expect(insertedRow.encrypted_payload).toBeUndefined();
  });

  it('writes encrypted columns when user mode is encrypted', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('encrypted');
    const returnRow = {
      id: 'id-2',
      user_id: 'u-2',
      mood: null,
      label: null,
      source: null,
      created_at: new Date().toISOString(),
      encrypted_payload: { ciphertext: 'ENCRYPTED', iv: 'iv', tag: 'tag' },
    };
    const chain = mockSupabaseInsert(returnRow);

    await moodRemoteStore.insert('u-2', 'grateful');

    // encryptedColumns MUST have been called
    expect(encryptedColumns).toHaveBeenCalledOnce();

    // The inserted row must have nulled-out plaintext columns
    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.mood).toBeNull();
    expect(insertedRow.label).toBeNull();
  });
});

describe('moodRemoteStore.list (reflective read path)', () => {
  it('maps plaintext rows without requiring a crypto session', async () => {
    // Regression: reflective users have no crypto session. The read path must
    // not call requireCurrentCryptoSession() for plaintext (null-envelope) rows.
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');
    setCurrentCryptoSession(null);
    mockSupabaseList([
      {
        id: 'id-1',
        user_id: 'u-1',
        mood: 'calm',
        label: 'Morning',
        source: null,
        created_at: new Date().toISOString(),
        encrypted_payload: null,
      },
    ]);

    const result = await moodRemoteStore.list('u-1');

    expect(result).toHaveLength(1);
    expect(result[0].mood).toBe('calm');
    expect(result[0].label).toBe('Morning');
  });
});
