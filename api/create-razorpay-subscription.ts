import Razorpay from 'razorpay';
import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
  getErrorMessage,
  getErrorStatusCode,
  parseJsonBody,
  requireUser,
  sendJson,
} from '../server/apiUtils';

type BillingPeriod = 'monthly' | 'yearly';

type CreateSubscriptionRequest = {
  billingPeriod?: BillingPeriod;
};

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const RAZORPAY_PLAN_IDS: Record<BillingPeriod, string> = {
  monthly: process.env.RAZORPAY_MONTHLY_PLAN_ID || '',
  yearly: process.env.RAZORPAY_YEARLY_PLAN_ID || '',
};

const SUBSCRIPTION_TOTAL_COUNT: Record<BillingPeriod, number> = {
  monthly: 120,
  yearly: 10,
};

const supabaseAuth = createSupabaseAuthClient();

const isBillingPeriod = (value: unknown): value is BillingPeriod =>
  value === 'monthly' || value === 'yearly';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const user = await requireUser(supabaseAuth, req.headers?.authorization);
    const body = await parseJsonBody<CreateSubscriptionRequest>(req);
    const billingPeriod = body.billingPeriod || 'monthly';

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

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: SUBSCRIPTION_TOTAL_COUNT[billingPeriod],
      customer_notify: 1,
      notes: {
        billingPeriod,
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
          metadata: { subscription },
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
    });
  } catch (error: unknown) {
    console.error('Razorpay subscription error:', getErrorMessage(error));
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'Failed to create subscription'),
    });
  }
}
