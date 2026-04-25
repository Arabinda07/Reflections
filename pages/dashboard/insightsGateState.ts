import { RoutePath, type WikiInsightsGate } from '../../types';

export type InsightsWikiState = 
  | { kind: 'zero_entries'; title: string; ctaLabel: string; ctaRoute: string }
  | { kind: 'few_entries'; title: string }
  | { kind: 'no_pages_can_generate'; title: string; ctaLabel: string }
  | { kind: 'no_pages_locked'; title: string; ctaLabel: string; ctaRoute: string }
  | { kind: 'has_pages'; title: string; canRefresh: boolean; showUpgradeBanner: boolean };

export const getInsightsWikiState = (
  entryCount: number,
  pageCount: number,
  gate: WikiInsightsGate
): InsightsWikiState => {
  const commonTitle = 'Your wiki is being built on less than 3 entries';

  if (entryCount === 0) {
    return {
      kind: 'zero_entries',
      title: commonTitle,
      ctaLabel: 'Write your first entry',
      ctaRoute: RoutePath.CREATE_NOTE,
    };
  }

  if (entryCount < 3) {
    return {
      kind: 'few_entries',
      title: commonTitle,
    };
  }

  if (pageCount === 0) {
    if (gate.canGenerate) {
      return {
        kind: 'no_pages_can_generate',
        title: 'Your wiki is ready for insights',
        ctaLabel: 'Refresh with AI',
      };
    }
    return {
      kind: 'no_pages_locked',
      title: 'Your wiki is ready for insights',
      ctaLabel: 'See Pro options',
      ctaRoute: RoutePath.ACCOUNT,
    };
  }

  return {
    kind: 'has_pages',
    title: commonTitle,
    canRefresh: gate.canGenerate,
    showUpgradeBanner: gate.requiresUpgrade,
  };
};
