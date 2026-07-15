import { db, type LocalEncryptedNote, type LocalNote } from './db';
import { cryptoService, type CryptoSession, isEncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';
import { getCurrentUserMode } from './userModeStore';

type LegacyLocalNote = LocalNote & {
  encryptedPayload?: unknown;
};

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

const isLegacyPlaintextNote = (note: LocalEncryptedNote | LegacyLocalNote): note is LegacyLocalNote =>
  !isEncryptedEnvelope(note.encryptedPayload) &&
  typeof note.id === 'string' &&
  typeof note.userId === 'string' &&
  typeof note.createdAt === 'string' &&
  typeof note.updatedAt === 'string' &&
  typeof note.syncStatus === 'string' &&
  ('title' in note || 'content' in note);

const normalizeLegacyLocalNote = (note: LegacyLocalNote): LocalNote => ({
  id: note.id,
  userId: note.userId,
  syncStatus: note.syncStatus,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  title: note.title || '',
  content: note.content || '',
  thumbnailUrl: note.thumbnailUrl,
  tags: note.tags || [],
  attachments: note.attachments || [],
  mood: note.mood,
  tasks: note.tasks || [],
});

const decryptLocalNote = async (note: LocalEncryptedNote | LegacyLocalNote, session: CryptoSession): Promise<LocalNote | undefined> => {
  if (!isEncryptedEnvelope(note.encryptedPayload)) {
    if (!isLegacyPlaintextNote(note)) {
      if (note.syncStatus === 'pending_insert' || note.syncStatus === 'pending_update') {
        throw new Error('Pending cached note cannot be migrated safely.');
      }
      await db.notes.delete(note.id);
      return undefined;
    }

    const legacyNote = normalizeLegacyLocalNote(note);
    await db.notes.put(await encryptLocalNote(legacyNote, session));
    return legacyNote;
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
    if (getCurrentUserMode() === 'reflective') {
      await db.notes.put(note as any);
      return;
    }
    await offlineStorage.saveEncryptedNote(note, requireCurrentCryptoSession());
  },

  async saveEncryptedNote(note: LocalNote, session: CryptoSession): Promise<void> {
    await db.notes.put(await encryptLocalNote(note, session));
  },

  async getAllNotes(userId: string): Promise<LocalNote[]> {
    const notes = await db.notes
      .where('userId')
      .equals(userId)
      .filter(note => note.syncStatus !== 'pending_delete')
      .reverse()
      .sortBy('updatedAt');

    if (getCurrentUserMode() === 'reflective') {
      return notes.map(n => normalizeLegacyLocalNote(n as LegacyLocalNote));
    }

    const session = requireCurrentCryptoSession();
    const decrypted = await Promise.all(notes.map((note) => decryptLocalNote(note, session)));
    return decrypted.filter((note): note is LocalNote => Boolean(note));
  },

  async getNoteById(id: string, userId: string): Promise<LocalNote | undefined> {
    const note = await db.notes.get(id);
    if (note?.userId !== userId) return undefined;
    
    if (getCurrentUserMode() === 'reflective') {
      return normalizeLegacyLocalNote(note as LegacyLocalNote);
    }
    const session = requireCurrentCryptoSession();
    return decryptLocalNote(note, session);
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
    const pendingNotes = await db.notes
      .where('[userId+syncStatus]')
      .anyOf([
        [userId, 'pending_insert'],
        [userId, 'pending_update'],
        [userId, 'pending_delete'],
      ])
      .toArray();

    if (getCurrentUserMode() === 'reflective') {
      return pendingNotes.map(n => normalizeLegacyLocalNote(n as LegacyLocalNote));
    }
    const session = requireCurrentCryptoSession();
    const decrypted = await Promise.all(pendingNotes.map((note) => decryptLocalNote(note, session)));
    return decrypted.filter((note): note is LocalNote => Boolean(note));
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
