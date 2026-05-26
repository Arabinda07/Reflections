import { supabase } from '../src/supabaseClient';
import type { FutureLetter, LifeTheme, MoodCheckin, Note } from '../types';
import { cryptoService, type CryptoSession, type EncryptedEnvelope, isEncryptedEnvelope } from './cryptoService';
import { mapToNote, type SupabaseNoteRow } from './noteRemoteStore';
import { WikiPageType } from './wikiTypes';

type MigrationTable = 'notes' | 'mood_checkins' | 'future_letters' | 'life_themes';

export interface MigrationProgress {
  table: MigrationTable;
  label: string;
  processed: number;
  total?: number;
}

type MigrationProgressCallback = (progress: MigrationProgress) => void;

const MIGRATION_BATCH_SIZE = 25;

const tableLabels: Record<MigrationTable, string> = {
  notes: 'notes',
  mood_checkins: 'moods',
  future_letters: 'future letters',
  life_themes: 'Life Wiki',
};

const aad = (table: MigrationTable, userId: string, rowId: string) => ({
  table,
  rowId,
  userId,
});

const fetchMigrationBatch = async <Row>(
  table: MigrationTable,
  userId: string,
  offset: number,
): Promise<{ rows: Row[]; total: number | undefined }> => {
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('id', { ascending: true })
    .range(offset, offset + MIGRATION_BATCH_SIZE - 1);

  if (error) throw error;

  return {
    rows: (data || []) as Row[],
    total: count ?? undefined,
  };
};

const isPlaintextCleared = (row: { encrypted_payload?: EncryptedEnvelope | null; encryption_migration_state?: string }) =>
  isEncryptedEnvelope(row.encrypted_payload) && row.encryption_migration_state === 'plaintext_cleared';

const reportProgress = (
  table: MigrationTable,
  processed: number,
  total: number | undefined,
  onProgress?: MigrationProgressCallback,
) => {
  onProgress?.({
    table,
    label: tableLabels[table],
    processed,
    total,
  });
};

const migrateRowsInBatches = async <Row extends { id: string }>({
  table,
  session,
  onProgress,
  migrateRow,
}: {
  table: MigrationTable;
  session: CryptoSession;
  onProgress?: MigrationProgressCallback;
  migrateRow: (row: Row) => Promise<void>;
}) => {
  let processed = 0;

  for (;;) {
    const { rows, total } = await fetchMigrationBatch<Row>(table, session.userId, processed);

    if (rows.length === 0) {
      reportProgress(table, processed, total, onProgress);
      return;
    }

    for (const row of rows) {
      await migrateRow(row);
    }

    processed += rows.length;
    reportProgress(table, processed, total, onProgress);

    if (rows.length < MIGRATION_BATCH_SIZE || (total !== undefined && processed >= total)) {
      return;
    }
  }
};

const verifyEnvelope = async <T>(
  session: CryptoSession,
  table: MigrationTable,
  userId: string,
  rowId: string,
  envelope: EncryptedEnvelope,
  expectedPayload: T,
) => {
  const decrypted = await cryptoService.decryptJson<T>(session, aad(table, userId, rowId), envelope);
  if (JSON.stringify(decrypted) !== JSON.stringify(expectedPayload)) {
    throw new Error(`Zero-knowledge migration verification failed for ${table}:${rowId}`);
  }
};

const markEncryptionVerified = async (
  table: MigrationTable,
  rowId: string,
  userId: string,
  encryptedPayload: EncryptedEnvelope,
) => {
  const { error } = await supabase
    .from(table)
    .update({
      encrypted_payload: encryptedPayload,
      encrypted_payload_version: 1,
      encryption_migration_state: 'verified',
    })
    .eq('id', rowId)
    .eq('user_id', userId);

  if (error) throw error;
};

const migrateNotes = async (session: CryptoSession, onProgress?: MigrationProgressCallback) => {
  await migrateRowsInBatches<SupabaseNoteRow>({
    table: 'notes',
    session,
    onProgress,
    migrateRow: async (row) => {
      if (isPlaintextCleared(row)) return;

      const note = mapToNote(row);
      const payload = {
        title: note.title,
        content: note.content,
        thumbnailUrl: note.thumbnailUrl,
        tags: note.tags || [],
        attachments: note.attachments || [],
        tasks: note.tasks || [],
        mood: note.mood,
      };
      const encryptedPayload = isEncryptedEnvelope(row.encrypted_payload)
        ? row.encrypted_payload
        : await cryptoService.encryptJson(session, aad('notes', session.userId, row.id), payload);

      await markEncryptionVerified('notes', row.id, session.userId, encryptedPayload);
      await verifyEnvelope(session, 'notes', session.userId, row.id, encryptedPayload, payload);

      const { error: clearError } = await supabase
        .from('notes')
        .update({
          title: null,
          content: null,
          thumbnail_url: null,
          tags: [],
          attachments: [],
          tasks: [],
          mood: null,
          encryption_migration_state: 'plaintext_cleared',
        })
        .eq('id', row.id)
        .eq('user_id', session.userId);

      if (clearError) throw clearError;
    },
  });
};

const migrateMoods = async (session: CryptoSession, onProgress?: MigrationProgressCallback) => {
  await migrateRowsInBatches<MoodCheckin & {
    user_id: string;
    created_at: string;
    encryption_migration_state?: string;
    encrypted_payload?: EncryptedEnvelope | null;
  }>({
    table: 'mood_checkins',
    session,
    onProgress,
    migrateRow: async (row) => {
      if (isPlaintextCleared(row)) return;

      const payload = {
        mood: row.mood,
        label: row.label || undefined,
        source: row.source || undefined,
      };
      const encryptedPayload = isEncryptedEnvelope(row.encrypted_payload)
        ? row.encrypted_payload
        : await cryptoService.encryptJson(session, aad('mood_checkins', session.userId, row.id), payload);

      await markEncryptionVerified('mood_checkins', row.id, session.userId, encryptedPayload);
      await verifyEnvelope(session, 'mood_checkins', session.userId, row.id, encryptedPayload, payload);

      const { error: clearError } = await supabase
        .from('mood_checkins')
        .update({
          mood: null,
          label: null,
          source: null,
          encryption_migration_state: 'plaintext_cleared',
        })
        .eq('id', row.id)
        .eq('user_id', session.userId);

      if (clearError) throw clearError;
    },
  });
};

const migrateFutureLetters = async (session: CryptoSession, onProgress?: MigrationProgressCallback) => {
  await migrateRowsInBatches<FutureLetter & {
    user_id: string;
    title: string | null;
    content: string | null;
    encryption_migration_state?: string;
    encrypted_payload?: EncryptedEnvelope | null;
  }>({
    table: 'future_letters',
    session,
    onProgress,
    migrateRow: async (row) => {
      if (isPlaintextCleared(row)) return;

      const payload = {
        title: row.title || '',
        content: row.content || '',
      };
      const encryptedPayload = isEncryptedEnvelope(row.encrypted_payload)
        ? row.encrypted_payload
        : await cryptoService.encryptJson(session, aad('future_letters', session.userId, row.id), payload);

      await markEncryptionVerified('future_letters', row.id, session.userId, encryptedPayload);
      await verifyEnvelope(session, 'future_letters', session.userId, row.id, encryptedPayload, payload);

      const { error: clearError } = await supabase
        .from('future_letters')
        .update({
          title: null,
          content: null,
          encryption_migration_state: 'plaintext_cleared',
        })
        .eq('id', row.id)
        .eq('user_id', session.userId);

      if (clearError) throw clearError;
    },
  });
};

const migrateLifeThemes = async (session: CryptoSession, onProgress?: MigrationProgressCallback) => {
  await migrateRowsInBatches<LifeTheme & {
    user_id: string;
    page_type: WikiPageType;
    title: string;
    content: string | null;
    encryption_migration_state?: string;
    encrypted_payload?: EncryptedEnvelope | null;
  }>({
    table: 'life_themes',
    session,
    onProgress,
    migrateRow: async (row) => {
      if (isPlaintextCleared(row)) return;

      const payload = {
        title: row.title || '',
        content: row.content || '',
      };
      const encryptedPayload = isEncryptedEnvelope(row.encrypted_payload)
        ? row.encrypted_payload
        : await cryptoService.encryptJson(session, aad('life_themes', session.userId, row.id), payload);

      await markEncryptionVerified('life_themes', row.id, session.userId, encryptedPayload);
      await verifyEnvelope(session, 'life_themes', session.userId, row.id, encryptedPayload, payload);

      const { error: clearError } = await supabase
        .from('life_themes')
        .update({
          title: row.page_type === 'theme' ? 'Encrypted theme' : 'Encrypted wiki page',
          content: '',
          encryption_migration_state: 'plaintext_cleared',
        })
        .eq('id', row.id)
        .eq('user_id', session.userId);

      if (clearError) throw clearError;
    },
  });
};

export const zeroKnowledgeMigrationService = {
  async migrateUserPrivateData(session: CryptoSession, onProgress?: MigrationProgressCallback): Promise<void> {
    await migrateNotes(session, onProgress);
    await migrateMoods(session, onProgress);
    await migrateFutureLetters(session, onProgress);
    await migrateLifeThemes(session, onProgress);
  },
};
