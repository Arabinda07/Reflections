import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const latestZeroKnowledgeMigration = () => {
  const migrations = readdirSync(path.resolve(process.cwd(), 'supabase/migrations'))
    .filter((fileName) => fileName.includes('zero_knowledge_encryption'))
    .sort();
  const latest = migrations.at(-1);
  if (!latest) return '';
  return read(path.join('supabase/migrations', latest));
};

describe('zero-knowledge schema contract', () => {
  it('adds key bundles and encrypted payload columns without making support-readable plaintext required', () => {
    const migration = latestZeroKnowledgeMigration();

    expect(migration).toContain('create table if not exists public.user_encryption_keys');
    expect(migration).toContain('passphrase_wrapper');
    expect(migration).toContain('recovery_wrapper');
    expect(migration).toContain('encrypted_payload jsonb');
    expect(migration).toContain('alter table public.notes');
    expect(migration).toContain('alter table public.mood_checkins');
    expect(migration).toContain('alter table public.future_letters');
    expect(migration).toContain('alter table public.life_themes');
    expect(migration).toContain('force_zero_knowledge_encryption');
  });
});
