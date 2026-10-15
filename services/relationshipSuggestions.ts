import type {
  Note,
  RelationshipHook,
  RelationshipInteraction,
  RelationshipRecord,
  WeeklyRelationshipSuggestion,
} from '../types';
import { mentionedLine, noteMentionsPerson } from './relationshipWikiLink';

type NoteLike = Pick<Note, 'title' | 'content' | 'relationshipIds' | 'createdAt'>;

const DAY_MS = 86_400_000;
const DEFAULT_QUIET_DAYS = 90;

const latestInteraction = (relationship: RelationshipRecord) =>
  [...relationship.interactions].sort((left, right) => Date.parse(right.date) - Date.parse(left.date))[0];

const daysSince = (date?: string) => {
  if (!date) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - timestamp) / DAY_MS);
};

const startOfCurrentWeek = () => {
  const start = new Date();
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start.getTime();
};

/** Days until the next birthday (0 = today), or Infinity when unknown. */
export const daysUntilBirthday = (birthday: string | undefined, now = new Date()) => {
  const match = birthday?.match(/(\d{2})-(\d{2})$/);
  if (!match) return Number.POSITIVE_INFINITY;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return Number.POSITIVE_INFINITY;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month, day);
  return Math.round((next.getTime() - today.getTime()) / DAY_MS);
};

const birthdayPhrase = (days: number) => {
  if (days === 0) return 'Birthday today.';
  if (days === 1) return 'Birthday tomorrow.';
  return `Birthday in ${days} days.`;
};

const sinceTogetherPhrase = (days: number) => {
  if (days < 14) return 'a little while';
  if (days < 60) return `about ${Math.round(days / 7)} weeks`;
  return `about ${Math.round(days / 30)} months`;
};

const lastWriting = (relationship: RelationshipRecord, notes: NoteLike[]) => {
  const note = notes
    .filter((candidate) => noteMentionsPerson(candidate, relationship))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
  return note ? { at: note.createdAt, line: mentionedLine(note, relationship) } : undefined;
};

export const buildWeeklyRelationshipSuggestions = (
  relationships: RelationshipRecord[],
  notes: NoteLike[] = [],
): WeeklyRelationshipSuggestion[] => relationships
  .filter((relationship) => relationship.stage !== 'archived')
  .filter((relationship) => !relationship.lastTendedAt || Date.parse(relationship.lastTendedAt) < startOfCurrentWeek())
  .map((relationship) => {
    const hook: RelationshipHook | undefined = relationship.hooks.find((item) => !item.used && item.description.trim());
    const openCare = relationship.nextCare.find((care) => care.status === 'open');
    const last: RelationshipInteraction | undefined = latestInteraction(relationship);
    const lastContactGap = Math.min(daysSince(last?.date), daysSince(relationship.lastTendedAt));
    const quietAfterDays = relationship.cadenceWeeks ? relationship.cadenceWeeks * 7 : DEFAULT_QUIET_DAYS;
    const isDue = lastContactGap !== Number.POSITIVE_INFINITY && lastContactGap >= quietAfterDays;
    const birthdayIn = daysUntilBirthday(relationship.birthday);
    const birthdaySoon = birthdayIn <= 7;
    const writing = lastWriting(relationship, notes);
    const wroteRecently = daysSince(writing?.at) <= 14;
    const isEarlyForRhythm = Boolean(relationship.cadenceWeeks) && !isDue && lastContactGap !== Number.POSITIVE_INFINITY;

    const score =
      (birthdaySoon ? 60 - birthdayIn : 0) +
      (openCare ? 30 : 0) +
      (hook ? 20 : 0) +
      (isDue ? 25 : 0) +
      (wroteRecently ? 8 : 0) -
      (isEarlyForRhythm && !birthdaySoon && !openCare ? 20 : 0) +
      Math.min(lastContactGap === Number.POSITIVE_INFINITY ? 18 : lastContactGap / 7, 18);

    // The writer's own words come first; generic copy is the last resort.
    const reason =
      (birthdaySoon && birthdayPhrase(birthdayIn)) ||
      (hook && `“${hook.description}”`) ||
      (writing?.line && `You wrote: “${writing.line}”`) ||
      (isDue && `It’s been ${sinceTogetherPhrase(lastContactGap)}.`) ||
      (!last ? 'Someone you want to keep close.' : 'Someone on your mind.');

    const suggestedCare =
      openCare?.label ||
      (birthdaySoon && 'Send a birthday note.') ||
      (hook && 'Ask them about it.') ||
      'Send a no-pressure hello.';

    return {
      relationship,
      reason,
      suggestedHook: hook,
      lastInteraction: last,
      suggestedCare,
      lastWrittenAt: writing?.at,
      score,
    };
  })
  .sort((left, right) => right.score - left.score)
  .slice(0, 5)
  .map(({ score: _score, ...suggestion }) => suggestion);

/** Router state that opens a fresh page already about this person. */
export const writeAboutState = (person: Pick<RelationshipRecord, 'id' | 'name'>) => ({
  relationshipIds: [person.id],
  initialPrompt: `What's on your mind about ${person.name.trim().split(/\s+/)[0]}?`,
});
