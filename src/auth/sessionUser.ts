import type { Session } from '@supabase/supabase-js';

import { useAuthStore } from '../../hooks/useAuthStore';
import type { User } from '../../types';

const getSessionAvatarUrl = (session: Session) =>
  session.user.user_metadata?.avatar_url ||
  session.user.user_metadata?.picture ||
  session.user.user_metadata?.avatar ||
  null;

export const mapSessionToUser = (session: Session): User => ({
  id: session.user.id,
  email: session.user.email || '',
  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
  avatarUrl: getSessionAvatarUrl(session) || undefined,
});

export const commitAuthSession = (session: Session) => {
  const { setHydrated, setInitialCheckDone, setUser } = useAuthStore.getState();

  setUser(mapSessionToUser(session));
  setHydrated(true);
  setInitialCheckDone(true);
};
