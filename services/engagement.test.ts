import { beforeEach, describe, expect, it, vi } from 'vitest';
import { moodCheckinService } from './moodService';
import { ritualEventService } from './ritualService';
import { futureLetterService, getFutureLetterOpenState } from './futureLetterService';
import { buildReferralLink, referralService } from './referralService';
import { supabase } from '../src/supabaseClient';
import { moodRemoteStore } from './moodRemoteStore';
import { ritualRemoteStore } from './ritualRemoteStore';
import { futureLetterRemoteStore } from './futureLetterRemoteStore';
import { referralRemoteStore } from './referralRemoteStore';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('./moodRemoteStore', () => ({
  moodRemoteStore: {
    insert: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('./ritualRemoteStore', () => ({
  ritualRemoteStore: {
    insert: vi.fn(),
    listSince: vi.fn(),
  },
}));

vi.mock('./futureLetterRemoteStore', () => ({
  futureLetterRemoteStore: {
    insert: vi.fn(),
    list: vi.fn(),
    fetchById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('./referralRemoteStore', () => ({
  referralRemoteStore: {
    fetchByUserId: vi.fn(),
    insert: vi.fn(),
    updateLastSharedAt: vi.fn(),
    acceptInvite: vi.fn(),
    getAcceptedCount: vi.fn(),
  },
}));

const mockAuth = vi.mocked(supabase.auth.getUser);
const mockMoodInsert = vi.mocked(moodRemoteStore.insert);
const mockRitualInsert = vi.mocked(ritualRemoteStore.insert);
const mockFutureLetterFetch = vi.mocked(futureLetterRemoteStore.fetchById);
const mockFutureLetterUpdate = vi.mocked(futureLetterRemoteStore.updateStatus);
const mockReferralAccept = vi.mocked(referralRemoteStore.acceptInvite);

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
    mockMoodInsert.mockResolvedValue({
      id: 'checkin-1',
      userId: 'user-1',
      mood: 'steady',
      label: 'morning',
      source: 'home',
      createdAt: '2026-04-29T08:00:00.000Z',
    } as any);

    const checkin = await moodCheckinService.create({
      mood: 'steady',
      label: 'morning',
      source: 'home',
    });

    expect(mockMoodInsert).toHaveBeenCalledWith('user-1', 'steady', 'morning', 'home');
    expect(checkin.userId).toBe('user-1');
  });
});

describe('futureLetterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'user-1' } } } as any);
  });

  it('refuses to open a future letter before its selected open date', async () => {
    mockFutureLetterFetch.mockResolvedValue({
      id: 'letter-1',
      userId: 'user-1',
      title: 'Later',
      content: 'Read this later',
      openAt: '2026-05-10T00:00:00.000Z',
      openedAt: undefined,
      createdAt: '2026-04-29T00:00:00.000Z',
      updatedAt: '2026-04-29T00:00:00.000Z',
      status: 'scheduled',
    } as any);

    await expect(
      futureLetterService.open('letter-1', new Date('2026-04-29T12:00:00.000Z')),
    ).rejects.toThrow('LETTER_LOCKED_UNTIL_OPEN_DATE');

    expect(mockFutureLetterFetch).toHaveBeenCalledWith('user-1', 'letter-1');
  });

  it('marks an openable letter as opened and records a content-free ritual event', async () => {
    mockFutureLetterFetch.mockResolvedValue({
      id: 'letter-1',
      userId: 'user-1',
      title: 'Today',
      content: 'A private note to myself',
      openAt: '2026-04-20T00:00:00.000Z',
      openedAt: undefined,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
      status: 'scheduled',
    } as any);

    mockFutureLetterUpdate.mockResolvedValue({
      id: 'letter-1',
      userId: 'user-1',
      title: 'Today',
      content: 'A private note to myself',
      openAt: '2026-04-20T00:00:00.000Z',
      openedAt: '2026-04-29T12:00:00.000Z',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-29T12:00:00.000Z',
      status: 'opened',
    } as any);

    mockRitualInsert.mockResolvedValue({
      id: 'event-1',
      userId: 'user-1',
      eventType: 'letter_opened',
      sourceId: 'letter-1',
      createdAt: '2026-04-29T12:00:00.000Z',
    } as any);

    const letter = await futureLetterService.open('letter-1', new Date('2026-04-29T12:00:00.000Z'));

    expect(letter.status).toBe('opened');
    expect(mockFutureLetterUpdate).toHaveBeenCalledWith(
      'user-1',
      'letter-1',
      'opened',
      '2026-04-29T12:00:00.000Z'
    );
    expect(mockRitualInsert).toHaveBeenCalledWith('user-1', 'letter_opened', 'letter-1');
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
    mockRitualInsert.mockResolvedValue({
      id: 'event-1',
      userId: 'user-1',
      eventType: 'release_completed',
      sourceId: undefined,
      createdAt: '2026-04-29T12:00:00.000Z',
    } as any);

    await ritualEventService.recordReleaseCompleted();

    expect(mockRitualInsert).toHaveBeenCalledWith('user-1', 'release_completed', undefined);
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
    mockReferralAccept.mockResolvedValue(true);

    await expect(referralService.recordAcceptedReferral(fakeStorage)).resolves.toBe(true);

    expect(mockReferralAccept).toHaveBeenCalledWith('friend-code');
    expect(fakeStorage.removeItem).toHaveBeenCalledWith('reflections.referral_code');
  });
});
