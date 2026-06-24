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

const suggestedCare = (relationship: RelationshipRecord, hook?: RelationshipHook) => {
  const openCare = relationship.nextCare.find((care) => care.status === 'open');
  if (openCare) return openCare.label;
  if (hook) return `Reach out around: ${hook.description}`;
  if (relationship.stage === 'dormant') return 'Send a warm check-in';
  return 'Notice one useful thing you can offer';
};

const reason = (relationship: RelationshipRecord, last?: RelationshipInteraction, hook?: RelationshipHook) => {
  if (relationship.stage === 'dormant') return 'Dormant relationship with enough context to revive gently.';
  if (hook) return 'Unused hook gives this outreach a human reason.';
  if (!last) return 'Seed relationship still needs first meaningful touchpoint.';
  const gap = daysSince(last.date);
  if (gap > 90) return `Quiet for ${gap} days; worth a small act of care.`;
  return 'Strong signal for this week based on closeness, energy, and opportunity.';
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
    const score =
      (relationship.stage === 'dormant' ? 25 : 0) +
      (hook ? 20 : 0) +
      Math.min(gap === Number.POSITIVE_INFINITY ? 18 : gap / 7, 18) +
      relationship.closeness * 2 +
      relationship.energy +
      relationship.opportunity;

    return {
      relationship,
      reason: reason(relationship, last, hook),
      suggestedHook: hook,
      lastInteraction: last,
      suggestedCare: suggestedCare(relationship, hook),
      score,
    };
  })
  .sort((left, right) => right.score - left.score)
  .slice(0, 5)
  .map(({ score: _score, ...suggestion }) => suggestion);
