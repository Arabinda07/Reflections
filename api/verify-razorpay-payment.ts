import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { normalizeNewsletterOptIn } from '../src/newsletter';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// We use service role key here if available to ensure we can update the profile securely
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAuth = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const requireUser = async (authorization?: string) => {
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!token) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return data.user;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const user = await requireUser(req.headers?.authorization);
    
    // Fallback parsing for body
    let body;
    if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
    } else if (req.body) {
        body = req.body;
    } else {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        body = raw ? JSON.parse(raw) : {};
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      newsletterOptIn
    } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return sendJson(res, 400, { error: 'Missing payment verification details' });
    }

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret is missing in environment variables');
    }

    // Verify signature for Subscription
    const text = razorpay_payment_id + '|' + razorpay_subscription_id;
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return sendJson(res, 400, { error: 'Invalid payment signature' });
    }

    // Payment is valid! Upgrade the user to Pro.
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'pro',
        newsletter_opt_in: normalizeNewsletterOptIn(newsletterOptIn)
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update user profile to pro plan: ' + updateError.message);
    }

    return sendJson(res, 200, { ok: true, message: 'Subscription verified and unlocked successfully' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    const message = error?.message || 'Failed to verify payment';
    const statusCode = message === 'Unauthorized' ? 401 : message === 'Method not allowed' ? 405 : 500;
    return sendJson(res, statusCode, { error: message });
  }
}
