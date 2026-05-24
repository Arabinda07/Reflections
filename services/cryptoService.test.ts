import { describe, expect, it } from 'vitest';
import { cryptoService, isEncryptedEnvelope } from './cryptoService';

const aad = {
  table: 'notes',
  rowId: 'note-1',
  userId: 'user-1',
};

describe('cryptoService', () => {
  it('round-trips JSON without storing plaintext in the envelope', async () => {
    const bundle = await cryptoService.createKeyBundle({
      userId: aad.userId,
      passphrase: 'a long private passphrase',
    });
    const session = await cryptoService.unlockWithPassphrase({
      userId: aad.userId,
      passphrase: 'a long private passphrase',
      bundle,
    });

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

  it('rejects wrong passphrases and recovery keys', async () => {
    const bundle = await cryptoService.createKeyBundle({
      userId: aad.userId,
      passphrase: 'correct private passphrase',
    });

    await expect(cryptoService.unlockWithPassphrase({
      userId: aad.userId,
      passphrase: 'wrong private passphrase',
      bundle,
    })).rejects.toThrow(/unlock/i);

    await expect(cryptoService.unlockWithRecoveryKey({
      userId: aad.userId,
      recoveryKey: 'bad recovery key',
      bundle,
    })).rejects.toThrow(/unlock/i);
  });

  it('uses random IVs and binds ciphertext to row identity with AAD', async () => {
    const bundle = await cryptoService.createKeyBundle({
      userId: aad.userId,
      passphrase: 'another long private passphrase',
    });
    const session = await cryptoService.unlockWithRecoveryKey({
      userId: aad.userId,
      recoveryKey: bundle.recoveryKey,
      bundle,
    });

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
    const bundle = await cryptoService.createKeyBundle({
      userId: aad.userId,
      passphrase: 'file private passphrase',
    });
    const session = await cryptoService.unlockWithPassphrase({
      userId: aad.userId,
      passphrase: 'file private passphrase',
      bundle,
    });
    const bytes = new TextEncoder().encode('secret attachment bytes');

    const encrypted = await cryptoService.encryptBytes(session, aad, bytes);
    const decrypted = await cryptoService.decryptBytes(session, aad, encrypted);

    expect(encrypted.ciphertext).not.toContain('secret attachment bytes');
    expect(new TextDecoder().decode(decrypted)).toBe('secret attachment bytes');
  });
});
