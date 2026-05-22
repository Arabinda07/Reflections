import type { LifeWikiRunEventRecord } from '../../services/aiRunClient';

const REVIEW_LABELS = {
  review_approved: { label: 'Review approved', tone: 'green' },
  review_revised: { label: 'Revision applied', tone: 'clay' },
  review_rejected: { label: 'Review blocked update', tone: 'clay' },
} as const;

type ReviewEventType = keyof typeof REVIEW_LABELS;

const isReviewEventType = (eventType: string): eventType is ReviewEventType =>
  eventType in REVIEW_LABELS;

const formatSourceLabel = (sourceCount: number) =>
  `${sourceCount} source${sourceCount === 1 ? '' : 's'} visible`;

export const getLifeWikiReviewSummary = (
  events: LifeWikiRunEventRecord[],
  pageType: string,
  sourceCount: number,
) => {
  const latestReview = events
    .filter((event) => event.page_type === pageType && isReviewEventType(event.event_type))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

  if (!latestReview || !isReviewEventType(latestReview.event_type)) {
    return {
      label: 'No review event loaded',
      sourceLabel: formatSourceLabel(sourceCount),
      reviewedAtLabel: null,
      tone: 'neutral' as const,
    };
  }

  const copy = REVIEW_LABELS[latestReview.event_type];
  return {
    label: copy.label,
    sourceLabel: formatSourceLabel(sourceCount),
    reviewedAtLabel: new Date(latestReview.created_at).toLocaleString(),
    tone: copy.tone,
  };
};
