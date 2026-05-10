import type { User } from '@supabase/supabase-js';

import { getAuthAdapter } from '../src/auth/AuthRuntime';

/** Backward-compatible wrapper for getting the current user object. */
export const getAuthenticatedUser = async (): Promise<User> => {
  const user = await getAuthAdapter().getUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};

/** Wrapper to retrieve the authenticated user's ID. */
export const getAuthenticatedUserId = async (): Promise<string> => {
  const userId = await getAuthAdapter().getUserId();
  if (!userId) throw new Error('User not authenticated');
  return userId;
};
