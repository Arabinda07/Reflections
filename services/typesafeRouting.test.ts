import { describe, expect, it } from 'vitest';
import {
  buildJevIngestDecisionRequest,
  evaluateJevIngestDecision,
  type IngestThemeCandidate,
} from './typesafeRouting';
import type { SystemOneResponse } from './typesafeTypes';

describe('typesafeRouting', () => {
  const themes: IngestThemeCandidate[] = [
    { id: 'theme-1', title: 'Creative Focus' },
    { id: 'theme-2', title: 'Evening Calm' },
  ];

  it('builds a valid Jev routing request with all options and none_of_these', () => {
    const request = buildJevIngestDecisionRequest(
      { title: 'Night Walk', content: 'Quiet walk under the stars', mood: 'Calm' },
      themes,
    );

    expect(request.model).toBe('jev-latest');
    const criteria = request.questions.route_decision.criteria;
    expect(criteria.skip).toBeDefined();
    expect(criteria.create_new).toBeDefined();
    expect(criteria['append_theme-1']).toBeDefined();
    expect(criteria['append_theme-2']).toBeDefined();
    expect(criteria.none_of_these).toBeDefined();
  });

  it('routes to append when Jev has high confidence for an existing theme', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        route_decision: {
          selected: 'append_theme-2',
          probabilities: {
            'append_theme-2': 0.88,
            'append_theme-1': 0.05,
            skip: 0.03,
            create_new: 0.02,
            none_of_these: 0.02,
          },
          confidence: 0.88,
        },
      },
      usage: { input_tokens: 80, output_tokens: 1 },
    };

    const result = evaluateJevIngestDecision(mockResponse, ['theme-1', 'theme-2']);
    expect(result).toEqual({
      action: 'append',
      themeId: 'theme-2',
      newThemeTitle: null,
      reasoning: 'jev_high_confidence_append',
    });
  });

  it('routes to skip when Jev has high confidence for skip', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        route_decision: {
          selected: 'skip',
          probabilities: {
            skip: 0.92,
            create_new: 0.03,
            'append_theme-1': 0.02,
            'append_theme-2': 0.01,
            none_of_these: 0.02,
          },
          confidence: 0.92,
        },
      },
      usage: { input_tokens: 80, output_tokens: 1 },
    };

    const result = evaluateJevIngestDecision(mockResponse, ['theme-1', 'theme-2']);
    expect(result).toEqual({
      action: 'skip',
      themeId: null,
      newThemeTitle: null,
      reasoning: 'jev_high_confidence_skip',
    });
  });

  it('escalates to Gemini (returns null) when create_new is selected', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        route_decision: {
          selected: 'create_new',
          probabilities: {
            create_new: 0.85,
            skip: 0.05,
            'append_theme-1': 0.05,
            'append_theme-2': 0.03,
            none_of_these: 0.02,
          },
          confidence: 0.85,
        },
      },
      usage: { input_tokens: 80, output_tokens: 1 },
    };

    // Needs title generation -> returns null so Gemini creates newThemeTitle
    const result = evaluateJevIngestDecision(mockResponse, ['theme-1', 'theme-2']);
    expect(result).toBeNull();
  });

  it('escalates to Gemini (returns null) on low confidence', () => {
    const mockResponse: SystemOneResponse = {
      model: 'jev-latest',
      answers: {
        route_decision: {
          selected: 'append_theme-1',
          probabilities: {
            'append_theme-1': 0.65,
            'append_theme-2': 0.20,
            skip: 0.10,
            create_new: 0.03,
            none_of_these: 0.02,
          },
          confidence: 0.65,
        },
      },
      usage: { input_tokens: 80, output_tokens: 1 },
    };

    const result = evaluateJevIngestDecision(mockResponse, ['theme-1', 'theme-2']);
    expect(result).toBeNull();
  });
});
