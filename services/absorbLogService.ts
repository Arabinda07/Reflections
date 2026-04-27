import type { Note } from '../types';
import { supabase } from '../src/supabaseClient';

const getAuthenticatedUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};

const stableNoteFingerprint = (note: Note) =>
  JSON.stringify({
    title: note.title || '',
    content: note.content || '',
    mood: note.mood || '',
    tags: [...(note.tags || [])].sort(),
    tasks: (note.tasks || []).map((task) => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.dueDate || '',
    })),
  });

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const fallbackHash = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
};

export const absorbLogService = {
  getNoteContentHash: async (note: Note): Promise<string> => {
    const fingerprint = stableNoteFingerprint(note);
    const subtle = globalThis.crypto?.subtle;

    if (!subtle) {
      return fallbackHash(fingerprint);
    }

    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
    return toHex(digest);
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
