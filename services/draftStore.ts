import { db } from './db';
import { cryptoService } from './cryptoService';
import { getCurrentCryptoSession } from './cryptoSessionStore';

// Unsaved writing, kept on this device only so a crash or an OS kill never
// loses a word. Always encrypted; when the vault is locked we simply skip.
export interface NoteDraftPayload {
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  relationshipIds: string[];
  /** updatedAt of the saved note this draft was based on (edits only). */
  baseUpdatedAt?: string;
}

const rowId = (userId: string, noteId?: string) => `${userId}:${noteId || 'new'}`;
const aad = (id: string, userId: string) => ({ table: 'dexie.drafts', rowId: id, userId });

// Writes and clears run in order, so a slow autosave can never land after the
// clear that follows a successful save and resurrect a finished note.
let queue: Promise<unknown> = Promise.resolve();
const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
};

export const draftStore = {
  save(noteId: string | undefined, payload: NoteDraftPayload): Promise<void> {
    return enqueue(async () => {
    const session = getCurrentCryptoSession();
    if (!session) return;
    const id = rowId(session.userId, noteId);
    await db.drafts.put({
      id,
      userId: session.userId,
      updatedAt: new Date().toISOString(),
      encryptedPayload: await cryptoService.encryptJson(session, aad(id, session.userId), payload),
    });
    });
  },

  async load(noteId: string | undefined): Promise<NoteDraftPayload | null> {
    const session = getCurrentCryptoSession();
    if (!session) return null;
    const id = rowId(session.userId, noteId);
    const row = await db.drafts.get(id);
    if (!row || row.userId !== session.userId) return null;
    try {
      return await cryptoService.decryptJson<NoteDraftPayload>(session, aad(id, session.userId), row.encryptedPayload);
    } catch {
      return null;
    }
  },

  clear(noteId: string | undefined): Promise<void> {
    return enqueue(async () => {
      const session = getCurrentCryptoSession();
      if (!session) return;
      await db.drafts.delete(rowId(session.userId, noteId));
    });
  },
};
