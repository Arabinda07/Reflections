import type { Session } from '@supabase/supabase-js';

import { useAuthStore } from '../../hooks/useAuthStore';
import type { User } from '../../types';

const getSessionAvatarUrl = (session: Session) =>
  session.user.user_metadata?.avatar_url ||
  session.user.user_metadata?.picture ||
  session.user.user_metadata?.avatar ||
  null;

const getTrimmedMetadataValue = (session: Session, key: 'full_name' | 'display_name' | 'name') => {
  const value = session.user.user_metadata?.[key];

  return typeof value === 'string' ? value.trim() : '';
};

const getSessionDisplayName = (session: Session) => {
  const emailPrefix = session.user.email?.split('@')[0]?.trim() || '';

  return (
    getTrimmedMetadataValue(session, 'full_name') ||
    getTrimmedMetadataValue(session, 'display_name') ||
    getTrimmedMetadataValue(session, 'name') ||
    emailPrefix ||
    'User'
  );
};

export const mapSessionToUser = (session: Session): User => ({
  id: session.user.id,
  email: session.user.email || '',
  name: getSessionDisplayName(session),
  avatarUrl: getSessionAvatarUrl(session) || undefined,
});

export const commitAuthSession = (session: Session) => {
  const { setHydrated, setInitialCheckDone, setUser } = useAuthStore.getState();

  setUser(mapSessionToUser(session));
  setHydrated(true);
  setInitialCheckDone(true);
};
