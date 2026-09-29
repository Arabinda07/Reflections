import { describe, expect, it } from 'vitest';
import { parseLifeWikiReviewResult } from './aiOutputReview';

describe('parseLifeWikiReviewResult', () => {
  it('parses a schema-shaped review', () => {
    expect(
      parseLifeWikiReviewResult('{"status":"revise","reasons":["missing source"],"revisedContent":" fixed "}'),
    ).toEqual({ status: 'revise', reasons: ['missing source'], revisedContent: 'fixed' });
  });

  it('rejects an unknown status', () => {
    expect(parseLifeWikiReviewResult('{"status":"maybe","reasons":[]}').status).toBe('reject');
  });

  it('rejects unparseable output', () => {
    expect(parseLifeWikiReviewResult('not json')).toEqual({
      status: 'reject',
      reasons: ['review_parse_failed'],
    });
  });
});
