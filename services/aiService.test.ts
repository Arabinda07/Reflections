import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../types';
import { aiService } from './aiService';
import { aiClient } from './aiClient';
import { wikiService } from './wikiService';
import { absorbLogService } from './absorbLogService';

vi.mock('./aiClient', () => ({
  aiClient: {
    requestText: vi.fn(),
    requestJson: vi.fn(),
  },
}));

vi.mock('./wikiService', () => ({
  wikiService: {
    getUserThemes: vi.fn(),
    getAllWikiPages: vi.fn(),
    getWikiPage: vi.fn(),
    upsertWikiPage: vi.fn(),
  },
}));

vi.mock('./absorbLogService', () => ({
  absorbLogService: {
    needsReAbsorb: vi.fn(),
    logAbsorption: vi.fn(),
    logAbsorptions: vi.fn(),
  },
}));

vi.mock('./userModeStore', () => ({
  getCurrentUserMode: () => 'encrypted',
}));


const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'Morning pages',
  content: '<p>Finding clarity in routine.</p>',
  createdAt: '2026-04-03T00:00:00.000Z',
  updatedAt: '2026-04-03T00:00:00.000Z',
  mood: 'calm',
  tags: ['clarity'],
  tasks: [],
  attachments: [],
  ...overrides,
});

describe('aiService in strict zero-knowledge mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not send notes to backend AI for reflections', async () => {
    const result = await aiService.generateReflection(baseNote());

    expect(result).toContain('zero-knowledge');
    expect(result).toContain('backend cannot read');
    expect(vi.mocked(aiClient.requestText)).not.toHaveBeenCalled();
    expect(vi.mocked(wikiService.getAllWikiPages)).not.toHaveBeenCalled();
  });

  it('skips Life Wiki refresh and Smart Mode ingest without reading private writing', async () => {
    await expect(aiService.refreshWikiOnDemand([baseNote()])).resolves.toEqual({
      pageCount: 0,
      source: 'none',
    });
    await expect(aiService.runGreatIngest([baseNote()])).resolves.toEqual({
      batchCount: 0,
      pageCount: 0,
      processedCount: 0,
      source: 'none',
      totalCount: 1,
    });

    expect(vi.mocked(aiClient.requestText)).not.toHaveBeenCalled();
    expect(vi.mocked(wikiService.upsertWikiPage)).not.toHaveBeenCalled();
    expect(vi.mocked(absorbLogService.logAbsorptions)).not.toHaveBeenCalled();
  });

  it('skips background ingest and dashboard writing notes', async () => {
    await expect(aiService.autoIngestSavedNote(baseNote())).resolves.toEqual({
      pageCount: 0,
      skipped: true,
      source: 'none',
    });
    await expect(aiService.generateWritingNotes()).resolves.toEqual([]);

    expect(vi.mocked(absorbLogService.needsReAbsorb)).not.toHaveBeenCalled();
    expect(vi.mocked(aiClient.requestJson)).not.toHaveBeenCalled();
  });

  it('skips tag suggestions without sending content to backend AI', async () => {
    await expect(aiService.suggestTags('Some journal content')).resolves.toEqual([]);

    expect(vi.mocked(aiClient.requestJson)).not.toHaveBeenCalled();
  });
});
