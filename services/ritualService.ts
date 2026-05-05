import type { RitualEvent, RitualEventType } from '../types';
import { getAuthenticatedUser } from './authUtils';
import { ritualRemoteStore } from './ritualRemoteStore';

export const ritualEventService = {
  record: async (eventType: RitualEventType, options: { sourceId?: string } = {}): Promise<RitualEvent> => {
    const user = await getAuthenticatedUser();
    return ritualRemoteStore.insert(user.id, eventType, options.sourceId);
  },

  recordReleaseCompleted: async (): Promise<RitualEvent> =>
    ritualEventService.record('release_completed'),

  listSince: async (since: string): Promise<RitualEvent[]> => {
    const user = await getAuthenticatedUser();
    return ritualRemoteStore.listSince(user.id, since);
  },
};
