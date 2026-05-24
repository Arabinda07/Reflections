import { db, type LocalEncryptedNote, type LocalNote } from './db';
import { cryptoService, type CryptoSession, isEncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';

const encryptedNoteAad = (note: Pick<LocalNote, 'id' | 'userId'>) => ({
  table: 'dexie.notes',
  rowId: note.id,
  userId: note.userId,
});

const encryptLocalNote = async (note: LocalNote, session: CryptoSession): Promise<LocalEncryptedNote> => ({
  id: note.id,
  userId: note.userId,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  syncStatus: note.syncStatus,
  encryptedPayload: await cryptoService.encryptJson(session, encryptedNoteAad(note), {
    title: note.title,
    content: note.content,
    thumbnailUrl: note.thumbnailUrl,
    tags: note.tags || [],
    attachments: note.attachments || [],
    mood: note.mood,
    tasks: note.tasks || [],
  }),
});

const decryptLocalNote = async (note: LocalEncryptedNote, session: CryptoSession): Promise<LocalNote> => {
  if (!isEncryptedEnvelope(note.encryptedPayload)) {
    throw new Error('Cached note is not encrypted.');
  }

  const payload = await cryptoService.decryptJson<Omit<LocalNote, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncStatus'>>(
    session,
    encryptedNoteAad(note),
    note.encryptedPayload,
  );

  return {
    ...payload,
    id: note.id,
    userId: note.userId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    syncStatus: note.syncStatus,
  };
};

export const offlineStorage = {
  // --- Note Operations ---

  async saveNote(note: LocalNote): Promise<void> {
    await offlineStorage.saveEncryptedNote(note, requireCurrentCryptoSession());
  },

  async saveEncryptedNote(note: LocalNote, session: CryptoSession): Promise<void> {
    await db.notes.put(await encryptLocalNote(note, session));
  },

  async getAllNotes(userId: string): Promise<LocalNote[]> {
    const session = requireCurrentCryptoSession();
    const notes = await db.notes
      .where('userId')
      .equals(userId)
      .filter(note => note.syncStatus !== 'pending_delete')
      .reverse()
      .sortBy('updatedAt');

    return Promise.all(notes.map((note) => decryptLocalNote(note, session)));
  },

  async getNoteById(id: string, userId: string): Promise<LocalNote | undefined> {
    const session = requireCurrentCryptoSession();
    const note = await db.notes.get(id);
    return note?.userId === userId ? decryptLocalNote(note, session) : undefined;
  },

  async deleteNote(id: string, userId: string): Promise<void> {
    const note = await db.notes.get(id);
    if (note?.userId !== userId) return;

    if (note) {
      // If it was already pending insert (never went to server), just delete it
      if (note.syncStatus === 'pending_insert') {
        await db.notes.delete(id);
      } else {
        await db.notes.update(id, { syncStatus: 'pending_delete', updatedAt: new Date().toISOString() });
      }
    }
  },

  // --- Sync Engine Queries ---

  async getPendingOperations(userId: string): Promise<LocalNote[]> {
    const session = requireCurrentCryptoSession();
    const pendingNotes = await db.notes
      .where('[userId+syncStatus]')
      .anyOf([
        [userId, 'pending_insert'],
        [userId, 'pending_update'],
        [userId, 'pending_delete'],
      ])
      .toArray();

    return Promise.all(pendingNotes.map((note) => decryptLocalNote(note, session)));
  },

  async markAsSynced(id: string): Promise<void> {
    const note = await db.notes.get(id);
    if (!note) return;
    
    if (note.syncStatus === 'pending_delete') {
      await db.notes.delete(id);
    } else {
      await db.notes.update(id, { syncStatus: 'synced' });
    }
  },

  async clearUserData(userId: string): Promise<void> {
    await db.notes.where('userId').equals(userId).delete();
  },
};
