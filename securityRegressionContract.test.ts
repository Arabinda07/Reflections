import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('launch security regression contract', () => {
  it('ships a paste-ready Supabase lockdown schema for external application', () => {
    const sql = read('supabase_security_lockdown.sql');

    expect(sql).toContain('create table if not exists public.account_entitlements');
    expect(sql).toContain('create table if not exists public.ai_usage_counters');
    expect(sql).toContain('create table if not exists public.ai_rate_events');
    expect(sql).toContain('create table if not exists public.razorpay_subscriptions');
    expect(sql).toContain('claim_ai_usage');
    expect(sql).toContain('drop policy if exists "Public profiles are viewable by everyone."');
    expect(sql).toContain('revoke update on table public.profiles from authenticated');
    expect(sql).toContain('Users can insert citations for own themes and notes');
    expect(sql).toContain('Users can insert own absorb log for own notes');
    expect(sql).toContain('allowed_mime_types');
  });

  it('sets a CSP that allows required third parties without inline script execution', () => {
    const vercelConfig = JSON.parse(read('vercel.json'));
    const appHeaders = vercelConfig.headers.find((entry: any) => entry.source === '/(.*)');
    const csp = appHeaders.headers.find((header: any) => header.key === 'Content-Security-Policy')?.value;

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://checkout.razorpay.com');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('https://api.razorpay.com');
    expect(csp).toContain('https://api.posthog.com');
    expect(csp).toContain('https://*.posthog.com');
    expect(csp).toContain('https://*.ingest.sentry.io');
    expect(csp).toContain('https://vitals.vercel-insights.com');
    expect(csp).not.toContain('https://o*.ingest.sentry.io');
    expect(csp).not.toMatch(/https:\/\/[^/\s;]*[A-Za-z0-9-]\*[^/\s;]*/);
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});
