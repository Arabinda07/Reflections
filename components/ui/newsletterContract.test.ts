import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('newsletter CTA contract', () => {
  it('uses the signup newsletter wording and helper on both newsletter opt-in surfaces', () => {
    const signUp = read('pages/auth/SignUp.tsx');
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');
    const verifyPayment = read('api/verify-razorpay-payment.ts');
    const schema = read('supabase_schema.sql');
    const schemaUpdate = read('supabase_schema_update.sql');

    expect(signUp).toContain('NEWSLETTER_SIGNUP_LABEL');
    expect(signUp).toContain('buildNewsletterOptInMetadata(newsletterOptIn)');
    expect(signUp).toContain('{NEWSLETTER_SIGNUP_LABEL}');

    expect(proUpgrade).toContain('NEWSLETTER_SIGNUP_LABEL');
    expect(proUpgrade).toContain('{NEWSLETTER_SIGNUP_LABEL}');
    expect(proUpgrade).not.toContain('Send me occasional journaling ideas and product updates.');

    expect(verifyPayment).toContain('normalizeNewsletterOptIn(newsletterOptIn)');
    expect(verifyPayment).not.toContain('newsletter_opt_in: !!newsletterOptIn');

    expect(schema).toContain("new.raw_user_meta_data->>'newsletter_opt_in'");
    expect(schemaUpdate).toContain("new.raw_user_meta_data->>'newsletter_opt_in'");
  });
});
