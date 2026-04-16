import { useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { noteService } from '../services/noteService';
import { supabase } from '../src/supabaseClient';

/**
 * useSync hook
 * 
 * Automatically synchronizes queued offline operations when the device
 * recovers its internet connection.
 */
export const useSync = () => {
  const sync = useCallback(async () => {
    // 1. Check if truly online
    if (!navigator.onLine) return;

    // 2. Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 3. Get queued operations
    const queue = await offlineStorage.getQueuedOperations();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} operations...`);

    // 4. Process operations sequentially to maintain order integrity
    for (const op of queue) {
      try {
        switch (op.action) {
          case 'create':
            // The entityId in queue for 'create' is the tempId we used
            await noteService.create(op.data); 
            // Note: noteService.create already handles Supabase logic
            // If it succeeds, we remove from queue.
            break;
          case 'update':
            await noteService.update(op.entityId, op.data);
            break;
          case 'delete':
            await noteService.delete(op.entityId);
            break;
        }
        
        // Remove from queue on success
        if (op.id !== undefined) {
          await offlineStorage.removeFromQueue(op.id);
        }
      } catch (err) {
        console.error(`Failed to sync operation ${op.action} for ${op.entityId}:`, err);
        // We stop processing here if a critical error occurs to avoid out-of-order syncs
        // unless it's a specific "Conflict" error we can handle.
        break; 
      }
    }
    
    console.log('Sync complete.');
  }, []);

  useEffect(() => {
    // Initial sync on mount
    sync();

    // Listen for online events
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);

  return { sync };
};
