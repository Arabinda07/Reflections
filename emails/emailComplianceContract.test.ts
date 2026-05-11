import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('email compliance contracts', () => {
  it('keeps transactional welcome email separate from newsletter unsubscribe controls', () => {
    const welcome = read('emails/templates/WelcomeEmail.tsx');

    expect(welcome).toContain('SupportFooter');
    expect(welcome).not.toContain('UnsubscribeFooter');
    expect(welcome).not.toContain('unsubscribeUrl');
    expect(welcome).not.toContain("You're also on the list");
  });

  it('requires marketing footers to include unsubscribe, preferences, identity, and mailing address', () => {
    const footer = read('emails/components/UnsubscribeFooter.tsx');
    const newsletterWelcome = read('emails/templates/NewsletterWelcomeEmail.tsx');
    const weeklyNewsletter = read('emails/templates/WeeklyNewsletter.tsx');

    expect(footer).toContain('mailingAddress');
    expect(footer).toContain('Reflections by Arabinda');
    expect(footer).toContain('Manage Preferences');
    expect(footer).toContain('Unsubscribe');

    expect(newsletterWelcome).toContain('mailingAddress');
    expect(newsletterWelcome).toContain('UnsubscribeFooter');
    expect(weeklyNewsletter).toContain('mailingAddress');
    expect(weeklyNewsletter).toContain('UnsubscribeFooter');
  });
});
