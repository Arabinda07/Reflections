import crypto from 'crypto';
import { normalizeNewsletterOptIn } from '../src/newsletter';
import {
  HttpError,
  createSupabaseAdminClient,
  createSupabaseAuthClient,
  getErrorMessage,
  getErrorStatusCode,
  parseJsonBody,
  requireUser,
  sendJson,
  timingSafeEqualHex,
} from '../server/apiUtils';

type VerifyPaymentRequest = {
  newsletterOptIn?: unknown;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  razorpay_subscription_id?: string;
};

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const supabaseAuth = createSupabaseAuthClient();

const verifyCheckoutSignature = (paymentId: string, subscriptionId: string, signature: string) => {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay secret is missing in environment variables');
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');

  if (!timingSafeEqualHex(expected, signature)) {
    throw new HttpError(400, 'Invalid payment signature');
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const user = await requireUser(supabaseAuth, req.headers?.authorization);
    const body = await parseJsonBody<VerifyPaymentRequest>(req);
    const {
      newsletterOptIn,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return sendJson(res, 400, { error: 'Missing payment verification details' });
    }

    verifyCheckoutSignature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature);

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: subscriptionRecord, error: lookupError } = await supabaseAdmin
      .from('razorpay_subscriptions')
      .select('id, user_id')
      .eq('razorpay_subscription_id', razorpay_subscription_id)
      .eq('user_id', user.id)
      .single();

    if (lookupError || !subscriptionRecord) {
      throw new HttpError(403, 'Subscription does not belong to the authenticated user');
    }

    const { error: updateError } = await supabaseAdmin
      .from('razorpay_subscriptions')
      .update({
        checkout_signature_verified_at: new Date().toISOString(),
        last_payment_id: razorpay_payment_id,
        newsletter_opt_in: normalizeNewsletterOptIn(newsletterOptIn),
        status: 'checkout_verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionRecord.id);

    if (updateError) {
      throw new Error(`Failed to record checkout verification: ${updateError.message}`);
    }

    return sendJson(res, 200, {
      ok: true,
      message: 'Payment verified. Pro access activates after Razorpay webhook confirmation.',
    });
  } catch (error: unknown) {
    console.error('Payment verification error:', getErrorMessage(error));
    return sendJson(res, getErrorStatusCode(error), {
      error: getErrorMessage(error, 'Failed to verify payment'),
    });
  }
}
