import type { Note } from '../types';
import { supabase } from '../src/supabaseClient';
import { getAuthenticatedUser } from './authUtils';
import { getNoteContentHash } from './aiContext';

export const absorbLogService = {
  getNoteContentHash: async (note: Note): Promise<string> => {
    return getNoteContentHash(note);
  },

  needsReAbsorb: async (note: Note): Promise<boolean> => {
    const user = await getAuthenticatedUser();
    const currentHash = await absorbLogService.getNoteContentHash(note);

    const { data, error } = await supabase
      .from('wiki_absorb_log')
      .select('content_hash')
      .eq('user_id', user.id)
      .eq('note_id', note.id)
      .maybeSingle();

    if (error) throw error;
    return data?.content_hash !== currentHash;
  },

  logAbsorption: async (note: Note): Promise<void> => {
    const user = await getAuthenticatedUser();
    const contentHash = await absorbLogService.getNoteContentHash(note);

    const { error } = await supabase
      .from('wiki_absorb_log')
      .upsert(
        {
          user_id: user.id,
          note_id: note.id,
          content_hash: contentHash,
          absorbed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,note_id' },
      );

    if (error) throw error;
  },

  logAbsorptions: async (notes: Note[]): Promise<void> => {
    for (const note of notes) {
      await absorbLogService.logAbsorption(note);
    }
  },
};
