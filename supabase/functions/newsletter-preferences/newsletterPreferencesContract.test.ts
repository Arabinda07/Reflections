import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('newsletter preferences edge function contract', () => {
  it('is a public signed-token endpoint for one-click unsubscribe', () => {
    const config = read('supabase/config.toml');
    const source = read('supabase/functions/newsletter-preferences/index.ts');
    const tokenSource = read('supabase/functions/_shared/newsletter-token.ts');

    expect(config).toContain('[functions.newsletter-preferences]');
    expect(config).toContain('verify_jwt = false');
    expect(source).toContain("req.method !== 'GET'");
    expect(source).toContain("searchParams.get('token')");
    expect(source).toContain('verifyNewsletterToken');
    expect(tokenSource).toContain('HMAC');
    expect(tokenSource).toContain('SHA-256');
    expect(tokenSource).toContain('timingSafeEqual');
  });

  it('updates only newsletter preference fields without logging tokens or profile data', () => {
    const source = read('supabase/functions/newsletter-preferences/index.ts');

    expect(source).toContain("from('profiles')");
    expect(source).toContain('newsletter_opt_in: false');
    expect(source).toContain('newsletter_unsubscribed_at');
    expect(source).not.toContain('console.log(token)');
    expect(source).not.toContain('console.error(profile');
  });
});
