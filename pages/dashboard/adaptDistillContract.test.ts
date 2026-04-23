import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('adapt and distill source contract', () => {
  it('keeps the requested mobile support controls touch-safe', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const signIn = read('pages/auth/SignIn.tsx');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(landing).toContain('min-h-11');
    expect(signIn).toContain('min-h-11');
    expect(home).toContain('h-11 w-11');
  });

  it('removes repeated grain overlays and flattens the FAQ detail cards', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const layout = read('layouts/DashboardLayout.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');

    expect(landing).not.toContain('grain-overlay');
    expect(layout).not.toContain('grain-overlay');
    expect(createNote).not.toContain('grain-overlay');
    expect(faq).not.toContain('bezel-outer group');
    expect(faq).toContain('surface-flat');
  });
});
