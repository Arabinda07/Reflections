import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Smart Mode Sanctuary contract', () => {
  it('keeps v1 on-demand while adding Smart Mode as an explicit opt-in', () => {
    const account = read('pages/dashboard/Account.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const productContract = read('components/ui/productContractPhase1.test.ts');

    expect(lifeWiki).toContain('Refresh with AI');
    expect(lifeWiki).toContain('refreshWikiOnDemand(notes)');
    expect(productContract).toContain("expect(createNote).not.toContain('processNoteIntoWiki')");

    expect(account).toContain('Smart Mode');
    expect(account).toContain('setSmartModeEnabled');
    expect(account).toContain('runGreatIngest');

    expect(createNote).toContain('smartModeEnabled');
    expect(createNote).toContain('autoIngestSavedNote');
    expect(createNote).not.toContain('processNoteIntoWiki');
  });

  it('persists Smart Mode and absorb state in the schema and profile access model', () => {
    const schema = read('supabase_schema.sql');
    const types = read('types.ts');
    const profileService = read('services/profileService.ts');

    expect(schema).toContain('smart_mode_enabled boolean default false');
    expect(schema).toContain('create table if not exists wiki_absorb_log');
    expect(schema).toContain('content_hash text not null');

    expect(types).toContain('smartModeEnabled: boolean');
    expect(profileService).toContain('smart_mode_enabled');
    expect(profileService).toContain('setSmartModeEnabled');
  });
});
