import crypto from 'crypto';
import {
  HttpError,
  createSupabaseAdminClient,
  getErrorMessage,
  getErrorStatusCode,
  readRawBody,
  sendJson,
  timingSafeEqualHex,
} from '../server/apiUtils';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        current_end?: number;
        status?: string;
      };
    };
    payment?: {
      entity?: {
        id?: string;
      };
    };
  };
};

const ACTIVE_EVENTS = new Set([
  'subscription.activated',
  'subscription.authenticated',
  'subscription.charged',
]);

const INACTIVE_EVENTS = new Set([
  'subscription.cancelled',
  'subscription.completed',
  'subscription.expired',
  'subscription.halted',
  'subscription.paused',
]);

const verifyWebhookSignature = (rawBody: string, signature: string | undefined) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Razorpay webhook secret is not configured');
  }

  if (!signature) {
    throw new HttpError(400, 'Missing Razorpay webhook signature');
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!timingSafeEqualHex(expected, signature)) {
    throw new HttpError(400, 'Invalid Razorpay webhook signature');
  }
};

const toIsoFromUnixSeconds = (value?: number) =>
  typeof value === 'number' ? new Date(value * 1000).toISOString() : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const rawBody = await readRawBody(req, 500_000);
    verifyWebhookSignature(rawBody, req.headers?.['x-razorpay-signature']);

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    const eventName = event.event || '';
    const subscription = event.payload?.subscription?.entity;
    const subscriptionId = subscription?.id;

    if (!subscriptionId) {
      return sendJson(res, 200, { ok: true, ignored: true });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: record, error: lookupError } = await supabaseAdmin
      .from('razorpay_subscriptions')
      .select('id, user_id, plan_code')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (lookupError || !record) {
      throw new HttpError(404, 'Subscription record not found');
    }

    const currentPeriodEnd = toIsoFromUnixSeconds(subscription?.current_end);
    const status = subscription?.status || eventName;
    const lastPaymentId = event.payload?.payment?.entity?.id || null;

    const { error: subscriptionUpdateError } = await supabaseAdmin
      .from('razorpay_subscriptions')
      .update({
        current_period_end: currentPeriodEnd,
        last_payment_id: lastPaymentId,
        last_webhook_event: eventName,
        metadata: event,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    if (subscriptionUpdateError) {
      throw new Error(`Failed to update subscription record: ${subscriptionUpdateError.message}`);
    }

    if (ACTIVE_EVENTS.has(eventName) || INACTIVE_EVENTS.has(eventName)) {
      const plan = ACTIVE_EVENTS.has(eventName) ? 'pro' : 'free';
      const { error: entitlementError } = await supabaseAdmin
        .from('account_entitlements')
        .upsert(
          {
            current_period_end: currentPeriodEnd,
            plan,
            pro_status: status,
            razorpay_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
            user_id: record.user_id,
          },
          { onConflict: 'user_id' },
        );

      if (entitlementError) {
        throw new Error(`Failed to update account entitlement: ${entitlementError.message}`);
      }
    }

    return sendJson(res, 200, { ok: true });
  } catch (error: unknown) {
    console.error('Razorpay webhook error:', getErrorMessage(error));
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'Webhook handling failed'),
    });
  }
}
