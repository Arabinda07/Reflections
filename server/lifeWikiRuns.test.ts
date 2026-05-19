import { describe, expect, it, vi } from 'vitest';
import type { LifeTheme, Note } from '../types';
import { getNoteContentHash } from '../services/aiContext';
import { runLifeWikiRefresh, type LifeWikiRunStore } from './lifeWikiRuns';

const note = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'Morning',
  content: '<p>Walked before work and felt clearer.</p>',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  tags: ['clarity'],
  tasks: [],
  attachments: [],
  ...overrides,
});

const page = (overrides: Partial<LifeTheme> = {}): LifeTheme => ({
  id: 'page-1',
  userId: 'user-1',
  title: 'People',
  content: 'Existing page',
  state: 'active',
  pageType: 'people',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  ...overrides,
});

const createStore = (overrides: Partial<LifeWikiRunStore> = {}): LifeWikiRunStore => ({
  createRun: vi.fn(async () => 'run-1'),
  finishRun: vi.fn(async () => undefined),
  recordEvent: vi.fn(async () => undefined),
  fetchNotes: vi.fn(async () => [note()]),
  fetchWikiPages: vi.fn(async () => []),
  getAbsorbedHash: vi.fn(async () => null),
  upsertWikiPage: vi.fn(async (_pageType, title, content) =>
    page({ id: `${title.toLowerCase()}-page`, title, content }),
  ),
  logAbsorptions: vi.fn(async () => undefined),
  ...overrides,
});

describe('runLifeWikiRefresh', () => {
  it('records a durable run, retries invalid wiki output once, and saves only validated pages', async () => {
    const store = createStore();
    const generateText = vi
      .fn()
      .mockResolvedValueOnce('People without sources')
      .mockResolvedValueOnce('People grounded in the note. [Source: note-1]')
      .mockImplementation(async (prompt: string) =>
        prompt.includes('index page') ? 'Index body' : 'Grounded page. [Source: note-1]',
      );

    const result = await runLifeWikiRefresh({
      store,
      generateText,
      claimFeatureUsage: vi.fn(async () => undefined),
      claimProviderUsage: vi.fn(async () => undefined),
      userId: 'user-1',
      trigger: 'manual',
    });

    expect(result).toMatchObject({
      runId: 'run-1',
      pageCount: 5,
      source: 'notes',
      status: 'succeeded',
    });
    expect(store.createRun).toHaveBeenCalledWith(expect.objectContaining({
      promptVersion: expect.stringMatching(/^life-wiki-refresh@/),
      sourceNoteIds: ['note-1'],
    }));
    expect(store.recordEvent).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        eventType: 'wiki_page_validation_failed',
        pageType: 'people',
      }),
    );
    expect(store.upsertWikiPage).toHaveBeenCalledWith(
      'people',
      'People',
      'People grounded in the note. [Source: note-1]',
    );
    expect(store.finishRun).toHaveBeenLastCalledWith('run-1', expect.objectContaining({
      pageCount: 5,
      status: 'succeeded',
    }));
  });

  it('skips smart-mode runs when the saved note hash has not changed', async () => {
    const savedNote = note();
    const store = createStore({
      fetchNotes: vi.fn(async () => [savedNote]),
      getAbsorbedHash: vi.fn(async () => getNoteContentHash(savedNote)),
    });
    const generateText = vi.fn();

    const result = await runLifeWikiRefresh({
      store,
      generateText,
      claimFeatureUsage: vi.fn(async () => undefined),
      claimProviderUsage: vi.fn(async () => undefined),
      userId: 'user-1',
      trigger: 'smart_mode',
      noteId: savedNote.id,
    });

    expect(result).toMatchObject({
      skipped: true,
      status: 'skipped',
      pageCount: 0,
    });
    expect(generateText).not.toHaveBeenCalled();
  });
});
