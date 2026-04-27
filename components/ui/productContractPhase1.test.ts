import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('phase 1 product contract and clarity', () => {
  it('keeps AI explicit and on demand instead of running in the background', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(createNote).not.toContain('processNoteIntoWiki');
    expect(createNote).not.toContain("requestJson<string[]>('prompts'");
    expect(createNote).toContain('Reflect with AI');

    expect(insights).toContain('<Link');
    expect(insights).toContain('to={RoutePath.SANCTUARY}');
    expect(insights).not.toContain('onClick={() => navigate(RoutePath.SANCTUARY)}');
    expect(lifeWiki).toContain('getWikiInsightsGate');
    expect(lifeWiki).toContain('incrementFreeWikiInsights');
    expect(insights).not.toContain('getAiReflectionGate');
    expect(insights).not.toContain('incrementFreeAiReflections');
  });

  it('removes AI-first marketing language from metadata and supporting screens', () => {
    const home = read('pages/dashboard/Home.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');
    const indexHtml = read('index.html');

    expect(home).not.toContain('View AI insights');
    expect(home).not.toContain('AI Reflection');

    expect(faq).not.toContain('Private AI');
    expect(faq).not.toContain('Google Gemini to process reflections');

    expect(indexHtml).not.toContain('AI-powered');
    expect(indexHtml).not.toContain('Mindful AI Journal');
  });

  it('replaces future-tense placeholders with honest, usable account affordances', () => {
    const account = read('pages/dashboard/Account.tsx');
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');
    const signIn = read('pages/auth/SignIn.tsx');

    expect(account).not.toContain('Once Pro billing is live');
    expect(account).toContain('<ProUpgradeCTA');
    expect(account).toContain('Request full account closure');
    expect(account).toContain('Saved writing and app data will be removed.');
    expect(account).not.toContain('Delete your notes, moods, tags, tasks, and saved profile details here.');

    expect(proUpgrade).toContain('Join the Pro waitlist');
    expect(proUpgrade).toContain('Razorpay checkout is coming soon');
    expect(proUpgrade).not.toContain("from '../../src/supabaseClient'");
    expect(proUpgrade).not.toContain(".from('profiles')");
    expect(proUpgrade).not.toContain("plan: 'pro'");
    expect(proUpgrade).not.toContain('Secured by Razorpay (Test Mode)');

    expect(signIn).toContain('Password reset email sent.');
    expect(signIn).not.toContain('href="#"');
  });

  it('keeps Surface variants and props honest for routed cards', () => {
    const surface = read('components/ui/Surface.tsx');

    expect(surface).toContain("variant?: 'bezel' | 'flat' | 'floating'");
    expect(surface).toContain('React.HTMLAttributes<HTMLDivElement>');
    expect(surface).toContain('...rest');
    expect(surface).toContain('surface-floating');
  });
});
