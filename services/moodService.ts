import type { MoodCheckin } from '../types';
import { getAuthenticatedUser } from './authUtils';
import { moodRemoteStore } from './moodRemoteStore';

interface MoodCheckinInput {
  mood: string;
  label?: string;
  source?: string;
}

export const DEFAULT_MOOD_HISTORY_LIMIT = 90;

export const moodCheckinService = {
  create: async (input: MoodCheckinInput): Promise<MoodCheckin> => {
    const user = await getAuthenticatedUser();
    return moodRemoteStore.insert(user.id, input.mood, input.label, input.source);
  },

  list: async (limit = DEFAULT_MOOD_HISTORY_LIMIT): Promise<MoodCheckin[]> => {
    const user = await getAuthenticatedUser();
    return moodRemoteStore.list(user.id, limit);
  },
};
