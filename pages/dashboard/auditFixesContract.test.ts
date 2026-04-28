import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('audit fix source contract', () => {
  it('keeps CreateNote on the custom draft guard path instead of browser alerts', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain("from 'react-router'");
    expect(createNote).toContain("from '../../components/ui/ConfirmationDialog'");
    expect(createNote).toContain('beforeunload');
    expect(createNote).not.toContain('animate-pulse');
    expect(createNote).not.toContain('return alert("Browser doesn\'t support speech recognition.")');
    expect(createNote).not.toContain('return alert("Browser doesn\\\'t support speech recognition.")');
  });

  it('removes the report-confirmed visual anti-patterns from marketing surfaces', () => {
    const home = read('pages/dashboard/Home.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const tailwind = read('tailwind.config.js');
    const insights = read('pages/dashboard/Insights.tsx');
    const css = read('index.css');

    expect(home).not.toContain('bg-black/30');
    expect(home).not.toContain("style={{ color: '#FFFFFF' }}");
    expect(home).not.toContain('dark:bg-white/40');
    expect(home).not.toContain('dark:bg-white/60');

    expect(faq).not.toContain('animate-pulse');
    expect(signIn).toContain('loading="lazy"');
    expect(tailwind).not.toContain('spring-bounce');
    expect(insights).not.toContain('#f97316');
    expect(insights).not.toContain('#10b981');
    expect(css).toContain('width: 44px !important;');
    expect(css).toContain('height: 44px !important;');
  });
});
