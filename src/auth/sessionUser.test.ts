import type { Session } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { mapSessionToUser } from './sessionUser';

const createSession = (userMetadata: Record<string, unknown>, email = 'journaler@example.com') =>
  ({
    user: {
      id: 'user-1',
      email,
      user_metadata: userMetadata,
      app_metadata: {},
    },
  }) as Session;

describe('mapSessionToUser', () => {
  it('prefers a trimmed full_name from Supabase user metadata', () => {
    const user = mapSessionToUser(
      createSession({
        full_name: '  Ada Lovelace  ',
        display_name: 'Display Name',
        name: 'Metadata Name',
      }),
    );

    expect(user.name).toBe('Ada Lovelace');
  });

  it('falls back through display_name, name, then the email prefix after trimming empty strings', () => {
    expect(
      mapSessionToUser(
        createSession({
          full_name: '   ',
          display_name: '  Grace Hopper  ',
          name: 'Metadata Name',
        }),
      ).name,
    ).toBe('Grace Hopper');

    expect(
      mapSessionToUser(
        createSession({
          full_name: '',
          display_name: '   ',
          name: '  Katherine Johnson  ',
        }),
      ).name,
    ).toBe('Katherine Johnson');

    expect(
      mapSessionToUser(
        createSession(
          {
            full_name: ' ',
            display_name: '',
            name: '   ',
          },
          '  reflector@example.com',
        ),
      ).name,
    ).toBe('reflector');
  });

  it('carries the Supabase auth provider for onboarding decisions', () => {
    const session = createSession({ full_name: 'OAuth User' });
    session.user.app_metadata = { provider: 'google' };

    expect(mapSessionToUser(session).authProvider).toBe('google');
  });
});
