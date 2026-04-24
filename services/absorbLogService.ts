import { supabase } from '../src/supabaseClient';

/**
 * Computes a SHA-256 hex digest of the given text.
 * Uses the Web Crypto API (available in browsers and Node 18+).
 */
export async function computeContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const absorbLogService = {
  /**
   * Check if a note has been absorbed and return its stored hash.
   * Returns null if the note has never been absorbed.
   */
  getStoredHash: async (noteId: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('wiki_absorb_log')
      .select('content_hash')
      .eq('user_id', user.id)
      .eq('note_id', noteId)
      .single();

    if (error || !data) return null;
    return data.content_hash;
  },

  /**
   * Returns true if the note content has changed since last absorption.
   */
  needsReAbsorb: async (noteId: string, currentContent: string): Promise<boolean> => {
    const storedHash = await absorbLogService.getStoredHash(noteId);
    if (storedHash === null) return true;
    const currentHash = await computeContentHash(currentContent);
    return storedHash !== currentHash;
  },

  /**
   * Record that a note has been absorbed with the given content hash.
   * Upserts on (user_id, note_id).
   */
  logAbsorption: async (noteId: string, contentHash: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('wiki_absorb_log')
      .upsert(
        {
          user_id: user.id,
          note_id: noteId,
          content_hash: contentHash,
          absorbed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,note_id' }
      );

    if (error) throw error;
  },

  /**
   * Delete all absorb log entries for the current user.
   * Used during "Nuclear Option" sanctuary data deletion.
   */
  purgeAll: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('wiki_absorb_log')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
