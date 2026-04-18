import { useEffect, useCallback, useRef } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { supabase } from '../src/supabaseClient';
import { useNetworkState } from './useNetworkState';

/**
 * useSync hook
 * 
 * Re-engineered for Dexie-based status tracking.
 * Automatically synchronizes pending notes when connectivity is restored.
 */
export const useSync = () => {
  const isOnline = useNetworkState();
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    // 1. Guards
    if (!isOnline || isSyncing.current) return;

    // 2. Auth Check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 3. Get all pending operations from Dexie
    const pending = await offlineStorage.getPendingOperations();
    if (pending.length === 0) return;

    isSyncing.current = true;
    console.log(`[SyncEngine] Processing ${pending.length} pending changes...`);

    // 4. Sequential Sync to maintain causal order
    for (const note of pending) {
      try {
        let error = null;

        if (note.syncStatus === 'pending_insert') {
          ({ error } = await supabase.from('notes').upsert({
            id: note.id,
            user_id: session.user.id,
            title: note.title,
            content: note.content,
            thumbnail_url: note.thumbnailUrl,
            tags: note.tags || [],
            attachments: note.attachments || [],
            tasks: note.tasks || [],
            mood: note.mood,
            created_at: note.createdAt,
            updated_at: note.updatedAt
          }));
        } 
        else if (note.syncStatus === 'pending_update') {
          ({ error } = await supabase.from('notes').update({
            title: note.title,
            content: note.content,
            thumbnail_url: note.thumbnailUrl,
            tags: note.tags || [],
            attachments: note.attachments || [],
            tasks: note.tasks || [],
            mood: note.mood,
            updated_at: note.updatedAt
          }).eq('id', note.id).eq('user_id', session.user.id));
        } 
        else if (note.syncStatus === 'pending_delete') {
          ({ error } = await supabase.from('notes')
            .delete()
            .eq('id', note.id)
            .eq('user_id', session.user.id));
        }

        if (!error || error.code === 'PGRST116') { // PGRST116 is "Not Found" for delete — treat as success
          await offlineStorage.markAsSynced(note.id);
        } else {
          throw error;
        }
      } catch (err) {
        console.error(`[SyncEngine] Failed to sync note ${note.id}:`, err);
        // We pause here to prevent out-of-order failures for this specific note
        // but we can continue to the next if they are independent
      }
    }

    isSyncing.current = false;
    console.log('[SyncEngine] Sync cycle complete.');
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  return { sync };
};
