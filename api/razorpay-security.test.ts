import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Razorpay subscription security contract', () => {
  it('does not trust client supplied plan ids or unlock Pro from checkout verification', () => {
    const createSubscription = read('api/create-razorpay-subscription.ts');
    const verifyPayment = read('api/verify-razorpay-payment.ts');

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
  });

  it('adds a verified webhook path for authoritative entitlement changes', () => {
    const webhook = read('api/razorpay-webhook.ts');

    expect(webhook).toContain('RAZORPAY_WEBHOOK_SECRET');
    expect(webhook).toContain('x-razorpay-signature');
    expect(webhook).toContain('subscription.activated');
    expect(webhook).toContain("from('account_entitlements')");
    expect(webhook).toContain("from('razorpay_subscriptions')");
  });

  it('keeps Razorpay subscription storage compatible with weekly and monthly plans only', () => {
    const schema = read('supabase_security_lockdown.sql');

    expect(schema).toContain("plan_code in ('weekly', 'monthly')");
    expect(schema).not.toContain("plan_code in ('monthly', 'yearly')");
  });
});
