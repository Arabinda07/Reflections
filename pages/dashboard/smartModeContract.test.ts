import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Smart Mode Sanctuary contract', () => {
  it('keeps v1 on-demand Life Wiki refresh and the Smart Mode auto-ingest plumbing', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const productContract = read('components/ui/productContractPhase1.test.ts');

    expect(lifeWiki).toContain('Refresh with AI');
    expect(lifeWiki).toContain('startLifeWikiRefresh');
    expect(productContract).toContain("expect(createNote).not.toContain('processNoteIntoWiki')");

    const noteDraft = read('hooks/useNoteDraft.ts');
    const notePublishingOrchestrator = read('services/notePublishingOrchestrator.ts');
    expect(noteDraft).toContain('smartModeEnabled');
    expect(notePublishingOrchestrator).toContain('startLifeWikiRefresh');
    expect(noteDraft).not.toContain('processNoteIntoWiki');
  });

  it('persists Smart Mode and absorb state in the schema and profile access model', () => {
    const schema = read('supabase_schema.sql');
    const types = read('types.ts');
    const profileService = read('services/profileService.ts');

    expect(schema).toContain('smart_mode_enabled boolean default false');
    expect(schema).toContain('create table if not exists wiki_absorb_log');
    expect(schema).toContain('create table if not exists ai_runs');
    expect(schema).toContain('create table if not exists ai_run_events');
    expect(schema).toContain('create table if not exists ai_feature_usage_counters');
    expect(schema).toContain('content_hash text not null');

    expect(types).toContain('smartModeEnabled: boolean');
    expect(profileService).toContain('smart_mode_enabled');
    expect(profileService).toContain('setSmartModeEnabled');
    expect(profileService).toContain('upsert(');
  });

  it('ships deployed-database Smart Mode migrations outside the full fresh schema', () => {
    const updateSchema = read('supabase_schema_update.sql');

    expect(updateSchema).toContain('smart_mode_enabled');
    expect(updateSchema).toContain('create table if not exists wiki_absorb_log');
    expect(updateSchema).toContain('create table if not exists ai_runs');
    expect(updateSchema).toContain('create table if not exists ai_run_events');
    expect(updateSchema).toContain('create table if not exists ai_feature_usage_counters');
    expect(updateSchema).toContain('content_hash text not null');
  });
});
