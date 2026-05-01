export const NEWSLETTER_OPT_IN_FIELD = 'newsletter_opt_in' as const;
export const NEWSLETTER_SIGNUP_LABEL = 'Subscribe to our weekly note';

export const normalizeNewsletterOptIn = (value: unknown): boolean => value === true;

export const buildNewsletterOptInMetadata = (wantsNewsletter: boolean) => ({
  [NEWSLETTER_OPT_IN_FIELD]: normalizeNewsletterOptIn(wantsNewsletter),
});
