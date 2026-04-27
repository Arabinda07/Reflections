import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const { data, error } = await supabase.auth.getUser(token);
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

    const { planId } = body;

    if (!planId) {
      return sendJson(res, 400, { error: 'planId is required' });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys are missing in environment variables');
    }

    const instance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // We set total_count to a high number (e.g., 60 cycles) to represent an ongoing subscription.
    // If it's a yearly plan, 10 years = 10 cycles. 
    // To be safe and support both monthly and yearly long-term, we use 60.
    const subscription = await instance.subscriptions.create({
      plan_id: planId,
      total_count: 120, // 10 years if monthly, 120 years if yearly
      customer_notify: 1,
      notes: {
        userId: user.id,
      }
    });

    return sendJson(res, 200, { ok: true, subscriptionId: subscription.id });
  } catch (error: any) {
    console.error('Razorpay subscription error:', error);
    const message = error?.message || 'Failed to create subscription';
    const statusCode = message === 'Unauthorized' ? 401 : message === 'Method not allowed' ? 405 : 500;
    return sendJson(res, statusCode, { error: message });
  }
}
