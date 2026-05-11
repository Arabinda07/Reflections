import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const readMigration = () => {
  const migrationsPath = path.resolve(process.cwd(), 'supabase/migrations');

  if (!existsSync(migrationsPath)) {
    return '';
  }

  const migrationFile = readdirSync(migrationsPath)
    .find((fileName) => fileName.endsWith('_add_newsletter_unsubscribed_at.sql'));

  return migrationFile ? read(path.join('supabase/migrations', migrationFile)) : '';
};

describe('newsletter preference schema contract', () => {
  it('stores newsletter unsubscribe timestamps on profiles', () => {
    const schema = read('supabase_schema.sql');
    const schemaUpdate = read('supabase_schema_update.sql');
    const lockdown = read('supabase_security_lockdown.sql');

    expect(schema).toContain('newsletter_unsubscribed_at timestamptz');
    expect(schemaUpdate).toContain("column_name = 'newsletter_unsubscribed_at'");
    expect(schemaUpdate).toContain('add column newsletter_unsubscribed_at timestamptz');
    expect(lockdown).toContain('newsletter_unsubscribed_at');
  });

  it('ships a Supabase migration for the newsletter unsubscribe timestamp', () => {
    const migration = readMigration();

    expect(migration).toContain('alter table public.profiles');
    expect(migration).toContain('add column if not exists newsletter_unsubscribed_at timestamptz');
    expect(migration).toContain('grant select (newsletter_unsubscribed_at)');
    expect(migration).toContain('on table public.profiles');
    expect(migration).toContain('to authenticated');
  });
});
