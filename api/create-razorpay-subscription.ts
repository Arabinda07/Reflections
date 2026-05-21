import Razorpay from 'razorpay';
import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
  getErrorMessage,
  getErrorStatusCode,
  parseJsonBody,
  requireUser,
  sendJson,
} from '../server/apiUtils.js';
import {
  DEFAULT_PRO_PLAN,
  PRO_PRICING_PLANS,
  PRO_TRIAL_DAYS,
  getTrialEndsAt,
  isBillingPeriod,
  type BillingPeriod,
} from '../src/config/pricingCatalog.js';

type CreateSubscriptionRequest = {
  billingPeriod?: BillingPeriod;
};

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const RAZORPAY_PLAN_IDS: Record<BillingPeriod, string> = {
  weekly: process.env.RAZORPAY_WEEKLY_PLAN_ID || '',
  monthly: process.env.RAZORPAY_MONTHLY_PLAN_ID || '',
};

const SUBSCRIPTION_TOTAL_COUNT: Record<BillingPeriod, number> = {
  weekly: PRO_PRICING_PLANS.weekly.totalCount,
  monthly: PRO_PRICING_PLANS.monthly.totalCount,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const supabaseAuth = createSupabaseAuthClient();
    const user = await requireUser(supabaseAuth, req.headers?.authorization);
    const body = await parseJsonBody<CreateSubscriptionRequest>(req);
    const billingPeriod = body.billingPeriod || DEFAULT_PRO_PLAN;

    if (!isBillingPeriod(billingPeriod)) {
      return sendJson(res, 400, { error: 'Invalid billing period' });
    }

    const planId = RAZORPAY_PLAN_IDS[billingPeriod];
    if (!planId) {
      return sendJson(res, 500, { error: 'Razorpay plan is not configured' });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys are missing in environment variables');
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const trialEndsAt = getTrialEndsAt();
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: SUBSCRIPTION_TOTAL_COUNT[billingPeriod],
      customer_notify: 1,
      start_at: Math.floor(trialEndsAt.getTime() / 1000),
      notes: {
        billingPeriod,
        trialDays: String(PRO_TRIAL_DAYS),
        userId: user.id,
      },
    });

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('razorpay_subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan_code: billingPeriod,
          razorpay_plan_id: planId,
          razorpay_subscription_id: subscription.id,
          status: subscription.status || 'created',
          metadata: { subscription, trialEndsAt: trialEndsAt.toISOString() },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'razorpay_subscription_id' },
      );

    if (error) {
      throw new Error(`Failed to record subscription: ${error.message}`);
    }

    return sendJson(res, 200, {
      ok: true,
      keyId: RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (error: unknown) {
    console.error('Razorpay subscription error:', getErrorMessage(error));
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'Failed to create subscription'),
    });
  }
}
