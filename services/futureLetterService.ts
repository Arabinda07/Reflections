import type { FutureLetter } from '../types';
import { getAuthenticatedUser } from './authUtils';
import { futureLetterRemoteStore } from './futureLetterRemoteStore';
import { ritualEventService } from './ritualService';

interface FutureLetterInput {
  title: string;
  content: string;
  openAt: string;
}

const formatOpenDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

export type FutureLetterOpenState = {
  letter: FutureLetter;
  state: 'locked' | 'openable' | 'opened';
  actionLabel: string;
};

export const getFutureLetterOpenState = (
  letter: FutureLetter,
  now = new Date(),
): FutureLetterOpenState => {
  if (letter.status === 'opened') {
    return {
      letter,
      state: 'opened',
      actionLabel: 'Read again',
    };
  }

  const openDate = new Date(letter.openAt);
  if (openDate > now) {
    return {
      letter,
      state: 'locked',
      actionLabel: `Locked until ${formatOpenDate(openDate)}`,
    };
  }

  return {
    letter,
    state: 'openable',
    actionLabel: 'Open letter',
  };
};

export const futureLetterService = {
  create: async (input: FutureLetterInput): Promise<FutureLetter> => {
    const user = await getAuthenticatedUser();
    const letter = await futureLetterRemoteStore.insert(user.id, input.title, input.content, input.openAt);
    await ritualEventService.record('letter_scheduled', { sourceId: letter.id });
    return letter;
  },

  list: async (): Promise<FutureLetter[]> => {
    const user = await getAuthenticatedUser();
    return futureLetterRemoteStore.list(user.id);
  },

  open: async (id: string, now = new Date()): Promise<FutureLetter> => {
    const user = await getAuthenticatedUser();
    const letter = await futureLetterRemoteStore.fetchById(user.id, id);

    if (new Date(letter.openAt) > now) {
      throw new Error('LETTER_LOCKED_UNTIL_OPEN_DATE');
    }

    if (letter.status === 'opened') {
      return letter;
    }

    const openedAt = now.toISOString();
    const openedLetter = await futureLetterRemoteStore.updateStatus(user.id, id, 'opened', openedAt);
    await ritualEventService.record('letter_opened', { sourceId: id });
    return openedLetter;
  },
};
