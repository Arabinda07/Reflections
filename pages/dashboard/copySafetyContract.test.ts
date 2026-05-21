import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('voice refresh copy safety', () => {
  it('keeps landing and privacy copy out of the voice refresh', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const privacy = read('pages/dashboard/PrivacyPolicy.tsx');
    const publicSeoCopy = read('src/config/publicSeoCopy.js');

    expect(landing).toContain('HOME_SEO.heroAriaLabel');
    expect(landing).toContain('HOME_SEO.heroIntro');
    expect(publicSeoCopy).toContain('Your mind');
    expect(publicSeoCopy).toContain('beautifully');
    expect(publicSeoCopy).toContain('organized');
    expect(publicSeoCopy).toContain('A private journal. Write what');
    expect(privacy).toContain('What Reflections keeps');
    expect(privacy).toContain('AI and Smart Mode');
  });

  it('uses original pop-confessional language without direct lyric or dark-pattern copy', () => {
    const refreshedCopy = [
      read('pages/dashboard/FAQ.tsx'),
      read('pages/dashboard/AboutArabinda.tsx'),
      read('pages/dashboard/CreateNote.tsx'),
      read('pages/dashboard/HomeAuthenticated.tsx'),
      read('pages/dashboard/MyNotes.tsx'),
      read('components/ui/ProUpgradeCTA.tsx'),
      read('components/ui/PaperPlaneToast.tsx'),
      read('public/pricing.md'),
    ].join('\n');

    expect(refreshedCopy).toContain('How does it feel right now?');
    expect(refreshedCopy).toContain('A reflection, not a verdict');
    expect(refreshedCopy).toContain('More room when life gets loud');
    expect(refreshedCopy).toContain('For the thought that keeps doing laps.');

    expect(refreshedCopy.toLowerCase()).not.toContain('my loneliness is killing me');
    expect(refreshedCopy.toLowerCase()).not.toMatch(/\b(hurry|last chance|limited time|act now)\b/);
    expect(refreshedCopy.toLowerCase()).not.toMatch(/\b(therapy replacement|diagnose|cure)\b/);
  });
});
