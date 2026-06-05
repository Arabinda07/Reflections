import { describe, expect, it } from 'vitest';
import { cryptoService, isEncryptedEnvelope } from './cryptoService';

const aad = {
  table: 'notes',
  rowId: 'note-1',
  userId: 'user-1',
};

const createSession = async () => ({
  userId: aad.userId,
  keyId: 'key-1',
  dataKey: await cryptoService.importRawDataKey(cryptoService.generateRawDataKey()),
});

describe('cryptoService primitives', () => {
  it('wraps and unwraps raw data keys without exposing plaintext wrappers', async () => {
    const rawDataKey = cryptoService.generateRawDataKey();
    const wrapper = await cryptoService.wrapRawDataKey(rawDataKey, 'correct secret', 1_000);
    const unwrappedDataKey = await cryptoService.unwrapRawDataKey(wrapper, 'correct secret');

    expect(wrapper.ciphertext).not.toContain('correct secret');
    expect(Array.from(unwrappedDataKey)).toEqual(Array.from(rawDataKey));
  });

  it('rejects the wrong wrapper secret', async () => {
    const wrapper = await cryptoService.wrapRawDataKey(
      cryptoService.generateRawDataKey(),
      'correct secret',
      1_000,
    );

    await expect(cryptoService.unwrapRawDataKey(wrapper, 'wrong secret')).rejects.toThrow(/unlock/i);
  });

  it('round-trips JSON without storing plaintext in the envelope', async () => {
    const session = await createSession();

    const envelope = await cryptoService.encryptJson(
      session,
      aad,
      { title: 'Private note', content: '<p>kept from admin console</p>' },
    );

    expect(isEncryptedEnvelope(envelope)).toBe(true);
    expect(JSON.stringify(envelope)).not.toContain('Private note');
    expect(JSON.stringify(envelope)).not.toContain('kept from admin console');
    await expect(cryptoService.decryptJson(session, aad, envelope)).resolves.toEqual({
      title: 'Private note',
      content: '<p>kept from admin console</p>',
    });
  });

  it('uses random IVs and binds ciphertext to row identity with AAD', async () => {
    const session = await createSession();

    const firstEnvelope = await cryptoService.encryptJson(session, aad, { mood: 'calm' });
    const secondEnvelope = await cryptoService.encryptJson(session, aad, { mood: 'calm' });

    expect(firstEnvelope.ciphertext).not.toBe(secondEnvelope.ciphertext);
    expect(firstEnvelope.iv).not.toBe(secondEnvelope.iv);
    await expect(cryptoService.decryptJson(
      session,
      { ...aad, rowId: 'note-2' },
      firstEnvelope,
    )).rejects.toThrow(/decrypt/i);
  });

  it('round-trips attachment bytes with the same envelope format', async () => {
    const session = await createSession();
    const bytes = new TextEncoder().encode('secret attachment bytes');

    const encrypted = await cryptoService.encryptBytes(session, aad, bytes);
    const decrypted = await cryptoService.decryptBytes(session, aad, encrypted);

    expect(encrypted.ciphertext).not.toContain('secret attachment bytes');
    expect(new TextDecoder().decode(decrypted)).toBe('secret attachment bytes');
  });
});
