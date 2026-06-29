import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('native Google OAuth contract', () => {
  it('keeps the app callback aligned between auth code and Android deep links', () => {
    const config = read('src/auth/authRedirectConfig.ts');
    const auth = read('src/auth/googleOAuth.ts');
    const manifest = read('android/app/src/main/AndroidManifest.xml');

    expect(config).toContain("const NATIVE_OAUTH_REDIRECT_TO = 'com.arabinda.reflections://auth/callback';");
    expect(auth).toContain('getOAuthRedirectTo');
    expect(manifest).toContain('android:scheme="com.arabinda.reflections"');
    expect(manifest).toContain('android:host="auth"');
    expect(manifest).toContain('android:pathPrefix="/callback"');
  });
});
