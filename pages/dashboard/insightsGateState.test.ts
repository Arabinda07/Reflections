import { describe, expect, it } from 'vitest';
import { RoutePath, type WikiInsightsGate } from '../../types';
import { getInsightsWikiState } from './insightsGateState';

const freeGate: WikiInsightsGate = {
  canGenerate: true,
  remainingFreeGenerations: 1,
  requiresUpgrade: false,
};

describe('getInsightsWikiState', () => {
  it('returns the zero entries state', () => {
    expect(getInsightsWikiState(0, 0, freeGate)).toEqual({
      kind: 'zero_entries',
      title: 'Your wiki is being built on less than 3 entries',
      ctaLabel: 'Write your first entry',
      ctaRoute: RoutePath.CREATE_NOTE,
    });
  });

  it('returns the 1-2 entries state', () => {
    expect(getInsightsWikiState(2, 0, freeGate)).toEqual({
      kind: 'few_entries',
      title: 'Your wiki is being built on less than 3 entries',
    });
  });

  it('returns the no pages free generation available state', () => {
    expect(getInsightsWikiState(3, 0, freeGate)).toEqual({
      kind: 'no_pages_can_generate',
      title: 'Your wiki is ready for insights',
      ctaLabel: 'Refresh with AI',
    });
  });

  it('returns the no pages free generation exhausted state', () => {
    const lockedGate: WikiInsightsGate = {
      canGenerate: false,
      remainingFreeGenerations: 0,
      requiresUpgrade: true,
    };

    expect(getInsightsWikiState(3, 0, lockedGate)).toEqual({
      kind: 'no_pages_locked',
      title: 'Your wiki is ready for insights',
      ctaLabel: 'See Pro options',
      ctaRoute: RoutePath.ACCOUNT,
    });
  });

  it('returns the has pages state', () => {
    const lockedGate: WikiInsightsGate = {
      canGenerate: false,
      remainingFreeGenerations: 0,
      requiresUpgrade: true,
    };

    expect(getInsightsWikiState(5, 4, lockedGate)).toEqual({
      kind: 'has_pages',
      title: 'Your wiki is being built on less than 3 entries',
      canRefresh: false,
      showUpgradeBanner: true,
    });
  });
});
