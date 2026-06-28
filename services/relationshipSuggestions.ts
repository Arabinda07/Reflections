import type { RelationshipHook, RelationshipInteraction, RelationshipRecord, WeeklyRelationshipSuggestion } from '../types';

const latestInteraction = (relationship: RelationshipRecord) =>
  [...relationship.interactions].sort((left, right) => Date.parse(right.date) - Date.parse(left.date))[0];

const daysSince = (date?: string) => {
  if (!date) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - timestamp) / 86_400_000);
};

const startOfCurrentWeek = () => {
  const start = new Date();
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start.getTime();
};

const suggestedCare = (relationship: RelationshipRecord, hook: RelationshipHook | undefined, isDormant: boolean) => {
  const openCare = relationship.nextCare.find((care) => care.status === 'open');
  if (openCare) return openCare.label;
  if (hook) return 'Message them about it.';
  if (isDormant) return 'Send a no-pressure hello.';
  return 'Share something they’d appreciate.';
};

const reason = (last: RelationshipInteraction | undefined, hook: RelationshipHook | undefined, isDormant: boolean) => {
  if (hook) return 'You’ve got a real reason to reach out.';
  if (!last) return 'You haven’t talked yet — a good time to start.';
  if (isDormant) return `Quiet for ${daysSince(last.date)} days — worth a hello.`;
  return 'Worth keeping close this week.';
};

export const buildWeeklyRelationshipSuggestions = (
  relationships: RelationshipRecord[],
): WeeklyRelationshipSuggestion[] => relationships
  .filter((relationship) => relationship.stage !== 'archived')
  .filter((relationship) => !relationship.lastTendedAt || Date.parse(relationship.lastTendedAt) < startOfCurrentWeek())
  .map((relationship) => {
    const hook = relationship.hooks.find((item) => !item.used);
    const last = latestInteraction(relationship);
    const gap = daysSince(last?.date);
    const isDormant = Boolean(last) && gap > 90;
    const score =
      (isDormant ? 25 : 0) +
      (hook ? 20 : 0) +
      Math.min(gap === Number.POSITIVE_INFINITY ? 18 : gap / 7, 18);

    return {
      relationship,
      reason: reason(last, hook, isDormant),
      suggestedHook: hook,
      lastInteraction: last,
      suggestedCare: suggestedCare(relationship, hook, isDormant),
      score,
    };
  })
  .sort((left, right) => right.score - left.score)
  .slice(0, 5)
  .map(({ score: _score, ...suggestion }) => suggestion);
