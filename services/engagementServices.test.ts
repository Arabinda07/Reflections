import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildReferralLink,
  futureLetterService,
  getFutureLetterOpenState,
  moodCheckinService,
  referralService,
  ritualEventService,
} from './engagementServices';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const mockAuth = vi.mocked(supabase.auth.getUser);
const mockFrom = vi.mocked(supabase.from);
const mockRpc = vi.mocked(supabase.rpc);

const storage = () => {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  };
};

describe('moodCheckinService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'user-1' } } } as any);
  });

  it('creates standalone mood check-ins without note content', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'checkin-1',
          user_id: 'user-1',
          mood: 'steady',
          label: 'morning',
          source: 'home',
          created_at: '2026-04-29T08:00:00.000Z',
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain as any);

    const checkin = await moodCheckinService.create({
      mood: 'steady',
      label: 'morning',
      source: 'home',
    });

    expect(mockFrom).toHaveBeenCalledWith('mood_checkins');
    expect(chain.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      mood: 'steady',
      label: 'morning',
      source: 'home',
    });
    expect(checkin.userId).toBe('user-1');
    expect(JSON.stringify(chain.insert.mock.calls[0][0])).not.toContain('content');
  });
});

describe('futureLetterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'user-1' } } } as any);
  });

  it('refuses to open a future letter before its selected open date', async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'letter-1',
          user_id: 'user-1',
          title: 'Later',
          content: 'Read this later',
          open_at: '2026-05-10T00:00:00.000Z',
          opened_at: null,
          created_at: '2026-04-29T00:00:00.000Z',
          updated_at: '2026-04-29T00:00:00.000Z',
          status: 'scheduled',
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(selectChain as any);

    await expect(
      futureLetterService.open('letter-1', new Date('2026-04-29T12:00:00.000Z')),
    ).rejects.toThrow('LETTER_LOCKED_UNTIL_OPEN_DATE');

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(selectChain.eq).toHaveBeenCalledWith('id', 'letter-1');
    expect(selectChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('marks an openable letter as opened and records a content-free ritual event', async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'letter-1',
          user_id: 'user-1',
          title: 'Today',
          content: 'A private note to myself',
          open_at: '2026-04-20T00:00:00.000Z',
          opened_at: null,
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
          status: 'scheduled',
        },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'letter-1',
          user_id: 'user-1',
          title: 'Today',
          content: 'A private note to myself',
          open_at: '2026-04-20T00:00:00.000Z',
          opened_at: '2026-04-29T12:00:00.000Z',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-29T12:00:00.000Z',
          status: 'opened',
        },
        error: null,
      }),
    };
    const eventChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'event-1',
          user_id: 'user-1',
          event_type: 'letter_opened',
          source_id: 'letter-1',
          created_at: '2026-04-29T12:00:00.000Z',
        },
        error: null,
      }),
    };
    mockFrom
      .mockReturnValueOnce(selectChain as any)
      .mockReturnValueOnce(updateChain as any)
      .mockReturnValueOnce(eventChain as any);

    const letter = await futureLetterService.open('letter-1', new Date('2026-04-29T12:00:00.000Z'));

    expect(letter.status).toBe('opened');
    expect(updateChain.update).toHaveBeenCalledWith({
      opened_at: '2026-04-29T12:00:00.000Z',
      status: 'opened',
      updated_at: '2026-04-29T12:00:00.000Z',
    });
    expect(eventChain.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      event_type: 'letter_opened',
      source_id: 'letter-1',
    });
  });
});

describe('getFutureLetterOpenState', () => {
  it('keeps letters locked until their open date and marks openable letters clearly', () => {
    const locked = getFutureLetterOpenState(
      {
        id: 'letter-1',
        userId: 'user-1',
        title: 'Later',
        content: 'Private',
        openAt: '2026-05-10T00:00:00.000Z',
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
        status: 'scheduled',
      },
      new Date('2026-04-29T12:00:00.000Z'),
    );

    const openable = getFutureLetterOpenState(
      {
        ...locked.letter,
        openAt: '2026-04-20T00:00:00.000Z',
      },
      new Date('2026-04-29T12:00:00.000Z'),
    );

    expect(locked.state).toBe('locked');
    expect(locked.actionLabel).toBe('Locked until May 10, 2026');
    expect(openable.state).toBe('openable');
    expect(openable.actionLabel).toBe('Open letter');
  });
});

describe('ritualEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'user-1' } } } as any);
  });

  it('records release completion as a content-free event', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'event-1',
          user_id: 'user-1',
          event_type: 'release_completed',
          source_id: null,
          created_at: '2026-04-29T12:00:00.000Z',
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain as any);

    await ritualEventService.recordReleaseCompleted();

    expect(mockFrom).toHaveBeenCalledWith('ritual_events');
    expect(chain.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      event_type: 'release_completed',
      source_id: undefined,
    });
    expect(JSON.stringify(chain.insert.mock.calls[0][0])).not.toMatch(/content|text|note/i);
  });
});

describe('referralService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'new-user' } } } as any);
  });

  it('captures a referral code from the URL so signup can preserve it', () => {
    const fakeStorage = storage();

    const captured = referralService.captureReferralCode('?ref=friend-code&utm_source=test', fakeStorage);

    expect(captured).toBe('friend-code');
    expect(fakeStorage.setItem).toHaveBeenCalledWith('reflections.referral_code', 'friend-code');
    expect(referralService.getCapturedReferralCode(fakeStorage)).toBe('friend-code');
  });

  it('builds hash-router signup links with the invite code only', () => {
    const link = buildReferralLink('abc_123', 'https://reflections.test', '/app/');

    expect(link).toBe('https://reflections.test/app/#/signup?ref=abc_123');
    expect(link).not.toMatch(/email|name|user/i);
  });

  it('records an accepted referral after profile creation and clears the stored code', async () => {
    const fakeStorage = storage();
    referralService.captureReferralCode('?ref=friend-code', fakeStorage);
    mockRpc.mockResolvedValue({ data: true, error: null } as any);

    await expect(referralService.recordAcceptedReferral(fakeStorage)).resolves.toBe(true);

    expect(mockFrom).not.toHaveBeenCalledWith('referral_invites');
    expect(mockRpc).toHaveBeenCalledWith('accept_referral_invite', {
      referral_code: 'friend-code',
    });
    expect(fakeStorage.removeItem).toHaveBeenCalledWith('reflections.referral_code');
  });
});
