import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) => readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('error copy and Toast error variant', () => {
  it('uses one calm voice on auth screens and never shows raw backend text', () => {
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');

    [signIn, signUp].forEach((src) => {
      expect(src).not.toContain('An unexpected error occurred');
      expect(src).not.toMatch(/Failed to sign (in|up)/);
    });
    expect(signIn).not.toContain('setError(signInError.message)');
  });

  it('avoids wellness phrasing on the not-found route', () => {
    expect(read('pages/RouteErrorBoundary.tsx')).not.toContain('calmer place');
  });

  it('gives errors an alert role, a longer dismiss, and pause on hover', () => {
    const toast = read('components/ui/Toast.tsx');

    expect(toast).toContain("'error'");
    expect(toast).toContain("isError ? 'alert' : 'status'");
    expect(toast).toContain('ERROR_DISMISS_MS');
    expect(toast).toContain('onMouseEnter');
  });
});
