import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('audited text link touch targets', () => {
  it('keeps auth switcher text links touch-safe without turning them into buttons', () => {
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');

    expect(signIn).toContain('className="inline-flex min-h-11 items-center rounded-xl px-2 text-green');
    expect(signUp).toContain('className="inline-flex min-h-11 items-center rounded-xl px-2 text-green');
    expect(signIn).toContain('focus-visible:ring-2 focus-visible:ring-green');
    expect(signUp).toContain('focus-visible:ring-2 focus-visible:ring-green');
  });

  it('keeps footer navigation links at least 44px wide and tall', () => {
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('inline-flex min-h-11 min-w-11 items-center justify-center');
  });
});
