import {
  cryptoService,
  isEncryptedEnvelope,
  type CryptoSession,
  type EncryptedEnvelope,
  type EncryptionAad,
} from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';

/**
 * Shared zero-knowledge envelope wiring for the encrypted Supabase stores.
 *
 * Domain field mapping stays in each store; this only removes the identical,
 * error-prone crypto plumbing (the decrypt guard and the remote-row column
 * triple) so the envelope contract lives in one place. The AAD is always passed
 * in by the caller — it is never derived implicitly here.
 */

/** Builds the `{ table, rowId, userId }` AAD binding for a given table. */
export const rowAad = (table: string) =>
  (userId: string, rowId: string): EncryptionAad => ({ table, rowId, userId });

/** Decrypts an envelope, or returns null when the column is absent / legacy plaintext. */
export const decryptEnvelope = async <T>(
  envelope: EncryptedEnvelope | null | undefined,
  aad: EncryptionAad,
  session?: CryptoSession | null,
): Promise<T | null> => {
  if (!isEncryptedEnvelope(envelope)) return null;
  const activeSession = session ?? requireCurrentCryptoSession();
  return cryptoService.decryptJson<T>(activeSession, aad, envelope);
};

/** The encrypted columns every zero-knowledge Supabase row writes. */
export const encryptedColumns = async <T>(
  payload: T,
  aad: EncryptionAad,
  session: CryptoSession = requireCurrentCryptoSession(),
) => ({
  encrypted_payload: await cryptoService.encryptJson(session, aad, payload),
  encrypted_payload_version: 1 as const,
  encryption_migration_state: 'verified' as const,
});
