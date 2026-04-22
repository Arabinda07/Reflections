import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('phase 1 product contract and clarity', () => {
  it('keeps AI explicit and on demand instead of running in the background', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const insights = read('pages/dashboard/Insights.tsx');

    expect(createNote).not.toContain('processNoteIntoWiki');
    expect(createNote).not.toContain("requestJson<string[]>('prompts'");
    expect(createNote).toContain('Reflect with AI');

    expect(insights).toContain('getWikiInsightsGate');
    expect(insights).toContain('incrementFreeWikiInsights');
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
    const signIn = read('pages/auth/SignIn.tsx');

    expect(account).not.toContain('Once Pro billing is live');
    expect(account).toContain('Join the Pro waitlist');
    expect(account).toContain('Request full account closure');

    expect(signIn).toContain('Password reset email sent.');
    expect(signIn).not.toContain('href="#"');
  });
});
