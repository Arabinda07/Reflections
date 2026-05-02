import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('send-welcome-email edge function security contract', () => {
  it('requires a shared function secret and avoids logging private profile records', () => {
    const source = read('supabase/functions/send-welcome-email/index.ts');

    expect(source).toContain('FUNCTION_SECRET');
    expect(source).toContain('x-function-secret');
    expect(source).toContain('timingSafeEqual');
    expect(source).not.toContain("console.error('No email found in record:', record)");
  });
});
