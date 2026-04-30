import { supabase } from '../src/supabaseClient';

export const getAuthenticatedUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};
