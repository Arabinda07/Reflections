import type {
  MoodCheckin,
  Note,
  RitualEvent,
  WeeklyRecap,
  WritingRhythm,
} from '../types';

interface WeeklyRecapInput {
  notes: Note[];
  moodCheckins: MoodCheckin[];
  ritualEvents: RitualEvent[];
  now?: Date;
}

const rhythmEventTypes = new Set<RitualEvent['eventType']>([
  'release_completed',
  'letter_scheduled',
  'letter_opened',
]);

const pad = (value: number) => String(value).padStart(2, '0');

const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfLocalWeek = (now: Date) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const isInRange = (isoDate: string, start: Date, endExclusive: Date) => {
  const date = new Date(isoDate);
  return date >= start && date < endExclusive;
};

const countBy = (values: string[]) =>
  values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

const topEntries = (counts: Record<string, number>, limit: number) =>
  Object.entries(counts)
    .sort(([aKey, aValue], [bKey, bValue]) => bValue - aValue || aKey.localeCompare(bKey))
    .slice(0, limit);

const getWeekData = ({ notes, moodCheckins, ritualEvents, now = new Date() }: WeeklyRecapInput) => {
  const start = startOfLocalWeek(now);
  const endExclusive = addDays(start, 7);
  const endInclusive = addDays(start, 6);

  return {
    start,
    endExclusive,
    weekStart: toLocalDateKey(start),
    weekEnd: toLocalDateKey(endInclusive),
    weekNotes: notes.filter((note) => isInRange(note.createdAt, start, endExclusive)),
    weekCheckins: moodCheckins.filter((checkin) => isInRange(checkin.createdAt, start, endExclusive)),
    weekEvents: ritualEvents.filter((event) => isInRange(event.createdAt, start, endExclusive)),
  };
};

const getActivityDays = (input: WeeklyRecapInput) => {
  const { start, endExclusive } = getWeekData(input);
  const days = new Set<string>();

  input.notes
    .filter((note) => isInRange(note.createdAt, start, endExclusive))
    .forEach((note) => days.add(toLocalDateKey(new Date(note.createdAt))));

  input.moodCheckins
    .filter((checkin) => isInRange(checkin.createdAt, start, endExclusive))
    .forEach((checkin) => days.add(toLocalDateKey(new Date(checkin.createdAt))));

  input.ritualEvents
    .filter((event) => rhythmEventTypes.has(event.eventType))
    .filter((event) => isInRange(event.createdAt, start, endExclusive))
    .forEach((event) => days.add(toLocalDateKey(new Date(event.createdAt))));

  return Array.from(days).sort();
};

export function buildWeeklyRecap(input: WeeklyRecapInput): WeeklyRecap {
  const { weekStart, weekEnd, weekNotes, weekCheckins, weekEvents } = getWeekData(input);
  const activityDays = getActivityDays(input);
  const moodSource = weekCheckins.length
    ? weekCheckins.map((checkin) => checkin.mood)
    : weekNotes.map((note) => note.mood || '');
  const moodData = topEntries(countBy(moodSource.filter(Boolean)), 8)
    .map(([name, value]) => ({ name, value }));
  const recurringTags = topEntries(countBy(weekNotes.flatMap((note) => note.tags || [])), 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    weekStart,
    weekEnd,
    writingDays: activityDays.length,
    reflectionsSaved: weekNotes.length,
    moodCheckins: weekCheckins.length,
    releaseMoments: weekEvents.filter((event) => event.eventType === 'release_completed').length,
    lettersScheduled: weekEvents.filter((event) => event.eventType === 'letter_scheduled').length,
    lettersOpened: weekEvents.filter((event) => event.eventType === 'letter_opened').length,
    moodData,
    recurringTags,
    activityDays,
  };
}

export function getWritingRhythm(input: WeeklyRecapInput): WritingRhythm {
  const activityDays = getActivityDays(input);
  const today = toLocalDateKey(input.now || new Date());
  const showedUpToday = activityDays.includes(today);
  const daysThisWeek = activityDays.length;

  let message = 'Welcome back. Today counts.';
  if (showedUpToday) {
    message = 'You showed up today.';
  } else if (daysThisWeek === 1) {
    message = 'You returned 1 day this week.';
  } else if (daysThisWeek > 1) {
    message = `You returned ${daysThisWeek} days this week.`;
  }

  return {
    daysThisWeek,
    showedUpToday,
    activityDays,
    message,
  };
}
