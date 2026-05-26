import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zeroKnowledgeMigrationService, type MigrationProgress } from './zeroKnowledgeMigrationService';

const cryptoMocks = vi.hoisted(() => ({
  encryptJson: vi.fn(async (_session, _aad, payload) => ({
    v: 1,
    alg: 'AES-GCM-256',
    kid: 'key-1',
    iv: 'iv',
    ciphertext: JSON.stringify(payload),
  })),
  decryptJson: vi.fn(async (_session, _aad, envelope) => JSON.parse(envelope.ciphertext)),
}));

vi.mock('./cryptoService', async () => {
  const actual = await vi.importActual<typeof import('./cryptoService')>('./cryptoService');
  return {
    ...actual,
    cryptoService: {
      encryptJson: cryptoMocks.encryptJson,
      decryptJson: cryptoMocks.decryptJson,
    },
  };
});

const tableRows: Record<string, any[]> = {
  notes: [],
  mood_checkins: [],
  future_letters: [],
  life_themes: [],
};

const updates: Array<{ table: string; payload: any; rowId?: string }> = [];
const ranges: Array<{ table: string; from: number; to: number }> = [];

const createSelectQuery = (table: string) => {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(async (from: number, to: number) => {
      ranges.push({ table, from, to });
      return {
        data: tableRows[table].slice(from, to + 1),
        error: null,
        count: tableRows[table].length,
      };
    }),
  };
  return query;
};

const createUpdateQuery = (table: string, payload: any) => {
  const update = { table, payload, rowId: undefined as string | undefined };
  updates.push(update);
  const query = {
    eq: vi.fn((column: string, value: string) => {
      if (column === 'id') update.rowId = value;
      return query;
    }),
    then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
  };
  return query;
};

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => createSelectQuery(table)),
      update: vi.fn((payload: any) => createUpdateQuery(table, payload)),
    })),
  },
}));

const session = {
  userId: 'user-1',
  keyId: 'key-1',
  dataKey: {} as CryptoKey,
};

describe('zeroKnowledgeMigrationService', () => {
  beforeEach(() => {
    for (const table of Object.keys(tableRows)) tableRows[table] = [];
    updates.length = 0;
    ranges.length = 0;
    cryptoMocks.encryptJson.mockClear();
    cryptoMocks.decryptJson.mockClear();
  });

  it('reports table progress while processing private rows in batches', async () => {
    tableRows.notes = [
      { id: 'note-1', title: 'One', content: 'First', tags: [], attachments: [], tasks: [], user_id: session.userId },
      { id: 'note-2', title: 'Two', content: 'Second', tags: [], attachments: [], tasks: [], user_id: session.userId },
    ];
    const progress: MigrationProgress[] = [];

    await zeroKnowledgeMigrationService.migrateUserPrivateData(session, (nextProgress) => {
      progress.push(nextProgress);
    });

    expect(progress).toContainEqual({
      table: 'notes',
      label: 'notes',
      processed: 2,
      total: 2,
    });
    expect(ranges.some((range) => range.table === 'notes' && range.from === 0)).toBe(true);
    expect(updates.some((update) => update.table === 'notes' && update.payload.encryption_migration_state === 'plaintext_cleared')).toBe(true);
  });

  it('skips already-cleared encrypted rows and resumes remaining rows', async () => {
    tableRows.notes = [
      {
        id: 'note-cleared',
        encrypted_payload: { v: 1, alg: 'AES-GCM-256', kid: 'key-1', iv: 'iv', ciphertext: '{}' },
        encryption_migration_state: 'plaintext_cleared',
        user_id: session.userId,
      },
      { id: 'note-pending', title: 'Pending', content: 'Resume me', tags: [], attachments: [], tasks: [], user_id: session.userId },
    ];

    await zeroKnowledgeMigrationService.migrateUserPrivateData(session);

    expect(updates.some((update) => update.rowId === 'note-cleared')).toBe(false);
    expect(updates.some((update) => update.rowId === 'note-pending' && update.payload.encryption_migration_state === 'plaintext_cleared')).toBe(true);
  });

  it('skips already-verified encrypted rows instead of comparing against cleared plaintext fields', async () => {
    tableRows.notes = [
      {
        id: 'note-verified',
        title: null,
        content: null,
        encrypted_payload: {
          v: 1,
          alg: 'AES-GCM-256',
          kid: 'key-1',
          iv: 'iv',
          ciphertext: JSON.stringify({ title: 'Real encrypted title', content: 'Real encrypted content' }),
        },
        encryption_migration_state: 'verified',
        user_id: session.userId,
      },
    ];

    await zeroKnowledgeMigrationService.migrateUserPrivateData(session);

    expect(updates.some((update) => update.rowId === 'note-verified')).toBe(false);
    expect(cryptoMocks.decryptJson).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      tableRows.notes[0].encrypted_payload,
    );
  });
});
