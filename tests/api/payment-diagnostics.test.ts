import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildPaymentDiagnostics } from '../../api/payment-diagnostics';

const PAYMENT_ENV_KEYS = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_ID',
  'VITE_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEEKLY_PLAN_ID',
  'RAZORPAY_MONTHLY_PLAN_ID',
  'RAZORPAY_WEBHOOK_SECRET',
] as const;

const snapshot = new Map<string, string | undefined>();

beforeEach(() => {
  snapshot.clear();
  for (const key of PAYMENT_ENV_KEYS) {
    snapshot.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of PAYMENT_ENV_KEYS) {
    const value = snapshot.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('payment diagnostics', () => {
  it('reports missing checkout and webhook config without exposing values', () => {
    const diagnostics = buildPaymentDiagnostics();

    expect(diagnostics.ready.checkout).toBe(false);
    expect(diagnostics.ready.webhook).toBe(false);
    expect(diagnostics.requiredForCheckout.RAZORPAY_KEY_ID).toBe(false);
    expect(diagnostics.requiredForWebhook.RAZORPAY_WEBHOOK_SECRET).toBe(false);
    expect(diagnostics.recommendations).toContain('Set RAZORPAY_KEY_ID in the Vercel environment you are testing.');
  });

  it('reports test-mode readiness and keeps secrets out of the payload', () => {
    process.env.SUPABASE_URL = 'https://reflections.example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-value';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_samekey';
    process.env.VITE_RAZORPAY_KEY_ID = 'rzp_test_samekey';
    process.env.RAZORPAY_KEY_SECRET = 'razorpay-secret';
    process.env.RAZORPAY_WEEKLY_PLAN_ID = 'plan_weekly';
    process.env.RAZORPAY_MONTHLY_PLAN_ID = 'plan_monthly';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-secret';

    const diagnostics = buildPaymentDiagnostics();
    const payload = JSON.stringify(diagnostics);

    expect(diagnostics.mode).toBe('test');
    expect(diagnostics.ready.checkout).toBe(true);
    expect(diagnostics.ready.webhook).toBe(true);
    expect(diagnostics.consistency.publicKeyMatchesServer).toBe(true);
    expect(payload).not.toContain('service-role-secret');
    expect(payload).not.toContain('razorpay-secret');
    expect(payload).not.toContain('webhook-secret');
    expect(payload).not.toContain('rzp_test_samekey');
  });

  it('flags mismatched browser and server Razorpay key ids', () => {
    process.env.SUPABASE_URL = 'https://reflections.example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-value';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_server';
    process.env.VITE_RAZORPAY_KEY_ID = 'rzp_live_public';
    process.env.RAZORPAY_KEY_SECRET = 'razorpay-secret';
    process.env.RAZORPAY_WEEKLY_PLAN_ID = 'plan_weekly';
    process.env.RAZORPAY_MONTHLY_PLAN_ID = 'plan_monthly';

    const diagnostics = buildPaymentDiagnostics();

    expect(diagnostics.ready.checkout).toBe(false);
    expect(diagnostics.consistency.publicKeyMatchesServer).toBe(false);
    expect(diagnostics.recommendations).toContain('Make VITE_RAZORPAY_KEY_ID match RAZORPAY_KEY_ID for the same Razorpay mode.');
  });
});
