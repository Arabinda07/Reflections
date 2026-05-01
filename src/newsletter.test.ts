import { describe, expect, it } from 'vitest';
import {
  NEWSLETTER_OPT_IN_FIELD,
  NEWSLETTER_SIGNUP_LABEL,
  buildNewsletterOptInMetadata,
  normalizeNewsletterOptIn,
} from './newsletter';

describe('newsletter signup helpers', () => {
  it('keeps the newsletter CTA text consistent with signup', () => {
    expect(NEWSLETTER_SIGNUP_LABEL).toBe('Subscribe to our weekly note');
  });

  it('normalizes newsletter opt-in payloads for auth metadata and profile updates', () => {
    expect(NEWSLETTER_OPT_IN_FIELD).toBe('newsletter_opt_in');
    expect(buildNewsletterOptInMetadata(true)).toEqual({ newsletter_opt_in: true });
    expect(buildNewsletterOptInMetadata(false)).toEqual({ newsletter_opt_in: false });
    expect(normalizeNewsletterOptIn('yes')).toBe(false);
  });
});
