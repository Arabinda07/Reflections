import { afterEach, describe, expect, it } from 'vitest';
import { cryptoService } from './cryptoService';
import { decryptEnvelope, encryptedColumns, rowAad } from './encryptedPayload';
import { setCurrentCryptoSession } from './cryptoSessionStore';

const createSession = async () => ({
  userId: 'user-1',
  keyId: 'key-1',
  dataKey: await cryptoService.importRawDataKey(cryptoService.generateRawDataKey()),
});

describe('encryptedPayload helper', () => {
  afterEach(() => {
    setCurrentCryptoSession(null);
  });

  it('rowAad builds the { table, rowId, userId } binding', () => {
    expect(rowAad('notes')('user-1', 'note-1')).toEqual({
      table: 'notes',
      rowId: 'note-1',
      userId: 'user-1',
    });
  });

  it('round-trips a payload through encryptedColumns -> decryptEnvelope', async () => {
    const session = await createSession();
    const aad = rowAad('notes')('user-1', 'note-1');
    const payload = { title: 'hello', tags: ['a', 'b'] };

    const columns = await encryptedColumns(payload, aad, session);
    const decrypted = await decryptEnvelope<typeof payload>(columns.encrypted_payload, aad, session);

    expect(decrypted).toEqual(payload);
  });

  it('always stamps the verified envelope columns', async () => {
    const session = await createSession();
    const columns = await encryptedColumns({ x: 1 }, rowAad('moods')('u', 'r'), session);

    expect(columns.encrypted_payload_version).toBe(1);
    expect(columns.encryption_migration_state).toBe('verified');
  });

  it('returns null for absent or non-envelope input', async () => {
    const aad = rowAad('notes')('user-1', 'note-1');
    const session = await createSession();

    expect(await decryptEnvelope(undefined, aad, session)).toBeNull();
    expect(await decryptEnvelope(null, aad, session)).toBeNull();
    expect(await decryptEnvelope({ not: 'an envelope' } as never, aad, session)).toBeNull();
  });

  it('returns null for absent input even when no crypto session exists (reflective users)', async () => {
    setCurrentCryptoSession(null);
    const aad = rowAad('notes')('user-1', 'note-1');

    await expect(decryptEnvelope(undefined, aad)).resolves.toBeNull();
    await expect(decryptEnvelope(null, aad)).resolves.toBeNull();
    await expect(decryptEnvelope({ not: 'an envelope' } as never, aad)).resolves.toBeNull();
  });

  it('throws only when decrypting a real envelope without a session', async () => {
    const session = await createSession();
    const aad = rowAad('notes')('user-1', 'note-1');
    const columns = await encryptedColumns({ title: 'secret' }, aad, session);

    setCurrentCryptoSession(null);
    await expect(decryptEnvelope(columns.encrypted_payload, aad)).rejects.toThrow();
  });

  it('decrypts a real envelope using the ambient session when none is passed', async () => {
    const session = await createSession();
    const aad = rowAad('notes')('user-1', 'note-1');
    const payload = { title: 'ambient' };
    const columns = await encryptedColumns(payload, aad, session);

    setCurrentCryptoSession(session);
    await expect(decryptEnvelope<typeof payload>(columns.encrypted_payload, aad)).resolves.toEqual(payload);
  });
});
