import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schema = readFileSync(join(process.cwd(), 'supabase_schema.sql'), 'utf8');

describe('engagement Supabase schema contract', () => {
  it.each([
    'mood_checkins',
    'future_letters',
    'ritual_events',
    'referral_invites',
    'referrals',
  ])('declares %s with row level security', (tableName) => {
    expect(schema).toContain(`create table if not exists ${tableName}`);
    expect(schema).toContain(`alter table ${tableName} enable row level security`);
  });

  it('keeps release events content-free at the schema level', () => {
    const ritualEventsBlock = schema.slice(
      schema.indexOf('create table if not exists ritual_events'),
      schema.indexOf('alter table ritual_events enable row level security'),
    );

    expect(ritualEventsBlock).toContain('event_type text not null');
    expect(ritualEventsBlock).not.toMatch(/\bcontent\b|\bbody\b|\bnote_text\b/);
  });

  it('removes engagement data when deleting user data', () => {
    expect(schema).toContain('delete from public.mood_checkins where user_id = auth.uid();');
    expect(schema).toContain('delete from public.future_letters where user_id = auth.uid();');
    expect(schema).toContain('delete from public.ritual_events where user_id = auth.uid();');
    expect(schema).toContain('delete from public.referrals where inviter_user_id = auth.uid() or referred_user_id = auth.uid();');
    expect(schema).toContain('delete from public.referral_invites where user_id = auth.uid();');
  });

  it('records accepted referrals through an RPC without exposing all invite codes', () => {
    expect(schema).toContain('create or replace function public.accept_referral_invite(referral_code text)');
    expect(schema).toContain('grant execute on function public.accept_referral_invite(text) to authenticated;');
    expect(schema).not.toContain('on referral_invites for select to authenticated using (true)');
  });
});
