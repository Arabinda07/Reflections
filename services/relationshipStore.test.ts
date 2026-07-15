import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./userModeStore', () => ({
  getCurrentUserMode: vi.fn(),
}));

vi.mock('./cryptoSessionStore', () => ({
  requireCurrentCryptoSession: vi.fn(() => ({ userId: 'u-1', keyId: 'k-1' })),
}));

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

import { getCurrentUserMode } from './userModeStore';
import { encryptedColumns } from './encryptedPayload';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import {
  defaultRelationshipPayload,
  toRemoteImportRow,
  toRemoteRelationshipRow,
} from './relationshipStore';
import type { RelationshipImportInboxItem, RelationshipRecord } from '../types';

const baseRelationship = (): RelationshipRecord => ({
  id: 'rel-1',
  userId: 'u-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...defaultRelationshipPayload('Alex'),
  email: 'alex@example.com',
});

const baseImportItem = (): RelationshipImportInboxItem => ({
  id: 'imp-1',
  userId: 'u-1',
  source: 'google_contacts',
  status: 'pending',
  name: 'Sam',
  email: 'sam@example.com',
  sourceFingerprint: 'fp-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('toRemoteRelationshipRow mode branching', () => {
  it('stores plaintext JSON in encrypted_payload for reflective users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');

    const row = await toRemoteRelationshipRow(baseRelationship(), 'u-1');

    expect(encryptedColumns).not.toHaveBeenCalled();
    expect(requireCurrentCryptoSession).not.toHaveBeenCalled();
    expect(row.encrypted_payload).toMatchObject({ name: 'Alex', email: 'alex@example.com' });
    expect(row.encryption_migration_state).toBe('verified');
    expect(row.user_id).toBe('u-1');
  });

  it('encrypts the payload for encrypted users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('encrypted');

    const row = await toRemoteRelationshipRow(baseRelationship(), 'u-1');

    expect(encryptedColumns).toHaveBeenCalledOnce();
    expect(requireCurrentCryptoSession).toHaveBeenCalled();
    expect(row.encrypted_payload).toEqual({ ciphertext: 'ENCRYPTED', iv: 'iv', tag: 'tag' });
  });
});

describe('toRemoteImportRow mode branching', () => {
  it('stores plaintext JSON in encrypted_payload for reflective users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('reflective');

    const row = await toRemoteImportRow(baseImportItem(), 'u-1');

    expect(encryptedColumns).not.toHaveBeenCalled();
    expect(row.encrypted_payload).toMatchObject({ name: 'Sam', email: 'sam@example.com' });
    expect(row.source).toBe('google_contacts');
  });

  it('encrypts the import payload for encrypted users', async () => {
    vi.mocked(getCurrentUserMode).mockReturnValue('encrypted');

    const row = await toRemoteImportRow(baseImportItem(), 'u-1');

    expect(encryptedColumns).toHaveBeenCalledOnce();
    expect(row.encrypted_payload).toEqual({ ciphertext: 'ENCRYPTED', iv: 'iv', tag: 'tag' });
  });
});
