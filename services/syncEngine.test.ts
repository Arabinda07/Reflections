import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./offlineStorage', () => ({
  offlineStorage: {
    getPendingOperations: vi.fn(),
    markAsSynced: vi.fn(),
  },
}));
vi.mock('./noteRemoteStore', () => ({
  noteRemoteStore: {
    insert: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
  },
}));

import { syncEngine } from './syncEngine';
import { offlineStorage } from './offlineStorage';
import { noteRemoteStore } from './noteRemoteStore';
import type { LocalNote } from './db';

const op = (id: string): LocalNote => ({ id, syncStatus: 'pending_insert' } as LocalNote);
const getPending = vi.mocked(offlineStorage.getPendingOperations);
const markAsSynced = vi.mocked(offlineStorage.markAsSynced);
const insert = vi.mocked(noteRemoteStore.insert);

// Note: opFailures is module-level state that persists across tests in this file,
// so each test uses distinct op ids to stay isolated.
describe('syncEngine.flush — poison-op resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markAsSynced.mockResolvedValue(undefined as never);
  });

  it('keeps syncing healthy ops when an earlier op fails', async () => {
    getPending.mockResolvedValue([op('a-bad'), op('a-good')]);
    insert.mockImplementation((_userId, note) =>
      note.id === 'a-bad' ? Promise.reject(new Error('boom')) : Promise.resolve(),
    );

    await syncEngine.flush('user-1');

    expect(insert).toHaveBeenCalledTimes(2);
    expect(markAsSynced).toHaveBeenCalledWith('a-good');
    expect(markAsSynced).not.toHaveBeenCalledWith('a-bad');
  });

  it('quarantines an op after MAX_OP_RETRIES failures', async () => {
    getPending.mockResolvedValue([op('b-poison')]);
    insert.mockRejectedValue(new Error('permanently broken'));

    for (let i = 0; i < 5; i += 1) await syncEngine.flush('user-2'); // 5 attempts -> count reaches max
    expect(insert).toHaveBeenCalledTimes(5);

    insert.mockClear();
    await syncEngine.flush('user-2'); // 6th flush: op is quarantined and skipped
    expect(insert).not.toHaveBeenCalled();
  });

  it('clears the failure count once a transient op finally succeeds', async () => {
    getPending.mockResolvedValue([op('c-transient')]);
    insert.mockRejectedValueOnce(new Error('transient')).mockResolvedValue();

    await syncEngine.flush('user-3'); // fails
    await syncEngine.flush('user-3'); // succeeds

    expect(insert).toHaveBeenCalledTimes(2);
    expect(markAsSynced).toHaveBeenCalledWith('c-transient');
  });
});
