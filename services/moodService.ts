import type { MoodCheckin } from '../types';
import { getAuthenticatedUser } from './authUtils';
import { moodRemoteStore } from './moodRemoteStore';

interface MoodCheckinInput {
  mood: string;
  label?: string;
  source?: string;
}

export const moodCheckinService = {
  create: async (input: MoodCheckinInput): Promise<MoodCheckin> => {
    const user = await getAuthenticatedUser();
    return moodRemoteStore.insert(user.id, input.mood, input.label, input.source);
  },

  list: async (limit = 90): Promise<MoodCheckin[]> => {
    const user = await getAuthenticatedUser();
    return moodRemoteStore.list(user.id, limit);
  },
};
