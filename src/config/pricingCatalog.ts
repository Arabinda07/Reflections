export type BillingPeriod = 'weekly' | 'monthly';

export interface ProPricingPlan {
  code: BillingPeriod;
  displayName: string;
  shortName: string;
  displayPrice: string;
  amountInr: number;
  intervalLabel: 'week' | 'month';
  renewalLabel: string;
  razorpayEnvKey: 'RAZORPAY_WEEKLY_PLAN_ID' | 'RAZORPAY_MONTHLY_PLAN_ID';
  totalCount: number;
  trialEligible: boolean;
  ctaLabel: string;
}

export const PRO_TRIAL_DAYS = 3;
export const DEFAULT_PRO_PLAN: BillingPeriod = 'weekly';

export const PRO_PRICING_PLANS: Record<BillingPeriod, ProPricingPlan> = {
  weekly: {
    code: 'weekly',
    displayName: 'Weekly Pro',
    shortName: 'Weekly',
    displayPrice: '₹49',
    amountInr: 49,
    intervalLabel: 'week',
    renewalLabel: 'Renews weekly after trial',
    razorpayEnvKey: 'RAZORPAY_WEEKLY_PLAN_ID',
    totalCount: 520,
    trialEligible: true,
    ctaLabel: 'Start my free trial',
  },
  monthly: {
    code: 'monthly',
    displayName: 'Monthly Pro',
    shortName: 'Monthly',
    displayPrice: '₹149',
    amountInr: 149,
    intervalLabel: 'month',
    renewalLabel: 'Renews monthly after trial',
    razorpayEnvKey: 'RAZORPAY_MONTHLY_PLAN_ID',
    totalCount: 120,
    trialEligible: true,
    ctaLabel: 'Try monthly Pro',
  },
};

export const PRO_PRICING_PLAN_LIST = [
  PRO_PRICING_PLANS.weekly,
  PRO_PRICING_PLANS.monthly,
] as const;

export const isBillingPeriod = (value: unknown): value is BillingPeriod =>
  value === 'weekly' || value === 'monthly';

export const getTrialEndsAt = (baseDate = new Date()) => {
  const trialEndsAt = new Date(baseDate);
  trialEndsAt.setDate(trialEndsAt.getDate() + PRO_TRIAL_DAYS);
  return trialEndsAt;
};

export const getTrialChargeDateLabel = (baseDate = new Date()) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(getTrialEndsAt(baseDate));
