import { describe, expect, it } from 'vitest';
import type { LifeWikiRunEventRecord } from '../../services/aiRunClient';
import { getLifeWikiReviewSummary } from './lifeWikiReviewSummary';

const event = (
  eventType: LifeWikiRunEventRecord['event_type'],
  createdAt: string,
): LifeWikiRunEventRecord => ({
  id: `${eventType}-${createdAt}`,
  run_id: 'run-1',
  event_type: eventType,
  page_type: 'people',
  status: 'succeeded',
  message: null,
  metadata: null,
  created_at: createdAt,
});

describe('getLifeWikiReviewSummary', () => {
  it('reports approved review state from review events', () => {
    expect(getLifeWikiReviewSummary([event('review_approved', '2026-05-01T10:00:00.000Z')], 'people', 2)).toMatchObject({
      label: 'Review approved',
      sourceLabel: '2 sources visible',
      tone: 'green',
    });
  });

  it('reports revised review state', () => {
    expect(getLifeWikiReviewSummary([event('review_revised', '2026-05-01T10:00:00.000Z')], 'people', 1)).toMatchObject({
      label: 'Revision applied',
      sourceLabel: '1 source visible',
      tone: 'clay',
    });
  });

  it('reports rejected review state', () => {
    expect(getLifeWikiReviewSummary([event('review_rejected', '2026-05-01T10:00:00.000Z')], 'people', 0)).toMatchObject({
      label: 'Review blocked update',
      sourceLabel: '0 sources visible',
      tone: 'clay',
    });
  });

  it('reports missing loaded review event without claiming success', () => {
    expect(getLifeWikiReviewSummary([], 'people', 3)).toMatchObject({
      label: 'No review event loaded',
      sourceLabel: '3 sources visible',
      tone: 'neutral',
    });
  });

  it('uses the newest matching review event', () => {
    const summary = getLifeWikiReviewSummary([
      event('review_approved', '2026-05-01T10:00:00.000Z'),
      event('review_revised', '2026-05-01T11:00:00.000Z'),
    ], 'people', 4);

    expect(summary.label).toBe('Revision applied');
  });
});
