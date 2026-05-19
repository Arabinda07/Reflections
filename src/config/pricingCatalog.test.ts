import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRO_PLAN,
  PRO_PRICING_PLANS,
  PRO_TRIAL_DAYS,
  getTrialEndsAt,
  isBillingPeriod,
} from './pricingCatalog';

describe('Pro pricing catalog', () => {
  it('keeps Pro pricing to weekly and monthly plans with weekly selected by default', () => {
    expect(Object.keys(PRO_PRICING_PLANS)).toEqual(['weekly', 'monthly']);
    expect(DEFAULT_PRO_PLAN).toBe('weekly');
    expect(PRO_TRIAL_DAYS).toBe(3);

    expect(PRO_PRICING_PLANS.weekly).toMatchObject({
      code: 'weekly',
      displayName: 'Weekly Pro',
      displayPrice: '₹49',
      intervalLabel: 'week',
      trialEligible: true,
    });

    expect(PRO_PRICING_PLANS.monthly).toMatchObject({
      code: 'monthly',
      displayName: 'Monthly Pro',
      displayPrice: '₹149',
      intervalLabel: 'month',
      trialEligible: true,
    });
  });

  it('rejects yearly billing and calculates a provider-backed trial end date', () => {
    expect(isBillingPeriod('weekly')).toBe(true);
    expect(isBillingPeriod('monthly')).toBe(true);
    expect(isBillingPeriod('yearly')).toBe(false);

    expect(getTrialEndsAt(new Date('2026-05-19T00:00:00.000Z')).toISOString()).toBe(
      '2026-05-22T00:00:00.000Z',
    );
  });
});
