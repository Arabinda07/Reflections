import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Razorpay subscription security contract', () => {
  it('does not trust client supplied plan ids or unlock Pro from checkout verification', () => {
    const createSubscription = read('api/create-razorpay-subscription.ts');
    const verifyPayment = read('api/verify-razorpay-payment.ts');
    const createSubscriptionModuleScope = createSubscription.split('export default')[0];
    const verifyPaymentModuleScope = verifyPayment.split('export default')[0];

    expect(createSubscription).not.toContain('const { planId } = body');
    expect(createSubscription).toContain('RAZORPAY_PLAN_IDS');
    expect(createSubscription).toContain('RAZORPAY_WEEKLY_PLAN_ID');
    expect(createSubscription).not.toContain('RAZORPAY_YEARLY_PLAN_ID');
    expect(createSubscription).toContain('start_at');
    expect(createSubscription).toContain("from('razorpay_subscriptions')");

    expect(verifyPayment).toContain("from('razorpay_subscriptions')");
    expect(verifyPayment).not.toContain("from('profiles')");
    expect(verifyPayment).not.toContain("plan: 'pro'");
    expect(verifyPayment).not.toContain('SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY');
    expect(createSubscriptionModuleScope).not.toContain('createSupabaseAuthClient()');
    expect(verifyPaymentModuleScope).not.toContain('createSupabaseAuthClient()');
  });

  it('adds a verified webhook path for authoritative entitlement changes', () => {
    const webhook = read('api/razorpay-webhook.ts');

    expect(webhook).toContain('RAZORPAY_WEBHOOK_SECRET');
    expect(webhook).toContain('x-razorpay-signature');
    expect(webhook).toContain('subscription.activated');
    expect(webhook).toContain("from('account_entitlements')");
    expect(webhook).toContain("from('razorpay_subscriptions')");
    expect(webhook).not.toContain('subscription.expired');
    expect(webhook).not.toContain('payment.captured');
    expect(webhook).not.toContain('invoice.');
    expect(webhook).not.toContain('order.');
    expect(webhook).not.toContain('settlement.');
    expect(webhook).not.toContain('qr_code.');
  });

  it('keeps tests out of the deployed api function directory', () => {
    const apiFiles = readdirSync(path.resolve(process.cwd(), 'api'));

    expect(apiFiles.some((fileName) => fileName.endsWith('.test.ts'))).toBe(false);
  });

  it('keeps Razorpay subscription storage compatible with weekly and monthly plans only', () => {
    const schema = read('supabase_security_lockdown.sql');

    expect(schema).toContain("plan_code in ('weekly', 'monthly')");
    expect(schema).not.toContain("plan_code in ('monthly', 'yearly')");
  });

  it('adds a redacted payment diagnostics endpoint for server config checks', () => {
    const diagnostics = read('api/payment-diagnostics.ts');

    expect(diagnostics).toContain('buildPaymentDiagnostics');
    expect(diagnostics).toContain('requiredForCheckout');
    expect(diagnostics).toContain('requiredForWebhook');
    expect(diagnostics).toContain('publicKeyMatchesServer');
    expect(diagnostics).not.toContain('keySecret: process.env.RAZORPAY_KEY_SECRET');
    expect(diagnostics).not.toContain('serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY');
  });
});
