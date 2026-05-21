import { sendJson } from '../server/apiUtils.js';

const hasValue = (value?: string) => Boolean(value && value.trim());

const inferRazorpayKeyMode = (keyId?: string) => {
  if (!keyId) return 'missing';
  if (keyId.startsWith('rzp_test_')) return 'test';
  if (keyId.startsWith('rzp_live_')) return 'live';
  return 'unknown';
};

const looksLikeRazorpayPlanId = (planId?: string) =>
  hasValue(planId) && planId!.startsWith('plan_');

const present = {
  supabaseUrl: () => hasValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
  supabaseAnonKey: () => hasValue(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: () => hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
  razorpayServerKeyId: () => hasValue(process.env.RAZORPAY_KEY_ID),
  razorpayPublicKeyId: () => hasValue(process.env.VITE_RAZORPAY_KEY_ID),
  razorpayKeySecret: () => hasValue(process.env.RAZORPAY_KEY_SECRET),
  razorpayWeeklyPlanId: () => hasValue(process.env.RAZORPAY_WEEKLY_PLAN_ID),
  razorpayMonthlyPlanId: () => hasValue(process.env.RAZORPAY_MONTHLY_PLAN_ID),
  razorpayWebhookSecret: () => hasValue(process.env.RAZORPAY_WEBHOOK_SECRET),
};

const missingRequired = (values: Record<string, boolean>) =>
  Object.entries(values)
    .filter(([, isPresent]) => !isPresent)
    .map(([name]) => name);

export const buildPaymentDiagnostics = () => {
  const serverKeyId = process.env.RAZORPAY_KEY_ID || '';
  const publicKeyId = process.env.VITE_RAZORPAY_KEY_ID || '';
  const keyIdMode = inferRazorpayKeyMode(serverKeyId || publicKeyId);
  const publicKeyMatchesServer = present.razorpayServerKeyId() && present.razorpayPublicKeyId()
    ? serverKeyId === publicKeyId
    : null;

  const requiredForCheckout = {
    SUPABASE_URL: present.supabaseUrl(),
    SUPABASE_ANON_KEY: present.supabaseAnonKey(),
    SUPABASE_SERVICE_ROLE_KEY: present.supabaseServiceRoleKey(),
    RAZORPAY_KEY_ID: present.razorpayServerKeyId(),
    VITE_RAZORPAY_KEY_ID: present.razorpayPublicKeyId(),
    RAZORPAY_KEY_SECRET: present.razorpayKeySecret(),
    RAZORPAY_WEEKLY_PLAN_ID: present.razorpayWeeklyPlanId(),
    RAZORPAY_MONTHLY_PLAN_ID: present.razorpayMonthlyPlanId(),
  };

  const requiredForWebhook = {
    RAZORPAY_WEBHOOK_SECRET: present.razorpayWebhookSecret(),
  };

  const recommendations = [
    ...missingRequired(requiredForCheckout).map((name) => `Set ${name} in the Vercel environment you are testing.`),
    ...missingRequired(requiredForWebhook).map((name) => `Set ${name} before relying on webhook-based Pro activation.`),
    publicKeyMatchesServer === false
      ? 'Make VITE_RAZORPAY_KEY_ID match RAZORPAY_KEY_ID for the same Razorpay mode.'
      : null,
    keyIdMode === 'unknown'
      ? 'Razorpay key id should start with rzp_test_ or rzp_live_.'
      : null,
    present.razorpayWeeklyPlanId() && !looksLikeRazorpayPlanId(process.env.RAZORPAY_WEEKLY_PLAN_ID)
      ? 'RAZORPAY_WEEKLY_PLAN_ID should look like plan_...'
      : null,
    present.razorpayMonthlyPlanId() && !looksLikeRazorpayPlanId(process.env.RAZORPAY_MONTHLY_PLAN_ID)
      ? 'RAZORPAY_MONTHLY_PLAN_ID should look like plan_...'
      : null,
  ].filter(Boolean);

  return {
    ok: true,
    mode: keyIdMode,
    ready: {
      checkout: missingRequired(requiredForCheckout).length === 0 && publicKeyMatchesServer !== false,
      webhook: missingRequired(requiredForWebhook).length === 0,
    },
    requiredForCheckout,
    requiredForWebhook,
    consistency: {
      publicKeyMatchesServer,
      weeklyPlanIdFormat: looksLikeRazorpayPlanId(process.env.RAZORPAY_WEEKLY_PLAN_ID),
      monthlyPlanIdFormat: looksLikeRazorpayPlanId(process.env.RAZORPAY_MONTHLY_PLAN_ID),
    },
    recommendations,
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  return sendJson(res, 200, buildPaymentDiagnostics());
}
