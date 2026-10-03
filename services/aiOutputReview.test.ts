import { describe, expect, it } from 'vitest';
import {
  buildJevWikiReviewRequest,
  evaluateJevWikiReview,
  parseLifeWikiReviewResult,
  type LifeWikiReviewInput,
} from './aiOutputReview';
import type { SystemOneResponse } from './typesafeTypes';

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

describe('Jev Wiki Review integration', () => {
  const sampleInput: LifeWikiReviewInput = {
    pageType: 'patterns',
    title: 'Patterns',
    content: 'Draft content [Source: note-1]',
    allowedSourceIds: ['note-1'],
  };

  it('builds a valid Jev review request shape', () => {
    const request = buildJevWikiReviewRequest(sampleInput);
    expect(request.model).toBe('jev-latest');
    expect(request.questions.review_status).toBeDefined();
    expect(request.questions.has_clinical_labels).toBeDefined();
    expect((request.state as any).allowed_source_ids).toEqual(['note-1']);
  });

  it('approves when Jev gives high approval probability and low clinical risk', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        review_status: {
          selected: 'approve',
          probabilities: { approve: 0.94, revise: 0.04, reject: 0.01, none_of_these: 0.01 },
          confidence: 0.94,
        },
        has_clinical_labels: {
          probability: 0.02,
        },
      },
      usage: { input_tokens: 120, output_tokens: 2 },
    };

    const result = evaluateJevWikiReview(mockResponse);
    expect(result).toEqual({
      status: 'approve',
      reasons: ['jev_grounded_and_safe'],
    });
  });

  it('escalates (returns null) when Jev suggests revise or is uncertain', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        review_status: {
          selected: 'revise',
          probabilities: { approve: 0.40, revise: 0.50, reject: 0.05, none_of_these: 0.05 },
          confidence: 0.50,
        },
        has_clinical_labels: {
          probability: 0.05,
        },
      },
      usage: { input_tokens: 120, output_tokens: 2 },
    };

    const result = evaluateJevWikiReview(mockResponse);
    expect(result).toBeNull();
  });

  it('escalates (returns null) when approval probability is below threshold', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        review_status: {
          selected: 'approve',
          probabilities: { approve: 0.72, revise: 0.20, reject: 0.05, none_of_these: 0.03 },
          confidence: 0.72,
        },
        has_clinical_labels: {
          probability: 0.01,
        },
      },
      usage: { input_tokens: 120, output_tokens: 2 },
    };

    const result = evaluateJevWikiReview(mockResponse);
    expect(result).toBeNull();
  });

  it('escalates (returns null) when clinical probability is too high despite approval', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        review_status: {
          selected: 'approve',
          probabilities: { approve: 0.90, revise: 0.05, reject: 0.03, none_of_these: 0.02 },
          confidence: 0.90,
        },
        has_clinical_labels: {
          probability: 0.35, // High clinical label risk!
        },
      },
      usage: { input_tokens: 120, output_tokens: 2 },
    };

    const result = evaluateJevWikiReview(mockResponse);
    expect(result).toBeNull();
  });

  it('rejects when Jev is highly confident of rejection', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        review_status: {
          selected: 'reject',
          probabilities: { approve: 0.02, revise: 0.05, reject: 0.91, none_of_these: 0.02 },
          confidence: 0.91,
        },
        has_clinical_labels: {
          probability: 0.85,
        },
      },
      usage: { input_tokens: 120, output_tokens: 2 },
    };

    const result = evaluateJevWikiReview(mockResponse);
    expect(result).toEqual({
      status: 'reject',
      reasons: ['jev_unsupported_or_unsafe'],
    });
  });

  it('returns null on null or missing response', () => {
    expect(evaluateJevWikiReview(null)).toBeNull();
    expect(evaluateJevWikiReview(undefined)).toBeNull();
  });
});

