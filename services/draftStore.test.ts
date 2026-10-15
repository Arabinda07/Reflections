import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { cryptoService } from './cryptoService';
import { setCurrentCryptoSession } from './cryptoSessionStore';
import { db } from './db';
import { draftStore } from './draftStore';

const unlock = async (userId = 'user-1') => {
  setCurrentCryptoSession({
    userId,
    keyId: 'key-1',
    dataKey: await cryptoService.importRawDataKey(cryptoService.generateRawDataKey()),
  });
};

const payload = { title: 'Sunday', content: '<p>Called Sam today</p>', tags: ['family'], relationshipIds: ['r1'] };

describe('draftStore', () => {
  afterEach(async () => {
    setCurrentCryptoSession(null);
    await db.drafts.clear();
  });

  it('round-trips a draft and never stores plaintext', async () => {
    await unlock();
    await draftStore.save(undefined, payload);

    expect(await draftStore.load(undefined)).toEqual(payload);
    const raw = JSON.stringify(await db.drafts.toArray());
    expect(raw).not.toContain('Sam');
    expect(raw).not.toContain('Sunday');
  });

  it('keeps new and existing-note drafts apart, and clears them', async () => {
    await unlock();
    await draftStore.save('note-9', { ...payload, title: 'Edit' });
    expect(await draftStore.load(undefined)).toBeNull();
    expect((await draftStore.load('note-9'))?.title).toBe('Edit');
    await draftStore.clear('note-9');
    expect(await draftStore.load('note-9')).toBeNull();
  });

  it('applies a clear issued after a save even if the save is still encrypting', async () => {
    await unlock();
    const pendingSave = draftStore.save(undefined, payload);
    await draftStore.clear(undefined);
    await pendingSave;
    expect(await draftStore.load(undefined)).toBeNull();
  });

  it('does nothing while the vault is locked', async () => {
    await draftStore.save(undefined, payload);
    expect(await db.drafts.count()).toBe(0);
    expect(await draftStore.load(undefined)).toBeNull();
  });

  it('does not hand one user another user\'s draft', async () => {
    await unlock('user-1');
    await draftStore.save(undefined, payload);
    await unlock('user-2');
    expect(await draftStore.load(undefined)).toBeNull();
  });
});
