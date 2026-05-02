import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('offline storage isolation contract', () => {
  it('requires a user id for cached note lookup and pending sync selection', () => {
    const offlineStorage = read('services/offlineStorage.ts');
    const syncHook = read('hooks/useSync.ts');
    const db = read('services/db.ts');

    expect(offlineStorage).toContain('getNoteById(id: string, userId: string)');
    expect(offlineStorage).toContain('getPendingOperations(userId: string)');
    expect(syncHook).toContain('getPendingOperations(session.user.id)');
    expect(syncHook).not.toContain('getPendingOperations()');
    expect(db).toContain('[userId+syncStatus]');
  });
});
