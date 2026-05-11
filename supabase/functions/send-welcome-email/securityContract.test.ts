import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('send-welcome-email edge function security contract', () => {
  it('requires a shared function secret and avoids logging private profile records', () => {
    const source = read('supabase/functions/send-welcome-email/index.ts');

    expect(source).toContain('FUNCTION_SECRET');
    expect(source).toContain('x-function-secret');
    expect(source).toContain('timingSafeEqual');
    expect(source).not.toContain("console.error('No email found in record:', record)");
  });

  it('sends accessible, idempotent Resend requests with a monitored reply path', () => {
    const source = read('supabase/functions/send-welcome-email/index.ts');

    expect(source).toContain('createWelcomeText');
    expect(source).not.toContain('toPlainText');
    expect(source).toContain('text: emailText');
    expect(source).toContain("'Idempotency-Key': idempotencyKey");
    expect(source).toContain("`welcome-user/${record.id}`");
    expect(source).toContain('REFLECTIONS_REPLY_TO_EMAIL');
    expect(source).toContain("reply_to: replyToEmail");
  });

  it('retries only temporary Resend delivery failures', () => {
    const source = read('supabase/functions/send-welcome-email/index.ts');

    expect(source).toContain('sendResendEmailWithRetry');
    expect(source).toContain('RETRY_DELAYS_MS = [500, 1000, 2000]');
    expect(source).toContain('status === 408');
    expect(source).toContain('status === 429');
    expect(source).toContain('status >= 500');
    expect(source).toContain('concurrent_idempotent_requests');
    expect(source).not.toContain('invalid_idempotent_request &&');
  });

  it('requires marketing configuration only for newsletter welcome emails', () => {
    const source = read('supabase/functions/send-welcome-email/index.ts');

    expect(source).toContain('if (newsletterOptIn && !NEWSLETTER_TOKEN_SECRET)');
    expect(source).toContain('if (newsletterOptIn && !REFLECTIONS_MAILING_ADDRESS)');
    expect(source).toContain('createNewsletterToken(record.id, newsletterTokenSecret)');
    expect(source).toContain('mailingAddress');
  });
});
