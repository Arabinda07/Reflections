import { describe, expect, it } from 'vitest';
import { getMissingClientEnvNames, hasRequiredClientEnv } from './bootstrapEnv';

describe('bootstrap env validation', () => {
  it('lists missing required client env keys', () => {
    expect(getMissingClientEnvNames({})).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ]);
  });

  it('treats blank values as missing', () => {
    expect(
      getMissingClientEnvNames({
        VITE_SUPABASE_URL: 'https://reflections.example.supabase.co',
        VITE_SUPABASE_ANON_KEY: '   ',
      }),
    ).toEqual(['VITE_SUPABASE_ANON_KEY']);
  });

  it('passes when the required frontend env is present', () => {
    expect(
      hasRequiredClientEnv({
        VITE_SUPABASE_URL: 'https://reflections.example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toBe(true);
  });
});
